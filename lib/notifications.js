const { executeHttpRequest, buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { getNotificationDestination, getNotificationTypesKeyWithPrefix } = require("./utils");

const NOTIFICATIONS_DESTINATION_NAME = cds.env.requires.notifications?.destination ?? "SAP_Notifications";
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";

async function createNotificationObject(
  recipients,
  notificationData
) {
  const prefix = "@cap-ans/";
  // const prefix = process.env.npm_package_name;
  return {
    Id: notificationData["Id"],
    OriginId: notificationData["OriginId"],
    NotificationTypeId: notificationData["NotificationTypeId"],
    NotificationTypeKey: `${prefix}/${notificationData["NotificationTypeKey"]}`,
    NotificationTypeVersion: notificationData["NotificationTypeVersion"],
    NavigationTargetAction: notificationData["NavigationTargetAction"],
    NavigationTargetObject: notificationData["NavigationTargetObject"],
    Priority: notificationData["Priority"] ? notificationData["Priority"] : "NEUTRAL",
    ProviderId: notificationData["ProviderId"],
    ActorId: notificationData["ActorId"],
    ActorDisplayText: notificationData["ActorDisplayText"],
    ActorImageURL: notificationData["ActorImageURL"],
    NotificationTypeTimestamp: notificationData["NotificationTypeTimestamp"],
    Recipients: recipients.map((recipient) => ({ RecipientId: recipient })),
    Properties: notificationData["Properties"],
    TargetParameters: notificationData["TargetParameters"]
  };
}

async function createDefaultNotificationObject(
  recipients,
  title,
  description,
  priority
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

async function postNotification() {
  const notifServiceDest = await _getDestination(NOTIFICATIONS_DESTINATION_NAME);
  const csrfHeaders = await buildCsrfHeaders(notifServiceDest, {
  url: NOTIFICATIONS_API_ENDPOINT,
  });

  if (arguments.length == 1 && typeof arguments[0] === "object") {  // using only notification object

    return (await executeRequest("post", `${NOTIFICATIONS_API_ENDPOINT}/Notifications`, arguments[0], notifServiceDest, csrfHeaders)).data.d;

  } else if (arguments.length == 2 && (Array.isArray(arguments[0]) && typeof arguments[1] === "object")) { // using array of recipients and partial notification object 
    let notification = await createNotificationObject(
      arguments[0], // recipients
      arguments[1] // part of notification object
    );

    return (await executeRequest("post", `${NOTIFICATIONS_API_ENDPOINT}/Notifications`, notification, notifServiceDest, csrfHeaders)).data.d;

  } else if ((arguments.length >= 2) && (Array.isArray(arguments[0]) && typeof arguments[1] === "string")) { // using the default notification type
    let notification = {};
    
    if (arguments.length === 2) { // using only recipients and title
      notification = await createDefaultNotificationObject(
        arguments[0], // recipients
        arguments[1], // title
        "",
        "LOW"
      );
      
    } else if (arguments.length === 3 && POSSIBLE_PRIORITIES.includes(arguments[2])) { // using recipients, title, priority
      notification = await createDefaultNotificationObject(
        arguments[0], // recipients
        arguments[1], // title
        "",
        arguments[2] // priority
      );
    } else if (arguments.length === 3 && !POSSIBLE_PRIORITIES.includes(arguments[2])) { // using only recipients, title, description
      notification = await createDefaultNotificationObject(
        arguments[0], // recipients
        arguments[1], // title
        arguments[2], // description
        "LOW"
      );
    } else if (arguments.length === 4 && POSSIBLE_PRIORITIES.includes(arguments[3])) { // using only recipients, title, description, priority
      notification = await createDefaultNotificationObject(
        arguments[0], // recipients
        arguments[1], // title
        arguments[2], // description
        arguments[3], // priority
      );
    }

    return (await executeRequest("post", `${NOTIFICATIONS_API_ENDPOINT}/Notifications`, notification, notifServiceDest, csrfHeaders)).data.d;
  }

  return new Error("Invalid invocation of postNotification");
}

module.exports = {
  postNotification,
};
