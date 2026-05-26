const cds = require("@sap/cds")
const { buildNotification, validateNotificationTypes, readFile, getNotificationDestination } = require("../../../lib/utils")
const { existsSync, readFileSync } = require("fs")
const { getDestination } = require("@sap-cloud-sdk/connectivity")

jest.mock("fs")
jest.mock("@sap-cloud-sdk/connectivity")

describe("Test utils", () => {

  describe("Build notifications", () => {
    describe("Default notifications", () => {
      const expectedWithoutDescription = {
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
        Recipients: [{ RecipientId: "test.mail@mail.com" }]
      }

      const expectedWithDescription = {
        ...expectedWithoutDescription,
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
        ]
      }

      test("Build a default notification with priority", () => {
        expect(
          buildNotification({
            recipients: ["test.mail@mail.com"],
            title: "Some Test Title",
            priority: "NEUTRAL"
          })
        ).toMatchObject(expectedWithoutDescription)
      })

      test("Build a default notification without priority", () => {
        expect(
          buildNotification({
            recipients: ["test.mail@mail.com"],
            title: "Some Test Title"
          })
        ).toMatchObject(expectedWithoutDescription)
      })

      test("Build a default notification with description and priority", () => {
        expect(
          buildNotification({
            recipients: ["test.mail@mail.com"],
            title: "Some Test Title",
            priority: "NEUTRAL",
            description: "Some Test Description"
          })
        ).toMatchObject(expectedWithDescription)
      })

      test("Build a default notification with description", () => {
        expect(
          buildNotification({
            recipients: ["test.mail@mail.com"],
            title: "Some Test Title",
            description: "Some Test Description"
          })
        ).toMatchObject(expectedWithDescription)
      })
    })

    describe("Custom notifications", () => {
      const properties = [{
        Key: "title",
        IsSensitive: false,
        Language: "en",
        Value: "Some Test Title",
        Type: "String"
      }]

      const baseInput = {
        recipients: ["test.mail@mail.com"],
        type: "TestNotificationType",
        Properties: properties
      }

      const baseExpected = {
        NotificationTypeKey: "notifications/TestNotificationType",
        NotificationTypeVersion: "1",
        Priority: "NEUTRAL",
        Properties: properties,
        Recipients: [{ RecipientId: "test.mail@mail.com" }]
      }

      test("Build a custom notification with properties", () => {
        expect(buildNotification(baseInput)).toMatchObject(baseExpected)
      })

      test("Build a custom notification with navigation targets", () => {
        expect(buildNotification({ 
          ...baseInput, 
          NavigationTargetAction: "TestTargetAction", 
          NavigationTargetObject: "TestTargetObject" 
        })).toMatchObject({ 
          ...baseExpected, 
          NavigationTargetAction: "TestTargetAction", 
          NavigationTargetObject: "TestTargetObject" 
        })
      })

      test("Build a custom notification with a non-default priority", () => {
        expect(buildNotification({ 
          ...baseInput, 
          priority: "HIGH" 
        })).toMatchObject({ 
          ...baseExpected, 
          Priority: "HIGH" 
        })
      })

      test("Build a custom notification with a non-default priority and navigation targets", () => {
        expect(
          buildNotification({
            ...baseInput,
            NavigationTargetAction: "TestTargetAction",
            NavigationTargetObject: "TestTargetObject",
            priority: "HIGH"
          })
        ).toMatchObject({
          ...baseExpected, 
          NavigationTargetAction: "TestTargetAction",
          NavigationTargetObject: "TestTargetObject",
          Priority: "HIGH"
        })
      })

      test("Maps data object to Properties array", () => {
        expect(
          buildNotification({
            recipients: ["test.mail@mail.com"],
            type: "TestNotificationType",
            data: { title: "Some Test Title" }
          })
        ).toMatchObject({
          ...baseExpected,
          Properties: [{ 
            Key: "title", 
            Value: "Some Test Title", 
            Language: "en", 
            Type: "string" 
          }]
        })
      })

      test("Pass all low-level API fields through to the notification", () => {
        const lowLevelFields = {
          OriginId: "01234567-89ab-cdef-0123-456789abcdef",
          NotificationTypeId: "01234567-89ab-cdef-0123-456789abcdef",
          NavigationTargetAction: "TestTargetAction",
          NavigationTargetObject: "TestTargetObject",
          ProviderId: "SAMPLEPROVIDER",
          ActorId: "BACKENDACTORID",
          ActorDisplayText: "ActorName",
          ActorImageURL: "https://some-url",
          NotificationTypeTimestamp: "2022-03-15T09:58:42.807Z",
          TargetParameters: [{ Key: "string", Value: "string" }]
        }

        expect(buildNotification({
            ...baseInput,
            ...lowLevelFields, 
            priority: "HIGH"
        })).toMatchObject({
          ...baseExpected,
          ...lowLevelFields,
          Priority: "HIGH"
        })
      })

      test("Pass partial low-level API fields through to the notification", () => {
        const partialLowLevelFields = {
          NotificationTypeId: "01234567-89ab-cdef-0123-456789abcdef",
          NavigationTargetAction: "TestTargetAction",
          NavigationTargetObject: "TestTargetObject",
          ProviderId: "SAMPLEPROVIDER",
          ActorId: "BACKENDACTORID",
          ActorDisplayText: "ActorName",
          ActorImageURL: "https://some-url",
          NotificationTypeTimestamp: "2022-03-15T09:58:42.807Z",
          TargetParameters: [{ Key: "string", Value: "string" }]
        }

        expect(
          buildNotification({
            ...baseInput,
            ...partialLowLevelFields,
            priority: "HIGH"
          })
        ).toMatchObject({
          ...baseExpected,
          ...partialLowLevelFields,
          Priority: "HIGH"
        })
      })
    })

    describe("Invalid inputs", () => {
      test("Return falsy when an empty object is passed", () => {
        expect(buildNotification({})).toBeFalsy()
      })

      describe("Default notification", () => {
        test("Return falsy when title is missing", () => {
          expect(
            buildNotification({
              recipients: ["test.mail@mail.com"],
              priority: "NEUTRAL"
            })
          ).toBeFalsy()
        })

        test("Return falsy when recipients is empty", () => {
          expect(
            buildNotification({
              recipients: [],
              title: "Some Test Title",
              priority: "NEUTRAL"
            })
          ).toBeFalsy()
        })

        test("Return falsy when recipients is not an array", () => {
          expect(
            buildNotification({
              recipients: "invalid",
              title: "Some Test Title",
              priority: "NEUTRAL"
            })
          ).toBeFalsy()
        })

        test("Return falsy when priority is not a valid value", () => {
          expect(
            buildNotification({
              recipients: ["test.mail@mail.com"],
              title: "Some Test Title",
              priority: "INVALID"
            })
          ).toBeFalsy()
        })

        test("Return falsy when description is not a string", () => {
          expect(
            buildNotification({
              recipients: ["test.mail@mail.com"],
              title: "Some Test Title",
              priority: "NEUTRAL",
              description: { invalid: "invalid" }
            })
          ).toBeFalsy()
        })

        test("Return falsy when title is not a string", () => {
          expect(
            buildNotification({
              recipients: ["test.mail@mail.com"],
              title: { invalid: "invalid" },
              priority: "NEUTRAL"
            })
          ).toBeFalsy()
        })
      })

      describe("Custom notification", () => {
        test("Return falsy when recipients is missing", () => {
          expect(
            buildNotification({
              type: "TestNotificationType"
            })
          ).toBeFalsy()
        })

        test("Return falsy when recipients is empty", () => {
          expect(
            buildNotification({
              recipients: [],
              type: "TestNotificationType"
            })
          ).toBeFalsy()
        })

        test("Return falsy when recipients is not an array", () => {
          expect(
            buildNotification({
              recipients: "invalid",
              type: "TestNotificationType"
            })
          ).toBeFalsy()
        })

        test("Return falsy when priority is not a valid value", () => {
          expect(
            buildNotification({
              recipients: ["test.mail@mail.com"],
              type: "TestNotificationType",
              priority: "invalid"
            })
          ).toBeFalsy()
        })

        test("Return falsy when properties is not an array", () => {
          expect(
            buildNotification({
              recipients: ["test.mail@mail.com"],
              type: "TestNotificationType",
              priority: "NEUTRAL",
              properties: "invalid"
            })
          ).toBeFalsy()
        })

        test("Return falsy when navigation is not an object", () => {
          expect(
            buildNotification({
              recipients: ["test.mail@mail.com"],
              type: "TestNotificationType",
              priority: "NEUTRAL",
              navigation: "invalid"
            })
          ).toBeFalsy()
        })

        test("Return falsy when payload is not an object", () => {
          expect(
            buildNotification({
              recipients: ["test.mail@mail.com"],
              type: "TestNotificationType",
              priority: "NEUTRAL",
              payload: "invalid"
            })
          ).toBeFalsy()
        })
      })
    })

    test("Pass a raw notification object through with the prefix applied to the type key", () => {
      const rawNotification = {
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
        Recipients: [{ RecipientId: "test.mail@mail.com" }]
      }

      expect(
        buildNotification({ ...rawNotification }))
        .toMatchObject({
        ...rawNotification,
        NotificationTypeKey: "notifications/TestNotificationType"
      })
    })
  })

  describe("Notification types validation", () => {
    test("Return false when an entry is missing NotificationTypeKey", () => {
      expect(validateNotificationTypes([{ NotificationTypeKey: "Test" }, { blabla: "Test2" }])).toEqual(false)
    })

    test("Return true for an empty array", () => {
      expect(validateNotificationTypes([])).toBe(true)
    })

    test("Return true when all entries have NotificationTypeKey", () => {
      expect(validateNotificationTypes([{ NotificationTypeKey: "Test" }, { NotificationTypeKey: "Test2" }])).toEqual(true)
    })
  })

  describe("Read file", () => {
    test("Return an empty array when the file does not exist", () => {
      existsSync.mockReturnValue(false)
      expect(readFile("test.json")).toMatchObject([])
    })

    test("Return the parsed file contents when the file exists", () => {
      existsSync.mockReturnValue(true)
      readFileSync.mockReturnValue('[{ "test": "test" }]')
      expect(readFile("test.json")).toMatchObject([{ test: "test" }])
    })
  })

  describe("Get notification destination", () => {
    test("Return the destination when it exists", async () => {
      getDestination.mockReturnValue({ "mock-destination": "mock-destination" })
      expect(await getNotificationDestination()).toMatchObject({ "mock-destination": "mock-destination" })
    })

    test("Throw an error when the destination is not found", async () => {
      getDestination.mockReturnValue(undefined)
      await expect(() => getNotificationDestination()).rejects.toThrow("Failed to get destination: SAP_Notifications")
    })
  })

  describe("Configuration", () => {
    test("Use GlobalUserId as the recipient key when authenticationIdentifier is set to UserUUID", () => {
      cds.env.requires.notifications ??= {}
      cds.env.requires.notifications.authenticationIdentifier = "UserUUID"

      const result = buildNotification({
        recipients: ["user-uuid-123"],
        title: "Test Title"
      })

      delete cds.env.requires.notifications.authenticationIdentifier
      expect(result.Recipients[0]).toMatchObject({ GlobalUserId: "user-uuid-123" })
    })

    test("Fall back to basename of cds.root as prefix when package.json cannot be read", () => {
      let result
      jest.isolateModules(() => {
        const cds = require("@sap/cds")
        const originalRoot = cds.root
        cds.env.requires.notifications ??= {}
        cds.env.requires.notifications.prefix = "$app-name"
        cds.root = "/nonexistent-path-for-testing"
        try {
          const { getNotificationTypesKeyWithPrefix } = require("../../../lib/utils")
          result = getNotificationTypesKeyWithPrefix("TestType")
        } finally {
          cds.root = originalRoot
          delete cds.env.requires.notifications.prefix
        }
      })
      expect(result).toBe("nonexistent-path-for-testing/TestType")
    })
  })
})
