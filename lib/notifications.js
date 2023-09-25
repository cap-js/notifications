const { executeHttpRequest, buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { getNotificationDestination, getNotificationTypesMapKey } = require("./utils");

const NOTIFICATIONS_DESTINATION_NAME = cds.env.requires.notifications?.destination ?? "SAP_Notifications";
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";

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

  const notificationTypeKeyWithPrefix = getNotificationTypesMapKey(notificationTypeKey);

  return {
    NotificationTypeKey: notificationTypeKeyWithPrefix,
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
  destination = NOTIFICATIONS_DESTINATION_NAME
) {
  const notification = createNotificationObject(recipients, notificationTypeKey, notificationTypeVersion, notificationData, language);
  const notifServiceDest = await getNotificationDestination(destination);
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
  createNotificationObject,
  postNotification
};
