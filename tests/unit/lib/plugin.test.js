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

describe("Serving hook - notification handler registration", () => {

  let notifySpy, registeredHandler, next

  beforeEach(async () => {
    notifySpy = jest.fn()
    jest.spyOn(cds.connect, 'to').mockResolvedValue({ notify: notifySpy })

    registeredHandler = undefined
    const service = new cds.Service()
    service.name = 'LazyService'
    jest.spyOn(service, 'on').mockImplementation((event, handler) => {
      if (event === '*') registeredHandler = handler
    })

    await cds.emit('serving', service)
    next = jest.fn()
  })

  afterEach(() => jest.restoreAllMocks())

  test("Does not attach a handler to the notifications service itself", async () => {
    const service = new cds.Service()
    service.name = 'notifications'
    const onSpy = jest.spyOn(service, 'on')
    await cds.emit('serving', service)
    expect(onSpy).not.toHaveBeenCalled()
  })

  test("Registers a handler on lazily connected services", () => {
    expect(registeredHandler).toBeDefined()
  })

  test("Calls notify for @notification events", async () => {
    const eventDef = {
      kind: 'event',
      name: 'LazyService.OrderPlaced',
      '@notification': true,
      '@notification.priority': { '#': 'High' },
      '@Common.SemanticObject': 'Orders',
      '@Common.SemanticObjectAction': 'manage',
      elements: { ID: { type: 'cds.String', key: true }, title: { type: 'cds.String' }, recipients: { items: { type: 'cds.String' } } }
    }
    await registeredHandler({ target: eventDef, data: { ID: '123', title: 'Moby Dick', recipients: ['buyer@example.com'] } }, next)

    expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({
      NotificationTypeKey: 'OrderPlaced',
      NotificationTypeVersion: '1',
      Priority: 'HIGH',
      NavigationTargetObject: 'Orders',
      NavigationTargetAction: 'manage',
      Recipients: [{ RecipientId: 'buyer@example.com' }],
      Properties: expect.arrayContaining([
        expect.objectContaining({ Key: 'title', Value: 'Moby Dick', IsSensitive: false }),
      ]),
      TargetParameters: [{ Key: 'ID', Value: '123' }],
    }))
    expect(next).toHaveBeenCalled()
  })

  test("Skips plain events and calls next()", async () => {
    await registeredHandler({ target: { kind: 'event', name: 'PlainEvent' }, data: {} }, next)

    expect(notifySpy).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  test("Logs error and still calls next() when notify fails", async () => {
    notifySpy.mockRejectedValue(new Error('Network error'))
    const errorSpy = jest.fn()
    jest.spyOn(cds, 'log').mockReturnValue({ _error: true, error: errorSpy })

    const eventDef = {
      kind: 'event',
      name: 'LazyService.OrderPlaced',
      '@notification': true,
      elements: { recipients: { items: { type: 'cds.String' } } }
    }
    await registeredHandler({ target: eventDef, data: { recipients: ['buyer@example.com'] } }, next)

    expect(next).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith('Failed to send notification for event', expect.any(String), expect.any(Error))
  })

})
