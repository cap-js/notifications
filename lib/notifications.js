const cloudSDK = require("@sap-cloud-sdk/core");
const { getDestination, executeHttpRequest, buildCsrfHeaders } = cloudSDK;
const { messages } = require("./utils");

const NOTIFICATIONS_DESTINATION_NAME = "SAP_Notifications";
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";
const NOTIFICATION_TYPES_API_ENDPOINT = "v2/NotificationType.svc";
const POSSIBLE_PRIORITIES = ["LOW", "NEUTRAL", "MEDIUM", "HIGH"];

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

async function createNotificationObject(
  recipients,
  notificationData
) {
  return {
    NotificationTypeKey: notificationData["NotificationTypeKey"],
    NotificationTypeVersion: notificationData["NotificationTypeVersion"],
    Priority: notificationData["Priority"],
    Properties: notificationData["Properties"],
    Recipients: recipients.map((recipient) => ({ RecipientId: recipient }))
  };
}

async function createDefaultNotificationObject(
  recipients,
  title,
  description,
  priority
) {
  let properties = [
    {
      Key: "title",
      Language: "en",
      Value: title,
      Type: "String",
      IsSensitive: false,
    },
    {
      Key: "description",
      Language: "en",
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

async function postNotificationCustomTemplate(
  recipients,
  notificationData
) {
  let notification = {};
  //This is done because of the nodejs function overloading
  if (arguments.length == 2) {
    notification = await createNotificationObject(
      recipients,
      notificationData
    );
  } else {
    notification = recipients
  }

  const notifServiceDest = await _getDestination(NOTIFICATIONS_DESTINATION_NAME);
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
    return e;
  }
  return response.data.d;
}

async function postNotificationDefaultTemplate(
  recipients,
  title,
  description,
  priority = "MEDIUM"
) {

  //This is done because of the nodejs function overloading
  if (POSSIBLE_PRIORITIES.includes(description)) {
    priority = description;
    description = "";
  }

  const notification = await createDefaultNotificationObject(
    recipients,
    title,
    description,
    priority
  );
  const notifServiceDest = await _getDestination(NOTIFICATIONS_DESTINATION_NAME);
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
    return e;
  }
  return response.data.d;
}
 
module.exports = {
  getNotificationTypes,
  postNotificationType,
  postNotificationDefaultTemplate,
  postNotificationCustomTemplate
};
