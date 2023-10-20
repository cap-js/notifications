const cds = require('@sap/cds')
const NotificationService = require('./service');
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { buildHeadersForDestination } = require("@sap-cloud-sdk/connectivity");
const { getNotificationDestination, buildNotification } = require("../lib/utils");

module.exports = class NotifyToRest extends NotificationService {
  async init() {

    // call NotificationService's init
    await super.init();

    this.on('postNotificationEvent', async function(req) {
      const { data } = req
      const notificationDestination = await getNotificationDestination();
      const csrfHeaders = await buildHeadersForDestination(notificationDestination, {
        url: NOTIFICATIONS_API_ENDPOINT,
      });

      try {
        console.log(`Sending notification of key: ${data.NotificationTypeKey} and version: ${data.NotificationTypeVersion}`)
        await executeHttpRequest(notificationDestination, {
          url: `${NOTIFICATIONS_API_ENDPOINT}/Notifications`,
          method: "post",
          data: data,
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
    })
  }

  async notify(notificationData) {
    const notification = buildNotification(notificationData);

    if (notification) {
      await this.emit({ event: 'postNotificationEvent', data: notification });
    }
  }
}
