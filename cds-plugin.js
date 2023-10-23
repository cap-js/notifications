const cds = require("@sap/cds");
const build = require('@sap/cds-dk/lib/build')
const { validateNotificationTypes, readFile } = require("./lib/utils");
const { createNotificationTypesMap } = require("./lib/notificationTypes");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");

// register build plugin
build.register('notifications', { impl: '@cap-js/notifications/lib/build', description: 'Notifications build plugin', taskDefaults: { src: cds.env.folders.srv } });

cds.once("served", async () => {
  setGlobalLogLevel("error");
  const profiles = cds.env.profiles ?? [];
  const production = profiles.includes("production");

  // read notification types
  const notificationTypes = readFile(cds.env.requires?.notifications?.types);

  if (validateNotificationTypes(notificationTypes)) {
    if (!production) {
      const notificationTypesMap = createNotificationTypesMap(notificationTypes, true);
      cds.notifications = { local: { types: notificationTypesMap } };
    }
  }
});