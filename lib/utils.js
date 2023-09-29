const { existsSync, readFileSync } = require('fs');
const { basename } = require('path')
const cds = require("@sap/cds");
const { executeHttpRequest, getDestination } = require("@sap-cloud-sdk/core");
const PRIORITIES = ["LOW", "NEUTRAL", "MEDIUM", "HIGH"];

const messages = {
  TYPES_FILE_NOT_EXISTS: "Notification Types file path is incorrect.",
  INVALID_NOTIFICATION_TYPES: "Notification Types must contain the following key: 'NotificationTypeKey'.",
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
  MANDATORY_PARAMETER_NOT_PASSED: "Recipients, priority and title are mandatory parameters",
};

function validateNotificationTypes(notificationTypes) {
  notificationTypes.forEach((notificationType) => {
    if(!("NotificationTypeKey" in notificationType)) {
      console.log(messages.INVALID_NOTIFICATION_TYPES);
      return false;
    }
  });

  return true;
}

function validateNotifyParameters(recipients, priority, title) {
  if (!recipients || !priority || !title) {
    console.log(messages.MANDATORY_PARAMETER_NOT_PASSED);
    return false;
  }

  if (!PRIORITIES.includes(priority)) {
    console.log(`Invalid priority ${priority}. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH`);
    return false;
  }

  return true;
}

function doesKeyExist(obj, key) {
  return typeof(key) === 'string' && typeof(obj) === 'object' && key in obj;
}

function readFile(filePath) {
  if(!existsSync(filePath)) {
    console.log(messages.TYPES_FILE_NOT_EXISTS);
    return [];
  }

  return JSON.parse(readFileSync(filePath));
}

async function getNotificationDestination() {
  const destinationName = cds.env.requires.notifications?.destination ?? "SAP_Notifications"
  const notificationDestination = await getDestination(destinationName);
  if (!notificationDestination) {
    // TODO: What to do if destination isn't found??
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

async function executeRequest(httpMethod, targetUrl, payload, notifServiceDest, csrfHeaders) {
  let response = {};
  try {
    response = await executeHttpRequest(notifServiceDest, {
      url: targetUrl,
      method: httpMethod,
      data: payload,
      headers: csrfHeaders,
    });
  } catch (e) {
    console.log(e);
    response = e.response.data
  }
  return response;
}

function buildDefaultNotification(
  recipients,
  priority,
  title,
  description
) {
  const properties = [
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

function buildNotification(passedArguments) {
  let notification;
  if (passedArguments.length == 1 && typeof passedArguments[0] === "object" && !Array.isArray(passedArguments[0])) {
    notification = passedArguments[0];
    notification["NotificationTypeKey"] = getNotificationTypesKeyWithPrefix(notification["NotificationTypeKey"]);
  } else {
    const recipients = passedArguments[0];
    const priority = passedArguments[1];
    const title = passedArguments[2];
    const description = passedArguments[3] ? passedArguments[3] : "";

    if (!validateNotifyParameters(recipients, priority, title)) {
      return;
    }

    notification = buildDefaultNotification(
      recipients,
      priority,
      title,
      description
    );
  }

  return notification;
}

module.exports = {
  messages,
  validateNotificationTypes,
  readFile,
  doesKeyExist,
  getNotificationDestination,
  getPrefix,
  getNotificationTypesKeyWithPrefix,
  executeRequest,
  buildNotification
};
