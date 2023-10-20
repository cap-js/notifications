/**
 * TODO: Add the entry point for the Plugin Service here.
 * We will branch out for development and production profile here
 */

// REVISIT: cds.OutboxService or technique to avoid extending OutboxService
const OutboxService = require('@sap/cds/libx/_runtime/messaging/Outbox');

module.exports = class NotificationService extends OutboxService {
  async init() {

    // call OutboxService's init
    await super.init();
  }

  notify() {
    // Abstract function
  }
}
