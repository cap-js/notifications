const NotificationService = require('./service');
const cds = require("@sap/cds");
const { buildNotification, doesKeyExist } = require("./../lib/utils");

module.exports = class NotifyToConsole extends NotificationService {
  async init() {
    // call NotificationService's init
    await super.init();
  }

  notify() {

    const notification = buildNotification(arguments[0]);

    if (notification) {
      console.log(`SAP Alert Notification service notification: ${JSON.stringify(notification, null, 2)}`);

      const existingTypes = cds.notifications.local.types;
  
      if (!doesKeyExist(existingTypes, notification["NotificationTypeKey"])) {
        console.log(`Notification Type ${notification["NotificationTypeKey"]} is not in the notification types file`);
        return;
      }
  
      if (!doesKeyExist(existingTypes[notification["NotificationTypeKey"]], notification["NotificationTypeVersion"])) {
        console.log(`Notification Type Version ${notification["NotificationTypeVersion"]} for type ${notification["NotificationTypeKey"]} is not in the notification types file`);
      }
    }
    
  }
}
