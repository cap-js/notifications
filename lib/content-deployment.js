const cds = require("@sap/cds")
const { validateNotificationTypes, readFile } = require("./utils")
const { processNotificationTypes } = require("./notificationTypes")
const { notificationTypesFromModel } = require("./compile")
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util")

async function deployNotificationTypes() {
  setGlobalLogLevel("error")

  // read notification types
  const filePath = cds.env.requires?.notifications?.types ?? ''
  const srvPath = cds.utils.path.join(cds.root, cds.env.folders.srv)
  const model = await cds.load(srvPath)

  const notificationTypes = [
    ...notificationTypesFromModel(model),
    ...readFile(filePath)
  ]

  if (validateNotificationTypes(notificationTypes)) {
    await processNotificationTypes(notificationTypes)
  }
}

deployNotificationTypes()

module.exports = {
  deployNotificationTypes
}
