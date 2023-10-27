const NotificationService = require('./service');
const cds = require("@sap/cds");
const LOG = cds.log('notifications');

module.exports = class NotifyToConsole extends NotificationService {
  async init() {

    this.on("*", req => {
      LOG._debug && LOG.debug('Handling notification event:', req.event)
      const notification = req.data; if (!notification) return
      console.log (
        '\n---------------------------------------------------------------\n' +
        'Notification:',
         notification,
        '\n---------------------------------------------------------------\n',
      )

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

    return super.init()
  }
}
