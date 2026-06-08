const { notificationTypesFromModel } = require("../../../lib/compile")

function makeModel(defs) {
  return { definitions: Object.values(defs) }
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

  describe("i18n integration", () => {
    const cds = require('@sap/cds')

    function mockLabels(allImpl, atImpl) {
      jest.spyOn(cds.i18n.labels, 'all').mockImplementation(allImpl)
      jest.spyOn(cds.i18n.labels, 'at').mockImplementation(atImpl)
    }

    afterEach(() => jest.restoreAllMocks())

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
  })
})
