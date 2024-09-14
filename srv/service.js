const { buildNotification, messages, validateNotificationTypes, _config_to_ms, calcTimeMs, getNotificationTypesKeyWithPrefix, getPrefix } = require("./../lib/utils")
const { validateAndPreprocessHandler } = require("../lib/deployer/notificationTypes")
const cds = require('@sap/cds')
const LOG = cds.log('notifications');

const DEL_TIMEOUT = {
  get value() {
      const timeout_ms = _config_to_ms('notifications_deletion_timeout', '30d')
      Object.defineProperty(DEL_TIMEOUT, 'value', { value: timeout_ms })
      return timeout_ms
  }
}

class NotificationService extends cds.Service {
  async init() {

    this.on("*", async (req, next) => {
      if (req.event === 'deleteNotifications') return next()
      LOG._debug && LOG.debug('Handling notification event:', req.event);
      let notificationsToCreate = [];
      if (Array.isArray(req.data)) {
        for (const notification of req.data) {
          await this.checkForMinimumDays(notification);
          const newNotifications = await this.postNotification(notification);
          notificationsToCreate = notificationsToCreate.concat(newNotifications);
        }
      } else if (req.data) {
        await this.checkForMinimumDays(req.data);
        const newNotifications = await this.postNotification(req.data);
        notificationsToCreate = notificationsToCreate.concat(newNotifications);
      }
      const {Notifications} = cds.entities('sap.cds.common');
      if (Notifications && notificationsToCreate.length > 0) {
        await INSERT.into(Notifications).entries(notificationsToCreate)
      }
    });

    this.on('deleteNotifications', async msg => {
      const {Notifications} = cds.entities('sap.cds.common');
      if (!Notifications) {
        LOG.warn(`Notifications wont be deleted because the table does not exist.`)
        return;
      }
      const expiryDate = new Date(Date.now() - DEL_TIMEOUT.value).toISOString()
      await DELETE.from(Notifications).where({createdAt: {'<': expiryDate}})
    });
    return super.init()
  }
  /**
   * Emits a notification. Method notify can be used alternatively.
   * @param {string} [event] - The notification type.
   * @param {object} message - The message object
   */
  emit (event, message) {
    if (!event) {
      LOG._warn && LOG.warn(messages.NO_OBJECT_FOR_NOTIFY);
      return;
    }
    // Outbox calls us with a req object, e.g. { event, data, headers }
    if (event.event) return super.emit (event)
    // First argument is optional for convenience
    if (!message) [ message, event ] = [ event ]
    if (Array.isArray(message)) {
      for (let i = 0; i < message.length; i++) {
        message[i] = processMessage(event, message[i])
      }
    } else {
      message = processMessage(event, message)
    }
    return super.emit (event, message)
  }

  /**
   * That's just a semantic alias for emit.
   */
  notify (type, message) {
    return this.emit (type,message)
  }

  async postNotification(notificationData) {
    //Implemented by sub classes
  }

  async checkForMinimumDays(notification) {
    const IDwithoutPrefix = notification.NotificationTypeKey.substring(getPrefix(notification.NotificationTypeKey).length+1, notification.NotificationTypeKey.length)
    const defaults =  
      cds.env.requires.notifications.defaults[IDwithoutPrefix] 
      && cds.env.requires.notifications.defaults[IDwithoutPrefix][notification.NotificationTypeVersion ?? "1"];
    if (!defaults.minTimeBetweenNotifications) return; //Intended that it returns with 0
    const {Notifications} = cds.entities('sap.cds.common');
    if (!Notifications) {
      LOG.warn(`Notification ${notification.NotificationTypeKey} has a minimum time between specified but Notifications table is not provided! Please includes @cap-js/notifications/index.cds in your cds model.`)
      return;
    }
    const where = [
      {ref: ['recipient']},
      'in',
      {list: notification.Recipients.map(r => ({val: r.RecipientId ?? r.GlobalUserId}))},
    ];
    (notification.TargetParameters ?? []).forEach(target => {
      if (target.Key !== 'IsActiveEntity') //Dont check because it may be 1 and not true on db + check makes no sense
        where.push(
          'and',
          'exists',
          { ref: [{
            id: 'targetParameters',
            where: [{ ref: ['value'] }, '=', { val: target.Value }, 'and', { ref: ['name'] }, '=', { val: target.Key }]
          }]},
        );
    });
    const minDistance = new Date(Date.now() - calcTimeMs(defaults.minTimeBetweenNotifications)).toISOString()
    const receivedNotifications = await SELECT.from(Notifications).where([
      {ref: ['notificationTypeKey']},
      '=',
      {val: notification.NotificationTypeKey},
      'and',
      {ref: ['createdAt']},
      '>',
      { val: minDistance},
      'and',
      {xpr: where}
    ]);

    notification.Recipients = notification.Recipients.filter(recipient => !receivedNotifications.some(notif => (recipient.RecipientId ?? recipient.GlobalUserId) === notif.recipient));
    if (notification.Recipients.length === 0) {
        LOG.info(`${notification.NotificationTypeKey} notification without recipients after removing recipients who received the notification recently!`);
    }
  }
}

const processMessage = (event, message) => {
  // CAP events translate to notification types and vice versa
  if (event) message.type = event
  else event = message.type || message.NotificationTypeKey || 'Default'
  // Prepare and emit the notification
  message = buildNotification(message);
  return message;
}

module.exports = NotificationService

// Without Generic Outbox only alert.notify() can be used, not alert.emit()
// Remove that when @sap/cds with Generic Outbox is released
if (!cds.outboxed) {
  class OutboxedNotificationService extends require('@sap/cds/libx/_runtime/messaging/Outbox') {}
  OutboxedNotificationService.prototype.notify = NotificationService.prototype.emit
  module.exports = OutboxedNotificationService
}
