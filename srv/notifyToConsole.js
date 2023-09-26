const NotificationService = require('./service');
const { getNotificationTypesKeyWithPrefix, createDefaultNotificationObject, POSSIBLE_PRIORITIES } = require("./../lib/utils");

module.exports = class NotifyToConsole extends NotificationService {
  async init() {
    // call NotificationService's init
    await super.init();
  }

  notify() {
    let notification; 
    
    if (arguments.length == 1 && typeof arguments[0] === "object") {
      notification = arguments[0];
      notification["NotificationTypeKey"] = getNotificationTypesKeyWithPrefix(notification["NotificationTypeKey"]);
  
    } else {
      let recipients = arguments[0];
      let priority = arguments[1];
      let title = arguments[2];
      let description = arguments[3] ? arguments[3] : "";
  
      if (!POSSIBLE_PRIORITIES.includes(priority)) {
        throw new Error(`Invalid priority ${priority}. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH`);
      }
  
      notification = createDefaultNotificationObject(
        recipients,
        priority,
        title,
        description
      );
    }

    console.log(`SAP Alert Notification service notification: ${JSON.stringify(notification, null, 2)}`);
  }
}
