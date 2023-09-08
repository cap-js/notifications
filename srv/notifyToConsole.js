const AlertNotificationService = require('./service')

module.exports = class NotifyToConsole extends AlertNotificationService {
  async init() {

    this.notify = this._postNotification;

    // call AlertNotificationService's init
    await super.init()
  }

  _postNotification(
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
