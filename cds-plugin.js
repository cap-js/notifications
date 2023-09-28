const cds = require("@sap/cds");
const { validateNotificationTypes, readFile } = require("./lib/utils");
const { createNotificationTypesMap, processNotificationTypes} = require("./lib/notificationTypes");

cds.once("served", async () => {
  const profiles = cds.env.profiles ?? [];
  const production = profiles.includes('production');

  // read notification types
  const notificationTypes = readFile(cds.env.requires.notifications.types);

  if(validateNotificationTypes(notificationTypes)) {
    if (production) {
      await processNotificationTypes(notificationTypes);
    } else {
      const notificationTypesMap = createNotificationTypesMap(notificationTypes, true);
      cds.notifications = { local: { types: notificationTypesMap }};
    }
  }
});
