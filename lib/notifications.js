const { getNotificationTypesKeyWithPrefix } = require("./utils");

function createNotificationObject(recipients, notificationData, priority) {
  // check if user wants to send a default notification
  if(typeof notificationData === 'string') {
    return {
      "NotificationTypeKey": getNotificationTypesKeyWithPrefix("Default"),
      "NotificationTypeVersion": "1",
      "Priority": priority,
      "Properties": [
        {
          "Key": "text",
          "IsSensitive": false,
          "Language": "en",
          "Value": notificationData,
          "Type": "String"
        }
      ],
      "Recipients": recipients.map((recipient) => ({ RecipientId: recipient }))
    }
  } else {
    notificationData.NotificationTypeKey = getNotificationTypesKeyWithPrefix(notificationData["NotificationTypeKey"]);
    
    if(notificationData.Priority === undefined) {
      notificationData.Priority = priority;
    }

    notificationData.Recipients = recipients.map((recipient) => ({ RecipientId: recipient }));
    return notificationData;
  }
}

module.exports = {
  createNotificationObject
};
