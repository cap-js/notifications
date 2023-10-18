const cds = require("@sap/cds");
const { validateNotificationTypes, readFile } = require("./utils");
const { processNotificationTypes } = require("./notificationTypes");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");

async function deployNotificationTypes() {
  setGlobalLogLevel("error");

  // read notification types
  const notificationTypes = readFile(cds.env?.requires?.notifications?.types);

  if (validateNotificationTypes(notificationTypes)) {
    await processNotificationTypes(notificationTypes);
  }
}

deployNotificationTypes();

module.exports = {
  deployNotificationTypes
}