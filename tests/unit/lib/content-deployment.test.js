const cds = require("@sap/cds");
const { validateNotificationTypes, readFile } = require("../../../lib/utils");
const { processNotificationTypes } = require("../../../lib/notificationTypes");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");

jest.mock("../../../lib/utils");
jest.mock("../../../lib/notificationTypes");
jest.mock("@sap-cloud-sdk/util");

const contentDeployment = require("../../../lib/content-deployment");

describe("contentDeployment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setGlobalLogLevel.mockImplementation(() => undefined);
    readFile.mockImplementation(() => []);
  });

  test("Set log level to error on startup", async () => {
    validateNotificationTypes.mockReturnValue(false);
    await contentDeployment.deployNotificationTypes();

    expect(setGlobalLogLevel).toHaveBeenCalledWith("error");
  });

  test("Process notification types when they are valid", async () => {
    validateNotificationTypes.mockReturnValue(true);
    processNotificationTypes.mockResolvedValue();
    await contentDeployment.deployNotificationTypes();

    expect(validateNotificationTypes).toHaveBeenCalledWith([]);
    expect(processNotificationTypes).toHaveBeenCalledWith([]);
  });

  test("Notification types are not processed when they are invalid", async () => {
    validateNotificationTypes.mockReturnValue(false);
    processNotificationTypes.mockResolvedValue();
    await contentDeployment.deployNotificationTypes();

    expect(validateNotificationTypes).toHaveBeenCalledWith([]);
    expect(processNotificationTypes).not.toHaveBeenCalled();
  });

  test("Call readFile with empty string when notifications types path is not configured", async () => {
    validateNotificationTypes.mockReturnValue(false);
    const originalTypes = cds.env.requires.notifications.types;
    delete cds.env.requires.notifications.types;
    await contentDeployment.deployNotificationTypes();
    cds.env.requires.notifications.types = originalTypes;
    
    expect(readFile).toHaveBeenCalledWith('');
  });
});
