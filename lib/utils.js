const { existsSync, readFileSync } = require('fs');
const { basename } = require('path')
const cds = require("@sap/cds");
const { getDestination } = require("@sap-cloud-sdk/core");

const messages = {
  TYPES_FILE_NOT_EXISTS: "Notification Types file path is incorrect.",
  INVALID_NOTIFICATION_TYPES: "Notification Types must contain the following keys: 'NotificationTypeKey' and 'NotificationTypeVersion'.",
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
  INVALID_RECIPIENTS_OBJECT: "Recipients object must be an array."
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
  if(!existsSync(filePath)) {
    throw new Error(messages.TYPES_FILE_NOT_EXISTS);
  }

  return JSON.parse(readFileSync(filePath));
}

async function getNotificationDestination() {
  const destinationName = cds.env.requires.notifications?.destination ?? "SAP_Notifications"
  const notificationDestination = await getDestination(destinationName);
  if (!notificationDestination) {
    throw new Error(messages.DESTINATION_NOT_FOUND + destinationName);
  }
  return notificationDestination;
}

function getPrefix() {
  return cds.env.requires.notifications?.prefix ?? basename(cds.root);
}

function getNotificationTypesKeyWithPrefix(notificationTypeKey) {
  const prefix = getPrefix();
  return `${prefix}/${notificationTypeKey}`;
}

module.exports = {
  messages,
  validateNotificationTypes,
  readFile,
  doesKeyExist,
  getNotificationDestination,
  getPrefix,
  getNotificationTypesKeyWithPrefix
};
