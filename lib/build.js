const cds = require('@sap/cds');
const { readFile, getPrefix } = require('./utils');
const { preprocessTypes } = require('./buildNotificationTypes');
const { readFileSync } = require('fs');
const { BuildPlugin } = cds.build

const { copy, exists, path, write } = cds.utils

module.exports = class NotificationsBuildPlugin extends BuildPlugin {
  static taskDefaults = { src: cds.env.folders.srv }
  static hasTask() {
    const notificationTypesFile = cds.env.requires?.notifications?.types;
    return notificationTypesFile === undefined ? false : exists(notificationTypesFile);
  }

  async build() {
    if (exists(cds.env.requires.notifications?.types)) {
      const notificationTypes = require(path.join(cds.root, cds.env.requires.notifications.types));
      
      if (exists(cds.env.requires.notifications?.build?.before)) {
        const handler = require(cds.env.requires.notifications?.build?.before);
        await handler(notificationTypes);
      }
      
      preprocessTypes(notificationTypes);
      
      if (exists(cds.env.requires.notifications?.build?.after)) {
        const handler = require(path.join(cds.root, cds.env.requires.notifications?.build?.after));
        await handler(notificationTypes);
      }
      
      const fileName = path.basename(cds.env.requires.notifications.types);
      await this.write(JSON.stringify(notificationTypes)).to(path.join(this.task.dest, fileName));

      await this.write(JSON.stringify(notificationTypes)).to(path.join(this.task.dest, '../notifications/notification-types.json'));

      if (exists(path.join(this.task.src, '../node_modules/@cap-js/notifications/lib/deployer'))) {
        await this.copy(path.join(this.task.src, '../node_modules/@cap-js/notifications/lib/deployer')).to(path.join(this.task.dest, '../notifications'))
      }
      const config = {
        prefix: getPrefix(),
        destination: cds.env.requires.notifications?.destination ?? "SAP_Notifications"
      }
      await this.write(JSON.stringify(config)).to(path.join(this.task.dest, '../notifications/config.json'))
    }
  }
}