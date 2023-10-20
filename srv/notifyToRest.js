const NotificationService = require('./service');
const { postNotification } = require("../lib/notifications");

module.exports = class NotifyToRest extends NotificationService {
  async init() {

    this.notify = postNotification;
    // call NotificationService's init
    await super.init();
  }
}
