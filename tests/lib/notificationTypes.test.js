const utils = require("../../lib/utils");
const httpClient = require("@sap-cloud-sdk/http-client");
const connectivity = require("@sap-cloud-sdk/connectivity");
const notificationTypes = require("../../lib/notificationTypes");
const assert = require("chai");

jest.mock("../../lib/utils");
jest.mock("@sap-cloud-sdk/http-client");
jest.mock("@sap-cloud-sdk/connectivity");

describe("Managing of Notification Types", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Given 2 New Notification Types and 0 Existing Notification Types | When process is called | Than Default and 2 New Notification Types are created", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(emptyResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    // REVISIT: Never test internal APIs -> blocks us from refactoring
    utils.getPrefix.mockReturnValue(testPrefix);

    notificationTypes.processNotificationTypes([copy(notificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.be.equal("get");

      const createDefaultNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
      assert.expect(createDefaultNotificationType.url).to.be.equal("v2/NotificationType.svc/NotificationTypes");
      assert.expect(createDefaultNotificationType.method).to.be.equal("post");
      assert.expect(createDefaultNotificationType.data).to.be.deep.equal(defaultNotificationType);

      const createFirstNotificationType = httpClient.executeHttpRequest.mock.calls[2][1];
      assert.expect(createFirstNotificationType.url).to.be.equal("v2/NotificationType.svc/NotificationTypes");
      assert.expect(createFirstNotificationType.method).to.be.equal("post");
      assert.expect(createFirstNotificationType.data).to.be.deep.equal(toNTypeWithPrefixedKey(notificationTypeWithAllProperties));

      const createSecondNotificationType = httpClient.executeHttpRequest.mock.calls[3][1];
      assert.expect(createSecondNotificationType.url).to.be.equal("v2/NotificationType.svc/NotificationTypes");
      assert.expect(createSecondNotificationType.method).to.be.equal("post");
      assert.expect(createSecondNotificationType.data).to.be.deep.eql(toNTypeWithPrefixedKey(toNTypeWithDefaultVersion(notificationTypeWithoutVersion)));

      assert.expect(httpClient.executeHttpRequest.mock.calls[4]).to.be.equal(undefined);
    });
  });

  test("Given 2 New Notification Types and 2 Existing Notification Types (+ 1 from another app) and they are the same | When process is called | Than nothing is done", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    notificationTypes.processNotificationTypes([copy(notificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      assert.expect(httpClient.executeHttpRequest.mock.calls[1]).to.be.equal(undefined);
    });
  });

  test("Given 1 New Notification Types and 2 Existing Notification Types (+ 1 from another app) and they are the same | When process is called | Than One Notification Type is deleted", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    notificationTypes.processNotificationTypes([copy(notificationTypeWithAllProperties)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      const deleteSecondNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
      assert.expect(deleteSecondNotificationType.url).to.be.equal("v2/NotificationType.svc/NotificationTypes(guid'719d8f6a-1e07-4981-b2be-07197cec7492')");
      assert.expect(deleteSecondNotificationType.method).to.be.equal("delete");

      assert.expect(httpClient.executeHttpRequest.mock.calls[2]).to.be.equal(undefined);
    });
  });

  test("Given 2 New Notification Types and 2 Existing Notification Types (+ 1 from another app) and they are changed | When process is called | Than notification types are updated", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    const updatedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);
    updatedNotificationTypeWithAllProperties.Templates[0].Description = "New Description";
    const updatedNotificationTypeWithoutVersion = copy(notificationTypeWithoutVersion);
    updatedNotificationTypeWithoutVersion.Templates[0].Description = "New Description";

    notificationTypes.processNotificationTypes([copy(updatedNotificationTypeWithAllProperties), copy(updatedNotificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      const updateFirstNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
      assert.expect(updateFirstNotificationType.url).to.be.equal("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')");
      assert.expect(updateFirstNotificationType.method).to.be.equal("patch");
      assert.expect(updateFirstNotificationType.data).to.be.deep.equal(toNTypeWithPrefixedKey(updatedNotificationTypeWithAllProperties));

      const updateSecondNotificationType = httpClient.executeHttpRequest.mock.calls[2][1];
      assert.expect(updateSecondNotificationType.url).to.be.equal("v2/NotificationType.svc/NotificationTypes(guid'719d8f6a-1e07-4981-b2be-07197cec7492')");
      assert.expect(updateSecondNotificationType.method).to.be.equal("patch");
      assert.expect(updateSecondNotificationType.data).to.be.deep.eql(toNTypeWithPrefixedKey(toNTypeWithDefaultVersion(updatedNotificationTypeWithoutVersion)));

      assert.expect(httpClient.executeHttpRequest.mock.calls[3]).to.be.equal(undefined);
    });
  });

  test("Given NType with additional Template | When process is called | Than notification type is updated", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    const updatedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);
    updatedNotificationTypeWithAllProperties.Templates[1] = updatedNotificationTypeWithAllProperties.Templates[0];
    updatedNotificationTypeWithAllProperties.Templates[1].Language = "DE";

    notificationTypes.processNotificationTypes([copy(updatedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      const updateFirstNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
      assert.expect(updateFirstNotificationType.url).to.be.equal("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')");
      assert.expect(updateFirstNotificationType.method).to.be.equal("patch");
      assert.expect(updateFirstNotificationType.data).to.be.deep.equal(toNTypeWithPrefixedKey(updatedNotificationTypeWithAllProperties));

      assert.expect(httpClient.executeHttpRequest.mock.calls[2]).to.be.equal(undefined);
    });
  });

  test("Given NType with additional Actions | When process is called | Than notification type is updated", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    const updatedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);
    updatedNotificationTypeWithAllProperties.Actions[1] = updatedNotificationTypeWithAllProperties.Actions[0];
    updatedNotificationTypeWithAllProperties.Actions[1].Language = "DE";

    notificationTypes.processNotificationTypes([copy(updatedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      const updateFirstNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
      assert.expect(updateFirstNotificationType.url).to.be.equal("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')");
      assert.expect(updateFirstNotificationType.method).to.be.equal("patch");
      assert.expect(updateFirstNotificationType.data).to.be.deep.equal(toNTypeWithPrefixedKey(updatedNotificationTypeWithAllProperties));

      assert.expect(httpClient.executeHttpRequest.mock.calls[2]).to.be.equal(undefined);
    });
  });

  test("Given NType with additional DeliveryChannels | When process is called | Than notification type is updated", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    const updatedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);
    updatedNotificationTypeWithAllProperties.DeliveryChannels[1] = updatedNotificationTypeWithAllProperties.DeliveryChannels[0];
    updatedNotificationTypeWithAllProperties.DeliveryChannels[1].Type = "MOBILE";

    notificationTypes.processNotificationTypes([copy(updatedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      const updateFirstNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
      assert.expect(updateFirstNotificationType.url).to.be.equal("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')");
      assert.expect(updateFirstNotificationType.method).to.be.equal("patch");
      assert.expect(updateFirstNotificationType.data).to.be.deep.equal(toNTypeWithPrefixedKey(updatedNotificationTypeWithAllProperties));

      assert.expect(httpClient.executeHttpRequest.mock.calls[2]).to.be.equal(undefined);
    });
  });

  test("Given arrays with results | When process is called | Then nothing is done", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    const changedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);
    changedNotificationTypeWithAllProperties.Templates = { results: notificationTypeWithAllProperties.Templates };
    changedNotificationTypeWithAllProperties.Actions = { results: notificationTypeWithAllProperties.Actions };
    changedNotificationTypeWithAllProperties.DeliveryChannels = { results: notificationTypeWithAllProperties.DeliveryChannels };

    notificationTypes.processNotificationTypes([copy(changedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      assert.expect(httpClient.executeHttpRequest.mock.calls[1]).to.be.equal(undefined);
    });
  });

  test("Given arrays with results | When process is called | Then nothing is done", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    const changedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);
    changedNotificationTypeWithAllProperties.IsGroupable = undefined;
    notificationTypes.processNotificationTypes([copy(changedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      assert.expect(httpClient.executeHttpRequest.mock.calls[1]).to.be.equal(undefined);
    });
  });

  test("Given language in lower case | When process is called | Then nothing is done", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    const changedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);
    changedNotificationTypeWithAllProperties.Templates[0].Language = notificationTypeWithAllProperties.Templates[0].Language.toLowerCase();
    changedNotificationTypeWithAllProperties.Actions[0].Language = notificationTypeWithAllProperties.Actions[0].Language.toLowerCase();

    notificationTypes.processNotificationTypes([copy(changedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      assert.expect(httpClient.executeHttpRequest.mock.calls[1]).to.be.equal(undefined);
    });
  });

  test("Given template language in lower case | When process is called | Then nothing is done", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    const changedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);
    changedNotificationTypeWithAllProperties.Templates[0].TemplateLanguage = notificationTypeWithAllProperties.Templates[0].TemplateLanguage.toLowerCase();

    notificationTypes.processNotificationTypes([copy(changedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      assert.expect(httpClient.executeHttpRequest.mock.calls[1]).to.be.equal(undefined);
    });
  });

  test("Given empty Templates, Actions and Delivery Channels in both new and old | When process is called | Then nothing is done", () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingWithUndefinedTemplatesActionsAndDeliveryChannelsResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    notificationTypes.processNotificationTypes([copy(notificationTypeWithNullTemplatesActionsAndDeliveryChannels)]).then(() => {
      const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
      assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
      assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

      assert.expect(httpClient.executeHttpRequest.mock.calls[1]).to.be.equal(undefined);
    });
  });

  test("Given that NType is different | When process is called | Then NType is updated", async () => {
    utils.getNotificationDestination.mockReturnValue(undefined);
    httpClient.executeHttpRequest.mockReturnValue(allExistingResponseBody);
    connectivity.buildHeadersForDestination.mockReturnValue({});
    utils.getNotificationTypesKeyWithPrefix.mockImplementation((str) => testPrefix + "/" + str);
    utils.getPrefix.mockReturnValue(testPrefix);

    var ntypeProperties = Object.entries(notificationTypeWithAllProperties);
    for (var ntypeProperty of ntypeProperties) {
      if (ntypeProperty[0] == "NotificationTypeKey" || ntypeProperty[0] == "NotificationTypeVersion") {
        continue;
      }
      const changedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);

      console.log(ntypeProperty);
      if (typeof ntypeProperty[1] === "string") {
        changedNotificationTypeWithAllProperties[ntypeProperty[0]] = ntypeProperty[1] + " UPDATED";
      } else if (typeof ntypeProperty[1] === "boolean") {
        changedNotificationTypeWithAllProperties[ntypeProperty[0]] = !ntypeProperty[1];
      } else if (typeof ntypeProperty[1] === "number") {
        changedNotificationTypeWithAllProperties[ntypeProperty[0]] = ntypeProperty[1] + 1;
      } else {
        continue;
      }
      await notificationTypes.processNotificationTypes([copy(changedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
        const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
        assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
        assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

        const updateFirstNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
        assert.expect(updateFirstNotificationType.url).to.equal("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')");
        assert.expect(updateFirstNotificationType.method).to.equal("patch");
        assert.expect(updateFirstNotificationType.data).to.be.deep.equal(toNTypeWithPrefixedKey(changedNotificationTypeWithAllProperties));

        assert.expect(httpClient.executeHttpRequest.mock.calls[2]).to.be.equal(undefined);
      });
      jest.clearAllMocks();
    }

    var templateProperties = Object.entries(notificationTypeWithAllProperties.Templates[0]);
    for (var templateProperty of templateProperties) {
      const changedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);

      if (typeof templateProperty[1] === "string") {
        changedNotificationTypeWithAllProperties.Templates[0][templateProperty[0]] = templateProperty[1] + " UPDATED";
      } else if (typeof templateProperty[1] === "boolean") {
        changedNotificationTypeWithAllProperties.Templates[0][templateProperty[0]] = !templateProperty[1];
      } else if (typeof templateProperty[1] === "number") {
        changedNotificationTypeWithAllProperties.Templates[0][templateProperty[0]] = templateProperty[1] + 1;
      } else {
        continue;
      }
      await notificationTypes.processNotificationTypes([copy(changedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
        const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
        assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
        assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

        const updateFirstNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
        assert.expect(updateFirstNotificationType.url).to.equal("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')");
        assert.expect(updateFirstNotificationType.method).to.equal("patch");
        assert.expect(updateFirstNotificationType.data).to.be.deep.equal(toNTypeWithPrefixedKey(changedNotificationTypeWithAllProperties));

        assert.expect(httpClient.executeHttpRequest.mock.calls[2]).to.be.equal(undefined);
      });
      jest.clearAllMocks();
    }

    var actionProperties = Object.entries(notificationTypeWithAllProperties.Actions[0]);
    for (var actionProperty of actionProperties) {
      const changedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);

      if (typeof actionProperty[1] === "string") {
        changedNotificationTypeWithAllProperties.Actions[0][actionProperty[0]] = actionProperty[1] + " UPDATED";
      } else if (typeof actionProperty[1] === "boolean") {
        changedNotificationTypeWithAllProperties.Actions[0][actionProperty[0]] = !actionProperty[1];
      } else if (typeof actionProperty[1] === "number") {
        changedNotificationTypeWithAllProperties.Actions[0][actionProperty[0]] = actionProperty[1] + 1;
      } else {
        continue;
      }
      await notificationTypes.processNotificationTypes([copy(changedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
        const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
        assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
        assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

        const updateFirstNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
        assert.expect(updateFirstNotificationType.url).to.equal("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')");
        assert.expect(updateFirstNotificationType.method).to.equal("patch");
        assert.expect(updateFirstNotificationType.data).to.be.deep.equal(toNTypeWithPrefixedKey(changedNotificationTypeWithAllProperties));

        assert.expect(httpClient.executeHttpRequest.mock.calls[2]).to.be.equal(undefined);
      });
      jest.clearAllMocks();
    }

    var deliveryChannelProperties = Object.entries(notificationTypeWithAllProperties.DeliveryChannels[0]);
    for (var deliveryChannelProperty of deliveryChannelProperties) {
      const changedNotificationTypeWithAllProperties = copy(notificationTypeWithAllProperties);

      if (typeof deliveryChannelProperty[1] === "string") {
        changedNotificationTypeWithAllProperties.DeliveryChannels[0][deliveryChannelProperty[0]] = deliveryChannelProperty[1] + " UPDATED";
      } else if (typeof deliveryChannelProperty[1] === "boolean") {
        changedNotificationTypeWithAllProperties.DeliveryChannels[0][deliveryChannelProperty[0]] = !deliveryChannelProperty[1];
      } else if (typeof deliveryChannelProperty[1] === "number") {
        changedNotificationTypeWithAllProperties.DeliveryChannels[0][deliveryChannelProperty[0]] = deliveryChannelProperty[1] + 1;
      } else {
        continue;
      }
      await notificationTypes.processNotificationTypes([copy(changedNotificationTypeWithAllProperties), copy(notificationTypeWithoutVersion)]).then(() => {
        const getAllNotificationTypesRequest = httpClient.executeHttpRequest.mock.calls[0][1];
        assert.expect(getAllNotificationTypesRequest.url).to.equal("v2/NotificationType.svc/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels");
        assert.expect(getAllNotificationTypesRequest.method).to.equal("get");

        const updateFirstNotificationType = httpClient.executeHttpRequest.mock.calls[1][1];
        assert.expect(updateFirstNotificationType.url).to.equal("v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')");
        assert.expect(updateFirstNotificationType.method).to.equal("patch");
        assert.expect(updateFirstNotificationType.data).to.be.deep.equal(toNTypeWithPrefixedKey(changedNotificationTypeWithAllProperties));

        assert.expect(httpClient.executeHttpRequest.mock.calls[2]).to.be.equal(undefined);
      });
      jest.clearAllMocks();
    }
  });
});

function toNTypeWithPrefixedKey(ntype) {
  var prefixedNtype = copy(ntype);
  prefixedNtype.NotificationTypeKey = testPrefix + "/" + prefixedNtype.NotificationTypeKey;
  return prefixedNtype;
}

function toNTypeWithDefaultVersion(ntype) {
  var ntypeWithVersion = copy(ntype);
  ntypeWithVersion.NotificationTypeVersion = "1";
  return ntypeWithVersion;
}

function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const defaultNotificationType = {
  NotificationTypeKey: "Default",
  NotificationTypeVersion: "1",
  Templates: [
    {
      Language: "en",
      Description: "Other Notifications",
      TemplatePublic: "{{title}}",
      TemplateSensitive: "{{title}}",
      TemplateGrouped: "Other Notifications",
      TemplateLanguage: "mustache",
      Subtitle: "{{description}}"
    }
  ]
};

const notificationTypeWithAllProperties = {
  NotificationTypeKey: "notificationTypeWithAllProperties",
  NotificationTypeVersion: "1",
  IsGroupable: true,
  Templates: [
    {
      Language: "EN",
      TemplatePublic: "TemplatePublic",
      TemplateSensitive: "TemplateSensitive",
      TemplateGrouped: "TemplateGrouped",
      Description: "Description",
      TemplateLanguage: "MUSTACHE",
      Subtitle: "Subtitle",
      EmailSubject: "EmailSubject",
      EmailText: "EmailText",
      EmailHtml: "EmailHtml"
    }
  ],
  Actions: [
    {
      ActionId: "Accept",
      Language: "EN",
      ActionText: "Accept",
      GroupActionText: "Accept All",
      Nature: "POSITIVE"
    }
  ],
  DeliveryChannels: [
    {
      Type: "WEB",
      Enabled: true,
      DefaultPreference: false,
      EditablePreference: true
    }
  ]
};

const notificationTypeWithoutVersion = {
  NotificationTypeKey: "notificationTypeWithoutVersion",
  IsGroupable: true,
  Templates: [
    {
      Language: "EN",
      TemplatePublic: "TemplatePublic",
      TemplateSensitive: "TemplateSensitive",
      TemplateGrouped: "TemplateGrouped",
      Description: "Description",
      TemplateLanguage: "MUSTACHE",
      Subtitle: "Subtitle",
      EmailSubject: "EmailSubject",
      EmailText: "EmailText",
      EmailHtml: "EmailHtml"
    }
  ],
  Actions: [
    {
      ActionId: "Accept",
      Language: "EN",
      ActionText: "Accept",
      GroupActionText: "Accept All",
      Nature: "POSITIVE"
    }
  ],
  DeliveryChannels: [
    {
      Type: "WEB",
      Enabled: true,
      DefaultPreference: false,
      EditablePreference: true
    }
  ]
};

const notificationTypeWithNullTemplatesActionsAndDeliveryChannels = {
  NotificationTypeKey: "notificationTypeWithAllProperties",
  NotificationTypeVersion: "1",
  IsGroupable: true,
  Templates: null,
  Actions: null,
  DeliveryChannels: null
};

const testPrefix = "test-prefix";

const emptyResponseBody = { data: { d: { results: [] } } };

const allExistingResponseBody = {
  data: {
    d: {
      results: [
        {
          __metadata: {
            id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'a6771115-42f4-4ac3-9c85-49a819927b9c')",
            uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'a6771115-42f4-4ac3-9c85-49a819927b9c')",
            type: "com.SAP.OData.V2.NotificationTypeService.NotificationType"
          },
          NotificationTypeId: "a6771115-42f4-4ac3-9c85-49a819927b9c",
          NotificationTypeKey: "Default",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'a6771115-42f4-4ac3-9c85-49a819927b9c',Language='EN')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'a6771115-42f4-4ac3-9c85-49a819927b9c',Language='EN')",
                  type: "com.SAP.OData.V2.NotificationTypeService.Template"
                },
                NotificationTypeId: "a6771115-42f4-4ac3-9c85-49a819927b9c",
                Language: "EN",
                TemplatePublic: "{{title}}",
                TemplateSensitive: "{{title}}",
                TemplateGrouped: "Other Notifications",
                Description: "Other Notifications",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "{{description}}",
                EmailSubject: null,
                EmailText: null,
                EmailHtml: null
              }
            ]
          },
          Actions: {
            results: []
          },
          DeliveryChannels: {
            results: []
          }
        },
        {
          __metadata: {
            id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')",
            uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')",
            type: "com.SAP.OData.V2.NotificationTypeService.NotificationType"
          },
          NotificationTypeId: "26f1fad0-de4c-4869-9b4e-62f445c8a7a8",
          NotificationTypeKey: "test-prefix/notificationTypeWithAllProperties",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8',Language='EN')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8',Language='EN')",
                  type: "com.SAP.OData.V2.NotificationTypeService.Template"
                },
                NotificationTypeId: "26f1fad0-de4c-4869-9b4e-62f445c8a7a8",
                Language: "EN",
                TemplatePublic: "TemplatePublic",
                TemplateSensitive: "TemplateSensitive",
                TemplateGrouped: "TemplateGrouped",
                Description: "Description",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "Subtitle",
                EmailSubject: "EmailSubject",
                EmailText: "EmailText",
                EmailHtml: "EmailHtml"
              }
            ]
          },
          Actions: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Actions(ActionId='Accept',Language='EN',NotificationTypeId=guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Actions(ActionId='Accept',Language='EN',NotificationTypeId=guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')",
                  type: "com.SAP.OData.V2.NotificationTypeService.Action"
                },
                NotificationTypeId: "26f1fad0-de4c-4869-9b4e-62f445c8a7a8",
                ActionId: "Accept",
                ActionText: "Accept",
                GroupActionText: "Accept All",
                Language: "EN",
                Nature: "POSITIVE"
              }
            ]
          },
          DeliveryChannels: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/DeliveryChannels('WEB')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/DeliveryChannels('WEB')",
                  type: "com.SAP.OData.V2.NotificationTypeService.DeliveryChannel"
                },
                Type: "WEB",
                Enabled: true,
                DefaultPreference: false,
                EditablePreference: true
              }
            ]
          }
        },
        {
          __metadata: {
            id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'5b641f19-7c05-404b-b9a3-f6326f8b23ad')",
            uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'5b641f19-7c05-404b-b9a3-f6326f8b23ad')",
            type: "com.SAP.OData.V2.NotificationTypeService.NotificationType"
          },
          NotificationTypeId: "5b641f19-7c05-404b-b9a3-f6326f8b23ad",
          NotificationTypeKey: "test-prefix-2/notificationTypeWithAllProperties",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'5b641f19-7c05-404b-b9a3-f6326f8b23ad',Language='EN')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'5b641f19-7c05-404b-b9a3-f6326f8b23ad',Language='EN')",
                  type: "com.SAP.OData.V2.NotificationTypeService.Template"
                },
                NotificationTypeId: "5b641f19-7c05-404b-b9a3-f6326f8b23ad",
                Language: "EN",
                TemplatePublic: "TemplatePublic",
                TemplateSensitive: "TemplateSensitive",
                TemplateGrouped: "TemplateGrouped",
                Description: "Description",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "Subtitle",
                EmailSubject: "EmailSubject",
                EmailText: "EmailText",
                EmailHtml: "EmailHtml"
              }
            ]
          },
          Actions: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Actions(ActionId='Accept',Language='EN',NotificationTypeId=guid'5b641f19-7c05-404b-b9a3-f6326f8b23ad')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Actions(ActionId='Accept',Language='EN',NotificationTypeId=guid'5b641f19-7c05-404b-b9a3-f6326f8b23ad')",
                  type: "com.SAP.OData.V2.NotificationTypeService.Action"
                },
                NotificationTypeId: "5b641f19-7c05-404b-b9a3-f6326f8b23ad",
                ActionId: "Accept",
                ActionText: "Accept",
                GroupActionText: "Accept All",
                Language: "EN",
                Nature: "POSITIVE"
              }
            ]
          },
          DeliveryChannels: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/DeliveryChannels('WEB')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/DeliveryChannels('WEB')",
                  type: "com.SAP.OData.V2.NotificationTypeService.DeliveryChannel"
                },
                Type: "WEB",
                Enabled: true,
                DefaultPreference: false,
                EditablePreference: true
              }
            ]
          }
        },
        {
          __metadata: {
            id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'719d8f6a-1e07-4981-b2be-07197cec7492')",
            uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'719d8f6a-1e07-4981-b2be-07197cec7492')",
            type: "com.SAP.OData.V2.NotificationTypeService.NotificationType"
          },
          NotificationTypeId: "719d8f6a-1e07-4981-b2be-07197cec7492",
          NotificationTypeKey: "test-prefix/notificationTypeWithoutVersion",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'719d8f6a-1e07-4981-b2be-07197cec7492',Language='EN')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'719d8f6a-1e07-4981-b2be-07197cec7492',Language='EN')",
                  type: "com.SAP.OData.V2.NotificationTypeService.Template"
                },
                NotificationTypeId: "719d8f6a-1e07-4981-b2be-07197cec7492",
                Language: "EN",
                TemplatePublic: "TemplatePublic",
                TemplateSensitive: "TemplateSensitive",
                TemplateGrouped: "TemplateGrouped",
                Description: "Description",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "Subtitle",
                EmailSubject: "EmailSubject",
                EmailText: "EmailText",
                EmailHtml: "EmailHtml"
              }
            ]
          },
          Actions: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Actions(ActionId='Accept',Language='EN',NotificationTypeId=guid'719d8f6a-1e07-4981-b2be-07197cec7492')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Actions(ActionId='Accept',Language='EN',NotificationTypeId=guid'719d8f6a-1e07-4981-b2be-07197cec7492')",
                  type: "com.SAP.OData.V2.NotificationTypeService.Action"
                },
                NotificationTypeId: "719d8f6a-1e07-4981-b2be-07197cec7492",
                ActionId: "Accept",
                ActionText: "Accept",
                GroupActionText: "Accept All",
                Language: "EN",
                Nature: "POSITIVE"
              }
            ]
          },
          DeliveryChannels: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/DeliveryChannels('WEB')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/DeliveryChannels('WEB')",
                  type: "com.SAP.OData.V2.NotificationTypeService.DeliveryChannel"
                },
                Type: "WEB",
                Enabled: true,
                DefaultPreference: false,
                EditablePreference: true
              }
            ]
          }
        }
      ]
    }
  }
};

const allExistingWithUndefinedTemplatesActionsAndDeliveryChannelsResponseBody = {
  data: {
    d: {
      results: [
        {
          __metadata: {
            id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'a6771115-42f4-4ac3-9c85-49a819927b9c')",
            uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'a6771115-42f4-4ac3-9c85-49a819927b9c')",
            type: "com.SAP.OData.V2.NotificationTypeService.NotificationType"
          },
          NotificationTypeId: "a6771115-42f4-4ac3-9c85-49a819927b9c",
          NotificationTypeKey: "Default",
          NotificationTypeVersion: "1",
          IsGroupable: true,
          Templates: {
            results: [
              {
                __metadata: {
                  id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'a6771115-42f4-4ac3-9c85-49a819927b9c',Language='EN')",
                  uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/Templates(NotificationTypeId=guid'a6771115-42f4-4ac3-9c85-49a819927b9c',Language='EN')",
                  type: "com.SAP.OData.V2.NotificationTypeService.Template"
                },
                NotificationTypeId: "a6771115-42f4-4ac3-9c85-49a819927b9c",
                Language: "EN",
                TemplatePublic: "{{title}}",
                TemplateSensitive: "{{title}}",
                TemplateGrouped: "Other Notifications",
                Description: "Other Notifications",
                TemplateLanguage: "MUSTACHE",
                Subtitle: "{{description}}",
                EmailSubject: null,
                EmailText: null,
                EmailHtml: null
              }
            ]
          },
          Actions: {
            results: null
          },
          DeliveryChannels: {}
        },
        {
          __metadata: {
            id: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')",
            uri: "https://notifications.cfapps.eu12.hana.ondemand.com:443/v2/NotificationType.svc/NotificationTypes(guid'26f1fad0-de4c-4869-9b4e-62f445c8a7a8')",
            type: "com.SAP.OData.V2.NotificationTypeService.NotificationType"
          },
          NotificationTypeId: "26f1fad0-de4c-4869-9b4e-62f445c8a7a8",
          NotificationTypeKey: "test-prefix/notificationTypeWithAllProperties",
          NotificationTypeVersion: "1",
          IsGroupable: true
        }
      ]
    }
  }
};
