const cds = require('@sap/cds')
const { getNotificationDestination } = require("../../../lib/utils")
const { buildHeadersForDestination } = require("@sap-cloud-sdk/connectivity")
const NotifyToRest = require("../../../srv/notifyToRest")
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client")

jest.mock("../../../lib/utils")
jest.mock("@sap-cloud-sdk/connectivity")
jest.mock("@sap-cloud-sdk/http-client")

const expectedCustomNotification = {
    NotificationTypeKey: "Custom",
    NotificationTypeVersion: "1",
    Priority: "HIGH",
    Properties: [
        {
            Key: "title",
            IsSensitive: false,
            Language: "en",
            Value: "Some Text Title",
            Type: "String"
        },
        {
            Key: "description",
            IsSensitive: false,
            Language: "en",
            Value: "Some Text Description",
            Type: "String"
        }
    ],
    Recipients: [{ RecipientId: "test.mail@mail.com" }]
}

describe("Test post notification", () => {
    let log = cds.test.log()
    let alert

    beforeEach(() => {
        alert = new NotifyToRest
        getNotificationDestination.mockReturnValue(undefined)
        buildHeadersForDestination.mockReturnValue(undefined)
    })

    test("Logs and sends when a valid notification object is posted", async () => {
        executeHttpRequest.mockReturnValue(expectedCustomNotification)
        await alert.postNotification(expectedCustomNotification)

        expect(log.output).toContain("Sending notification of key: Custom and version: 1")
        expect(executeHttpRequest).toHaveBeenCalled()
    })

    test.each([
        [500, false],
        [404, true],
        [429, false],
    ])("HTTP %i error - unrecoverable is %s", async (status, unrecoverable) => {
        expect.assertions(3)
        const error = new Error()
        error.response = { message: "mocked error", status }
        executeHttpRequest.mockRejectedValue(error)

        try {
            await alert.postNotification(expectedCustomNotification)
        } catch (err) {
            expect(!!err.unrecoverable).toBe(unrecoverable)
        }

        expect(log.output).toContain("Sending notification of key: Custom and version: 1")
        expect(executeHttpRequest).toHaveBeenCalled()
    })
})
