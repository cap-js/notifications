const cds = require("@sap/cds")
require("../../../cds-plugin")

function makeModel(defs) {
  return { definitions: defs }
}

describe("Loaded hook - recipients injection", () => {

  test("Inject recipients into a notification event that has none", () => {
    const model = makeModel({
      "MyEvent": {
        kind: "event",
        "@notification.template.title": "Test",
        elements: {}
      }
    })
    cds.emit("loaded", model)
    expect(model.definitions.MyEvent.elements.recipients).toEqual({ items: { type: "cds.String" } })
  })

  test("Do not overwrite recipients already defined on the event", () => {
    const existing = { items: { type: "cds.String" } }
    const model = makeModel({
      "MyEvent": {
        kind: "event",
        "@notification.template.title": "Test",
        elements: { recipients: existing }
      }
    })
    cds.emit("loaded", model)
    expect(model.definitions.MyEvent.elements.recipients).toBe(existing)
  })

  test("Do not inject recipients on events without @notification", () => {
    const model = makeModel({
      "PlainEvent": { kind: "event", elements: {} }
    })
    cds.emit("loaded", model)
    expect(model.definitions.PlainEvent.elements.recipients).toBeUndefined()
  })

  test("Create elements object if missing before injecting", () => {
    const model = makeModel({
      "MyEvent": {
        kind: "event",
        "@notification": true
      }
    })
    cds.emit("loaded", model)
    expect(model.definitions.MyEvent.elements.recipients).toEqual({ items: { type: "cds.String" } })
  })

})