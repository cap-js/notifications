const NotificationService = require('./service');
const cds = require("@sap/cds");
const { createNotificationObject } = require("../lib/notifications");
const { doesKeyExist } = require('../lib/utils');

module.exports = class NotifyToConsole extends NotificationService {
  async init() {
    // call NotificationService's init
    await super.init();
  }

  notify (recipients, notificationData, priority = "LOW") {
    const notification = createNotificationObject(recipients, notificationData, priority);
    if(!(typeof notificationData === 'string')) {
      const types = cds.notifications.local.types;
      if (!doesKeyExist(types, notification.NotificationTypeKey)) {
        throw new Error(`Invalid Notification Type Key: ${notification.NotificationTypeKey}`);
      }

      if (!doesKeyExist(types[notification.NotificationTypeKey], notification.NotificationTypeVersion)) {
        throw new Error(`Invalid Notification Type Version for Key ${notification.NotificationTypeKey}: ${notification.NotificationTypeVersion}`);
      }      
    }

    console.log(`[ans] - ${notification.NotificationTypeKey} - ${notification.NotificationTypeVersion}:`, notification);
  }
}
