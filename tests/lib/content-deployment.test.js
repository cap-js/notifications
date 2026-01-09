// import required modules and functions
const { validateNotificationTypes, readFile } = require("../../lib/utils");
const { processNotificationTypes } = require("../../lib/notificationTypes");
const { setGlobalLogLevel } = require("@sap-cloud-sdk/util");
const assert = require("chai");

jest.mock("../../lib/utils");
jest.mock("../../lib/notificationTypes");
jest.mock("@sap-cloud-sdk/util");

const contentDeployment = require("../../lib/content-deployment");

describe("contentDeployment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Given valid notification types | When Deploy is called | Then process is called", async () => {
    setGlobalLogLevel.mockImplementation(() => undefined);
    readFile.mockImplementation(() => []);
    validateNotificationTypes.mockImplementation(() => true);
    processNotificationTypes.mockImplementation(() => Promise.resolve());

    await contentDeployment.deployNotificationTypes();

    console.log(setGlobalLogLevel.mock.calls);
    assert.expect(setGlobalLogLevel.mock.calls[0][0]).to.be.equal("error");
    assert.expect(validateNotificationTypes.mock.calls[0][0]).to.be.deep.equal([]);
    assert.expect(processNotificationTypes.mock.calls[0][0]).to.be.deep.equal([]);
  });

  test("Given invalid notification types | When Deploy is called | Then process is called", async () => {
    setGlobalLogLevel.mockImplementation(() => undefined);
    readFile.mockImplementation(() => []);
    validateNotificationTypes.mockImplementation(() => false);
    processNotificationTypes.mockImplementation(() => Promise.resolve());

    await contentDeployment.deployNotificationTypes();

    console.log(setGlobalLogLevel.mock.calls);
    assert.expect(setGlobalLogLevel.mock.calls[0][0]).to.be.equal("error");
    assert.expect(validateNotificationTypes.mock.calls[0][0]).to.be.deep.equal([]);
    assert.expect(processNotificationTypes.mock.calls[0]).to.be.deep.equal(undefined);
  });
});
