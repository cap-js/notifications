const {getNotificationDestination, buildNotification, executeRequest} = require("./../../lib/utils");
const {buildHeadersForDestination} = require("@sap-cloud-sdk/connectivity");
const {postNotification} = require("./../../lib/notifications");

jest.mock("./../../lib/utils");
jest.mock("@sap-cloud-sdk/connectivity");

const expectedDefaultNotificationWithoutDescription = {
    NotificationTypeKey: "Default",
    NotificationTypeVersion: "1",
    Priority: "HIGH", 
    Properties: [
      {
        Key:"title",
        IsSensitive:false,
        Language :"en",
        Value :"Some Test Title",
        Type :"String"
      },
      {
        Key:"description",
        IsSensitive:false,
        Language :"en",
        Value :"",
        Type :"String"
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
    Priority: "HIGH", 
    Properties: [
        {
            Key:"title",
            IsSensitive:false,
            Language :"en",
            Value :"Some Test Title",
            Type :"String"
        },
        {
            Key:"description",
            IsSensitive:false,
            Language :"en",
            Value :"Some Test Description",
            Type :"String"
        }
    ],
    Recipients: [
        {
            RecipientId: "test.mail@mail.com"
        }
    ]
};

describe ("Test post notification", () => {
    test("When passed arguments are incorrect to postNotification", () => {
        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        buildNotification.mockReturnValue(undefined);

        expect(postNotification({})).toMatchObject({});
    })

    test("When passed whole notification object to postNotification", () => {
        const expectedCustomNotification = {
            NotificationTypeKey: "Custom",
            NotificationTypeVersion: "1",
            Priority: "HIGH", 
            Properties: [
                {
                    Key:"title",
                    IsSensitive:false,
                    Language :"en",
                    Value :"Some Text Title",
                    Type :"String"
                },
                {
                    Key:"description",
                    IsSensitive:false,
                    Language :"en",
                    Value :"Some Text Description",
                    Type :"String"
                }
            ],
            Recipients: [
                {
                    RecipientId: "test.mail@mail.com"
                }
            ]
        };

        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        buildNotification.mockReturnValue(expectedCustomNotification);
        executeRequest.mockReturnValue(Promise.resolve(expectedCustomNotification));

        expect(postNotification(expectedCustomNotification)).toMatchObject(Promise.resolve(expectedCustomNotification));
    })

    test("When passed recipients, priority, title to postNotification", () => {
        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        buildNotification.mockReturnValue(expectedDefaultNotificationWithoutDescription);
        executeRequest.mockReturnValue(Promise.resolve(expectedDefaultNotificationWithoutDescription));

        expect(postNotification( 
            {
                recipients: ["test.mail@mail.com"],
                title: "Some Test Title",
                priority: "HIGH"
            })
            ).toMatchObject(Promise.resolve(expectedDefaultNotificationWithoutDescription));
    })

    test("When passed recipients, priority, title, description to postNotification", () => {
        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        buildNotification.mockReturnValue(expectedDefaultNotificationWithoutDescription);
        executeRequest.mockReturnValue(Promise.resolve(expectedDefaultNotificationWithoutDescription));

        expect(postNotification( 
            {
                recipients: ["test.mail@mail.com"],
                title: "Some Test Title",
                priority: "HIGH",
                description: "Some Test Description"
            })
            ).toMatchObject(Promise.resolve(expectedDefaultNotificationWithDescription));
    })

    test("When passed recipients, priority, title, description to postNotification", () => {
        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        buildNotification.mockReturnValue(expectedDefaultNotificationWithoutDescription);
        executeRequest.mockReturnValue(Promise.resolve(expectedDefaultNotificationWithoutDescription));

        expect(postNotification( 
            {
                recipients: ["test.mail@mail.com"],
                title: "Some Test Title",
                priority: "HIGH",
                description: "Some Test Description"
            })
            ).toMatchObject(Promise.resolve(expectedDefaultNotificationWithDescription));
    })

    test("When passed recipients, priority, title, description to postNotification", () => {
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
                    Key:"title",
                    IsSensitive:false,
                    Language :"en",
                    Value :"Some Test Title",
                    Type :"String"
                }
            ],
            Recipients: [
                {
                    RecipientId: "test.mail@mail.com"
                }
            ],
            TargetParameters: [
                {
                   "Key": "string",
                   "Value": "string"
                }
             ]
        };
        
        getNotificationDestination.mockReturnValue(undefined);
        buildHeadersForDestination.mockReturnValue(undefined);
        buildNotification.mockReturnValue(expectedNotification);
        executeRequest.mockReturnValue(Promise.resolve(expectedNotification));

        expect(postNotification( 
            {
                recipients: ["test.mail@mail.com"],
                type: "TestNotificationType",
                properties: [{
                    Key:"title",
                    IsSensitive:false,
                    Language :"en",
                    Value :"Some Test Title",
                    Type :"String"
                }],
                navigation: {
                    NavigationTargetAction: "TestTargetAction",
                    NavigationTargetObject: "TestTargetObject"
                },
                priority: "HIGH",
                payload: {
                    NotificationTypeId: "01234567-89ab-cdef-0123-456789abcdef",
                    ProviderId: "SAMPLEPROVIDER",
                    ActorId: "BACKENDACTORID",
                    ActorDisplayText: "ActorName",
                    ActorImageURL: "https://some-url",
                    NotificationTypeTimestamp: "2022-03-15T09:58:42.807Z",
                    TargetParameters: [
                        {
                           "Key": "string",
                           "Value": "string"
                        }
                     ]
                }
            })
            ).toMatchObject(Promise.resolve(expectedNotification));
    })
})
