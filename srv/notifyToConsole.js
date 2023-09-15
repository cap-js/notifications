const NotificationService = require('./service')

const cds = require("@sap/cds");
const notifier = require("../lib/notifications");
const { validateNotificationTypes, readFile, messages } = require("../lib/utils");

module.exports = class NotifyToConsole extends NotificationService {
  async init() {

    const notificationTypes = readFile(cds.env.requires.notifications.types);

    this._types = {};
    notificationTypes.forEach((oNotificationType) => {
      if(this._types[oNotificationType.NotificationTypeKey] === undefined) {
        this._types[oNotificationType.NotificationTypeKey] = {};
      }

      this._types[oNotificationType.NotificationTypeKey][oNotificationType.NotificationTypeVersion] = oNotificationType;
    });

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

    if(this._types[notificationTypeKey] === undefined) {
      console.log(`Invalid Notification Type Key: ${notificationTypeKey}`);
      return;
    }

    if(this._types[notificationTypeKey][notificationTypeVersion] === undefined) {
      console.log(`Invalid Notification Type Version for Key ${notificationTypeKey}: ${notificationTypeVersion}`);
      return;
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
