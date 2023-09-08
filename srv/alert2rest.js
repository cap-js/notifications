const AlertNotificationService = require('./service')

const notifier = require("../lib/notifications");

module.exports = class Alert2Rest extends AlertNotificationService {
  async init() {

    this.notify = notifier.postNotification

    // call AlertNotificationService's init
    await super.init()
  }
}