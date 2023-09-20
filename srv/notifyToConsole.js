const NotificationService = require('./service');
const cds = require("@sap/cds");
const notifier = require("../lib/notifications");
const { doesKeyExist, getNotificationTypesKeyWithPrefix } = require('../lib/utils');

module.exports = class NotifyToConsole extends NotificationService {
  async init() {
    // call NotificationService's init
    await super.init();
  }

  notify() {
    console.log(`[ans] - ${arguments}:`);
  }
}
