const { buildNotification, messages } = require("./../lib/utils")
const cds = require('@sap/cds')
const LOG = cds.log('notifications');

class NotificationService extends cds.Service {

  /**
   * Emits a notification. Method notify can be used alternatively.
   * @param {string} [event] - The notification type.
   * @param {object} message - The message object
   */
  emit (event, message) {
    if(!event) {
      LOG._warn && LOG.warn(messages.NO_OBJECT_FOR_NOTIFY);
      return;
    }
    // Outbox calls us with a req object, e.g. { event, data, headers }
    if (event.event) return super.emit (event)
    // First argument is optional for convenience
    if (!message) [ message, event ] = [ event ]
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

// Without Generic Outbox only alert.notify() can be used, not alert.emit()
// Remove that when @sap/cds with Generic Outbox is released
if (!cds.outboxed) {
  class OutboxedNotificationService extends require('@sap/cds/libx/_runtime/messaging/Outbox') {}
  OutboxedNotificationService.prototype.notify = NotificationService.prototype.emit
  module.exports = OutboxedNotificationService
}
