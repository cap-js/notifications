const { buildNotification } = require("./../../lib/utils");


const expectedDefaultNotificationWithoutDescription = {
    NotificationTypeKey: "Default",
    NotificationTypeVersion: "1",
    Priority: "NEUTRAL", 
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
    Priority: "NEUTRAL", 
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

describe("Test buildNotification functionality", () => {
    test("When recipients, priority, title are passed to buildNotification", () => {
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                title: "Some Test Title",
                priority: "NEUTRAL"
            }
        ))
        .toMatchObject(expectedDefaultNotificationWithoutDescription);
    })

    test("When recipients, priority, title, description are passed to buildNotification", () => {
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                title: "Some Test Title",
                priority: "NEUTRAL",
                description: "Some Test Description"
            }
        ))
        .toMatchObject(expectedDefaultNotificationWithDescription);
    })

    test("When recipients, title are passed to buildNotification", () => {
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                title: "Some Test Title"
            }
        ))
        .toMatchObject(expectedDefaultNotificationWithoutDescription);
    })

    test("When recipients, title, description are passed to buildNotification", () => {
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                title: "Some Test Title",
                description: "Some Test Description"
            }
        ))
        .toMatchObject(expectedDefaultNotificationWithDescription);
    })

    test("When recipients, type, properties are passed to buildNotification", () => {
        const expectedNotification = {
            NotificationTypeKey: "alert-notification/TestNotificationType",
            NotificationTypeVersion: "1",
            Priority: "NEUTRAL", 
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
            ]
        };

        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                type: "TestNotificationType",
                properties: [{
                    Key:"title",
                    IsSensitive:false,
                    Language :"en",
                    Value :"Some Test Title",
                    Type :"String"
                }]
            }
        ))
        .toMatchObject(expectedNotification);
    })

    test("When recipients, type, properties, navigation are passed to buildNotification", () => {
        const expectedNotification = {
            NotificationTypeKey: "alert-notification/TestNotificationType",
            NotificationTypeVersion: "1",
            NavigationTargetAction: "TestTargetAction",
            NavigationTargetObject: "TestTargetObject",
            Priority: "NEUTRAL", 
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
            ]
        };

        expect(buildNotification(
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
                }
            }
        ))
        .toMatchObject(expectedNotification);
    })

    test("When recipients, type, properties, navigation, priority are passed to buildNotification", () => {
        const expectedNotification = {
            NotificationTypeKey: "alert-notification/TestNotificationType",
            NotificationTypeVersion: "1",
            NavigationTargetAction: "TestTargetAction",
            NavigationTargetObject: "TestTargetObject",
            Priority: "HIGH", 
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
            ]
        };

        expect(buildNotification(
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
                priority: "HIGH"
            }
        ))
        .toMatchObject(expectedNotification);
    })

    test("When recipients, type, properties, navigation, priority, payload are passed to buildNotification", () => {
        const expectedNotification = {
            Id: "01234567-89ab-cdef-0123-456789abcdef",
            OriginId: "01234567-89ab-cdef-0123-456789abcdef",
            NotificationTypeId: "01234567-89ab-cdef-0123-456789abcdef",
            NotificationTypeKey: "alert-notification/TestNotificationType",
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

        expect(buildNotification(
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
                    Id: "01234567-89ab-cdef-0123-456789abcdef",
                    OriginId: "01234567-89ab-cdef-0123-456789abcdef",
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
            }
        ))
        .toMatchObject(expectedNotification);
    })

    test("When recipients, type, properties, navigation, priority, but with not all the payload are passed to buildNotification", () => {
        const expectedNotification = {
            NotificationTypeId: "01234567-89ab-cdef-0123-456789abcdef",
            NotificationTypeKey: "alert-notification/TestNotificationType",
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

        expect(buildNotification(
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
            }
        ))
        .toMatchObject(expectedNotification);
    })

    test("When whole notification object is passed to buildNotification", () => {
        const expectedNotification = {
            NotificationTypeKey: "alert-notification/TestNotificationType",
            NotificationTypeVersion: "1",
            Priority: "NEUTRAL", 
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
        
        expect(buildNotification(
            {
                NotificationTypeKey: "TestNotificationType",
                NotificationTypeVersion: "1",
                Priority: "NEUTRAL", 
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
            }
        ))
        .toMatchObject(expectedNotification);
    })

    test("When empty object is passed to buildNotification", () => {        
        expect(buildNotification({} || undefined)).toBeFalsy();
    })

    test("When not all mandatory parameters for default notification are passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                priority: "NEUTRAL"
            }
            || undefined)).toBeFalsy();
    })

    test("When empty recipients array for default notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: [],
                title: "Some Test Title",
                priority: "NEUTRAL"
            }
            || undefined)).toBeFalsy();
    })

    test("When string is passed as recipients for default notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: "invalid",
                title: "Some Test Title",
                priority: "NEUTRAL"
            }
            || undefined)).toBeFalsy();
    })

    test("When invalid priority for default notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                title: "Some Test Title",
                priority: "INVALID"
            }
            || undefined)).toBeFalsy();
    })

    test("When invalid description for default notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                title: "Some Test Title",
                priority: "NEUTRAL",
                description: {invalid: "invalid"}
            }
            || undefined)).toBeFalsy();
    })

    test("When invalid title for default notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                title: {invalid: "invalid"},
                priority: "NEUTRAL"
            }
            || undefined)).toBeFalsy();
    })

    test("When not all mandatory parameters for custom notification are passed to buildNotification", () => {        
        expect(buildNotification(
            {
                type: "TestNotificationType"
            }
            || undefined)).toBeFalsy();
    })

    test("When empty array of recipients for custom notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: [],
                type: "TestNotificationType"
            }
            || undefined)).toBeFalsy();
    })

    test("When invalid recipients for custom notification are passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: "invalid",
                type: "TestNotificationType"
            }
            || undefined)).toBeFalsy();
    })

    test("When invalid priority for custom notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                type: "TestNotificationType",
                priority: "invalid"
            }
            || undefined)).toBeFalsy();
    })

    test("When invalid properties for custom notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                type: "TestNotificationType",
                priority: "NEUTRAL",
                properties: "invalid"
            }
            || undefined)).toBeFalsy();
    })

    test("When invalid navigation for custom notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                type: "TestNotificationType",
                priority: "NEUTRAL",
                navigation: "invalid"
            }
            || undefined)).toBeFalsy();
    })

    test("When invalid payload for custom notification is passed to buildNotification", () => {        
        expect(buildNotification(
            {
                recipients: ["test.mail@mail.com"],
                type: "TestNotificationType",
                priority: "NEUTRAL",
                payload: "invalid"
            }
            || undefined)).toBeFalsy();
    })
})