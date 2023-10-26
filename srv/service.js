const { buildNotification } = require("./../lib/utils");

const cds = require('@sap/cds');
const Base = cds.outboxed ? cds.Service : require('@sap/cds/libx/_runtime/messaging/Outbox');

module.exports = class NotificationService extends Base {
  notify (message) {
    // Subclasses simply register handlers for 'notification' events
    // App code could plugin own before / after handlers
    return this.emit('notification', buildNotification(message))
  }
}
