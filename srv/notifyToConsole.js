const NotificationService = require('./service');
const cds = require("@sap/cds");
const LOG = cds.log('notifications');

module.exports = class NotifyToConsole extends NotificationService {

  postNotification(notificationData) {
    const { NotificationTypeKey, NotificationTypeVersion } = notificationData
    const types = cds.notifications.local.types // fetch notification types this way as there is no deployed service

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

    console.log (
      '\n---------------------------------------------------------------\n' +
      'Notification:', notificationData.NotificationTypeKey,
      notificationData,
      '\n---------------------------------------------------------------\n',
    )
    const notification = {Id: cds.utils.uuid()};
    return notificationData.Recipients.map(r => ({
      notificationID: notification.Id,
      notificationTypeKey: notificationData.NotificationTypeKey,
      recipient: r.RecipientId ?? r.GlobalUserId,
      targetParameters: notificationData.TargetParameters.map(t => ({
        notificationID: notification.Id,
        value: t.Value,
        name: t.Key
      })),
      properties: notificationData.Properties.map(t => ({
        notificationID: notification.Id,
        value: t.Value,
        name: t.Key,
        type: t.Type,
        isSensitive: t.IsSensitive,
      }))
    }))
  }
}
