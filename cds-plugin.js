const cds = require("@sap/cds");
const { validateNotificationTypes, readFile } = require("./lib/utils");
const { createNotificationTypesMap, processNotificationTypes} = require("./lib/notificationTypes");

cds.once("served", async () => {
  const profiles = cds.env.profiles ?? [];
  const production = profiles.includes('production');
  const destination = cds.env.requires.notifications?.destination ?? "SAP_Notifications";

  if (cds.env.requires?.notifications?.types) {
    // read notification types
    const notificationTypes = readFile(cds.env.requires.notifications.types);

    // validate notification types
    validateNotificationTypes(notificationTypes);

    const notificationTypesMap = createNotificationTypesMap(notificationTypes);

    // create notification types
    if (production) {
      await processNotificationTypes(notificationTypesMap, destination);
    } else {
      cds.notifications = { local: { types: notificationTypesMap }};
    }
  } else if (!production) {
    cds.notifications = { local: { types: {} }};
  }
});
