jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}))

const { existsSync, readFileSync } = require('fs')
const { notificationTypesFromModel } = require("../../../lib/compile")

function makeModel(defs) {
  return { definitions: defs }
}

function makeEventWithHtml(html, file = 'srv/notifications.cds') {
  return {
    kind: 'event',
    name: 'E',
    '@notification.template.title': 't',
    '@notification.template.email.html': html,
    $location: { file, line: 1, col: 1 },
  }
}

describe("notificationTypesFromModel", () => {
  let originalI18nDescriptor

  beforeEach(() => {
    originalI18nDescriptor = Object.getOwnPropertyDescriptor(require('@sap/cds'), 'i18n')
  })

  afterEach(() => {
    if (originalI18nDescriptor) {
      Object.defineProperty(require('@sap/cds'), 'i18n', originalI18nDescriptor)
    }
  })

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

  test("Unwrap hash-form enum references in deliveryChannels", () => {
    const model = makeModel({
      "E": {
        kind: "event",
        name: "E",
        "@notification.template.title": "t",
        "@notification.deliveryChannels": [{ channel: { "#": "Mail" }, enabled: true }]
      }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.DeliveryChannels[0].Type).toBe("MAIL")
    expect(type.DeliveryChannels[0].Enabled).toBe(true)
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

  test("Resolve {i18n>KEY} references to English labels", () => {
    const cds = require('@sap/cds')
    Object.defineProperty(cds, 'i18n', {
      value: { labels: { at: (key, lang) => key === 'BOOK_ORDERED_TITLE' && lang === 'en' ? 'Book Ordered' : undefined } },
      configurable: true,
      writable: true
    })

    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "{i18n>BOOK_ORDERED_TITLE}" }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].TemplateSensitive).toBe("Book Ordered")
  })

  test("Fall back to raw value when i18n key not found", () => {
    const cds = require('@sap/cds')
    cds.i18n = { labels: { at: () => undefined } }

    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "{i18n>MISSING_KEY}" }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].TemplateSensitive).toBe("{i18n>MISSING_KEY}")
  })

  test("Pass plain strings through i18n unchanged", () => {
    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "Plain Title" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].TemplateSensitive).toBe("Plain Title")
  })

  test("Resolve {i18n>KEY} in subtitle field", () => {
    Object.defineProperty(cds, 'i18n', {
      value: { labels: { at: (key) => key === 'BOOK_ORDERED_SUBTITLE' ? '{{buyer}} ordered {{title}}' : undefined } },
      configurable: true, writable: true
    })
    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "t", "@notification.template.subtitle": "{i18n>BOOK_ORDERED_SUBTITLE}" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].Subtitle).toBe("{{buyer}} ordered {{title}}")
  })

  test("Resolve {i18n>KEY} embedded within inline html string", () => {
    const cds = require('@sap/cds')
    Object.defineProperty(cds, 'i18n', {
      value: { labels: { at: (key) => key === 'BOOK_ORDERED_SUBTITLE' ? '{{buyer}} ordered {{title}}' : undefined } },
      configurable: true, writable: true
    })
    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.email.html": "<p>{i18n>BOOK_ORDERED_SUBTITLE}</p>" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].EmailHtml).toBe("<p>{{buyer}} ordered {{title}}</p>")
  })
})

describe("defaultEmailDelivery config", () => {
  const cds = require('@sap/cds')

  afterEach(() => {
    delete cds.env.requires?.notifications?.defaultEmailDelivery
  })

  test("Add MAIL delivery channel when defaultEmailDelivery is true and no channels annotated", () => {
    cds.env.requires.notifications ??= {}
    cds.env.requires.notifications.defaultEmailDelivery = true

    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "t" }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.DeliveryChannels).toEqual([{ Type: 'MAIL', Enabled: true, DefaultPreference: true, EditablePreference: true }])
  })

  test("Do not override explicit delivery channels when defaultEmailDelivery is true", () => {
    cds.env.requires.notifications ??= {}
    cds.env.requires.notifications.defaultEmailDelivery = true

    const model = makeModel({
      "E": {
        kind: "event",
        name: "E",
        "@notification.template.title": "t",
        "@notification.deliveryChannels": [{ channel: "Web", enabled: false }]
      }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.DeliveryChannels).toEqual([{ Type: 'WEB', Enabled: false }])
  })

  test("Do not add delivery channels when defaultEmailDelivery is false", () => {
    cds.env.requires.notifications ??= {}
    cds.env.requires.notifications.defaultEmailDelivery = false

    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "t" }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.DeliveryChannels).toBeUndefined()
  })

  test("Do not add delivery channels when defaultEmailDelivery is not configured", () => {
    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "t" }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.DeliveryChannels).toBeUndefined()
  })
})

describe("HTML file resolution", () => {
  const cds = require('@sap/cds')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("Read html file when annotation value starts with ./", () => {
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue('<p>Hello {{buyer}}</p>')

    const model = makeModel({ "E": makeEventWithHtml('./email.html') })
    const [type] = notificationTypesFromModel(model)

    expect(type.Templates[0].EmailHtml).toBe('<p>Hello {{buyer}}</p>')
    expect(existsSync).toHaveBeenCalled()
    expect(readFileSync).toHaveBeenCalled()
  })

  test("Read html file when annotation value starts with ../", () => {
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue('<p>content</p>')

    const model = makeModel({ "E": makeEventWithHtml('../templates/email.html') })
    const [type] = notificationTypesFromModel(model)

    expect(type.Templates[0].EmailHtml).toBe('<p>content</p>')
  })

  test("Pass through inline html unchanged (no file read)", () => {
    const model = makeModel({ "E": makeEventWithHtml('<p>inline</p>') })
    const [type] = notificationTypesFromModel(model)

    expect(type.Templates[0].EmailHtml).toBe('<p>inline</p>')
    expect(existsSync).not.toHaveBeenCalled()
  })

  test("Returns annotation value as-is when html file not found", () => {
    existsSync.mockReturnValue(false)

    const model = makeModel({ "E": makeEventWithHtml('./missing.html') })
    const [type] = notificationTypesFromModel(model)

    expect(type.Templates[0].EmailHtml).toBe('./missing.html')
    expect(readFileSync).not.toHaveBeenCalled()
  })

  test("Resolves {i18n>KEY} placeholders inside html file content", () => {
    Object.defineProperty(cds, 'i18n', {
      value: { labels: { at: (key) => key === 'BOOK_ORDERED_DESCRIPTION' ? 'Book Ordered' : undefined } },
      configurable: true, writable: true
    })
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue('<p>{i18n>BOOK_ORDERED_DESCRIPTION}</p>')

    const model = makeModel({ "E": makeEventWithHtml('./email.html') })
    const [type] = notificationTypesFromModel(model)

    expect(type.Templates[0].EmailHtml).toBe('<p>Book Ordered</p>')
  })

  test("Resolves html file path relative to the cds source file", () => {
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue('<p>hi</p>')

    const model = makeModel({ "E": makeEventWithHtml('./email.html', 'srv/notifications.cds') })
    notificationTypesFromModel(model)

    const calledPath = existsSync.mock.calls[0][0]
    expect(calledPath).toMatch(/srv[/\\]email\.html$/)
  })
})
