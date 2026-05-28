const { existsSync, readFileSync } = require('fs')
const { resolve, dirname } = require('path')
const cds = require('@sap/cds')
const LOG = cds.log('notifications')

function resolveEnum(val) {
  if (val && typeof val === 'object') {
    if ('=' in val) return val['=']
    if ('#' in val) return val['#']
  }
  return val
}

function notificationTypesFromModel(model) {
  if (!model) return []
  const types = []

  for (const def of Object.values(cds.reflect(model).definitions)) {
    if (def.kind !== 'event') continue
    if (!Object.keys(def).some(k => k === '@notification' || k.startsWith('@notification.'))) continue

    const tmpl = { Language: 'en', TemplateLanguage: 'mustache' }
    if (def['@description'])                          tmpl.Description       = resolveI18n(def['@description'])
    if (def['@notification.template.title'])          tmpl.TemplateSensitive = resolveI18n(def['@notification.template.title'])
    if (def['@notification.template.publicTitle'])    tmpl.TemplatePublic    = resolveI18n(def['@notification.template.publicTitle'])
    if (def['@notification.template.subtitle'])       tmpl.Subtitle          = resolveI18n(def['@notification.template.subtitle'])
    if (def['@notification.template.groupedTitle'])   tmpl.TemplateGrouped   = resolveI18n(def['@notification.template.groupedTitle'])
    if (def['@notification.template.email.subject'])  tmpl.EmailSubject      = resolveI18n(def['@notification.template.email.subject'])
    if (def['@notification.template.email.html'])     tmpl.EmailHtml         = resolveI18n(resolveHtmlFile(def['@notification.template.email.html'], def.$location))

    const type = {
      NotificationTypeKey: def.name.split('.').pop(),
      NotificationTypeVersion: '1',
      Templates: [tmpl],
    }

    if (def['@Common.SemanticObject'])       type.NavigationTargetObject = def['@Common.SemanticObject']
    if (def['@Common.SemanticObjectAction']) type.NavigationTargetAction = def['@Common.SemanticObjectAction']

    if (def['@notification.deliveryChannels']?.length) {
      type.DeliveryChannels = def['@notification.deliveryChannels'].map(ch => {
        if (!ch.channel) return null
        const entry = { Type: resolveEnum(ch.channel).toUpperCase() }
        if (ch.enabled             !== undefined) entry.Enabled             = ch.enabled
        if (ch.defaultPreference   !== undefined) entry.DefaultPreference   = ch.defaultPreference
        if (ch.editablePreference  !== undefined) entry.EditablePreference  = ch.editablePreference
        return entry
      }).filter(Boolean)
    }

    types.push(type)
  }

  return types
}

function resolveI18n(value) {
  if (typeof value !== 'string') return value
  return value.replace(/\{i18n>([^}]+)\}/g, (match, key) =>
    cds.i18n?.labels?.at(key, 'en') ?? match
  )
}

function resolveHtmlFile(value, location) {
  if (typeof value !== 'string') return value
  if (!value.startsWith('./') && !value.startsWith('../')) return value

  const cdsFile = resolve(cds.root, location.file)
  const htmlPath = resolve(dirname(cdsFile), value)
  if (!existsSync(htmlPath)) {
    LOG._warn && LOG.warn(`HTML file not found: ${htmlPath}`)
    return value
  }
  return readFileSync(htmlPath, 'utf8')
}

module.exports = { notificationTypesFromModel }
