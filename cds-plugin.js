const cds = require("@sap/cds");
const notifier = require("./lib/notifications");
const {
  messages,
  validateNotificationTypes,
  readFileContent,
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
  if (production && cds.env.requires?.notifications?.types) {

    let notificationTypes = readFileContent(
      cds.env.requires.notifications.types
    );
    if (validateNotificationTypes(notificationTypes)) {
      notificationTypes.forEach((oNotificationType) => {
        notifier.postNotificationType(oNotificationType);
      });
    } else {
      /**
       * TODO: Move this message inside the validation function
       * ? Should we throw error message or warning for the specific invalid NotificationType?
       * ? e.g., If we have 5 notificationTypes and 1 out of the 5 is invalid type, we should
       * ? go ahead and create the valid ones and display INFO/Warning for the invalid type
       */
      console.log(messages.INVALID_NOTIFICATION_TYPES);
    }
  }
});

