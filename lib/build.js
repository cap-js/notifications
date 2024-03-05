const cds = require('@sap/cds')
const {BuildPlugin} = cds.build

const { copy, exists, path } = cds.utils

module.exports = class NotificationsBuildPlugin extends BuildPlugin {

  static hasTask() {
    const notificationTypesFile = cds.env.requires?.notifications?.types;
    return notificationTypesFile === undefined ? false : exists(notificationTypesFile);
  }

  async build() {
    if (exists(cds.env.requires.notifications?.types)) {
      const fileName = path.basename(cds.env.requires.notifications.types);
      await this.copy(cds.env.requires.notifications.types).to(fileName);
    }
  }
}