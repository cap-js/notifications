const cds = require('@sap/cds')

const { path } = cds.utils

module.exports = class NotificationsBuildPlugin extends cds.build.Plugin {
  static taskDefaults = { src: cds.env.folders.srv }

  static hasTask() {
    return !!cds.env.requires?.notifications
  }

  async build() {
    const model = await this.model()
    if (!model) return

    const { notificationTypesFromModel } = require('./compile')
    const { readFile } = require('./utils')

    const typesPath = cds.env.requires.notifications?.types
    const types = [
      ...notificationTypesFromModel(model),
      ...(typesPath ? readFile(typesPath) : [])
    ]

    if (types.length) {
      await this.write(JSON.stringify(types, null, 2)).to(path.join(this.task.dest, 'notification-types.json'))
    }
  }
}
