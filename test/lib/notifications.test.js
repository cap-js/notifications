const { getNotificationDestination } = require("./../../lib/utils");
const { buildHeadersForDestination } = require("@sap-cloud-sdk/connectivity");
const { postNotification } = require("./../../lib/notifications");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

jest.mock("./../../lib/utils");
jest.mock("@sap-cloud-sdk/connectivity");
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
    Recipients: [
        {
            RecipientId: "test.mail@mail.com"
        }
    ]
};

describe("Test post notification", () => {

    test("When passed whole notification object to postNotification", async () => {
        const infoSpy = jest.spyOn(global.console, 'info');
        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        executeHttpRequest.mockReturnValue(expectedCustomNotification);

        // call post notification
        await postNotification(expectedCustomNotification)

        // check if console.info was called
        expect(infoSpy).toHaveBeenCalled();
        expect(infoSpy).toHaveBeenCalledWith("[notifications] -", "Sending notification of key: Custom and version: 1");

        // check if execute http request was called
        expect(executeHttpRequest).toHaveBeenCalled();
        infoSpy.mockClear();
    })

    test("When execute http request throws error with status code 500", async () => {
        const error = new Error();
        error.response = {
            message: "mocked error",
            status: 500
        };

        const infoSpy = jest.spyOn(global.console, 'info');
        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        executeHttpRequest.mockImplementation(() => {
            throw error;
        });

        // call post notification
        try {
            await postNotification(expectedCustomNotification);
        } catch (err) {
            expect(err.unrecoverable).toBeFalsy();
        }

        // check if console.info was called
        expect(infoSpy).toHaveBeenCalled();
        expect(infoSpy).toHaveBeenCalledWith("[notifications] -", "Sending notification of key: Custom and version: 1");

        // check if execute http request was called
        expect(executeHttpRequest).toHaveBeenCalled();
        infoSpy.mockClear();
    })

    test("When execute http request throws error with status code 404", async () => {
        const error = new Error();
        error.response = {
            message: "mocked error",
            status: 404
        };

        const infoSpy = jest.spyOn(global.console, 'info');
        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        executeHttpRequest.mockImplementation(() => {
            throw error;
        });

        // call post notification
        try {
            await postNotification(expectedCustomNotification);
        } catch (err) {
            expect(err.unrecoverable).toEqual(true);
        }

        // check if console.info was called
        expect(infoSpy).toHaveBeenCalled();
        expect(infoSpy).toHaveBeenCalledWith("[notifications] -", "Sending notification of key: Custom and version: 1");

        // check if execute http request was called
        expect(executeHttpRequest).toHaveBeenCalled();
        infoSpy.mockClear();
    })

    test("When execute http request throws error with status code 429", async () => {
        const error = new Error();
        error.response = {
            message: "mocked error",
            status: 429
        };

        const infoSpy = jest.spyOn(global.console, 'info');
        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        executeHttpRequest.mockImplementation(() => {
            throw error;
        });

        // call post notification
        try {
            await postNotification(expectedCustomNotification);
        } catch (err) {
            expect(err.unrecoverable).toBeFalsy();
        }

        // check if console.info was called
        expect(infoSpy).toHaveBeenCalled();
        expect(infoSpy).toHaveBeenCalledWith("[notifications] -", "Sending notification of key: Custom and version: 1");

        // check if execute http request was called
        expect(executeHttpRequest).toHaveBeenCalled();
        infoSpy.mockClear();
    })
})
