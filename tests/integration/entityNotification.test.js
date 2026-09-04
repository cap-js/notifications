const cds = require("@sap/cds")
const { join } = require("path")

const { GET } = cds.test(join(__dirname, "../bookshop"))

describe("Entity @notifications", () => {
  let alert

  beforeAll(async () => {
    alert = await cds.connect.to("notifications")
  })

  describe("Startup", () => {
    test("MY_NOTIFICATION_TYPE is registered in cds.notifications.local.types", () => {
      expect(cds.notifications?.local?.types).toBeDefined()
      expect(cds.notifications.local.types).toHaveProperty("bookshop/MY_NOTIFICATION_TYPE")
    })

    test("MY_NOTIFICATION_TYPE template fields are set to the type key", () => {
      const type = cds.notifications.local.types["bookshop/MY_NOTIFICATION_TYPE"]["1"]
      expect(type.Templates[0].TemplateSensitive).toBe("MY_NOTIFICATION_TYPE")
      expect(type.Templates[0].TemplatePublic).toBe("MY_NOTIFICATION_TYPE")
      expect(type.Templates[0].TemplateGrouped).toBe("MY_NOTIFICATION_TYPE")
    })
  })

  describe("READ event", () => {
    test("Reading the matching book fires a notification", async () => {
      const captured = []
      const handler = msg => captured.push(msg.data)
      alert.before("*", handler)

      try {
        await GET("/odata/v4/catalog-test/Books(201)")
        expect(captured.length).toBeGreaterThan(0)
        expect(captured[0].NotificationTypeKey).toContain("MY_NOTIFICATION_TYPE")
      } finally {
        alert._handlers.before.splice(alert._handlers.before.indexOf(handler), 1)
      }
    })

    test("Reading a non-matching book does NOT fire a notification", async () => {
      const captured = []
      const handler = msg => captured.push(msg.data)
      alert.before("*", handler)

      try {
        await GET("/odata/v4/catalog-test/Books(251)")
        expect(captured).toHaveLength(0)
      } finally {
        alert._handlers.before.splice(alert._handlers.before.indexOf(handler), 1)
      }
    })

    test("Notification for matching READ has Priority LOW", async () => {
      const captured = []
      const handler = msg => captured.push(msg.data)
      alert.before("*", handler)

      try {
        await GET("/odata/v4/catalog-test/Books(201)")
        expect(captured[0]?.Priority).toBe("LOW")
      } finally {
        alert._handlers.before.splice(alert._handlers.before.indexOf(handler), 1)
      }
    })

    test("Notification for matching READ has Properties from entity data", async () => {
      const captured = []
      const handler = msg => captured.push(msg.data)
      alert.before("*", handler)

      try {
        await GET("/odata/v4/catalog-test/Books(201)")
        const props = captured[0]?.Properties ?? []
        const titleProp = props.find(p => p.Key === "title")
        expect(titleProp?.Value).toBe("Wuthering Heights")
      } finally {
        alert._handlers.before.splice(alert._handlers.before.indexOf(handler), 1)
      }
    })

    test("Collection READ only fires notifications for entities matching the where clause", async () => {
      const captured = []
      const handler = msg => captured.push(msg.data)
      alert.before("*", handler)

      try {
        await GET("/odata/v4/catalog-test/Books")
        const titles = captured.map(n => n.Properties?.find(p => p.Key === "title")?.Value)
        expect(titles).toContain("Wuthering Heights")
        expect(titles).not.toContain("The Raven")
        expect(titles).not.toContain("Eleonora")
        expect(titles).not.toContain("Catweazle")
      } finally {
        alert._handlers.before.splice(alert._handlers.before.indexOf(handler), 1)
      }
    })
  })

  describe("READ event with explicit parameters", () => {
    test("Notification Properties contains only the explicitly specified parameters", async () => {
      const captured = []
      const handler = msg => captured.push(msg.data)
      alert.before("*", handler)

      try {
        await GET("/odata/v4/catalog-test/Books(207)")
        const props = captured[0]?.Properties ?? []
        expect(props.map(p => p.Key)).toEqual(["bookTitle", "bookId"])
      } finally {
        alert._handlers.before.splice(alert._handlers.before.indexOf(handler), 1)
      }
    })

    test("Notification Properties values are resolved from entity data", async () => {
      const captured = []
      const handler = msg => captured.push(msg.data)
      alert.before("*", handler)

      try {
        await GET("/odata/v4/catalog-test/Books(207)")
        const props = captured[0]?.Properties ?? []
        expect(props.find(p => p.Key === "bookTitle")?.Value).toBe("Jane Eyre")
        expect(props.find(p => p.Key === "bookId")?.Value).toBe("207")
      } finally {
        alert._handlers.before.splice(alert._handlers.before.indexOf(handler), 1)
      }
    })
  })
})
