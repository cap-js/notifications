const { executeHttpRequest, buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const NotificationService = require('./service');
const { messages, getNotificationDestination } = require('../lib/utils');
const { createNotificationObject } = require("../lib/notifications");
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";

module.exports = class NotifyToRest extends NotificationService {
  async init() {

    // call NotificationService's init
    await super.init();
  }

  async notify(recipients, notificationData, priority = "LOW") {
    // validate recipients array
    if(!Array.isArray(recipients)) {
      throw new Error(messages.INVALID_RECIPIENTS_OBJECT);
    }

    const notification = createNotificationObject(recipients, notificationData, priority);
    const notificationServiceDestination = await getNotificationDestination();
    const csrfHeaders = await buildCsrfHeaders(notificationServiceDestination, {
      url: NOTIFICATIONS_API_ENDPOINT,
    });

    try {
      const response = await executeHttpRequest(notificationServiceDestination, {
        url: `${NOTIFICATIONS_API_ENDPOINT}/Notifications`,
        method: "post",
        data: notification,
        headers: csrfHeaders,
      });

      return response.data.d;
    } catch (e) {
      console.log(e);
    }
  }
}