const NotificationService = require('./service');
const cds = require("@sap/cds");
const notifier = require("../lib/notifications");

module.exports = class NotifyToConsole extends NotificationService {
  async init() {
    // call NotificationService's init
    await super.init();
  }

  notify() {
    console.log(JSON.stringify(arguments, null, 2));
  }
}
