const cds = require("@sap/cds");
const fs = require("fs").promises;
const notifier = require("./srv/notify");

global.alert = {
  notify: notifier.postNotification,
};

const oErrorMessages = {
  INVALID_NOTIFICATION_TYPES:
    "Failed to create Notification Types as they are not valid.",
};

let fAreNotificationTypesValid = async (aNotificationtypes) => {
  /**
   * TODO: write a logic to check all the required fields.
   */
  return true;
};

cds.once("served", async () => {
  /**
   * For local testing initialise VCAP_SERVICES variables for the application
   * process.env.VCAP_SERVICES = Strigified VCAP_SERVICES variable
   */
  /**
   * TODO: Decide the properties to be added in the alerts section for notificationtype files.
   */
  if (cds.requires.alerts && cds.requires.alerts.notificationTypes) {
    let notificationTypes = JSON.parse(
      await fs.readFile(cds.requires.alerts.notificationTypes)
    );
    if (fAreNotificationTypesValid) {
      notificationTypes.forEach((oNotificationType) => {
        notifier.postNotificationType(oNotificationType);
      });
    } else {
      console.log(oErrorMessages.INVALID_NOTIFICATION_TYPES);
    }
  }
});

module.exports = { alert: alert };
