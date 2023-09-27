const { buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { getNotificationDestination, executeRequest, buildNotification } = require("./utils");

const NOTIFICATIONS_DESTINATION_NAME = cds.env.requires.notifications?.destination ?? "SAP_Notifications";
const NOTIFICATIONS_API_ENDPOINT = "v2/Notification.svc";

async function postNotification() {
  const notifServiceDest = await getNotificationDestination(NOTIFICATIONS_DESTINATION_NAME);
  const csrfHeaders = await buildCsrfHeaders(notifServiceDest, {
    url: NOTIFICATIONS_API_ENDPOINT,
  });

  const notification = buildNotification(arguments);

  if (notification) {
    return (await executeRequest("post", `${NOTIFICATIONS_API_ENDPOINT}/Notifications`, notification, notifServiceDest, csrfHeaders)).data.d;
  }
}

module.exports = {
  postNotification
};
