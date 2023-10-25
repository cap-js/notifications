const NotificationService = require('./service');
const cds = require("@sap/cds");
const LOG = cds.log('notifications');

module.exports = class NotifyToConsole extends NotificationService {
  async init() {
    await super.init()
    this.on("notification", req => {
      const notification = req.data; if (!notification) return
      LOG.info(notification)

      const { NotificationTypeKey, NotificationTypeVersion } = notification
      const types = cds.notifications.local.types // REVISIT: what is this?

      if (!(NotificationTypeKey in types)) {
        LOG._warn && LOG.warn(
          `Notification Type ${NotificationTypeKey} is not in the notification types file`
        );
        return;
      }

      if (!(NotificationTypeVersion in types[NotificationTypeKey])) {
        LOG._warn && LOG.warn(
          `Notification Type Version ${NotificationTypeVersion} for type ${NotificationTypeKey} is not in the notification types file`
        );
      }
    })
  }
}
