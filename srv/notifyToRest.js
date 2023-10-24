const NotificationService = require("./service");
const { buildNotification } = require("../lib/utils");
const { postNotification } = require("../lib/notifications");

module.exports = class NotifyToRest extends NotificationService {
  async init() {
    // call NotificationService's init
    await super.init();

    this.on("postNotificationEvent", async (req) => await postNotification(req.data));
  }

  async notify(notificationData) {
    const notification = buildNotification(notificationData);

    if (notification) {
      await this.emit({ event: "postNotificationEvent", data: notification });
    }
  }
};
