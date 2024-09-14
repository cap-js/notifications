const NotificationService = require("./service")

const { buildHeadersForDestination } = require("@sap-cloud-sdk/connectivity");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { getNotificationDestination } = require("../lib/utils");
const cds = require("@sap/cds");
const { processNotificationTypes } = require("../lib/deployer/notificationTypes");
const LOG = cds.log('notifications');
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";


module.exports = exports = class NotifyToRest extends NotificationService {
  async postNotification(notificationData) {
    if (!notificationData.Recipients || notificationData.Recipients.length === 0) {
      LOG.warn(`Tried to send notification ${notificationData.NotificationTypeKey} without recipients!`);
      return;
    }

    const notificationDestination = await getNotificationDestination();
    const csrfHeaders = await buildHeadersForDestination(notificationDestination, {
      url: NOTIFICATIONS_API_ENDPOINT,
    });

    try {
      LOG._info && LOG.info(
        `Sending notification of key: ${notificationData.NotificationTypeKey} and version: ${notificationData.NotificationTypeVersion}`
      );
      const {data: {d: notification}} = await executeHttpRequest(notificationDestination, {
        url: `${NOTIFICATIONS_API_ENDPOINT}/Notifications`,
        method: "post",
        data: notificationData,
        headers: csrfHeaders,
      });
      return notificationData.Recipients.map(r => ({
        ID: notification.Id,
        notificationTypeKey: notificationData.NotificationTypeKey,
        recipient: r.RecipientId,
        targetParameters: notificationData.TargetParameters.map(t => ({
          notification_ID: notification.Id,
          value: t.Value,
          name: t.Key
        })),
      }))
    } catch (err) {
      const message = err.response.data?.error?.message?.value ?? err.response.message;
      const error = new cds.error(message);

      if (/^4\d\d$/.test(err.response?.status) && err.response?.status != 429) {
        error.unrecoverable = true;
      }

      throw error;
    }
  }
}
