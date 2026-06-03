const cds = require("@sap/cds")
const { join } = cds.utils.path
const { messages } = require("../../lib/utils")

cds.test(join(__dirname, "../bookshop"))

describe("Notifications Integration", () => {
  let log = cds.test.log()
  let alert

  beforeAll(async () => {
    alert = await cds.connect.to("notifications")
  })

  test("Notifications service resolves to console implementation in development", async () => {
    expect(alert.constructor.name).toBe("NotifyToConsole")
  })

  test("Notification types are loaded into cds.notifications on startup", () => {
    expect(cds.notifications?.local?.types).toBeDefined()
    expect(cds.notifications.local.types).toHaveProperty("bookshop/BookOrderedNotify")
  })

  test("Sending a notification with unknown type key gives a warning", async () => {
    await alert.notify("UnknownType", {
      recipients: ["reader@bookshop.com"],
      data: { title: "test" }
    })

    expect(log.output).toContain("UnknownType is not in the notification types file")
  })

  test("Sending a default notification logs to console", async () => {
    await alert.notify({
      recipients: ["reader@bookshop.com"],
      title: "New book arrived",
      description: "A new book has been added to the catalogue"
    })

    expect(log.output).toContain("Notification:")
    expect(log.output).toContain("NotificationTypeKey: 'Default'")
    expect(log.output).toContain("RecipientId: 'reader@bookshop.com'")
    expect(log.output).toContain("Value: 'New book arrived'")
  })

  test("Sending a notification with no arguments warns and does nothing", async () => {
    await alert.notify()

    expect(log.output).toContain(messages.NO_OBJECT_FOR_NOTIFY)
    expect(log.output).not.toContain("Notification:")
  })

  test("Custom typed notification uses prefixed type key from types file", async () => {
    await alert.notify("BookOrderedNotify", {
      recipients: ["reader@bookshop.com"],
      data: { title: "Moby Dick", buyer: "reader@bookshop.com" }
    })

    expect(log.output).toContain("bookshop/BookOrderedNotify")
    expect(log.output).not.toContain("is not in the notification types file")
  })

  test("Notification types from CDS and JSON are merged", () => {
    expect(cds.notifications.local.types).toHaveProperty("bookshop/BookOrderedNotify")
    expect(cds.notifications.local.types).toHaveProperty("bookshop/BookReturned")
  })

  test("Notification type templates have resolved i18n values", () => {
    const type = cds.notifications.local.types["bookshop/BookOrderedNotify"]["1"]
    expect(type.Templates[0].TemplateSensitive).toBe("Book Ordered")
    expect(type.Templates[0].Subtitle).toBe("{{buyer}} ordered {{title}}")
  })

  test("Notification type for BookOrdered has templates for all 44 ANS languages", () => {
    const type = cds.notifications.local.types["bookshop/BookOrdered"]["1"]
    expect(type.Templates).toHaveLength(2)
    expect(type.Templates.map(t => t.Language)).toContain("en")
    expect(type.Templates.map(t => t.Language)).toContain("de")
  })

  test("German template for BookOrdered has German translation", () => {
    const type = cds.notifications.local.types["bookshop/BookOrdered"]["1"]
    const de = type.Templates.find(t => t.Language === "de")
    expect(de.TemplateSensitive).toBe("Buch bestellt")
    expect(de.Subtitle).toBe("{{buyer}} hat {{title}} bestellt")
  })

  test("Notification type templates have resolved i18n values", () => {
    const type = cds.notifications.local.types["bookshop/BookOrdered"]["1"]
    const en = type.Templates.find(t => t.Language === 'en')
    const de = type.Templates.find(t => t.Language === 'de')
    expect(en.TemplateSensitive).toBe("Book Ordered")
    expect(en.Subtitle).toBe("{{buyer}} ordered {{title}}")
    expect(de.TemplateSensitive).toBe("Buch bestellt")
    expect(de.Subtitle).toBe("{{buyer}} hat {{title}} bestellt")
  })
})