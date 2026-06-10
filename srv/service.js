const { buildNotification, messages } = require("./../lib/utils")
const cds = require('@sap/cds')
const LOG = cds.log('notifications')

class NotificationService extends cds.Service {

  /**
   * Emits a notification. Method notify can be used alternatively.
   * @param {string} [event] - The notification type.
   * @param {object|object[]} message - The message object or array of message objects for batch
   */
  emit (event, message) {
    if (!event) {
      LOG._warn && LOG.warn(messages.NO_OBJECT_FOR_NOTIFY)
      return
    }
    // Outbox calls us with a req object, e.g. { event, data, headers }
    if (event.event) return super.emit (event)
    // First argument is optional for convenience
    if (!message) [ message, event ] = [ event ]
    // Batch: array of messages emitted as a single event
    if (Array.isArray(message)) {
      const type = event || 'Default'
      const notifications = message.map(m => {
        if (event) m.type = event
        return buildNotification(m)
      }).filter(Boolean)
      return super.emit(type, notifications)
    }
    // CAP events translate to notification types and vice versa
    if (event) message.type = event
    else event = message.type || message.NotificationTypeKey || 'Default'
    // Prepare and emit the notification
    message = buildNotification(message)
    return super.emit (event, message)
  }

  /**
   * That's just a semantic alias for emit.
   */
  notify (type, message) {
    return this.emit (type,message)
  }

}
module.exports = NotificationService
