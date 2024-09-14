const cds = require("@sap/cds/lib");
const path = require('path');
const { preprocessTypes } = require("./lib/buildNotificationTypes");
const { existsSync } = require("fs");

if (cds.cli.command === "build") {
  // register build plugin
  cds.build?.register?.('notifications', { 
      impl: '@cap-js/notifications/lib/build',
      taskDefaults: { src: cds.env.folders.srv }
  });
}

else cds.once("served", async () => {
  const { validateNotificationTypes, readFile } = require("./lib/utils");
  const { createNotificationTypesMap } = require("./lib/deployer/notificationTypes");
  const production = cds.env.profiles?.includes("production");

  // read notification types
  const notificationTypes = require(path.join(cds.root, cds.env.requires?.notifications?.types));
      
  if (existsSync(cds.env.requires.notifications?.build?.before)) {
    const handler = require(cds.env.requires.notifications?.build?.before);
    await handler(notificationTypes);
  }
  
  preprocessTypes(notificationTypes);
  
  if (existsSync(cds.env.requires.notifications?.build?.after)) {
    const handler = require(path.join(cds.root, cds.env.requires.notifications?.build?.after));
    await handler(notificationTypes);
  }

  if (validateNotificationTypes(notificationTypes)) {
    if (!production) {
      const notificationTypesMap = createNotificationTypesMap(notificationTypes, true);
      cds.notifications = { local: { types: notificationTypesMap } };
    }
  }

  require("@sap-cloud-sdk/util").setGlobalLogLevel("error")
})
