const { buildHeadersForDestination } = require("@sap-cloud-sdk/connectivity");
const { getNotificationDestination, executeRequest, buildNotification } = require("./utils");
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";

async function postNotification(notificationData) {
  const notificationDestination = await getNotificationDestination();
  const csrfHeaders = await buildHeadersForDestination(notificationDestination, {
    url: NOTIFICATIONS_API_ENDPOINT,
  });

  const notification = buildNotification(notificationData);

  if (notification) {
    const response = await executeRequest("post", `${NOTIFICATIONS_API_ENDPOINT}/Notifications`, notification, notificationDestination, csrfHeaders);
    return response.data?.d ?? response;
  }
}

module.exports = {
  postNotification
};
