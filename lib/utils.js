const { existsSync, readFileSync } = require('fs');
const { basename } = require('path')
const cds = require("@sap/cds");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { getDestination } = require("@sap-cloud-sdk/connectivity");
const PRIORITIES = ["LOW", "NEUTRAL", "MEDIUM", "HIGH"];

const messages = {
  TYPES_FILE_NOT_EXISTS: "Notification Types file path is incorrect.",
  INVALID_NOTIFICATION_TYPES: "Notification Types must contain the following key: 'NotificationTypeKey'.",
  DESTINATION_NOT_FOUND: "Failed to get destination: ",
  MANDATORY_PARAMETER_NOT_PASSED_FOR_DEFAULT_NOTIFICATION: "Recipients and title are mandatory parameters",
  MANDATORY_PARAMETER_NOT_PASSED_FOR_CUSTOM_NOTIFICATION: "Recipients, type are mandatory parameters",
  RECIPIENTS_IS_NOT_ARRAY: "Recipients is not an array or it is empty",
  TITLE_IS_NOT_STRING: "Title is not a string",
  DESCRIPTION_IS_NOT_STRING: "Description is not a string",
  PROPERTIES_IS_NOT_OBJECT: "Properties is not an object",
  NAVIGATION_IS_NOT_OBJECT: "Navigation is not an object",
  PAYLOAD_IS_NOT_OBJECT: "Payload is not an object",
  EMPTY_OBJECT_FOR_NOTIFY: "Empty object is passed a single parameter to notify function"
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

function validateDefaultNotifyParameters(recipients, priority, title, description) {
  if (!recipients || !title) {
    console.log(messages.MANDATORY_PARAMETER_NOT_PASSED_FOR_DEFAULT_NOTIFICATION);
    return false;
  }

  if (!Array.isArray(recipients) || recipients.length == 0) {
    console.log(messages.RECIPIENTS_IS_NOT_ARRAY);
    return false;
  }

  if (typeof title !== "string") {
    console.log(messages.TITLE_IS_NOT_STRING);
    return false;
  }

  if (priority && !PRIORITIES.includes(priority.toUpperCase())) {
    console.log(`Invalid priority ${priority}. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH`);
    return false;
  }

  if (description && typeof description !== "string") {
    console.log(messages.DESCRIPTION_IS_NOT_STRING);
    return false;
  }

  return true;
}

function validateCustomNotifyParameters(type, recipients, properties, navigation, priority, payload) {
  if (!recipients || !type) {
    console.log(messages.MANDATORY_PARAMETER_NOT_PASSED_FOR_CUSTOM_NOTIFICATION);
    return false;
  }

  if (!Array.isArray(recipients) || recipients.length == 0) {
    console.log(messages.RECIPIENTS_IS_NOT_ARRAY);
    return false;
  }

  if (priority && !PRIORITIES.includes(priority.toUpperCase())) {
    console.log(`Invalid priority ${priority}. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH`);
    return false;
  }

  if (properties && !Array.isArray(properties)) {
    console.log(messages.PROPERTIES_IS_NOT_OBJECT);
    return false;
  }

  if (navigation && typeof navigation !== "object") {
    console.log(messages.NAVIGATION_IS_NOT_OBJECT);
    return false;
  }

  if (payload && typeof payload !== "object") {
    console.log(messages.PAYLOAD_IS_NOT_OBJECT);
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
  const notificationDestination = await getDestination({ destinationName, useCache: true });
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

async function executeRequest(httpMethod, targetUrl, payload, notificationDestination, csrfHeaders) {
  let response = {};
  try {
    response = await executeHttpRequest(notificationDestination, {
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
  priority = "NEUTRAL",
  title,
  description = ""
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

function buildCustomNotification(notificationData) {
  return {
    Id: notificationData["payload"] ? notificationData["payload"]["Id"] : undefined,
    OriginId: notificationData["payload"] ? notificationData["payload"]["OriginId"] : undefined,
    NotificationTypeId: notificationData["payload"] ? notificationData["payload"]["NotificationTypeId"] : undefined,
    NotificationTypeKey: getNotificationTypesKeyWithPrefix(notificationData["type"]),
    NotificationTypeVersion: notificationData["payload"] ? notificationData["payload"]["NotificationTypeVersion"] : "1",
    NavigationTargetAction: notificationData["navigation"] ? notificationData["navigation"]["NavigationTargetAction"] : undefined,
    NavigationTargetObject: notificationData["navigation"] ? notificationData["navigation"]["NavigationTargetObject"] : undefined,
    Priority: notificationData["priority"] ? notificationData["priority"] : "NEUTRAL",
    ProviderId: notificationData["payload"] ? notificationData["payload"]["ProviderId"] : undefined,
    ActorId: notificationData["payload"] ? notificationData["payload"]["ActorId"] : undefined,
    ActorDisplayText: notificationData["payload"] ? notificationData["payload"]["ActorDisplayText"] : undefined,
    ActorImageURL: notificationData["payload"] ? notificationData["payload"]["ActorImageURL"] : undefined,
    NotificationTypeTimestamp: notificationData["payload"] ? notificationData["payload"]["NotificationTypeTimestamp"] : undefined,
    Recipients: notificationData["recipients"].map((recipient) => ({ RecipientId: recipient })),
    Properties: notificationData["properties"] ? notificationData["properties"] : undefined,
    TargetParameters: notificationData["payload"] ? notificationData["payload"]["TargetParameters"] : undefined
  };
}

function buildNotification(notificationData) {
  let notification

  if (Object.keys(notificationData).length === 0) {
    console.log(messages.EMPTY_OBJECT_FOR_NOTIFY);
    return;
  }

  if (notificationData["type"]) {
    if (!validateCustomNotifyParameters(notificationData["type"], notificationData["recipients"], notificationData["properties"], notificationData["navigation"], notificationData["priority"], notificationData["payload"])) {
      return;
    }

    notification = buildCustomNotification(notificationData)
  } else if (notificationData["NotificationTypeKey"]) {
    notificationData["NotificationTypeKey"] = getNotificationTypesKeyWithPrefix(notificationData["NotificationTypeKey"])
    notification = notificationData;
  } else {
    if (!validateDefaultNotifyParameters(notificationData["recipients"], notificationData["priority"], notificationData["title"], notificationData["description"])) {
      return;
    }

    notification = buildDefaultNotification(
      notificationData["recipients"],
      notificationData["priority"],
      notificationData["title"],
      notificationData["description"]
    )
  }

  return JSON.parse(JSON.stringify(notification));
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
