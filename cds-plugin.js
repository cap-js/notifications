const cds = require("@sap/cds/lib");

if (cds.cli.command === "build") {
  // register build plugin
  cds.build?.register?.('notifications', require("./lib/build"));
}

else cds.once("served", async () => {
  const { validateNotificationTypes, readFile } = require("./lib/utils");
  const { createNotificationTypesMap } = require("./lib/notificationTypes");
  const production = cds.env.profiles?.includes("production");

  // read notification types
  const notificationTypes = readFile(cds.env.requires?.notifications?.types);
  if (validateNotificationTypes(notificationTypes)) {
    if (!production) {
      const notificationTypesMap = createNotificationTypesMap(notificationTypes, true);
      cds.notifications = { local: { types: notificationTypesMap } };
    }
  }

  require("@sap-cloud-sdk/util").setGlobalLogLevel("error")
})
