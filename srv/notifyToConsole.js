const NotificationService = require('./service');
const { createNotification } = require("./../lib/utils");

module.exports = class NotifyToConsole extends NotificationService {
  async init() {
    // call NotificationService's init
    await super.init();
  }

  notify() {
    const notification = createNotification(arguments);

    console.log(`SAP Alert Notification service notification: ${JSON.stringify(notification, null, 2)}`);
  }
}
