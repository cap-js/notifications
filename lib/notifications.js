const cloudSDK = require("@sap-cloud-sdk/core");
const _ = require("lodash");
const util = require("util");
const { getDestination, executeHttpRequest, buildCsrfHeaders } = cloudSDK;
const { messages } = require("./utils");

const NOTIFICATIONS_DESTINATION_NAME = "SAP_Notifications";
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";
const NOTIFICATION_TYPES_API_ENDPOINT = "v2/NotificationType.svc";

async function _getDestination(destinationName) {
  const notifServiceDest = await getDestination(destinationName);
  if (!notifServiceDest) {
    throw new Error(messages.DESTINATION_NOT_FOUND + destinationName);
  }
  return notifServiceDest;
}
async function applyNotificationTypes(notificationTypes) {
  const prefix = "@cap-ans";
  // const prefix = process.env.npm_package_name;
  const keyAndVersionToNotificationType = new Map();
  notificationTypes.forEach((notificationType) => {
    notificationType.NotificationTypeKey = `${prefix}/${notificationType.NotificationTypeKey}`;
    if(notificationType.NotificationTypeVersion === undefined || notificationType.NotificationTypeVersion === null) {
      notificationType.NotificationTypeVersion = "def";
    }
    keyAndVersionToNotificationType.set(toKeyAndVersion(notificationType), notificationType)
  });
  const existingNotificationTypes = await getNotificationTypes();
  const notificationTypesToBeCreated = [];
  const notificationTypesToBeUpdated = [];
  const notificationTypesToBeSkipped = [];
  const notificationTypesToBeSkippedOtherApp = [];
  const notificationTypesToBeDeleted = [];

  existingNotificationTypes.forEach((existingNotificationType) => {
    if (!existingNotificationType.NotificationTypeKey.startsWith(prefix)) {
      notificationTypesToBeSkippedOtherApp.push({ id: existingNotificationType.NotificationTypeId, notificationType: existingNotificationType });
      return;
    }
    var existingKeyAndVersion = toKeyAndVersion(existingNotificationType);
    var notificationType = keyAndVersionToNotificationType.get(existingKeyAndVersion);
    if (notificationType === undefined) {
      notificationTypesToBeDeleted.push({ id: existingNotificationType.NotificationTypeId, notificationType: existingNotificationType });
    } else {
      if (isEligibleForUpdate(existingNotificationType, notificationType)) {
        notificationTypesToBeUpdated.push({ id: existingNotificationType.NotificationTypeId, notificationType: notificationType });
      } else {
        notificationTypesToBeSkipped.push({ id: existingNotificationType.NotificationTypeId, notificationType: notificationType });
      }
      keyAndVersionToNotificationType.delete(existingKeyAndVersion);
    }
  });
  Array.from(keyAndVersionToNotificationType).map(([key, value]) => notificationTypesToBeCreated.push(value));

  console.log("Deleting:");
  console.log(util.inspect(notificationTypesToBeDeleted, false, null, true));
  for (const notificationTypeToBeDeleted of notificationTypesToBeDeleted) {
    await deleteNotificationType(notificationTypeToBeDeleted.id);
  }
  console.log("Skipping Other App:");
  console.log(util.inspect(notificationTypesToBeSkippedOtherApp, false, null, true));
  console.log("Skipping:");
  console.log(util.inspect(notificationTypesToBeSkipped, false, null, true));
  console.log("Updating:");
  console.log(util.inspect(notificationTypesToBeUpdated, false, null, true));
  for (const notificationTypeToBeUpdated of notificationTypesToBeUpdated) {
    await updateNotificationType(notificationTypeToBeUpdated.id, notificationTypeToBeUpdated.notificationType);
  }
  console.log("Creating:");
  console.log(util.inspect(notificationTypesToBeCreated, false, null, true));
  for (const notificationTypeToBeCreated of notificationTypesToBeCreated) {
    await createNotificationType(notificationTypeToBeCreated);
  }
  console.log(process.env.npm_package_name);
}

async function getNotificationTypes(destinationName = NOTIFICATIONS_DESTINATION_NAME) {
  const notifServiceDest = await _getDestination(destinationName);
  const response = await executeHttpRequest(notifServiceDest, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels`,
    method: "get",
  });
  return response.data.d.results;
}

async function createNotificationType(notificationType, destinationName = NOTIFICATIONS_DESTINATION_NAME) {
  const notifServiceDest = await _getDestination(destinationName);
  const csrfHeaders = await buildCsrfHeaders(notifServiceDest, {
    url: NOTIFICATION_TYPES_API_ENDPOINT,
  });
  const response = await executeHttpRequest(notifServiceDest, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes`,
    method: "post",
    data: notificationType,
    headers: csrfHeaders,
  });
  return response.data.d;
}

async function updateNotificationType(id, notificationType, destinationName = NOTIFICATIONS_DESTINATION_NAME) {
  const notifServiceDest = await _getDestination(destinationName);
  const csrfHeaders = await buildCsrfHeaders(notifServiceDest, {
    url: NOTIFICATION_TYPES_API_ENDPOINT,
  });
  const response = await executeHttpRequest(notifServiceDest, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes(guid'${id}')`,
    method: "patch",
    data: notificationType,
    headers: csrfHeaders,
  });
  return response.data.d;
}

async function deleteNotificationType(id, destinationName = NOTIFICATIONS_DESTINATION_NAME) {
  const notifServiceDest = await _getDestination(destinationName);
  const csrfHeaders = await buildCsrfHeaders(notifServiceDest, {
    url: NOTIFICATION_TYPES_API_ENDPOINT,
  });
  const response = await executeHttpRequest(notifServiceDest, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes(guid'${id}')`,
    method: "delete",
    headers: csrfHeaders,
  });
  return response.data.d;
}

async function postNotificationType(notificationType, destinationName = NOTIFICATIONS_DESTINATION_NAME) {
  const notifServiceDest = await _getDestination(destinationName);
  const csrfHeaders = await buildCsrfHeaders(notifServiceDest, {
    url: NOTIFICATION_TYPES_API_ENDPOINT,
  });
  const aExistingNotificationTypes = await this.getNotificationTypes();
  const bIsDuplicateNotificationType = aExistingNotificationTypes.find(
    (nType) =>
      nType.NotificationTypeKey === notificationType.NotificationTypeKey && nType.NotificationTypeVersion === notificationType.NotificationTypeVersion
  );

  if (!bIsDuplicateNotificationType) {
    console.log(
      `Notification Type of key ${notificationType.NotificationTypeKey} and version ${notificationType.NotificationTypeVersion} was not found. Creating it...`
    );
    const response = await executeHttpRequest(notifServiceDest, {
      url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes`,
      method: "post",
      data: notificationType,
      headers: csrfHeaders,
    });
    return response.data.d;
  } else {
    return true;
  }
}

function createNotificationObject(recipients, notificationTypeKey, notificationTypeVersion, notificationData, language = "en") {
  let aProperties = [];
  if (typeof notificationData === "object") {
    for (sProperty of Object.keys(notificationData)) {
      //TODO: recheck if can be sent from application. Check for localization
      aProperties.push({
        Key: sProperty,
        Language: language,
        Value: notificationData[sProperty],
        Type: "String",
        IsSensitive: false,
      });
    }
  }
  return {
    NotificationTypeKey: notificationTypeKey,
    NotificationTypeVersion: notificationTypeVersion,
    Priority: "High",
    Properties: aProperties,
    Recipients: recipients.map((recipient) => ({ RecipientId: recipient })),
  };
}

async function postNotification(
  recipients,
  notificationTypeKey,
  notificationTypeVersion,
  notificationData,
  language = "en",
  destinationName = NOTIFICATIONS_DESTINATION_NAME
) {
  const notification = createNotificationObject(recipients, notificationTypeKey, notificationTypeVersion, notificationData, language);
  const notifServiceDest = await _getDestination(destinationName);
  const csrfHeaders = await buildCsrfHeaders(notifServiceDest, {
    url: NOTIFICATIONS_API_ENDPOINT,
  });

  let response = {};
  try {
    response = await executeHttpRequest(notifServiceDest, {
      url: `${NOTIFICATIONS_API_ENDPOINT}/Notifications`,
      method: "post",
      data: notification,
      headers: csrfHeaders,
    });
  } catch (e) {
    console.log(e);
  }
  return response.data.d;
}

function isEligibleForUpdate(existingNotificationType, notificationType) {
  return !(
    existingNotificationType.NotificationTypeKey == notificationType.NotificationTypeKey &&
    existingNotificationType.NotificationTypeVersion == notificationType.NotificationTypeVersion &&
    existingNotificationType.IsGroupable == notificationType.IsGroupable &&
    areTemplatesEqual(existingNotificationType.Templates.results, fromOdataArrayFormat(notificationType.Templates)) &&
    areActionsEqual(existingNotificationType.Actions.results, fromOdataArrayFormat(notificationType.Actions)) &&
    areDeliveryChannelsEqual(existingNotificationType.DeliveryChannels.results, fromOdataArrayFormat(notificationType.DeliveryChannels))
  );
}

function fromOdataArrayFormat(objectInArray) {
  if (objectInArray === undefined || objectInArray === null || Array.isArray(objectInArray)) {
    return objectInArray;
  } else {
    return objectInArray.results;
  }
}

function areTemplatesEqual(existingTemplates, templates) {
  if (_.size(existingTemplates) != _.size(templates)) {
    console.log("length no equal");
    return false;
  }
  var foundMatch = false;
  for (const existingTemplate of existingTemplates) {
    for (const template of templates) {
      if (areTemplateEqual(existingTemplate, template)) {
        foundMatch = true;
        break;
      }
    }
    if (!foundMatch) {
      console.log("match not found");
      return false;
    }
  }
  return true;
}

function areTemplateEqual(existingTemplate, template) {
  var asd =
    existingTemplate.Language == template.Language.toUpperCase() &&
    existingTemplate.TemplatePublic == template.TemplatePublic &&
    existingTemplate.TemplateSensitive == template.TemplateSensitive &&
    existingTemplate.TemplateGrouped == template.TemplateGrouped &&
    existingTemplate.Description == template.Description &&
    existingTemplate.TemplateLanguage == template.TemplateLanguage.toUpperCase() &&
    existingTemplate.Subtitle == template.Subtitle &&
    existingTemplate.EmailSubject == template.EmailSubject &&
    existingTemplate.EmailText == template.EmailText &&
    existingTemplate.EmailHtml == template.EmailHtml;
  return asd;
}

function areActionsEqual(existingActions, actions) {
  if (_.size(existingActions) != _.size(actions)) {
    console.log("length no equal");
    return false;
  }
  var foundMatch = false;
  for (const existingAction of existingActions) {
    for (const action of actions) {
      if (areActionEqual(existingAction, action)) {
        foundMatch = true;
        break;
      }
    }
    if (!foundMatch) {
      console.log("match not found");
      return false;
    }
  }
  return true;
}

function areActionEqual(existingAction, action) {
  console.log(existingAction);
  console.log(action);
  var asd =
    existingAction.Language == action.Language.toUpperCase() &&
    existingAction.ActionId == action.ActionId &&
    existingAction.ActionText == action.ActionText &&
    existingAction.GroupActionText == action.GroupActionText &&
    existingAction.Nature == action.Nature;
  return asd;
}

function areDeliveryChannelsEqual(existingDeliveryChannels, deliveryChannels) {
  if (_.size(existingDeliveryChannels) != _.size(deliveryChannels)) {
    console.log("length no equal");
    return false;
  }
  var foundMatch = false;
  for (const existingDeliveryChannel of existingDeliveryChannels) {
    for (const deliveryChannel of deliveryChannels) {
      if (areDeliveryChannelEqual(existingDeliveryChannel, deliveryChannel)) {
        foundMatch = true;
        break;
      }
    }
    if (!foundMatch) {
      console.log("match not found");
      return false;
    }
  }
  return true;
}

function areDeliveryChannelEqual(existingDeliveryChannel, deliveryChannel) {
  console.log(existingDeliveryChannel);
  console.log(deliveryChannel);
  var asd =
    existingDeliveryChannel.Language == deliveryChannel.Language.toUpperCase() &&
    existingDeliveryChannel.ActionId == deliveryChannel.ActionId &&
    existingDeliveryChannel.ActionText == deliveryChannel.ActionText &&
    existingDeliveryChannel.GroupActionText == deliveryChannel.GroupActionText &&
    existingDeliveryChannel.Nature == deliveryChannel.Nature;
  return asd;
}

function toKeyAndVersion(notificationType) {
  return `${notificationType.NotificationTypeKey}_${notificationType.NotificationTypeVersion}`;
}

module.exports = {
  getNotificationTypes,
  postNotificationType,
  createNotificationObject,
  postNotification,
  isEligibleForUpdate,
  applyNotificationTypes,
};
