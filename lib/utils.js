const { existsSync, readFileSync } = require('fs')
const { basename } = require('path')
const cds = require("@sap/cds")
const LOG = cds.log('notifications')
const { getDestination } = require("@sap-cloud-sdk/connectivity")
const PRIORITIES = ["LOW", "NEUTRAL", "MEDIUM", "HIGH"]
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const messages = {
  INVALID_NOTIFICATION_TYPES: "Notification Types must contain the following key: 'NotificationTypeKey'.",
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
  MANDATORY_PARAMETER_NOT_PASSED_FOR_DEFAULT_NOTIFICATION: "Recipients and title are mandatory parameters.",
  MANDATORY_PARAMETER_NOT_PASSED_FOR_CUSTOM_NOTIFICATION: "Recipients are mandatory parameters.",
  RECIPIENTS_IS_NOT_ARRAY: "Recipients is not an array or it is empty.",
  TITLE_IS_NOT_STRING: "Title is not a string.",
  DESCRIPTION_IS_NOT_STRING: "Description is not a string.",
  PROPERTIES_IS_NOT_OBJECT: "Properties is not an object.",
  NAVIGATION_IS_NOT_OBJECT: "Navigation is not an object.",
  PAYLOAD_IS_NOT_OBJECT: "Payload is not an object.",
  EMPTY_OBJECT_FOR_NOTIFY: "Empty object is passed a single parameter to notify function.",
  NO_OBJECT_FOR_NOTIFY: "An object must be passed to notify function."
}

function validateNotificationTypes(notificationTypes) {
  for(let notificationType of notificationTypes){
    if (!("NotificationTypeKey" in notificationType)) {
      LOG._warn && LOG.warn(messages.INVALID_NOTIFICATION_TYPES)
      return false
    }
  }

  return true
}

function validateDefaultNotifyParameters(recipients, priority, title, description) {
  if (!recipients || !title) {
    LOG._warn && LOG.warn(messages.MANDATORY_PARAMETER_NOT_PASSED_FOR_DEFAULT_NOTIFICATION)
    return false
  }

  if (!Array.isArray(recipients) || recipients.length == 0) {
    LOG._warn && LOG.warn(messages.RECIPIENTS_IS_NOT_ARRAY)
    return false
  }

  if (typeof title !== "string") {
    LOG._warn && LOG.warn(messages.TITLE_IS_NOT_STRING)
    return false
  }

  if (priority && !PRIORITIES.includes(priority.toUpperCase())) {
    LOG._warn && LOG.warn(`Invalid priority ${priority}. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH`)
    return false
  }

  if (description && typeof description !== "string") {
    LOG._warn && LOG.warn(messages.DESCRIPTION_IS_NOT_STRING)
    return false
  }

  return true
}

function validateCustomNotifyParameters(type, recipients, properties, navigation, priority, payload) {
  if (!recipients) {
    LOG._warn && LOG.warn(messages.MANDATORY_PARAMETER_NOT_PASSED_FOR_CUSTOM_NOTIFICATION)
    return false
  }

  if (!Array.isArray(recipients) || recipients.length == 0) {
    LOG._warn && LOG.warn(messages.RECIPIENTS_IS_NOT_ARRAY)
    return false
  }

  if (priority && !PRIORITIES.includes(priority.toUpperCase())) {
    LOG._warn && LOG.warn(`Invalid priority ${priority}. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH`)
    return false
  }

  if (properties && !Array.isArray(properties)) {
    LOG._warn && LOG.warn(messages.PROPERTIES_IS_NOT_OBJECT)
    return false
  }

  if (navigation && typeof navigation !== "object") {
    LOG._warn && LOG.warn(messages.NAVIGATION_IS_NOT_OBJECT)
    return false
  }

  if (payload && typeof payload !== "object") {
    LOG._warn && LOG.warn(messages.PAYLOAD_IS_NOT_OBJECT)
    return false
  }

  return true
}


function readFile(filePath) {
  const resolvedPath = cds.utils.path.resolve(cds.root, filePath)
  if (!existsSync(resolvedPath)) return []

  return JSON.parse(readFileSync(resolvedPath))
}

async function getNotificationDestination() {
  const destinationName = cds.env.requires.notifications?.destination ?? "SAP_Notifications"
  const notificationDestination = await getDestination({ destinationName, useCache: true })
  if (!notificationDestination) {
    // TODO: What to do if destination isn't found??
    throw new Error(messages.DESTINATION_NOT_FOUND + destinationName)
  }
  return notificationDestination
}

function getRecipientKey(recipient) {
  const authenticationIdentifier = cds.env.requires.notifications?.authenticationIdentifier ?? 'auto'
  if (authenticationIdentifier === 'UserUUID') return 'GlobalUserId'
  if (authenticationIdentifier === 'RecipientId') return 'RecipientId'
  // 'auto' (and any unrecognized value): detect format per recipient
  if (typeof recipient === 'string' && UUID_REGEX.test(recipient)) return 'GlobalUserId'
  if (typeof recipient === 'string' && !EMAIL_REGEX.test(recipient)) {
    LOG._warn && LOG.warn(`Recipient '${recipient}' is neither a UUID nor an email format. Falling back to RecipientId.`)
  }
  return 'RecipientId'
}

let prefix
function getPrefix() {
  if (!prefix) {
    prefix = cds.env.requires.notifications?.prefix
    if (prefix === "$app-name") try {
      prefix = require(cds.root + '/package.json').name
    } catch { prefix = null }
    if (!prefix) prefix = basename(cds.root)
  }
  return prefix
}

function getNotificationTypesKeyWithPrefix(notificationTypeKey) {
  const prefix = getPrefix()
  return `${prefix}/${notificationTypeKey}`
}

function buildDefaultNotification(
  recipients,
  priority = "NEUTRAL",
  title,
  description = ""
) {
  const locale = cds.context?.locale ?? 'en'
  const properties = [
    {
      Key: "title",
      Language: locale,
      Value: title,
      Type: "String",
      IsSensitive: false,
    },
    {
      Key: "description",
      Language: locale,
      Value: description,
      Type: "String",
      IsSensitive: false,
    },
  ]

  return {
    NotificationTypeKey: "Default",
    NotificationTypeVersion: "1",
    Priority: priority,
    Properties: properties,
    Recipients: recipients.map((recipient) => ({ [getRecipientKey(recipient)]: recipient }))
  }
}

function buildCustomNotification(_) {
  let notification = {

    // Properties with simple API variants
    NotificationTypeKey: getNotificationTypesKeyWithPrefix(_.NotificationTypeKey || _.type),
    Recipients: _.Recipients || _.recipients?.map(id => ({ [getRecipientKey(id)]: id })),
    Priority: _.Priority || _.priority || "NEUTRAL",
    Properties: _.Properties || Object.entries(_.data).map(([k,v]) => ({
      Key:k, Value:v, Language: cds.context?.locale ?? 'en', Type: typeof v, // IsSensitive: false
    })),

    // Low-level API properties
    OriginId: _.OriginId,
    NotificationTypeId: _.NotificationTypeId,
    NotificationTypeVersion: _.NotificationTypeVersion || "1",
    NavigationTargetAction: _.NavigationTargetAction,
    NavigationTargetObject: _.NavigationTargetObject,
    ProviderId: _.ProviderId,
    ActorId: _.ActorId,
    ActorDisplayText: _.ActorDisplayText,
    ActorImageURL: _.ActorImageURL,
    TargetParameters: _.TargetParameters,
    NotificationTypeTimestamp: _.NotificationTypeTimestamp,
  }
  return notification
}

function mapCdsTypeToANSType(cdsType) {
  if (!cdsType) return 'String'
  const base = cdsType.split('.').pop()
  if (/^(Integer|Integer64|Int16|Int32|Int64|UInt8)$/.test(base)) return 'Integer'
  if (/^(Date|DateTime|Timestamp|Time)$/.test(base)) return 'Date'
  return 'String'
}

function resolveEnumValue(val) {
  if (val && typeof val === 'object') {
    if ('#' in val) return val['#']
    if ('=' in val) return val['=']
  }
  return val
}

function replaceRefsInExpr(expr, data) {
  if (Array.isArray(expr)) return expr.map(item => replaceRefsInExpr(item, data))
  if (!expr || typeof expr !== 'object') return expr
  if ('#' in expr) return { val: expr['#'] }
  if ('ref' in expr && !expr.param) {
    const key = expr.ref[0]
    if (key in data) return { val: data[key] }
    return expr
  }
  if ('xpr' in expr) return { xpr: replaceRefsInExpr(expr.xpr, data) }
  if ('func' in expr) {
    const args = Array.isArray(expr.args)
      ? replaceRefsInExpr(expr.args, data)
      : expr.args
    return { ...expr, args }
  }
  return expr
}

async function evaluateDynamicPriority(xpr, data) {
  const resolvedXpr = replaceRefsInExpr(xpr, data)
  const col = { ...resolvedXpr, as: 'result' }
  const [result] = await cds.db.run({ SELECT: { columns: [col] } })
  if (!result) {
    LOG._warn && LOG.warn('Dynamic priority expression returned no result, falling back to NEUTRAL')
    return undefined
  }
  const raw = result.result
  return raw ? String(raw).toUpperCase() : undefined
}

async function buildNotificationFromEvent(eventDef, data = {}) {
  const { recipients = [], ...eventData } = data

  const Recipients = recipients.map(id => ({ [getRecipientKey(id)]: id }))

  const keyElementNames = new Set(
    Object.entries(eventDef.elements ?? {}).filter(([, elem]) => elem.key).map(([key]) => key)
  )
  const Properties = Object.entries(eventData)
    .filter(([key]) => !keyElementNames.has(key))
    .map(([key, value]) => ({
      Key: key,
      Language: cds.env.i18n?.default_language ?? 'en',
      Value: String(value ?? ''),
      Type: mapCdsTypeToANSType(eventDef.elements?.[key]?.type),
      IsSensitive: true,
    }))

  const TargetParameters = [...keyElementNames].map(key => ({
    Key: key,
    Value: String(data[key] ?? ''),
  }))

  const priorityAnnotation = eventDef['@notification.priority']
  let Priority = 'NEUTRAL'
  if (priorityAnnotation) {
    if (priorityAnnotation.xpr) {
      Priority = await evaluateDynamicPriority({ xpr: priorityAnnotation.xpr }, data) ?? 'NEUTRAL'
    } else {
      const raw = resolveEnumValue(priorityAnnotation)
      Priority = raw ? String(raw).toUpperCase() : 'NEUTRAL'
    }
  }

  const notification = {
    NotificationTypeKey: eventDef.name.split('.').pop(),
    NotificationTypeVersion: '1',
    NavigationTargetObject: eventDef['@Common.SemanticObject'],
    NavigationTargetAction: eventDef['@Common.SemanticObjectAction'],
    Priority,
    Properties,
    Recipients,
  }

  if (TargetParameters.length) notification.TargetParameters = TargetParameters

  return notification
}

function buildNotification(notificationData) {
  let notification

  if (Object.keys(notificationData).length === 0) {
    LOG._warn && LOG.warn(messages.EMPTY_OBJECT_FOR_NOTIFY)
    return
  }

  if (notificationData.type) {
    if (!validateCustomNotifyParameters(
      notificationData.type,
      notificationData.recipients,
      notificationData.properties,
      notificationData.navigation,
      notificationData.priority,
      notificationData.payload)
    ) {
      return
    }

    notification = buildCustomNotification(notificationData)
  } else if (notificationData.NotificationTypeKey) {
    notificationData.NotificationTypeKey = getNotificationTypesKeyWithPrefix(notificationData.NotificationTypeKey)
    notification = notificationData
  } else {
    if (!validateDefaultNotifyParameters(
      notificationData.recipients,
      notificationData.priority,
      notificationData.title,
      notificationData.description)
    ) {
      return
    }

    notification = buildDefaultNotification(
      notificationData.recipients,
      notificationData.priority,
      notificationData.title,
      notificationData.description
    )
  }

  return JSON.parse(JSON.stringify(notification))
}

module.exports = {
  messages,
  validateNotificationTypes,
  readFile,
  getNotificationDestination,
  getPrefix,
  getNotificationTypesKeyWithPrefix,
  buildNotification,
  buildNotificationFromEvent,
  mapCdsTypeToANSType,
  replaceRefsInExpr,
}
