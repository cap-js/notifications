const fs = require('fs');

const messages = {
  INVALID_NOTIFICATION_TYPES:
    "Failed to create Notification Types as they are not valid.",
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
};

// we should at least verify that NotificationTypeKey and NotificationTypeVersion is present
function validateNotificationTypes(notificationTypes = {}) {
  /**
   * TODO: write a logic to check all the required fields.
   */
  return true;
}

function readFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath));
}

module.exports = {
  messages,
  validateNotificationTypes,
  readFile
};
