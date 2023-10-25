// REVISIT: cds.OutboxService or technique to avoid extending OutboxService
const OutboxService = require('@sap/cds/libx/_runtime/messaging/Outbox');
const { buildNotification } = require("./../lib/utils");

module.exports = class NotificationService extends OutboxService {
  notify (message) {
    // Subclasses simply register handlers for 'notification' events
    // App code could plugin own before / after handlers
    return this.emit('notification', buildNotification(message))
  }
}
