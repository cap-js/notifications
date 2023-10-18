const cds = require("@sap/cds");
const { validateNotificationTypes, readFile } = require("./utils");
const { createNotificationTypesMap, processNotificationTypes } = require("./notificationTypes");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");

async function deployNotificationTypes() {
  setGlobalLogLevel("error");

  // read notification types
  const notificationTypes = process.env.NOTIFICATION_TYPES ?? {};

  console.log(notificationTypes);
  if (validateNotificationTypes(notificationTypes)) {
    await processNotificationTypes(notificationTypes);
  }
}

deployNotificationTypes();
