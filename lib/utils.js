const fs = require('fs');

const messages = {
  INVALID_NOTIFICATION_TYPES:
    "Failed to create Notification Types as they are not valid.",
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
};

function validateNotificationTypes(notificationTypes = {}) {
  /**
   * TODO: write a logic to check all the required fields.
   */
  return true;
}

function readFileContent(filePath) {
  return JSON.parse(
    fs.readFileSync(cds.requires.alerts.notificationTypes)
  );
}

module.exports = {
  messages,
  validateNotificationTypes,
  readFileContent
};
