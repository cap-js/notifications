const cds = require('@sap/cds')
const fs = require('fs')
const { join } = require('path')

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

  const i18nBundles = loadI18nBundles(cds.root)
  if (!i18nBundles) cds.log('notifications').warn('No i18n files found, falling back to English only')
  const locales = i18nBundles ? Object.keys(i18nBundles) : ['en']
  
  for (const def of model.definitions) {
    if (def.kind !== 'event') continue
    if (!Object.keys(def).some(k => k === '@notification' || k.startsWith('@notification.'))) continue

    const templates = locales.map(locale => {
      const texts = { ...i18nBundles?.['en'], ...i18nBundles?.[locale] }
      const t = { Language: locale, TemplateLanguage: 'mustache' }
      if (def['@description'])                         t.Description       = resolveI18n(def['@description'], texts)
      if (def['@notification.template.title'])         t.TemplateSensitive = resolveI18n(def['@notification.template.title'], texts)
      if (def['@notification.template.publicTitle'])   t.TemplatePublic    = resolveI18n(def['@notification.template.publicTitle'], texts)
      if (def['@notification.template.subtitle'])      t.Subtitle          = resolveI18n(def['@notification.template.subtitle'], texts)
      if (def['@notification.template.groupedTitle'])  t.TemplateGrouped   = resolveI18n(def['@notification.template.groupedTitle'], texts)
      if (def['@notification.template.email.subject']) t.EmailSubject      = resolveI18n(def['@notification.template.email.subject'], texts)
      if (def['@notification.template.email.html'])    t.EmailHtml         = resolveI18n(def['@notification.template.email.html'], texts)
      return t
    })

    const type = {
      NotificationTypeKey: def.name.split('.').pop(),
      NotificationTypeVersion: '1',
      Templates: templates,
    }

    if (def['@Common.SemanticObject'])       type.NavigationTargetObject = def['@Common.SemanticObject']
    if (def['@Common.SemanticObjectAction']) type.NavigationTargetAction = def['@Common.SemanticObjectAction']

    if (def['@notification.deliveryChannels']?.length) {
      type.DeliveryChannels = def['@notification.deliveryChannels'].map(ch => {
        if (!ch.channel) return null
        const resolved = resolveEnum(ch.channel)
        if (typeof resolved !== 'string') return null
        const entry = { Type: resolved.toUpperCase() }
        
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

 function parseProperties(content) {
  const result = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq >= 0) result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return result
}

function loadI18nBundles(baseDir) {
  const i18nDir = join(baseDir, '_i18n')
  if (!fs.existsSync(i18nDir)) return null
  const bundles = {}
  for (const file of fs.readdirSync(i18nDir)) {
    const m = file.match(/^i18n(?:_(.+))?\.properties$/)
    if (!m) continue
    bundles[m[1] ?? 'en'] = parseProperties(fs.readFileSync(join(i18nDir, file), 'utf8'))
  }
  return Object.keys(bundles).length ? bundles : null
}

function resolveI18n(value, texts) {
  if (typeof value !== 'string') return value
  const match = value.match(/^\{i18n>([^}]+)\}$/)
  if (!match) return value
  return texts[match[1]] ?? value
}

module.exports = { notificationTypesFromModel }
