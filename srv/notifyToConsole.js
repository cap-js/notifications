const NotificationService = require('./service')

const cds = require("@sap/cds");
const notifier = require("../lib/notifications");
const { presentInObject } = require('../lib/utils');

module.exports = class NotifyToConsole extends NotificationService {
  async init() {
    // call NotificationService's init
    await super.init()
  }

  notify (
    recipients,
    notificationTypeKey,
    notificationTypeVersion,
    notificationData,
    language = "en"
  ) {

    const types = cds.notifications.local.types;
    if(!presentInObject(types, notificationTypeKey)) {
      throw new Error(`Invalid Notification Type Key: ${notificationTypeKey}`);
    }

    if(!presentInObject(types[notificationTypeKey], notificationTypeVersion)) {
      throw new Error(`Invalid Notification Type Version for Key ${notificationTypeKey}: ${notificationTypeVersion}`);
    }

    const notification = notifier.createNotificationObject(
      recipients,
      notificationTypeKey,
      notificationTypeVersion,
      notificationData,
      language
    );

    console.log(`[ans] - ${notificationTypeKey} - ${notificationTypeVersion}:`, notification);
  }
}
