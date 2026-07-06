const cds = require("@sap/cds")
const { join } = cds.utils.path
const { messages } = require("../../lib/utils")
const { notificationTypesFromModel } = require("../../lib/compile")


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
    const en = type.Templates.find(t => t.Language === 'en')
    expect(en.TemplateSensitive).toBe("Book Ordered")
    expect(en.Subtitle).toBe("{{buyer}} ordered {{title}}")
  })

  test("Emitting a @notification event directly triggers a notification via the plugin", async () => {
    const catalog = await cds.connect.to('CatalogService')
    await catalog.emit('BookOrderedNotify', {
      title: 'Moby Dick',
      buyer: 'reader@bookshop.com',
      quantity: 1,
      recipients: ['reader@bookshop.com'],
    })

    expect(log.output).toContain("BookOrderedNotify")
    expect(log.output).toContain("Moby Dick")
  })

  test("Submitting an order triggers a notification via the plugin auto-emit path", async () => {
    const catalog = await cds.connect.to('CatalogService')
    await catalog.send({ event: 'submitOrder', data: { book: '201', quantity: 1 }, user: new cds.User('reader@bookshop.com') })

    expect(log.output).toContain("bookshop/BookOrderedNotify")
    expect(log.output).toContain("Wuthering Heights")
  })

  test("Emitting a @notification event with dynamic xpr priority evaluates priority via db", async () => {
    const catalog = await cds.connect.to('CatalogService')

    // quantity > 5 -> High
    await catalog.emit('BookOrderedNotify', {
      title: 'Bulk Order',
      buyer: 'reader@bookshop.example',
      quantity: 10,
      recipients: ['reader@bookshop.example'],
    })
    expect(log.output).toContain('BookOrderedNotify')
    expect(log.output).toContain("Priority: 'HIGH'")

    log.clear()

    // quantity <= 5 -> Low
    await catalog.emit('BookOrderedNotify', {
      title: 'Small Order',
      buyer: 'reader@bookshop.example',
      quantity: 2,
      recipients: ['reader@bookshop.example'],
    })
    expect(log.output).toContain("Priority: 'LOW'")
  })

  test("Dynamic priority using a db function (days_between) is evaluated by the database", async () => {
    const catalog = await cds.connect.to('CatalogService')

    // 30 days apart → High
    await catalog.emit('LateDeliveryNotify', {
      title: 'Late delivery',
      orderDate: '2024-01-01',
      deliveryDate: '2024-02-01',
      recipients: ['reader@bookshop.example'],
    })
    expect(log.output).toContain("Priority: 'HIGH'")

    log.clear()

    // 3 days apart → Low
    await catalog.emit('LateDeliveryNotify', {
      title: 'On-time delivery',
      orderDate: '2024-01-01',
      deliveryDate: '2024-01-04',
      recipients: ['reader@bookshop.example'],
    })
    expect(log.output).toContain("Priority: 'LOW'")
  })

  test("Throw when a notification event has an element name exceeding 128 characters", () => {
    const longName = 'a'.repeat(129)
    const model = cds.linked(cds.parse.cdl(`@notification event OversizedEvent { ${longName}: String; }`))
    expect(() => notificationTypesFromModel(model)).toThrow(
      "Event 'OversizedEvent' has elements exceeding the maximum key length of 128 characters"
    )
  })

  test("Notification type for BookOrderedNotify has templates for all available languages", () => {
    const type = cds.notifications.local.types["bookshop/BookOrderedNotify"]["1"]
    expect(type.Templates).toHaveLength(2)
    expect(type.Templates.map(t => t.Language)).toContain("en")
    expect(type.Templates.map(t => t.Language)).toContain("de")
  })

  test("German template for BookOrderedNotify has German translation", () => {
    const type = cds.notifications.local.types["bookshop/BookOrderedNotify"]["1"]
    const de = type.Templates.find(t => t.Language === "de")
    expect(de.TemplateSensitive).toBe("Buch bestellt")
    expect(de.Subtitle).toBe("{{buyer}} hat {{title}} bestellt")
  })

  describe("before('*') hook", () => {
    let beforeHandlers

    beforeEach(() => {
      beforeHandlers = alert._handlers.before.length
    })

    afterEach(() => {
      alert._handlers.before.splice(beforeHandlers)
    })

    test("is called before a notification is sent and receives msg.event and msg.data", async () => {
      let capturedEvent, capturedData
      alert.before('*', msg => {
        capturedEvent = msg.event
        capturedData = msg.data
      })

      await alert.notify("BookOrderedNotify", {
        recipients: ["reader@bookshop.com"],
        data: { title: "Moby Dick", buyer: "reader@bookshop.com" }
      })

      expect(capturedEvent).toBe("BookOrderedNotify")
      expect(capturedData).toMatchObject({
        NotificationTypeKey: expect.stringContaining("BookOrderedNotify"),
        Recipients: expect.arrayContaining([expect.objectContaining({ RecipientId: "reader@bookshop.com" })]),
      })
    })

    test("can suppress a notification by throwing", async () => {
      alert.before('*', () => { throw new cds.error("Recipient not eligible") })

      await expect(
        alert.notify({ recipients: ["reader@bookshop.com"], title: "New book arrived" })
      ).rejects.toThrow("Recipient not eligible")

      expect(log.output).not.toContain("Notification:")
    })
  })

  test("Email html is loaded from file with i18n resolved per locale", () => {
    const type = cds.notifications.local.types["bookshop/BookOrderedNotify"]["1"]
    const en = type.Templates.find(t => t.Language === 'en')
    const de = type.Templates.find(t => t.Language === 'de')
    expect(en.EmailHtml).toBe(
      "<h1>Book Ordered</h1>\n<p>Hi {{buyer}}, your order for <b>{{title}}</b> has been placed.</p>\n"
    )
    expect(de.EmailHtml).toBe(
      "<h1>Buch bestellt</h1>\n<p>Hallo {{buyer}}, deine Bestellung für <b>{{title}}</b> wurde aufgegeben.</p>\n"
    )
  })
})
