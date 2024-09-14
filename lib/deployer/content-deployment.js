const { readFileSync } = require('fs');
const { processNotificationTypes } = require("./notificationTypes");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");

async function deployNotificationTypes() {
  setGlobalLogLevel("error");

  // read notification types
  const notificationTypes = JSON.parse(readFileSync('./notification-types.json'));
  await processNotificationTypes(notificationTypes);
}

deployNotificationTypes();

module.exports = {
  deployNotificationTypes
}
