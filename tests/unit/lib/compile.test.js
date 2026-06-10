jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}))

const { existsSync, readFileSync } = require('fs')
const { notificationTypesFromModel } = require("../../../lib/compile")

function makeModel(defs) {
  return { definitions: Object.values(defs) }
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

describe("Notification Types from Model", () => {
  let originalI18nDescriptor

  beforeEach(() => {
    originalI18nDescriptor = Object.getOwnPropertyDescriptor(require('@sap/cds'), 'i18n')
  })

  afterEach(() => {
    if (originalI18nDescriptor) {
      Object.defineProperty(require('@sap/cds'), 'i18n', originalI18nDescriptor)
    }
  })

describe("Notification Types from Model", () => {
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
      "BookOrderedNotify": {
        kind: "event",
        name: "BookOrderedNotify",
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

    expect(type.NotificationTypeKey).toBe("BookOrderedNotify")
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
      "CatalogService.BookOrderedNotify": {
        kind: "event",
        name: "CatalogService.BookOrderedNotify",
        "@notification": { template: { title: "x" } }
      }
    })

    const [type] = notificationTypesFromModel(model)
    expect(type.NotificationTypeKey).toBe("BookOrderedNotify")
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
})

describe("i18n integration", () => {
  const cds = require('@sap/cds')
  let originalI18nDescriptor

  beforeEach(() => {
    originalI18nDescriptor = Object.getOwnPropertyDescriptor(cds, 'i18n')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    if (originalI18nDescriptor) Object.defineProperty(cds, 'i18n', originalI18nDescriptor)
  })

  function mockLabels(allImpl, atImpl) {
    jest.spyOn(cds.i18n.labels, 'all').mockImplementation(allImpl)
    jest.spyOn(cds.i18n.labels, 'at').mockImplementation(atImpl)
  }

  test("Fall back to single English template when no i18n files found", () => {
    mockLabels(() => ({}), () => undefined)

    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "Hello" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates).toHaveLength(1)
    expect(type.Templates[0].Language).toBe("en")
    expect(type.Templates[0].TemplateSensitive).toBe("Hello")
  })

  test("Generate one template per available locale from i18n files", () => {
    mockLabels(() => ({ en: 'Hello', de: 'Hallo' }),
      (_, locale) => locale === 'de' ? 'Hallo' : 'Hello')

    const model = makeModel({ "E": { kind: "event", name: "E", "@notification.template.title": "{i18n>TITLE}" } })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates).toHaveLength(2)
    expect(type.Templates.find(t => t.Language === 'en').TemplateSensitive).toBe('Hello')
    expect(type.Templates.find(t => t.Language === 'de').TemplateSensitive).toBe('Hallo')
  })

  test("Resolve {i18n>KEY} references from i18n.properties file", () => {
    mockLabels(() => ({ en: 'Book Ordered' }), () => 'Book Ordered')

    const model = makeModel({ "E": { kind: "event", name: "E", "@notification.template.title": "{i18n>BOOK_ORDERED_TITLE}" } })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].TemplateSensitive).toBe("Book Ordered")
  })

  test("Resolve {i18n>KEY} to locale-specific translation when available", () => {
    mockLabels(() => ({ en: 'Book Ordered', de: 'Buch bestellt' }),
      (_, locale) => locale === 'de' ? 'Buch bestellt' : 'Book Ordered')

    const model = makeModel({ "E": { kind: "event", name: "E", "@notification.template.title": "{i18n>BOOK_ORDERED_TITLE}" } })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates.find(t => t.Language === 'en').TemplateSensitive).toBe("Book Ordered")
    expect(type.Templates.find(t => t.Language === 'de').TemplateSensitive).toBe("Buch bestellt")
  })

  test("Fall back to raw value when i18n key not found in any locale", () => {
    mockLabels(() => ({}), () => undefined)

    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "{i18n>MISSING_KEY}" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].TemplateSensitive).toBe("{i18n>MISSING_KEY}")
  })

  test("Pass plain strings through i18n unchanged", () => {
    mockLabels(() => ({}), () => undefined)

    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "Plain Title" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].TemplateSensitive).toBe("Plain Title")
  })

  test("Resolve {i18n>KEY} in subtitle field", () => {
    mockLabels(() => ({ en: 'Resolved Subtitle' }), () => 'Resolved Subtitle')

    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "t", "@notification.template.subtitle": "{i18n>SUBTITLE_KEY}" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].Subtitle).toBe("Resolved Subtitle")
  })

  test("Exclude locale when none of its keys differ from English", () => {
    mockLabels(() => ({ en: 'Hello' }), () => 'Hello')

    const model = makeModel({ "E": { kind: "event", name: "E", "@notification.template.title": "{i18n>TITLE}" } })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates).toHaveLength(1)
    expect(type.Templates[0].Language).toBe('en')
  })

  test("Exclude locale when its translation is identical to English", () => {
    mockLabels(() => ({ en: 'Hello', de: 'Hello' }), () => 'Hello')

    const model = makeModel({ "E": { kind: "event", name: "E", "@notification.template.title": "{i18n>TITLE}" } })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates).toHaveLength(1)
    expect(type.Templates[0].Language).toBe('en')
  })

  test("Include locale only when at least one key differs from English", () => {
    mockLabels((key) => key === 'TITLE' ? { en: 'Hello', de: 'Hallo' } : { en: 'Same', de: 'Same' },
      (key, locale) => key === 'TITLE' ? (locale === 'de' ? 'Hallo' : 'Hello') : 'Same')

    const model = makeModel({ "E": { kind: "event", name: "E",
      "@notification.template.title": "{i18n>TITLE}",
      "@notification.template.subtitle": "{i18n>SUBTITLE}"
    }})
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates).toHaveLength(2)
    expect(type.Templates.find(t => t.Language === 'de').TemplateSensitive).toBe('Hallo')
    expect(type.Templates.find(t => t.Language === 'de').Subtitle).toBe('Same')
  })

  test("Two events with same locale files get independent template sets", () => {
    mockLabels((key) => key === 'A_TITLE' ? { en: 'A in English', de: 'A auf Deutsch' } : { en: 'B in English' },
      (key, locale) => key === 'A_TITLE' ? (locale === 'de' ? 'A auf Deutsch' : 'A in English') : 'B in English')

    const model = makeModel({
      "A": { kind: "event", name: "A", "@notification.template.title": "{i18n>A_TITLE}" },
      "B": { kind: "event", name: "B", "@notification.template.title": "{i18n>B_TITLE}" },
    })
    const [typeA, typeB] = notificationTypesFromModel(model)
    expect(typeA.Templates).toHaveLength(2)
    expect(typeB.Templates).toHaveLength(1)
  })

  test("Resolve {i18n>KEY} in subtitle field via Object.defineProperty", () => {
    Object.defineProperty(cds, 'i18n', {
      value: { labels: { all: () => ({}), at: (key) => key === 'BOOK_ORDERED_SUBTITLE' ? '{{buyer}} ordered {{title}}' : undefined } },
      configurable: true, writable: true
    })
    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.title": "t", "@notification.template.subtitle": "{i18n>BOOK_ORDERED_SUBTITLE}" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].Subtitle).toBe("{{buyer}} ordered {{title}}")
  })
})

describe("defaultEmailDelivery config", () => {
  const cds = require('@sap/cds')

  afterEach(() => {
    if (cds.env.requires?.notifications) {
      delete cds.env.requires.notifications.defaultEmailDelivery
    }
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
  let originalI18nDescriptor

  beforeEach(() => {
    originalI18nDescriptor = Object.getOwnPropertyDescriptor(cds, 'i18n')
    jest.clearAllMocks()
  })

  afterEach(() => {
    if (originalI18nDescriptor) Object.defineProperty(cds, 'i18n', originalI18nDescriptor)
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

  test("Resolve {i18n>KEY} embedded within inline html string", () => {
    const cds = require('@sap/cds')
    Object.defineProperty(cds, 'i18n', {
      value: { labels: { all: () => ({}), at: (key) => key === 'BOOK_ORDERED_SUBTITLE' ? '{{buyer}} ordered {{title}}' : undefined } },
      configurable: true, writable: true
    })
    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.email.html": "<p>{i18n>BOOK_ORDERED_SUBTITLE}</p>" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].EmailHtml).toBe("<p>{{buyer}} ordered {{title}}</p>")
  })
})

  test("Resolve {i18n>KEY} in subtitle field", () => {
    Object.defineProperty(cds, 'i18n', {
      value: { labels: { all: () => ({}), at: (key) => key === 'BOOK_ORDERED_SUBTITLE' ? '{{buyer}} ordered {{title}}' : undefined } },
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
      value: { labels: { all: () => ({}), at: (key) => key === 'BOOK_ORDERED_SUBTITLE' ? '{{buyer}} ordered {{title}}' : undefined } },
      configurable: true, writable: true
    })
    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification.template.email.html": "<p>{i18n>BOOK_ORDERED_SUBTITLE}</p>" }
    })
    const [type] = notificationTypesFromModel(model)
    expect(type.Templates[0].EmailHtml).toBe("<p>{i18n>BOOK_ORDERED_SUBTITLE}</p>")
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
      value: { labels: { all: () => ({}), at: (key) => key === 'BOOK_ORDERED_DESCRIPTION' ? 'Book Ordered' : undefined } },
      configurable: true, writable: true
    })
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue('<p>{i18n>BOOK_ORDERED_DESCRIPTION}</p>')

    const model = makeModel({ "E": makeEventWithHtml('./email.html') })
    const [type] = notificationTypesFromModel(model)

    expect(type.Templates[0].EmailHtml).toBe('<p>{i18n>BOOK_ORDERED_DESCRIPTION}</p>')
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

  describe("Element name length validation", () => {
    test("Throw when an element name exceeds 128 characters", () => {
      const longName = 'a'.repeat(129)
      const model = makeModel({
        "E": {
          kind: "event",
          name: "E",
          "@notification": {},
          elements: { [longName]: { type: "cds.String" } }
        }
      })
      expect(() => notificationTypesFromModel(model)).toThrow(longName)
      expect(() => notificationTypesFromModel(model)).toThrow("'E'")
    })

  test("No error for element names at exactly 128 characters", () => {
    const exactName = 'a'.repeat(128)
    const model = makeModel({
      "E": {
        kind: "event",
        name: "E",
        "@notification": {},
        elements: { [exactName]: { type: "cds.String" } }
      }
    })
    expect(() => notificationTypesFromModel(model)).not.toThrow()
  })

  test("No error when all element names are within the 128-character limit", () => {
    const model = makeModel({
      "E": {
        kind: "event",
        name: "E",
        "@notification": {},
        elements: { title: { type: "cds.String" }, buyer: { type: "cds.String" } }
      }
    })
    expect(() => notificationTypesFromModel(model)).not.toThrow()
  })

  test("Report all violating element names in the error message", () => {
    const b = 'b'.repeat(129)
    const c = 'c'.repeat(130)
    const model = makeModel({
      "E": {
        kind: "event",
        name: "E",
        "@notification": {},
        elements: {
          valid: { type: "cds.String" },
          [b]: { type: "cds.String" },
          [c]: { type: "cds.String" }
        }
      }
    })
    expect(() => notificationTypesFromModel(model)).toThrow(b)
    expect(() => notificationTypesFromModel(model)).toThrow(c)
  })

  test("Use stripped event name in error when event has a namespace prefix", () => {
    const longName = 'x'.repeat(129)
    const model = makeModel({
      "My.Namespace.OrderPlaced": {
        kind: "event",
        name: "My.Namespace.OrderPlaced",
        "@notification": {},
        elements: { [longName]: { type: "cds.String" } }
      }
    })
    expect(() => notificationTypesFromModel(model)).toThrow("'OrderPlaced'")
  })

  test("No error when event has no elements", () => {
    const model = makeModel({
      "E": { kind: "event", name: "E", "@notification": {} }
    })
    expect(() => notificationTypesFromModel(model)).not.toThrow()
  })
