const { buildHeadersForDestination } = require("@sap-cloud-sdk/connectivity");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { getNotificationDestination } = require("./utils");
const LOG = cds.log('notifications');
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";

async function postNotification(notificationData) {
  const notificationDestination = await getNotificationDestination();
  const csrfHeaders = await buildHeadersForDestination(notificationDestination, {
    url: NOTIFICATIONS_API_ENDPOINT,
  });

  try {
    LOG._info && LOG.info(
      `Sending notification of key: ${notificationData.NotificationTypeKey} and version: ${notificationData.NotificationTypeVersion}`
    );
    await executeHttpRequest(notificationDestination, {
      url: `${NOTIFICATIONS_API_ENDPOINT}/Notifications`,
      method: "post",
      data: notificationData,
      headers: csrfHeaders,
    });
  } catch (err) {
    const message = err.response.data?.error?.message?.value ?? err.response.message;
    const error = new cds.error(message);

    if (String(err.response?.status).match(/^4\d\d$/) && err.response?.status !== 429) {
      error.unrecoverable = true;
    }

    throw error;
  }
}

module.exports = {
  postNotification
};