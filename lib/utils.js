const { existsSync, readFileSync } = require('fs');
const { basename } = require('path');
const cds = require("@sap/cds");
const LOG = cds.log('notifications');
const { getDestination } = require("@sap-cloud-sdk/connectivity");
const PRIORITIES = ["LOW", "NEUTRAL", "MEDIUM", "HIGH"];

const messages = {
  TYPES_FILE_NOT_EXISTS: "Notification Types file path is incorrect.",
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
};
//See: https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/developing-cloud-foundry-applications-with-notifications
const supportedANSLanguages = {AF: 1, AR: 1, BG: 1, CA: 1, ZH: 1, ZF: 1, HR: 1, CS: 1, DA: 1, NL: 1, EN: 1, ET: 1, FI: 1, FR: 1, KM: 1, DE: 1, EL: 1, HE: 1, HU: 1, IS: 1, ID: 1, IT: 1, HI: 1, JA: 1, KO: 1, LV: 1, LT: 1, MS: 1, NO: 1, NB: 1, PL: 1, PT: 1, Z1: 1, RO: 1, RU: 1, SR: 1, SH: 1, SK: 1, VI: 1, SL: 1, ES: 1, SV: 1, TH: 1, TR: 1, UK: 1, IW: 1, IN: 1, ZH_HANS: 1, ZH_HANT: 1, ZH_CN: 1, ZH_TW: 1}

const sanitizedLocale = () => cds.context?.locale && supportedANSLanguages[cds.context.locale] != undefined ? cds.context.locale : 'en'

function validateNotificationTypes(notificationTypes) {
  for(let notificationType of notificationTypes){
    if (!("NotificationTypeKey" in notificationType)) {
      LOG._warn && LOG.warn(messages.INVALID_NOTIFICATION_TYPES);
      return false;
    }
  }

  return true;
}

function validateDefaultNotifyParameters(recipients, priority, title, description) {
  if (!recipients || !title) {
    LOG._warn && LOG.warn(messages.MANDATORY_PARAMETER_NOT_PASSED_FOR_DEFAULT_NOTIFICATION);
    return false;
  }

  if (!Array.isArray(recipients) || recipients.length == 0) {
    LOG._warn && LOG.warn(messages.RECIPIENTS_IS_NOT_ARRAY);
    return false;
  }

  if (typeof title !== "string") {
    LOG._warn && LOG.warn(messages.TITLE_IS_NOT_STRING);
    return false;
  }

  if (priority && !PRIORITIES.includes(priority.toUpperCase())) {
    LOG._warn && LOG.warn(`Invalid priority ${priority}. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH`);
    return false;
  }

  if (description && typeof description !== "string") {
    LOG._warn && LOG.warn(messages.DESCRIPTION_IS_NOT_STRING);
    return false;
  }

  return true;
}

function validateCustomNotifyParameters(type, recipients, properties, navigation, priority, payload) {
  if (!recipients) {
    LOG._warn && LOG.warn(messages.MANDATORY_PARAMETER_NOT_PASSED_FOR_CUSTOM_NOTIFICATION);
    return false;
  }

  if (!Array.isArray(recipients) || recipients.length == 0) {
    LOG._warn && LOG.warn(messages.RECIPIENTS_IS_NOT_ARRAY);
    return false;
  }

  if (priority && !PRIORITIES.includes(priority.toUpperCase())) {
    LOG._warn && LOG.warn(`Invalid priority ${priority}. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH`);
    return false;
  }

  if (properties && !Array.isArray(properties)) {
    LOG._warn && LOG.warn(messages.PROPERTIES_IS_NOT_OBJECT);
    return false;
  }

  if (navigation && typeof navigation !== "object") {
    LOG._warn && LOG.warn(messages.NAVIGATION_IS_NOT_OBJECT);
    return false;
  }

  if (payload && typeof payload !== "object") {
    LOG._warn && LOG.warn(messages.PAYLOAD_IS_NOT_OBJECT);
    return false;
  }

  return true;
}


function readFile(filePath) {
  if (!existsSync(filePath)) {
    LOG._warn && LOG.warn(messages.TYPES_FILE_NOT_EXISTS);
    return [];
  }

  return JSON.parse(readFileSync(filePath));
}

async function getNotificationDestination() {
  const destinationName = cds.env.requires.notifications?.destination ?? "SAP_Notifications";
  const notificationDestination = await getDestination({ destinationName, useCache: true });
  if (!notificationDestination) {
    // TODO: What to do if destination isn't found??
    throw new Error(messages.DESTINATION_NOT_FOUND + destinationName);
  }
  return notificationDestination;
}

let prefix // be filled in below...
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
  const prefix = getPrefix();
  return `${prefix}/${notificationTypeKey}`;
}

function buildDefaultNotification(
  recipients,
  priority = "NEUTRAL",
  title,
  description = ""
) {
  const properties = [
    {
      Key: "title",
      Language: sanitizedLocale(),
      Value: title,
      Type: "String",
      IsSensitive: false,
    },
    {
      Key: "description",
      Language: sanitizedLocale(),
      Value: description,
      Type: "String",
      IsSensitive: false,
    },
  ];

  return {
    NotificationTypeKey: "Default",
    NotificationTypeVersion: "1",
    Priority: priority,
    Properties: properties,
    Recipients: recipients.map((recipient) => ({ RecipientId: recipient }))
  };
}

function buildCustomNotification(_) {
  let notification = {

    // Properties with simple API variants
    NotificationTypeKey: getNotificationTypesKeyWithPrefix(_.NotificationTypeKey || _.type),
    Recipients: _.Recipients || _.recipients?.map(id => ({ RecipientId: id })),
    Priority: _.Priority || _.priority || "NEUTRAL",
    Properties: _.Properties || Object.entries(_.data).map(([k,v]) => ({
      Key:k, Value:v, Language: sanitizedLocale(), Type: typeof v, IsSensitive: true //Is sensitive so all data is encrypted and stored in DB in ANS
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

function buildNotification(notificationData) {
  let notification;

  if (Object.keys(notificationData).length === 0) {
    LOG._warn && LOG.warn(messages.EMPTY_OBJECT_FOR_NOTIFY);
    return;
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
      return;
    }

    notification = buildCustomNotification(notificationData);
  } else if (notificationData.NotificationTypeKey) {
    notificationData.NotificationTypeKey = getNotificationTypesKeyWithPrefix(notificationData.NotificationTypeKey);
    notification = notificationData;
  } else {
    if (!validateDefaultNotifyParameters(
      notificationData.recipients,
      notificationData.priority,
      notificationData.title,
      notificationData.description)
    ) {
      return;
    }

    notification = buildDefaultNotification(
      notificationData.recipients,
      notificationData.priority,
      notificationData.title,
      notificationData.description
    );
  }

  return JSON.parse(JSON.stringify(notification));
}

module.exports = {
  messages,
  validateNotificationTypes,
  readFile,
  getNotificationDestination,
  getPrefix,
  getNotificationTypesKeyWithPrefix,
  buildNotification
};
