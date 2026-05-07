const { notificationTypesFromModel } = require("../../../lib/compile")

function makeModel(defs) {
  return { definitions: defs }
}

describe("notificationTypesFromModel", () => {

  test("Return empty array for null/undefined model", () => {
    expect(notificationTypesFromModel(null)).toEqual([])
    expect(notificationTypesFromModel(undefined)).toEqual([])
  })

  test("Return empty array when no events have @notification", () => {
    const model = makeModel({
      "MyEntity": { kind: "entity", name: "MyEntity" },
      "PlainEvent": { kind: "event", name: "PlainEvent" }
    })
    expect(notificationTypesFromModel(model)).toEqual([])
  })

  test("Handle @notification with no template property", () => {
    const model = makeModel({
      "E": {
        kind: "event",
        name: "E",
        "@notification": {}
      }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.NotificationTypeKey).toBe("E")
    expect(type.Templates[0].TemplateSensitive).toBeUndefined()
    expect(type.Templates[0].Language).toBe("en")
  })

  test("Convert a fully annotated event to a notification type", () => {
    const model = makeModel({
      "BookOrdered": {
        kind: "event",
        name: "BookOrdered",
        "@description": "Book Ordered",
        "@Common.SemanticObject": "Book",
        "@Common.SemanticObjectAction": "display",
        "@notification.template.title": "Book '{{title}}' Ordered",
        "@notification.template.publicTitle": "Book Ordered",
        "@notification.template.subtitle": "{{buyer}} ordered {{title}}",
        "@notification.template.groupedTitle": "Bookshop Updates",
        "@notification.template.email.subject": "Your order",
        "@notification.deliveryChannels": [{ channel: { "=": "Mail" }, enabled: true }]
      }
    })

    const [type] = notificationTypesFromModel(model)

    expect(type.NotificationTypeKey).toBe("BookOrdered")
    expect(type.NotificationTypeVersion).toBe("1")
    expect(type.NavigationTargetObject).toBe("Book")
    expect(type.NavigationTargetAction).toBe("display")

    const tmpl = type.Templates[0]
    expect(tmpl.Language).toBe("en")
    expect(tmpl.TemplateLanguage).toBe("mustache")
    expect(tmpl.Description).toBe("Book Ordered")
    expect(tmpl.TemplateSensitive).toBe("Book '{{title}}' Ordered")
    expect(tmpl.TemplatePublic).toBe("Book Ordered")
    expect(tmpl.Subtitle).toBe("{{buyer}} ordered {{title}}")
    expect(tmpl.TemplateGrouped).toBe("Bookshop Updates")
    expect(tmpl.EmailSubject).toBe("Your order")

    expect(type.DeliveryChannels).toEqual([{ Type: "MAIL", Enabled: true }])
  })

  test("Handle minimal annotation (only @notification present)", () => {
    const model = makeModel({
      "SimpleEvent": {
        kind: "event",
        name: "SimpleEvent",
        "@notification.template.title": "Hello"
      }
    })

    const [type] = notificationTypesFromModel(model)

    expect(type.NotificationTypeKey).toBe("SimpleEvent")
    expect(type.NotificationTypeVersion).toBe("1")
    expect(type.Templates[0].TemplateSensitive).toBe("Hello")
    expect(type.Templates[0].TemplatePublic).toBeUndefined()
    expect(type.NavigationTargetObject).toBeUndefined()
    expect(type.DeliveryChannels).toBeUndefined()
  })

  test("Strip namespace prefix from event name", () => {
    const model = makeModel({
      "CatalogService.BookOrdered": {
        kind: "event",
        name: "CatalogService.BookOrdered",
        "@notification": { template: { title: "x" } }
      }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.NotificationTypeKey).toBe("BookOrdered")
  })

  test("Unwrap plain string enum values in deliveryChannels", () => {
    const model = makeModel({
      "E": {
        kind: "event",
        name: "E",
        "@notification.template.title": "t",
        "@notification.deliveryChannels": [{ channel: "Web", enabled: false }]
      }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.DeliveryChannels[0].Type).toBe("WEB")
    expect(type.DeliveryChannels[0].Enabled).toBe(false)
  })

  test("Return all events with @notification from a mixed model", () => {
    const model = makeModel({
      "A": { kind: "event", name: "A", "@notification": { template: { title: "a" } } },
      "B": { kind: "entity", name: "B" },
      "C": { kind: "event", name: "C", "@notification": { template: { title: "c" } } },
      "D": { kind: "event", name: "D" }
    })

    const types = notificationTypesFromModel(model)
    expect(types).toHaveLength(2)
    expect(types.map(t => t.NotificationTypeKey)).toEqual(expect.arrayContaining(["A", "C"]))
  })

  test("Include defaultPreference and editablePreference from deliveryChannels when present", () => {
    const model = makeModel({
      "E": {
        kind: "event",
        name: "E",
        "@notification.template.title": "t",
        "@notification.deliveryChannels": [{
          channel: "Mail",
          enabled: true,
          defaultPreference: true,
          editablePreference: false
        }]
      }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.DeliveryChannels[0]).toEqual({
      Type: "MAIL",
      Enabled: true,
      DefaultPreference: true,
      EditablePreference: false
    })
  })

  test("Skip deliveryChannel entry when channel is missing", () => {
    const model = makeModel({
      "E": {
        kind: "event",
        name: "E",
        "@notification.template.title": "t",
        "@notification.deliveryChannels": [{ enabled: true }]
      }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.DeliveryChannels).toHaveLength(0)
  })
})
