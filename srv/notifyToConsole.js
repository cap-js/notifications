const NotificationService = require('./service')

const notifier = require("../lib/notifications");

module.exports = class NotifyToConsole extends NotificationService {
  async init() {

    // call AlertNotificationService's init
    await super.init()
  }

  notify (
    recipients,
    notificationTypeKey,
    notificationTypeVersion,
    notificationData,
    language = "en"
  ) {
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
