const cds = require("@sap/cds")
const { buildNotification, validateNotificationTypes, readFile, getNotificationDestination, buildNotificationFromEvent, mapCdsTypeToANSType } = require("../../../lib/utils")
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

      test("Default notification uses locale from cds.context when set", () => {
        const prev = cds.context
        cds.context = { locale: "de" }
        const result = buildNotification({
          recipients: ["test@mail.com"],
          title: "Hallo"
        })
        cds.context = prev
        expect(result.Properties[0].Language).toBe("de")
        expect(result.Properties[1].Language).toBe("de")
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

      test("Custom notification data mapping uses locale from cds.context when set", () => {
        const prev = cds.context
        cds.context = { locale: "de" }
        const result = buildNotification({
          recipients: ["test@mail.com"],
          type: "TestType",
          data: { title: "Hallo" }
        })
        cds.context = prev
        expect(result.Properties[0].Language).toBe("de")
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

  describe("Build notification from event", () => {
    const baseEventDef = {
      name: 'CatalogService.NewOrder',
      kind: 'event',
      '@notification': true,
      elements: {
        book:      { type: 'cds.String' },
        quantity:  { type: 'cds.Integer' },
        orderedAt: { type: 'cds.Date' },
        ID:        { type: 'cds.UUID', key: true },
        recipients: { items: { type: 'cds.String' } },
      }
    }

    const baseData = {
      book: 'Moby Dick',
      quantity: 2,
      orderedAt: '2024-01-15',
      ID: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      recipients: ['buyer@example.com'],
    }

    test("Sets NotificationTypeKey to the prefixed event name", () => {
      const result = buildNotificationFromEvent(baseEventDef, baseData)
      expect(result.NotificationTypeKey).toBe('notifications/NewOrder')
    })

    test("Sets NotificationTypeVersion to '1'", () => {
      const result = buildNotificationFromEvent(baseEventDef, baseData)
      expect(result.NotificationTypeVersion).toBe('1')
    })

    test("Maps event data fields to Properties with IsSensitive true", () => {
      const result = buildNotificationFromEvent(baseEventDef, baseData)
      expect(result.Properties).toContainEqual({ Key: 'book', Language: 'en', Value: 'Moby Dick', Type: 'String', IsSensitive: true })
    })

    test("Does not include recipients in Properties", () => {
      const result = buildNotificationFromEvent(baseEventDef, baseData)
      expect(result.Properties.map(p => p.Key)).not.toContain('recipients')
    })

    test("Maps key elements to TargetParameters", () => {
      const result = buildNotificationFromEvent(baseEventDef, baseData)
      expect(result.TargetParameters).toEqual([{ Key: 'ID', Value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }])
    })

    test("Omits TargetParameters when no key elements exist", () => {
      const defNoKeys = { ...baseEventDef, elements: { book: { type: 'cds.String' } } }
      const result = buildNotificationFromEvent(defNoKeys, { book: 'Test', recipients: [] })
      expect(result.TargetParameters).toBeUndefined()
    })

    test("Uses RecipientId for email-style recipients", () => {
      const result = buildNotificationFromEvent(baseEventDef, baseData)
      expect(result.Recipients).toEqual([{ RecipientId: 'buyer@example.com' }])
    })

    test("Uses GlobalUserId for GUID recipients", () => {
      const data = { ...baseData, recipients: ['123e4567-e89b-12d3-a456-426614174000'] }
      const result = buildNotificationFromEvent(baseEventDef, data)
      expect(result.Recipients).toEqual([{ GlobalUserId: '123e4567-e89b-12d3-a456-426614174000' }])
    })

    test("Handles mixed GUID and email recipients", () => {
      const data = { ...baseData, recipients: ['123e4567-e89b-12d3-a456-426614174000', 'email@example.com'] }
      const result = buildNotificationFromEvent(baseEventDef, data)
      expect(result.Recipients).toEqual([
        { GlobalUserId: '123e4567-e89b-12d3-a456-426614174000' },
        { RecipientId: 'email@example.com' },
      ])
    })

    test("Defaults Priority to NEUTRAL when annotation is absent", () => {
      const result = buildNotificationFromEvent(baseEventDef, baseData)
      expect(result.Priority).toBe('NEUTRAL')
    })

    test("Resolves enum priority annotation (#High -> HIGH)", () => {
      const def = { ...baseEventDef, '@notification.priority': { '#': 'High' } }
      const result = buildNotificationFromEvent(def, baseData)
      expect(result.Priority).toBe('HIGH')
    })

    test("Accepts plain string priority annotation", () => {
      const def = { ...baseEventDef, '@notification.priority': 'LOW' }
      const result = buildNotificationFromEvent(def, baseData)
      expect(result.Priority).toBe('LOW')
    })

    test("Maps @Common.SemanticObject to NavigationTargetObject", () => {
      const def = { ...baseEventDef, '@Common.SemanticObject': 'Orders' }
      const result = buildNotificationFromEvent(def, baseData)
      expect(result.NavigationTargetObject).toBe('Orders')
    })

    test("Maps @Common.SemanticObjectAction to NavigationTargetAction", () => {
      const def = { ...baseEventDef, '@Common.SemanticObjectAction': 'manage' }
      const result = buildNotificationFromEvent(def, baseData)
      expect(result.NavigationTargetAction).toBe('manage')
    })

    test("Works with empty data and no recipients", () => {
      const result = buildNotificationFromEvent(baseEventDef, {})
      expect(result.Recipients).toEqual([])
      expect(result.Properties).toEqual([])
    })
  })

  describe("mapCdsTypeToANSType", () => {
    test.each([
      ['cds.String',    'String'],
      ['cds.UUID',      'String'],
      ['cds.Boolean',   'String'],
      ['String',        'String'],
    ])("%s -> %s", (cdsType, expected) => {
      expect(mapCdsTypeToANSType(cdsType)).toBe(expected)
    })

    test.each([
      ['cds.Integer',   'Integer'],
      ['cds.Integer64', 'Integer'],
      ['cds.Int16',     'Integer'],
      ['cds.Int32',     'Integer'],
      ['cds.Int64',     'Integer'],
      ['cds.UInt8',     'Integer'],
      ['cds.Decimal',   'String'],
      ['cds.Double',    'String'],
      ['cds.Float',     'String'],
    ])("%s -> %s", (cdsType, expected) => {
      expect(mapCdsTypeToANSType(cdsType)).toBe(expected)
    })

    test.each([
      ['cds.Date',      'Date'],
      ['cds.DateTime',  'Date'],
      ['cds.Timestamp', 'Date'],
      ['cds.Time',      'Date'],
    ])("%s -> %s", (cdsType, expected) => {
      expect(mapCdsTypeToANSType(cdsType)).toBe(expected)
    })

    test("Returns String for undefined type", () => {
      expect(mapCdsTypeToANSType(undefined)).toBe('String')
    })
  })

  describe("Configuration", () => {
    const log = cds.test.log()
    afterEach(() => { delete cds.env.requires.notifications?.authenticationIdentifier })

    it("Use GlobalUserId as the recipient key when authenticationIdentifier is set to UserUUID", () => {
      cds.env.requires.notifications ??= {}
      cds.env.requires.notifications.authenticationIdentifier = "UserUUID"

      const result = buildNotification({
        recipients: ["user-uuid-123"],
        title: "Test Title"
      })

      expect(result.Recipients[0]).toMatchObject({ GlobalUserId: "user-uuid-123" })
    })

    it("Auto mode picks GlobalUserId for UUID recipients", () => {
      cds.env.requires.notifications ??= {}
      cds.env.requires.notifications.authenticationIdentifier = "auto"

      const result = buildNotification({
        recipients: ["550e8400-e29b-41d4-a716-446655440000"],
        title: "Test Title"
      });

      expect(result.Recipients[0]).toMatchObject({ GlobalUserId: "550e8400-e29b-41d4-a716-446655440000" })
    })

    it("Auto mode picks RecipientId for email recipients", () => {
      cds.env.requires.notifications ??= {}
      cds.env.requires.notifications.authenticationIdentifier = "auto"

      const result = buildNotification({
        recipients: ["test.mail@mail.com"],
        title: "Test Title"
      })

      expect(result.Recipients[0]).toMatchObject({ RecipientId: "test.mail@mail.com" })
    })

    it("Auto mode supports mixed UUID and email recipients in one notification", () => {
      cds.env.requires.notifications ??= {}
      cds.env.requires.notifications.authenticationIdentifier = "auto"

      const result = buildNotification({
        recipients: ["550e8400-e29b-41d4-a716-446655440000", "test.mail@mail.com"],
        title: "Test Title"
      })

      expect(result.Recipients).toEqual([
        { GlobalUserId: "550e8400-e29b-41d4-a716-446655440000" },
        { RecipientId: "test.mail@mail.com" }
      ])
    })

    it("Auto mode warns and falls back to RecipientId when value is neither UUID nor email", () => {
      cds.env.requires.notifications ??= {}
      cds.env.requires.notifications.authenticationIdentifier = "auto"
      log.clear()

      const result = buildNotification({
        recipients: ["not-a-uuid-or-email"],
        title: "Test Title"
      })

      expect(result.Recipients[0]).toMatchObject({ RecipientId: "not-a-uuid-or-email" })
      expect(log.output).toContain("neither a UUID nor an email")
    })

    it("Auto is the default when authenticationIdentifier is not configured", () => {
      cds.env.requires.notifications ??= {}
      delete cds.env.requires.notifications.authenticationIdentifier

      const result = buildNotification({
        recipients: ["550e8400-e29b-41d4-a716-446655440000"],
        title: "Test Title"
      })

      expect(result.Recipients[0]).toMatchObject({ GlobalUserId: "550e8400-e29b-41d4-a716-446655440000" })
    })

    it("Explicit RecipientId mode never resolves to GlobalUserId even for UUID values", () => {
      cds.env.requires.notifications ??= {}
      cds.env.requires.notifications.authenticationIdentifier = "RecipientId"

      const result = buildNotification({
        recipients: ["550e8400-e29b-41d4-a716-446655440000"],
        title: "Test Title"
      })

      expect(result.Recipients[0]).toMatchObject({ RecipientId: "550e8400-e29b-41d4-a716-446655440000" })
    })

    it("Fall back to basename of cds.root as prefix when package.json cannot be read", () => {
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
