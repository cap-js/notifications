const cds = require("@sap/cds")
const { validateNotificationTypes, readFile } = require("../../../lib/utils")
const { processNotificationTypes } = require("../../../lib/notificationTypes")
const { notificationTypesFromModel } = require("../../../lib/compile")
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util")

jest.mock("../../../lib/utils")
jest.mock("../../../lib/notificationTypes")
jest.mock("../../../lib/compile")
jest.mock("@sap-cloud-sdk/util")

// Set defaults before require — the module calls deployNotificationTypes() on load
readFile.mockReturnValue([])
notificationTypesFromModel.mockReturnValue([])

const contentDeployment = require("../../../lib/content-deployment")

describe("contentDeployment", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setGlobalLogLevel.mockImplementation(() => undefined)
    readFile.mockReturnValue([])
    notificationTypesFromModel.mockReturnValue([])
  })

  test("Set log level to error on startup", async () => {
    validateNotificationTypes.mockReturnValue(false)
    await contentDeployment.deployNotificationTypes()

    expect(setGlobalLogLevel).toHaveBeenCalledWith("error")
  })

  test("Process notification types when they are valid", async () => {
    validateNotificationTypes.mockReturnValue(true)
    processNotificationTypes.mockResolvedValue()
    await contentDeployment.deployNotificationTypes()

    expect(validateNotificationTypes).toHaveBeenCalledWith([])
    expect(processNotificationTypes).toHaveBeenCalledWith([])
  })

  test("Notification types are not processed when they are invalid", async () => {
    validateNotificationTypes.mockReturnValue(false)
    processNotificationTypes.mockResolvedValue()
    await contentDeployment.deployNotificationTypes()

    expect(validateNotificationTypes).toHaveBeenCalledWith([])
    expect(processNotificationTypes).not.toHaveBeenCalled()
  })

  test("readFile is not called when notifications types path is not configured", async () => {
    validateNotificationTypes.mockReturnValue(false)
    const originalTypes = cds.env.requires.notifications.types
    delete cds.env.requires.notifications.types
    await contentDeployment.deployNotificationTypes()
    cds.env.requires.notifications.types = originalTypes
    
    expect(readFile).not.toHaveBeenCalled()
  })
})
