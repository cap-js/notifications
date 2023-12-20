const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { buildHeadersForDestination } = require("@sap-cloud-sdk/connectivity");
const { getNotificationDestination, getPrefix, getNotificationTypesKeyWithPrefix } = require("./utils");
const NOTIFICATION_TYPES_API_ENDPOINT = "v2/NotificationType.svc";
const cds = require("@sap/cds");
const LOG = cds.log('notifications');

const defaultTemplate = {
  NotificationTypeKey: "Default",
  NotificationTypeVersion: "1",
  Templates: [
    {
      Language: "en",
      Description: "Other Notifications",
      TemplatePublic: "{{title}}",
      TemplateSensitive: "{{title}}",
      TemplateGrouped: "Other Notifications",
      TemplateLanguage: "mustache",
      Subtitle: "{{description}}"
    }
  ]
};

function fromOdataArrayFormat(objectInArray) {
  if (objectInArray === undefined || objectInArray === null || Array.isArray(objectInArray)) {
    return (objectInArray === undefined || objectInArray === null) ? [] : objectInArray;
  } else {
    return (objectInArray.results === undefined || objectInArray.results === null) ? [] : objectInArray.results;
  }
}

function createNotificationTypesMap(notificationTypesJSON, isLocal = false) {
  const types = {};

  if (isLocal) {
    types["Default"] = { "1": defaultTemplate };
  }

  // add user provided templates
  notificationTypesJSON.forEach((notificationType) => {
    // set default NotificationTypeVersion if required
    if (notificationType.NotificationTypeVersion === undefined) {
      notificationType.NotificationTypeVersion = "1";
    }

    const notificationTypeKeyWithPrefix = getNotificationTypesKeyWithPrefix(notificationType.NotificationTypeKey);

    // update the notification type key with prefix
    notificationType.NotificationTypeKey = notificationTypeKeyWithPrefix;

    if (!(notificationTypeKeyWithPrefix in types)) {
      types[notificationTypeKeyWithPrefix] = {};
    }

    types[notificationTypeKeyWithPrefix][notificationType.NotificationTypeVersion] = notificationType;
  });

  return types;
}

async function getNotificationTypes() {
  const notificationDestination = await getNotificationDestination();
  const response = await executeHttpRequest(notificationDestination, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels`,
    method: "get"
  });
  return response.data.d.results;
}

async function createNotificationType(notificationType) {
  const notificationDestination = await getNotificationDestination();
  const csrfHeaders = await buildHeadersForDestination(notificationDestination, {
    url: NOTIFICATION_TYPES_API_ENDPOINT
  });

  LOG._warn && LOG.warn(
    `Notification Type of key ${notificationType.NotificationTypeKey} and version ${notificationType.NotificationTypeVersion} was not found. Creating it...`
  );

  const response = await executeHttpRequest(notificationDestination, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes`,
    method: "post",
    data: notificationType,
    headers: csrfHeaders
  });
  return response.data?.d ?? response;
}

async function updateNotificationType(id, notificationType) {
  const notificationDestination = await getNotificationDestination();
  const csrfHeaders = await buildHeadersForDestination(notificationDestination, {
    url: NOTIFICATION_TYPES_API_ENDPOINT
  });

  LOG._info && LOG.info(
    `Detected change in notification type of key ${notificationType.NotificationTypeKey} and version ${notificationType.NotificationTypeVersion}. Updating it...`
  );

  const response = await executeHttpRequest(notificationDestination, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes(guid'${id}')`,
    method: "patch",
    data: notificationType,
    headers: csrfHeaders
  });
  return response.status;
}

async function deleteNotificationType(notificationType) {
  const notificationDestination = await getNotificationDestination();
  const csrfHeaders = await buildHeadersForDestination(notificationDestination, {
    url: NOTIFICATION_TYPES_API_ENDPOINT
  });

  LOG._info && LOG.info(
    `Notification Type of key ${notificationType.NotificationTypeKey} and version ${notificationType.NotificationTypeVersion} not present in the types file. Deleting it...`
  );

  const response = await executeHttpRequest(notificationDestination, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes(guid'${notificationType.NotificationTypeId}')`,
    method: "delete",
    headers: csrfHeaders
  });
  return response.status;
}

function _createChannelsMap(channels) {
  const channelMap = {};

  channels.forEach((channel) => {
    channelMap[channel.Type] = channel;
  });

  return channelMap;
}

function areDeliveryChannelsEqual(oldChannels, newChannels) {
  if (oldChannels.length !== newChannels.length) {
    return false;
  }

  const oldChannelsMap = _createChannelsMap(oldChannels);
  const newChannelsMap = _createChannelsMap(newChannels);

  for (let type of Object.keys(oldChannelsMap)) {
    if (!(type in newChannelsMap)) return false;

    const oldChannel = oldChannelsMap[type];
    const newChannel = newChannelsMap[type];

    // TODO: Check if language is not there
    const equal =
      oldChannel.Type == newChannel.Type.toUpperCase() &&
      oldChannel.Enabled == newChannel.Enabled &&
      oldChannel.DefaultPreference == newChannel.DefaultPreference &&
      oldChannel.EditablePreference == newChannel.EditablePreference;

    if (!equal) return false;
    delete newChannelsMap[type];
  }

  return Object.keys(newChannelsMap).length == 0;
}

function isActionEqual(oldAction, newAction) {
  return (
    oldAction.Language == newAction.Language.toUpperCase() &&
    oldAction.ActionId == newAction.ActionId &&
    oldAction.ActionText == newAction.ActionText &&
    oldAction.GroupActionText == newAction.GroupActionText &&
    oldAction.Nature == newAction.Nature
  );
}

function areActionsEqual(oldActions, newActions) {
  if (oldActions.length !== newActions.length) {
    return false;
  }

  let matchFound = false;
  for (const oldAction of oldActions) {
    for (const newAction of newActions) {
      if (isActionEqual(oldAction, newAction)) {
        matchFound = true;
        break;
      }
    }
    if (!matchFound) {
      return false;
    }
  }

  return true;
}

function isTemplateEqual(oldTemplate, newTemplate) {
  return (
    oldTemplate.Language == newTemplate.Language.toUpperCase() &&
    oldTemplate.TemplatePublic == newTemplate.TemplatePublic &&
    oldTemplate.TemplateSensitive == newTemplate.TemplateSensitive &&
    oldTemplate.TemplateGrouped == newTemplate.TemplateGrouped &&
    oldTemplate.Description == newTemplate.Description &&
    oldTemplate.TemplateLanguage == newTemplate.TemplateLanguage.toUpperCase() &&
    oldTemplate.Subtitle == newTemplate.Subtitle &&
    oldTemplate.EmailSubject == newTemplate.EmailSubject &&
    oldTemplate.EmailText == newTemplate.EmailText &&
    oldTemplate.EmailHtml == newTemplate.EmailHtml
  );
}

function areTemplatesEqual(oldTemplates, newTemplates) {
  if (oldTemplates.length !== newTemplates.length) {
    return false;
  }

  let matchFound = false;
  for (const oldTemplate of oldTemplates) {
    for (const newTemplate of newTemplates) {
      if (isTemplateEqual(oldTemplate, newTemplate)) {
        matchFound = true;
        break;
      }
    }
    if (!matchFound) {
      return false;
    }
  }

  return true;
}

function isNotificationTypeEqual(oldNotificationType, newNotificationType) {
  if (newNotificationType.IsGroupable === undefined) {
    newNotificationType.IsGroupable = true;
  }

  return (
    oldNotificationType.IsGroupable == newNotificationType.IsGroupable &&
    areTemplatesEqual(fromOdataArrayFormat(oldNotificationType.Templates), fromOdataArrayFormat(newNotificationType.Templates)) &&
    areActionsEqual(fromOdataArrayFormat(oldNotificationType.Actions), fromOdataArrayFormat(newNotificationType.Actions)) &&
    areDeliveryChannelsEqual(fromOdataArrayFormat(oldNotificationType.DeliveryChannels), fromOdataArrayFormat(newNotificationType.DeliveryChannels))
  );
}

async function processNotificationTypes(notificationTypesJSON) {
  const notificationTypes = createNotificationTypesMap(notificationTypesJSON);
  const prefix = getPrefix();
  let defaultTemplateExists = false;

  // get notficationTypes
  const existingTypes = await getNotificationTypes();

  // iterate through notification types
  for (const existingType of existingTypes) {
    if (existingType.NotificationTypeKey == "Default") {
      defaultTemplateExists = true;
      continue;
    }

    if (!existingType.NotificationTypeKey.startsWith(`${prefix}/`)) {
      LOG._info && LOG.info(`Skipping Notification Type of other application: ${existingType.NotificationTypeKey}.`);
      continue;
    }

    // if the type isn't present in the JSON file, delete it
    if (
      notificationTypes[existingType.NotificationTypeKey] === undefined ||
      notificationTypes[existingType.NotificationTypeKey][existingType.NotificationTypeVersion] === undefined
    ) {
      await deleteNotificationType(existingType);
      continue;
    }

    const newType = JSON.parse(JSON.stringify(notificationTypes[existingType.NotificationTypeKey][existingType.NotificationTypeVersion]));

    // if the type is there then verify if everything is same or not
    if (!isNotificationTypeEqual(existingType, newType)) {
      await updateNotificationType(existingType.NotificationTypeId, notificationTypes[existingType.NotificationTypeKey][existingType.NotificationTypeVersion]);
    } else {
      LOG._info && LOG.info(
        `Notification Type of key ${existingType.NotificationTypeKey} and version ${existingType.NotificationTypeVersion} unchanged.`
      );
    }

    delete notificationTypes[existingType.NotificationTypeKey][existingType.NotificationTypeVersion];

    if (Object.keys(notificationTypes[existingType.NotificationTypeKey]).length == 0) {
      delete notificationTypes[existingType.NotificationTypeKey];
    }
  }

  // create default template if required
  if (!defaultTemplateExists) {
    await createNotificationType(defaultTemplate);
  }

  // create notification types that aren't there
  for (const notificationTypeKey in notificationTypes) {
    for (const notificationTypeVersion in notificationTypes[notificationTypeKey]) {
      await createNotificationType(notificationTypes[notificationTypeKey][notificationTypeVersion]);
    }
  }
}

module.exports = {
  createNotificationTypesMap,
  processNotificationTypes
}
