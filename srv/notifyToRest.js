const NotificationService = require('./service');

const notifier = require("../lib/notifications");

module.exports = class NotifyToRest extends NotificationService {
  async init() {

    this.notify = notifier.postNotification;

    // call NotificationService's init
    await super.init();
  }
}