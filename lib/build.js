const cds = require('@sap/cds')

const { copy, exists, path } = cds.utils

module.exports = class NotificationsBuildPlugin extends cds.build.Plugin {
  static taskDefaults = { src: cds.env.folders.srv }
  
  static hasTask() {
    const notificationTypesFile = cds.env.requires?.notifications?.types;
    return notificationTypesFile === undefined ? false : exists(notificationTypesFile);
  }

  async build() {
    if (exists(cds.env.requires.notifications?.types)) {
      const fileName = path.basename(cds.env.requires.notifications.types);
      await copy(cds.env.requires.notifications.types).to(path.join(this.task.dest, fileName));
    }
  }
}