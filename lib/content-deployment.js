const cds = require("@sap/cds");
const { validateNotificationTypes, readFile } = require("./utils");
const { createNotificationTypesMap, processNotificationTypes } = require("./notificationTypes");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");

async function deploy() {
  setGlobalLogLevel("error");
  const profiles = cds.env.profiles ?? [];
  const production = profiles.includes("production");

  // read notification types
  const notificationTypes = readFile(cds.env.requires?.notifications?.types);

  if (validateNotificationTypes(notificationTypes)) {
    if (production) {
      await processNotificationTypes(notificationTypes);
    } else {
      const notificationTypesMap = createNotificationTypesMap(notificationTypes, true);
      cds.notifications = { local: { types: notificationTypesMap } };
    }
  }
}

deploy();
