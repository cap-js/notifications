const cds = require('@sap/cds')
const { join } = cds.utils.path

// cds.build.Plugin is only available during a real `cds build` run, so we stub it here
// before requiring lib/build, which extends it at module evaluation time
class MockBuildPlugin {
  constructor(options) { this.options = options }
  static hasTask() { return false }
  async model() { return null }
}
cds.build = { Plugin: MockBuildPlugin }

const BuildPlugin = require('../../../lib/build')

function makePlugin(overrides = {}) {
  const plugin = new BuildPlugin({ src: join(__dirname, '../../bookshop/srv') })
  plugin.task = { dest: '/tmp' }
  plugin.write = jest.fn(() => ({ to: jest.fn().mockResolvedValue(undefined) }))
  Object.assign(plugin, overrides)
  return plugin
}

describe('Notifications Build Plugin', () => {
  beforeEach(() => {
    cds.env.requires.notifications ??= {}
  })

  afterEach(() => {
    delete cds.env.requires.notifications.types
  })

  test('hasTask returns true when notifications is configured', () => {
    expect(BuildPlugin.hasTask()).toBe(true)
  })

  test('hasTask returns false when notifications is not configured', () => {
    const saved = cds.env.requires.notifications
    delete cds.env.requires.notifications
    expect(BuildPlugin.hasTask()).toBe(false)
    cds.env.requires.notifications = saved
  })

  test('build succeeds with a raw unlinked model', async () => {
    const plugin = makePlugin({
      model: () => cds.load(join(__dirname, '../../bookshop/srv'))
    })
    await expect(plugin.build()).resolves.not.toThrow()
  })

  test('build writes notification-types.json when types are found', async () => {
    const plugin = makePlugin({
      model: () => cds.load(join(__dirname, '../../bookshop/srv'))
    })
    await plugin.build()
    expect(plugin.write).toHaveBeenCalled()
    const written = JSON.parse(plugin.write.mock.calls[0][0])
    expect(written.some(t => t.NotificationTypeKey === 'BookOrderedNotify')).toBe(true)
  })

  test('build does not write output when model has no notification events', async () => {
    const plugin = makePlugin({
      model: () => Promise.resolve(cds.linked({ definitions: [] }))
    })
    await plugin.build()
    expect(plugin.write).not.toHaveBeenCalled()
  })

  test('build merges types from JSON file with model types', async () => {
    cds.env.requires.notifications.types = join(__dirname, '../../bookshop/srv/notification-types.json')
    const plugin = makePlugin({
      model: () => cds.load(join(__dirname, '../../bookshop/srv'))
    })
    await plugin.build()
    const written = JSON.parse(plugin.write.mock.calls[0][0])
    expect(written.some(t => t.NotificationTypeKey === 'BookOrderedNotify')).toBe(true)
    expect(written.some(t => t.NotificationTypeKey === 'BookReturned')).toBe(true)
  })

  test('build output includes templates for multiple languages', async () => {
    const plugin = makePlugin({
      model: () => cds.load(join(__dirname, '../../bookshop/srv'))
    })
    await plugin.build()
    const written = JSON.parse(plugin.write.mock.calls[0][0])
    const type = written.find(t => t.NotificationTypeKey === 'BookOrderedNotify')
    expect(type.Templates.map(t => t.Language)).toContain('en')
    expect(type.Templates.map(t => t.Language)).toContain('de')
  })
})
