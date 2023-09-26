const { buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { getNotificationDestination, getNotificationTypesKeyWithPrefix, executeRequest, createDefaultNotificationObject, POSSIBLE_PRIORITIES } = require("./utils");

const NOTIFICATIONS_DESTINATION_NAME = cds.env.requires.notifications?.destination ?? "SAP_Notifications";
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";

async function postNotification() {
  const notifServiceDest = await getNotificationDestination(NOTIFICATIONS_DESTINATION_NAME);
  const csrfHeaders = await buildCsrfHeaders(notifServiceDest, {
    url: NOTIFICATIONS_API_ENDPOINT,
  });

  if (arguments.length == 1 && typeof arguments[0] === "object") {
    let notification = arguments[0];
    notification["NotificationTypeKey"] = getNotificationTypesKeyWithPrefix(notification["NotificationTypeKey"]);

    return (await executeRequest("post", `${NOTIFICATIONS_API_ENDPOINT}/Notifications`, notification, notifServiceDest, csrfHeaders)).data.d;
  } else {
    let recipients = arguments[0];
    let priority = arguments[1];
    let title = arguments[2];
    let description = arguments[3] ? arguments[3] : "";

    if (!POSSIBLE_PRIORITIES.includes(priority)) {
      throw new Error(`Invalid priority ${priority}. Allowed priorities are LOW, NEUTRAL, MEDIUM, HIGH`);
    }

    let notification = createDefaultNotificationObject(
      recipients,
      priority,
      title,
      description
    );

    return (await executeRequest("post", `${NOTIFICATIONS_API_ENDPOINT}/Notifications`, notification, notifServiceDest, csrfHeaders)).data.d;
  }
}

module.exports = {
  postNotification
};
