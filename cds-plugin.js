const cds = require("@sap/cds/lib")

cds.on("loaded", m => {
  for (const def of Object.values(m.definitions)) {
    if (def.kind !== 'event') continue
    if (!Object.keys(def).some(k => k === '@notification' || k.startsWith('@notification.'))) continue
    if (!def.elements) def.elements = {}
    if (!def.elements.recipients) {
      def.elements.recipients = { items: { type: 'cds.String' } }
    }
  }
})

if (cds.cli.command === "build") {
  // register build plugin
  cds.build?.register?.('notifications', require("./lib/build"))
}

else cds.once("served", async () => {
  const { validateNotificationTypes, readFile } = require("./lib/utils")
  const { createNotificationTypesMap } = require("./lib/notificationTypes")
  const { notificationTypesFromModel } = require("./lib/compile")
  const { path } = cds.utils
  const production = cds.env.profiles?.includes("production")

  const typesPath = cds.env.requires?.notifications?.types
  const kind = cds.env.requires?.notifications?.kind
  const needsProcessing = kind === 'notify-to-rest' || !production
  if (!needsProcessing) return

  const model = cds.context?.model ?? cds.model
  const notificationTypes = [
    ...notificationTypesFromModel(model),
    ...( typesPath ? readFile(typesPath) : [] )
  ]

  if (validateNotificationTypes(notificationTypes)) {
    if (kind === 'notify-to-rest') {
      const { processNotificationTypes } = require('./lib/notificationTypes')
      await processNotificationTypes(notificationTypes)
    } else if (!production) {
      const notificationTypesMap = createNotificationTypesMap(notificationTypes, true)
      cds.notifications = { local: { types: notificationTypesMap } }
    }
  }

  require("@sap-cloud-sdk/util").setGlobalLogLevel("error")
})
