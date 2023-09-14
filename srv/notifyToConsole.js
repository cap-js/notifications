const NotificationService = require('./service')

const cds = require("@sap/cds");
const notifier = require("./lib/notifications");
const { validateNotificationTypes, readFile, messages } = require("../lib/utils");

module.exports = class NotifyToConsole extends NotificationService {
  async init() {

    const notificationTypes = readFile(cds.env.requires.notifications.types);

    this.types = {};
    notificationTypes.forEach((oNotificationType) => {
      if(types[oNotificationType.NotificationTypeKey] === undefined) {
        this.types[oNotificationType.NotificationTypeKey] = {};
      }

      this.types[oNotificationType.NotificationTypeKey][oNotificationType.NotificationTypeVersion] = oNotificationType;
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

    if(this.types[notificationTypeKey] === undefined) {
      console.log(`Invalid Notification Type Key: ${notificationTypeKey}`);
      return;
    }

    if(this.types[notificationTypeKey][notificationTypeVersion] === undefined) {
      console.log(`Invalid Notification Type Version: ${notificationTypeVersion}`)
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
