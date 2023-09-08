const cloudSDK = require("@sap-cloud-sdk/core");
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

async function getNotificationTypes(
  destinationName = NOTIFICATIONS_DESTINATION_NAME
) {
  const notifServiceDest = await _getDestination(destinationName);
  const response = await executeHttpRequest(notifServiceDest, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes`,
    method: "get",
  });
  return response.data.d.results;
}

async function postNotificationType(
  notificationType,
  destinationName = NOTIFICATIONS_DESTINATION_NAME
) {
  const notifServiceDest = await _getDestination(destinationName);
  const csrfHeaders = await buildCsrfHeaders(notifServiceDest, {
    url: NOTIFICATION_TYPES_API_ENDPOINT,
  });
  const aExistingNotificationTypes = await this.getNotificationTypes();
  const bIsDuplicateNotificationType = aExistingNotificationTypes.find(
    (nType) =>
      nType.NotificationTypeKey === notificationType.NotificationTypeKey &&
      nType.NotificationTypeVersion === notificationType.NotificationTypeVersion
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

function createNotificationObject(
  recipients,
  notificationTypeKey,
  notificationTypeVersion,
  notificationData,
  language = "en"
) {
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
  const notification = createNotificationObject(
    recipients,
    notificationTypeKey,
    notificationTypeVersion,
    notificationData,
    language
  );
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

module.exports = {
  getNotificationTypes,
  postNotificationType,
  createNotificationObject,
  postNotification,
};
