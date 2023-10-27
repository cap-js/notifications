const { buildNotification, validateNotificationTypes, readFile, getNotificationDestination } = require("../../lib/utils");
const { existsSync, readFileSync } = require("fs");
const { getDestination } = require("@sap-cloud-sdk/connectivity");

jest.mock("fs");
jest.mock("@sap-cloud-sdk/connectivity");

const expectedDefaultNotificationWithoutDescription = {
  NotificationTypeKey: "Default",
  NotificationTypeVersion: "1",
  Priority: "NEUTRAL",
  Properties: [
    {
      Key: "title",
      IsSensitive: false,
      Language: "en",
      Value: "Some Test Title",
      Type: "String"
    },
    {
      Key: "description",
      IsSensitive: false,
      Language: "en",
      Value: "",
      Type: "String"
    }
  ],
  Recipients: [
    {
      RecipientId: "test.mail@mail.com"
    }
  ]
};

const expectedDefaultNotificationWithDescription = {
  NotificationTypeKey: "Default",
  NotificationTypeVersion: "1",
  Priority: "NEUTRAL",
  Properties: [
    {
      Key: "title",
      IsSensitive: false,
      Language: "en",
      Value: "Some Test Title",
      Type: "String"
    },
    {
      Key: "description",
      IsSensitive: false,
      Language: "en",
      Value: "Some Test Description",
      Type: "String"
    }
  ],
  Recipients: [
    {
      RecipientId: "test.mail@mail.com"
    }
  ]
};

describe("Test utils", () => {
  test("When recipients, priority, title are passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        title: "Some Test Title",
        priority: "NEUTRAL"
      })
    ).toMatchObject(expectedDefaultNotificationWithoutDescription);
  });

  test("When recipients, priority, title, description are passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        title: "Some Test Title",
        priority: "NEUTRAL",
        description: "Some Test Description"
      })
    ).toMatchObject(expectedDefaultNotificationWithDescription);
  });

  test("When recipients, title are passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        title: "Some Test Title"
      })
    ).toMatchObject(expectedDefaultNotificationWithoutDescription);
  });

  test("When recipients, title, description are passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        title: "Some Test Title",
        description: "Some Test Description"
      })
    ).toMatchObject(expectedDefaultNotificationWithDescription);
  });

  test("When recipients, type, properties are passed to buildNotification", () => {
    const expectedNotification = {
      NotificationTypeKey: "notifications/TestNotificationType",
      NotificationTypeVersion: "1",
      Priority: "NEUTRAL",
      Properties: [
        {
          Key: "title",
          IsSensitive: false,
          Language: "en",
          Value: "Some Test Title",
          Type: "String"
        }
      ],
      Recipients: [
        {
          RecipientId: "test.mail@mail.com"
        }
      ]
    };

    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        type: "TestNotificationType",
        Properties: [
          {
            Key: "title",
            IsSensitive: false,
            Language: "en",
            Value: "Some Test Title",
            Type: "String"
          }
        ]
      })
    ).toMatchObject(expectedNotification);
  });

  test("When recipients, type, properties, navigation are passed to buildNotification", () => {
    const expectedNotification = {
      NotificationTypeKey: "notifications/TestNotificationType",
      NotificationTypeVersion: "1",
      NavigationTargetAction: "TestTargetAction",
      NavigationTargetObject: "TestTargetObject",
      Priority: "NEUTRAL",
      Properties: [
        {
          Key: "title",
          IsSensitive: false,
          Language: "en",
          Value: "Some Test Title",
          Type: "String"
        }
      ],
      Recipients: [
        {
          RecipientId: "test.mail@mail.com"
        }
      ]
    };

    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        type: "TestNotificationType",
        Properties: [
          {
            Key: "title",
            IsSensitive: false,
            Language: "en",
            Value: "Some Test Title",
            Type: "String"
          }
        ],
        NavigationTargetAction: "TestTargetAction",
        NavigationTargetObject: "TestTargetObject",
      })
    ).toMatchObject(expectedNotification);
  });

  test("When recipients, type, properties, navigation, priority are passed to buildNotification", () => {
    const expectedNotification = {
      NotificationTypeKey: "notifications/TestNotificationType",
      NotificationTypeVersion: "1",
      NavigationTargetAction: "TestTargetAction",
      NavigationTargetObject: "TestTargetObject",
      Priority: "HIGH",
      Properties: [
        {
          Key: "title",
          IsSensitive: false,
          Language: "en",
          Value: "Some Test Title",
          Type: "String"
        }
      ],
      Recipients: [
        {
          RecipientId: "test.mail@mail.com"
        }
      ]
    };

    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        type: "TestNotificationType",
        Properties: [
          {
            Key: "title",
            IsSensitive: false,
            Language: "en",
            Value: "Some Test Title",
            Type: "String"
          }
        ],
        NavigationTargetAction: "TestTargetAction",
        NavigationTargetObject: "TestTargetObject",
        priority: "HIGH"
      })
    ).toMatchObject(expectedNotification);
  });

  test("When recipients, type, properties, navigation, priority, payload are passed to buildNotification", () => {
    const expectedNotification = {
      OriginId: "01234567-89ab-cdef-0123-456789abcdef",
      NotificationTypeId: "01234567-89ab-cdef-0123-456789abcdef",
      NotificationTypeKey: "notifications/TestNotificationType",
      NotificationTypeVersion: "1",
      NavigationTargetAction: "TestTargetAction",
      NavigationTargetObject: "TestTargetObject",
      Priority: "HIGH",
      ProviderId: "SAMPLEPROVIDER",
      ActorId: "BACKENDACTORID",
      ActorDisplayText: "ActorName",
      ActorImageURL: "https://some-url",
      NotificationTypeTimestamp: "2022-03-15T09:58:42.807Z",
      Properties: [
        {
          Key: "title",
          IsSensitive: false,
          Language: "en",
          Value: "Some Test Title",
          Type: "String"
        }
      ],
      Recipients: [
        {
          RecipientId: "test.mail@mail.com"
        }
      ],
      TargetParameters: [
        {
          Key: "string",
          Value: "string"
        }
      ]
    };

    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        type: "TestNotificationType",
        Properties: [
          {
            Key: "title",
            IsSensitive: false,
            Language: "en",
            Value: "Some Test Title",
            Type: "String"
          }
        ],
        NavigationTargetAction: "TestTargetAction",
        NavigationTargetObject: "TestTargetObject",
        priority: "HIGH",
        OriginId: "01234567-89ab-cdef-0123-456789abcdef",
        NotificationTypeId: "01234567-89ab-cdef-0123-456789abcdef",
        ProviderId: "SAMPLEPROVIDER",
        ActorId: "BACKENDACTORID",
        ActorDisplayText: "ActorName",
        ActorImageURL: "https://some-url",
        NotificationTypeTimestamp: "2022-03-15T09:58:42.807Z",
        TargetParameters: [
          {
            Key: "string",
            Value: "string"
          }
        ]
      })
    ).toMatchObject(expectedNotification);
  });

  test("When recipients, type, properties, navigation, priority, but with not all the payload are passed to buildNotification", () => {
    const expectedNotification = {
      NotificationTypeId: "01234567-89ab-cdef-0123-456789abcdef",
      NotificationTypeKey: "notifications/TestNotificationType",
      NotificationTypeVersion: "1",
      NavigationTargetAction: "TestTargetAction",
      NavigationTargetObject: "TestTargetObject",
      Priority: "HIGH",
      ProviderId: "SAMPLEPROVIDER",
      ActorId: "BACKENDACTORID",
      ActorDisplayText: "ActorName",
      ActorImageURL: "https://some-url",
      NotificationTypeTimestamp: "2022-03-15T09:58:42.807Z",
      Properties: [
        {
          Key: "title",
          IsSensitive: false,
          Language: "en",
          Value: "Some Test Title",
          Type: "String"
        }
      ],
      Recipients: [
        {
          RecipientId: "test.mail@mail.com"
        }
      ],
      TargetParameters: [
        {
          Key: "string",
          Value: "string"
        }
      ]
    };

    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        type: "TestNotificationType",
        Properties: [
          {
            Key: "title",
            IsSensitive: false,
            Language: "en",
            Value: "Some Test Title",
            Type: "String"
          }
        ],
        NavigationTargetAction: "TestTargetAction",
        NavigationTargetObject: "TestTargetObject",
        priority: "HIGH",
        NotificationTypeId: "01234567-89ab-cdef-0123-456789abcdef",
        ProviderId: "SAMPLEPROVIDER",
        ActorId: "BACKENDACTORID",
        ActorDisplayText: "ActorName",
        ActorImageURL: "https://some-url",
        NotificationTypeTimestamp: "2022-03-15T09:58:42.807Z",
        TargetParameters: [
          {
            Key: "string",
            Value: "string"
          }
        ]
      })
    ).toMatchObject(expectedNotification);
  });

  test("When whole notification object is passed to buildNotification", () => {
    const expectedNotification = {
      NotificationTypeKey: "notifications/TestNotificationType",
      NotificationTypeVersion: "1",
      Priority: "NEUTRAL",
      Properties: [
        {
          Key: "title",
          IsSensitive: false,
          Language: "en",
          Value: "Some Test Title",
          Type: "String"
        },
        {
          Key: "description",
          IsSensitive: false,
          Language: "en",
          Value: "Some Test Description",
          Type: "String"
        }
      ],
      Recipients: [
        {
          RecipientId: "test.mail@mail.com"
        }
      ]
    };

    expect(
      buildNotification({
        NotificationTypeKey: "TestNotificationType",
        NotificationTypeVersion: "1",
        Priority: "NEUTRAL",
        Properties: [
          {
            Key: "title",
            IsSensitive: false,
            Language: "en",
            Value: "Some Test Title",
            Type: "String"
          },
          {
            Key: "description",
            IsSensitive: false,
            Language: "en",
            Value: "Some Test Description",
            Type: "String"
          }
        ],
        Recipients: [
          {
            RecipientId: "test.mail@mail.com"
          }
        ]
      })
    ).toMatchObject(expectedNotification);
  });

  test("When empty object is passed to buildNotification", () => {
    expect(buildNotification({})).toBeFalsy();
  });

  test("When not all mandatory parameters for default notification are passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        priority: "NEUTRAL"
      })
    ).toBeFalsy();
  });

  test("When empty recipients array for default notification is passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: [],
        title: "Some Test Title",
        priority: "NEUTRAL"
      })
    ).toBeFalsy();
  });

  test("When string is passed as recipients for default notification is passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: "invalid",
        title: "Some Test Title",
        priority: "NEUTRAL"
      })
    ).toBeFalsy();
  });

  test("When invalid priority for default notification is passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        title: "Some Test Title",
        priority: "INVALID"
      })
    ).toBeFalsy();
  });

  test("When invalid description for default notification is passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        title: "Some Test Title",
        priority: "NEUTRAL",
        description: { invalid: "invalid" }
      })
    ).toBeFalsy();
  });

  test("When invalid title for default notification is passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        title: { invalid: "invalid" },
        priority: "NEUTRAL"
      })
    ).toBeFalsy();
  });

  test("When not all mandatory parameters for custom notification are passed to buildNotification", () => {
    expect(
      buildNotification({
        type: "TestNotificationType"
      })
    ).toBeFalsy();
  });

  test("When empty array of recipients for custom notification is passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: [],
        type: "TestNotificationType"
      })
    ).toBeFalsy();
  });

  test("When invalid recipients for custom notification are passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: "invalid",
        type: "TestNotificationType"
      })
    ).toBeFalsy();
  });

  test("When invalid priority for custom notification is passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        type: "TestNotificationType",
        priority: "invalid"
      })
    ).toBeFalsy();
  });

  test("When invalid properties for custom notification is passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        type: "TestNotificationType",
        priority: "NEUTRAL",
        properties: "invalid"
      })
    ).toBeFalsy();
  });

  test("When invalid navigation for custom notification is passed to buildNotification", () => {
    expect(
      buildNotification({
        recipients: ["test.mail@mail.com"],
        type: "TestNotificationType",
        priority: "NEUTRAL",
        navigation: "invalid"
      })
    ).toBeFalsy();
  });

  test("Given invalid NTypes | When validateNotificationTypes is called | Then false is returned", () => {
    expect(validateNotificationTypes([{ NotificationTypeKey: "Test" }, { blabla: "Test2" }])).toEqual(false);
  });

  test("Given valid NTypes | When validateNotificationTypes is called | Then true is returned", () => {
    expect(validateNotificationTypes([])).toEqual(true);
    expect(validateNotificationTypes([{ NotificationTypeKey: "Test" }, { NotificationTypeKey: "Test2" }])).toEqual(true);
  });

  test("Given that file does not exist | When readFile is called | Then empty array is returned", () => {
    existsSync.mockReturnValue(false);
    expect(readFile("test.json")).toMatchObject([]);
  });

  test("Given that file does exist | When readFile is called | Then correct array is returned", () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('[{ "test": "test" }]');
    expect(readFile("test.json")).toMatchObject([{ test: "test" }]);
  });

  test("Given that destination does exist | When getNotificationDestination is called | Then correct destination is returned", async () => {
    getDestination.mockReturnValue({ "mock-destination": "mock-destination" });
    expect(await getNotificationDestination()).toMatchObject({ "mock-destination": "mock-destination" });
  });

  test("Given that destination does not exist | When getNotificationDestination is called | Then error is thrown", async () => {
    getDestination.mockReturnValue(undefined);
    await expect(() => getNotificationDestination()).rejects.toThrow("Failed to get destination: SAP_Notifications");
  });
});
