const fs = require('fs');
const { basename } = require('path')
const cds = require("@sap/cds");
const { executeHttpRequest, getDestination } = require("@sap-cloud-sdk/core");
const POSSIBLE_PRIORITIES = ["LOW", "NEUTRAL", "MEDIUM", "HIGH"];

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

function getPrefix() {
  return cds.env.requires.notifications?.prefix ?? basename(cds.root);
}

function getNotificationTypesKeyWithPrefix(notificationTypeKey) {
  const prefix = getPrefix();
  return `${prefix}/${notificationTypeKey}`;
}

async function executeRequest(httpmethod, targetUrl, payload, notifServiceDest, csrfHeaders) {
  let response = {};
  try {
    response = await executeHttpRequest(notifServiceDest, {
      url: targetUrl,
      method: httpmethod,
      data: payload,
      headers: csrfHeaders,
    });
  } catch (e) {
    console.log(e);
    return e;
  }
  return response;
}

function createDefaultNotificationObject(
  recipients,
  priority,
  title,
  description
) {
  let properties = [
    {
      Key: "title",
      Language: "en",
      Value: title,
      Type: "String",
      IsSensitive: false,
    },
    {
      Key: "description",
      Language: "en",
      Value: description,
      Type: "String",
      IsSensitive: false,
    },
  ];
  
  return {
    NotificationTypeKey: "Default",
    NotificationTypeVersion: "1",
    Priority: priority,
    Properties: properties,
    Recipients: recipients.map((recipient) => ({ RecipientId: recipient }))
  };
}

module.exports = {
  messages,
  POSSIBLE_PRIORITIES,
  validateNotificationTypes,
  readFile,
  doesKeyExist,
  getNotificationDestination,
  getPrefix,
  getNotificationTypesKeyWithPrefix,
  executeRequest,
  createDefaultNotificationObject
};
