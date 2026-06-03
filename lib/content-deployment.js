const cds = require("@sap/cds")
const { validateNotificationTypes, readFile } = require("./utils")
const { processNotificationTypes } = require("./notificationTypes")
const { notificationTypesFromModel } = require("./compile")
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util")

async function deployNotificationTypes() {
  setGlobalLogLevel("error")

  // read notification types
  const model = await cds.load('*')
  const filePath = cds.env.requires?.notifications?.types ?? ''

  const notificationTypes = [
    ...notificationTypesFromModel(model),
    ...(filePath ? readFile(filePath) : [])
  ]

  if (validateNotificationTypes(notificationTypes)) {
    await processNotificationTypes(notificationTypes)
  }
}

module.exports = {
  deployNotificationTypes
}
