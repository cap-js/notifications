const fs = require('fs');
const { basename } = require('path')
const cds = require("@sap/cds");
const { executeHttpRequest, getDestination } = require("@sap-cloud-sdk/core");
const PRIORITIES = ["LOW", "NEUTRAL", "MEDIUM", "HIGH"];

const messages = {
  INVALID_NOTIFICATION_TYPES: "Notification Types must contain the following keys: 'NotificationTypeKey' and 'NotificationTypeVersion'.",
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
  MANDATORY_PARAMETER_NOT_PASSED: "Recipients, priority and title are mandatory parameters",
};

function validateNotificationTypes(notificationTypes) {
  notificationTypes.forEach((notificationType) => {
    if(!("NotificationTypeKey" in notificationType) && ("NotificationTypeVersion" in notificationType)) {
      throw new Error(messages.INVALID_NOTIFICATION_TYPES);
    }
  });
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
  }
  return response;
}

function createDefaultNotification(
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

function createNotification(passedArguments) {
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

    notification = createDefaultNotification(
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
  createNotification
};
