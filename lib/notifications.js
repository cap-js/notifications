const { buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { getNotificationDestination, executeRequest, buildNotification } = require("./utils");
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";

async function postNotification() {
  const notificationServiceDestination = await getNotificationDestination();
  const csrfHeaders = await buildCsrfHeaders(notificationServiceDestination, {
    url: NOTIFICATIONS_API_ENDPOINT,
  });

  const notification = buildNotification(arguments);

  if (notification) {
    const response = await executeRequest("post", `${NOTIFICATIONS_API_ENDPOINT}/Notifications`, notification, notificationServiceDestination, csrfHeaders);
    return response.data?.d ?? response;
  }
}

module.exports = {
  postNotification
};
