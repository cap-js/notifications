const fs = require('fs');
const { getDestination } = require("@sap-cloud-sdk/core");

const messages = {
  INVALID_NOTIFICATION_TYPES: "Notification Types must contain the following keys: 'NotificationTypeKey' and 'NotificationTypeVersion'.",
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
};

function validateNotificationTypes(notificationTypes) {
  notificationTypes.forEach((notificationType) => {
    if(!("NotificationTypeKey" in notificationType) && ("NotificationTypeVersion" in notificationType)) {
      throw new Error(messages.INVALID_NOTIFICATION_TYPES);
    }
  });
}

function doesKeyExist(obj, key) {
  return typeof(key) === 'string' && typeof(obj) === 'object' && key in obj;
}

function readFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath));
}

async function getNotificationDestination(destination) {
  const notificationDestination = await getDestination(destination);
  if (!notificationDestination) {
    throw new Error(messages.DESTINATION_NOT_FOUND + destination);
  }
  return notificationDestination;
}

function getNotificationTypesMapKey(notificationTypeKey) {
  const prefix = cds.env.requires.notifications?.prefix ?? "CAP";
  return `${prefix}/${notificationTypeKey}`;
}

module.exports = {
  messages,
  validateNotificationTypes,
  readFile,
  doesKeyExist,
  getNotificationDestination,
  getNotificationTypesMapKey
};
