const NotificationService = require('./service');
const { buildNotification } = require("../lib/utils");
const { postNotification } = require('../lib/notifications');

module.exports = class NotifyToRest extends NotificationService {
  async init() {

    // call NotificationService's init
    await super.init();

    this.on('postNotificationEvent', async function(req) {
      const { data } = req;

      try {
        await postNotification(data);
      } catch (err) {
        throw err;
      }
    });
  }

  async notify(notificationData) {
    const notification = buildNotification(notificationData);

    if (notification) {
      await this.emit({ event: 'postNotificationEvent', data: notification });
    }
  }
}
