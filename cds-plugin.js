const cds = require("@sap/cds");
const notifier = require("./lib/notifications");
const {
  validateNotificationTypes,
  readFile,
  doesKeyExist
} = require("./lib/utils");

cds.once("served", () => {
  /**
   * For local testing initialise VCAP_SERVICES variables for the application
   * process.env.VCAP_SERVICES = Strigified VCAP_SERVICES variable
   */
  /**
   * TODO: Decide the properties to be added in the alerts section for notificationtype files.
   */
  const profiles = cds.env.profiles ?? [];
  const production = profiles.includes('production');
  if(cds.env.requires?.notifications?.types) {
    // read notification types
    const notificationTypes = readFile(cds.env.requires.notifications.types);

    // validate notification types
    validateNotificationTypes(notificationTypes);

    // create notification types
    if(production) {
      notificationTypes.forEach((oNotificationType) => {
        notifier.postNotificationType(oNotificationType);
      });
    } else {
      const types = {}
      notificationTypes.forEach((oNotificationType) => {
        if(!doesKeyExist(types, oNotificationType.NotificationTypeKey)) {
          types[oNotificationType.NotificationTypeKey] = {}; 
        }
  
        types[oNotificationType.NotificationTypeKey][oNotificationType.NotificationTypeVersion] = oNotificationType;
      });

      cds.notifications = { local: { types }};
    }
  } else if (!production) {
    cds.notifications = { local: { types: {} }};
  }
});

