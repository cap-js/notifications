const cds = require("@sap/cds");
const { validateNotificationTypes, readFile } = require("./utils");
const { processNotificationTypes } = require("./notificationTypes");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");

async function deployNotificationTypes() {
  setGlobalLogLevel("error");

  // read notification types
  const fileName = path.basename(cds.env.requires?.notifications?.types);
  const notificationTypes = readFile(fileName);

  if (validateNotificationTypes(notificationTypes)) {
    await processNotificationTypes(notificationTypes);
  }
}

deployNotificationTypes();

module.exports = {
  deployNotificationTypes
}
