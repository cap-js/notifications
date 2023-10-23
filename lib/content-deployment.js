const cds = require("@sap/cds");
const { validateNotificationTypes, readFile } = require("./utils");
const { processNotificationTypes } = require("./notificationTypes");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");
const { basename } = require('path');

async function deployNotificationTypes() {
  setGlobalLogLevel("error");

  // read notification types
  const filePath = cds.env.requires?.notifications?.types ?? '';
  const fileName = basename(filePath);
  const notificationTypes = readFile(fileName);

  if (validateNotificationTypes(notificationTypes)) {
    await processNotificationTypes(notificationTypes);
  }
}

deployNotificationTypes();

module.exports = {
  deployNotificationTypes
}
