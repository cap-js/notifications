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
  const { validateNotificationTypes, readFile, buildNotificationFromEvent } = require("./lib/utils")
  const { createNotificationTypesMap } = require("./lib/notificationTypes")
  const { notificationTypesFromModel } = require("./lib/compile")
  const { path } = cds.utils
  const production = cds.env.profiles?.includes("production")

  const typesPath = cds.env.requires?.notifications?.types
  const srvPath = path.join(cds.root, cds.env.folders.srv)
  const model = await cds.load(srvPath)
  const notificationTypes = [
    ...notificationTypesFromModel(model),
    ...( typesPath ? readFile(typesPath) : [] )
  ]

  if (validateNotificationTypes(notificationTypes)) {
    const kind = cds.env.requires?.notifications?.kind
    if (kind === 'notify-to-rest') {
      const { processNotificationTypes } = require('./lib/notificationTypes')
      await processNotificationTypes(notificationTypes)
    } else if (!production) {
      const notificationTypesMap = createNotificationTypesMap(notificationTypes, true)
      cds.notifications = { local: { types: notificationTypesMap } }
    }
  }

  const notifications = await cds.connect.to('notifications')
  for (const service of Object.values(cds.services)) {
    if (service === notifications || service === cds.db) continue
    service.on('*', async (req, next) => {
      const def = req.target
      if (!def || def.kind !== 'event') return next()
      if (!Object.keys(def).some(k => k === '@notification' || k.startsWith('@notification.'))) return next()
      const notification = buildNotificationFromEvent(def, req.data)
      await notifications.notify(notification)
      return next()
    })
  }

  require("@sap-cloud-sdk/util").setGlobalLogLevel("error")
})

