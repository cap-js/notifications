const NotificationService = require('./service')

const cds = require("@sap/cds");
const notifier = require("../lib/notifications");

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
    if(types[notificationTypeKey] === undefined) {
      throw new Error(`Invalid Notification Type Key: ${notificationTypeKey}`);
    }

    if(types[notificationTypeKey][notificationTypeVersion] === undefined) {
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
