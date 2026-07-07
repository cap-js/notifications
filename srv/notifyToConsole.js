const NotificationService = require('./service')
const cds = require("@sap/cds")
const LOG = cds.log('notifications')

module.exports = class NotifyToConsole extends NotificationService {
  async init() {

    this.on("*", req => {
      LOG._debug && LOG.debug('Handling notification event:', req.event)
      const notification = req.data
      if (!notification) return

      const notifications = Array.isArray(notification) ? notification : [notification]
      for (const n of notifications) {
        LOG.info (
          '\n---------------------------------------------------------------\n' +
          'Notification:', req.event,
           n,
          '\n---------------------------------------------------------------\n',
        )

        const { NotificationTypeKey, NotificationTypeVersion } = n
        const types = cds.notifications.local.types

        if (!(NotificationTypeKey in types)) {
          LOG._warn && LOG.warn(
            `Notification Type ${NotificationTypeKey} is not in the notification types file`
          )
          continue
        }

        if (!(NotificationTypeVersion in types[NotificationTypeKey])) {
          LOG._warn && LOG.warn(
            `Notification Type Version ${NotificationTypeVersion} for type ${NotificationTypeKey} is not in the notification types file`
          )
        }
      }
    })

    return super.init()
  }
}
