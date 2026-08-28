const cds = require("@sap/cds")
const { buildNotificationFromEntity, resolveRecipients, resolveWhereXpr } = require("../../../lib/utils")
const { notificationTypesFromModel } = require("../../../lib/compile")

function makeModel(defs) {
  const definitions = { ...defs }
  definitions[Symbol.iterator] = function* () {
    yield* Object.values(this)
  }
  return { definitions }
}

describe("resolveWhereXpr", () => {
  test("Returns xpr array when where has xpr property", () => {
    const where = { xpr: [{ ref: ["title"] }, "=", { val: "Wuthering Heights" }] }
    expect(resolveWhereXpr(where)).toBe(where.xpr)
  })

  test("Returns where directly when it is a plain array", () => {
    const where = [{ ref: ["title"] }, "=", { val: "Wuthering Heights" }]
    expect(resolveWhereXpr(where)).toBe(where)
  })

  test("Returns null when where has no xpr and is not an array", () => {
    expect(resolveWhereXpr({ someOtherShape: true })).toBeNull()
  })

  test("Returns null for null/undefined", () => {
    expect(resolveWhereXpr(null)).toBeNull()
    expect(resolveWhereXpr(undefined)).toBeNull()
  })
})

describe("resolveRecipients", () => {
  test("Returns empty array for null", () => {
    expect(resolveRecipients(null, {})).toEqual([])
  })

  test("Returns empty array for undefined", () => {
    expect(resolveRecipients(undefined, {})).toEqual([])
  })

  test("Resolves $self.field ref from a single data object", () => {
    const recipients = { ref: ["$self", "createdBy"] }
    expect(resolveRecipients(recipients, { createdBy: "alice@example.com" })).toEqual(["alice@example.com"])
  })

  test("Resolves plain field ref from a single data object", () => {
    const recipients = { ref: ["createdBy"] }
    expect(resolveRecipients(recipients, { createdBy: "alice@example.com" })).toEqual(["alice@example.com"])
  })

  test("Resolves recipients across an array of rows and deduplicates", () => {
    const recipients = { ref: ["$self", "createdBy"] }
    const data = [
      { createdBy: "alice@example.com" },
      { createdBy: "bob@example.com" },
      { createdBy: "alice@example.com" }
    ]
    expect(resolveRecipients(recipients, data)).toEqual(["alice@example.com", "bob@example.com"])
  })

  test("Filters out falsy values from data rows", () => {
    const recipients = { ref: ["$self", "createdBy"] }
    const data = [{ createdBy: "alice@example.com" }, { createdBy: null }, { createdBy: undefined }]
    expect(resolveRecipients(recipients, data)).toEqual(["alice@example.com"])
  })

  test("Returns string literal as a single-element array", () => {
    expect(resolveRecipients("static@example.com", {})).toEqual(["static@example.com"])
  })

  test("Recurses over object without .ref (e.g. CDS object-like annotation)", () => {
    const recipients = { 0: { ref: ["createdBy"] }, 1: { ref: ["modifiedBy"] } }
    const data = { createdBy: "alice@example.com", modifiedBy: "bob@example.com" }
    const result = resolveRecipients(recipients, data)
    expect(result).toContain("alice@example.com")
    expect(result).toContain("bob@example.com")
  })
})

describe("buildNotificationFromEntity", () => {
  const baseHook = {
    type: "MY_NOTIFICATION_TYPE",
    on: ["READ", "CREATE"],
    recipients: { ref: ["$self", "createdBy"] }
  }

  const baseData = {
    ID: "201",
    title: "Wuthering Heights",
    createdBy: "alice@example.com"
  }

  test("Sets NotificationTypeKey to hook.type (no prefix applied)", async () => {
    const result = await buildNotificationFromEntity(baseHook, baseData)
    expect(result.NotificationTypeKey).toBe("MY_NOTIFICATION_TYPE")
  })

  test("Sets NotificationTypeVersion to '1'", async () => {
    const result = await buildNotificationFromEntity(baseHook, baseData)
    expect(result.NotificationTypeVersion).toBe("1")
  })

  test("Auto-maps all entity data fields to Properties when hook.parameters is not set", async () => {
    const result = await buildNotificationFromEntity(baseHook, baseData)
    const keys = result.Properties.map(p => p.Key)
    expect(keys).toContain("ID")
    expect(keys).toContain("title")
    expect(keys).toContain("createdBy")
  })

  test("Properties entries have correct shape with IsSensitive true", async () => {
    const result = await buildNotificationFromEntity(baseHook, baseData)
    expect(result.Properties).toContainEqual({
      Key: "title",
      Language: "en",
      Value: "Wuthering Heights",
      Type: "String",
      IsSensitive: true
    })
  })

  test("Converts null/undefined property values to empty string", async () => {
    const data = { title: null, stock: undefined }
    const result = await buildNotificationFromEntity(baseHook, data)
    const titleProp = result.Properties.find(p => p.Key === "title")
    expect(titleProp.Value).toBe("")
  })

  test("Uses explicit hook.parameters when provided, mapped by ref", async () => {
    const hook = {
      ...baseHook,
      parameters: {
        bookTitle: { ref: ["title"] }
      }
    }
    const result = await buildNotificationFromEntity(hook, baseData)
    expect(result.Properties).toHaveLength(1)
    expect(result.Properties[0]).toMatchObject({ Key: "bookTitle", Value: "Wuthering Heights" })
  })

  test("hook.parameters strips $self prefix from refs", async () => {
    const hook = {
      ...baseHook,
      parameters: {
        bookTitle: { ref: ["$self", "title"] }
      }
    }
    const result = await buildNotificationFromEntity(hook, baseData)
    expect(result.Properties[0]).toMatchObject({ Key: "bookTitle", Value: "Wuthering Heights" })
  })

  test("hook.parameters resolves CDS '=' path expression format ({ '=': '$self.title' })", async () => {
    const hook = {
      ...baseHook,
      parameters: {
        bookTitle: { "=": "$self.title" },
        bookId: { "=": "$self.ID" }
      }
    }
    const result = await buildNotificationFromEntity(hook, baseData)
    expect(result.Properties.find(p => p.Key === "bookTitle")?.Value).toBe("Wuthering Heights")
    expect(result.Properties.find(p => p.Key === "bookId")?.Value).toBe("201")
  })

  test("hook.parameters with array data uses first element instead of crashing", async () => {
    const hook = {
      ...baseHook,
      parameters: { bookTitle: { ref: ["title"] } }
    }
    const data = [{ title: "Wuthering Heights", createdBy: "alice@example.com" }]
    const result = await buildNotificationFromEntity(hook, data)
    expect(result.Properties[0]).toMatchObject({ Key: "bookTitle", Value: "Wuthering Heights" })
  })

  test("hook.parameters with a plain literal value (no ref) uses val instead of crashing", async () => {
    const hook = {
      ...baseHook,
      parameters: { staticKey: { val: "hardcoded" } }
    }
    const result = await buildNotificationFromEntity(hook, baseData)
    expect(result.Properties[0]).toMatchObject({ Key: "staticKey", Value: "hardcoded" })
  })

  test("Defaults Priority to NEUTRAL when hook has no priority", async () => {
    const result = await buildNotificationFromEntity(baseHook, baseData)
    expect(result.Priority).toBe("NEUTRAL")
  })

  test("Resolves enum priority annotation (#Low -> LOW)", async () => {
    const hook = { ...baseHook, priority: { "#": "Low" } }
    const result = await buildNotificationFromEntity(hook, baseData)
    expect(result.Priority).toBe("LOW")
  })

  test("Resolves enum priority annotation (#High -> HIGH)", async () => {
    const hook = { ...baseHook, priority: { "#": "High" } }
    const result = await buildNotificationFromEntity(hook, baseData)
    expect(result.Priority).toBe("HIGH")
  })

  describe("Falls back to NEUTRAL for invalid priority", () => {
    const log = cds.test.log()
    beforeEach(() => log.clear())

    test("warns and returns NEUTRAL", async () => {
      const hook = { ...baseHook, priority: { "#": "CRITICAL" } }
      const result = await buildNotificationFromEntity(hook, baseData)
      expect(result.Priority).toBe("NEUTRAL")
      expect(log.output).toMatch(/invalid|CRITICAL/i)
    })
  })

  test("Resolves recipients from $self.field ref in data", async () => {
    const result = await buildNotificationFromEntity(baseHook, baseData)
    expect(result.Recipients).toContainEqual({ RecipientId: "alice@example.com" })
  })

  test("Returns empty Recipients array when hook.recipients is not set", async () => {
    const hook = { type: "MY_NOTIFICATION_TYPE", on: ["READ"] }
    const result = await buildNotificationFromEntity(hook, baseData)
    expect(result.Recipients).toEqual([])
  })

  test("Works with array data (multiple result rows)", async () => {
    const data = [
      { title: "Book A", createdBy: "alice@example.com" },
      { title: "Book B", createdBy: "bob@example.com" }
    ]
    const result = await buildNotificationFromEntity(baseHook, data)
    const recipientIds = result.Recipients.map(r => r.RecipientId)
    expect(recipientIds).toContain("alice@example.com")
    expect(recipientIds).toContain("bob@example.com")
  })
})

describe("notificationTypesFromModel — entity @notifications", () => {
  test("Generates a type with TemplateSensitive/Public/Grouped set to entry.type", () => {
    const model = makeModel({
      MyEntity: {
        kind: "entity",
        name: "MyEntity",
        "@notifications": [{ type: "MY_TYPE", on: ["READ"] }]
      }
    })
    const types = notificationTypesFromModel(model)
    const type = types.find(t => t.NotificationTypeKey === "MY_TYPE")
    expect(type).toBeDefined()
    expect(type.NotificationTypeVersion).toBe("1")
    expect(type.Templates[0].TemplateSensitive).toBe("MY_TYPE")
    expect(type.Templates[0].TemplatePublic).toBe("MY_TYPE")
    expect(type.Templates[0].TemplateGrouped).toBe("MY_TYPE")
  })

  test("Skips @notifications entries that have no type field", () => {
    const model = makeModel({
      MyEntity: {
        kind: "entity",
        name: "MyEntity",
        "@notifications": [{ on: ["READ"] }]
      }
    })
    const types = notificationTypesFromModel(model)
    expect(types).toHaveLength(0)
  })

  test("Does not generate entity type when @notifications is empty", () => {
    const model = makeModel({
      MyEntity: {
        kind: "entity",
        name: "MyEntity",
        "@notifications": []
      }
    })
    const types = notificationTypesFromModel(model)
    expect(types).toHaveLength(0)
  })

  test("Does not add a duplicate when an event with the same type key already exists", () => {
    const model = makeModel({
      "Svc.MY_TYPE": {
        kind: "event",
        name: "Svc.MY_TYPE",
        "@notification.title": "My Type Title"
      },
      MyEntity: {
        kind: "entity",
        name: "MyEntity",
        "@notifications": [{ type: "MY_TYPE", on: ["READ"] }]
      }
    })
    const types = notificationTypesFromModel(model)
    const matching = types.filter(t => t.NotificationTypeKey === "MY_TYPE")
    expect(matching).toHaveLength(1)
    // The event-derived entry should win (it has a real title)
    expect(matching[0].Templates[0].TemplateSensitive).toBe("My Type Title")
  })

  test("Handles multiple @notifications entries on the same entity", () => {
    const model = makeModel({
      MyEntity: {
        kind: "entity",
        name: "MyEntity",
        "@notifications": [
          { type: "TYPE_A", on: ["READ"] },
          { type: "TYPE_B", on: ["CREATE"] }
        ]
      }
    })
    const types = notificationTypesFromModel(model)
    const keys = types.map(t => t.NotificationTypeKey)
    expect(keys).toContain("TYPE_A")
    expect(keys).toContain("TYPE_B")
  })
})
