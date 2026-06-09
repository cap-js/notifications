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

  const defaultTexts = cds.env.i18n.default_language ?? 'en'

  for (const def of model.definitions) {
    if (def.kind !== 'event') continue
    if (!Object.keys(def).some(k => k === '@notification' || k.startsWith('@notification.'))) continue

    const eventName = def.name.split('.').pop()
    const violations = Object.keys(def.elements ?? {}).filter(name => name.length > 128)
    if (violations.length) {
      throw new Error(
        `Event '${eventName}' has elements exceeding the maximum key length of 128 characters: ${violations.map(n => `'${n}'`).join(', ')}`
      )
    }
    
    const localeTexts = localesForKeys(def, defaultTexts)

    const templates = localeTexts.map(locale => {
      const t = { Language: locale, TemplateLanguage: 'mustache' }
      if (def['@description'])                         t.Description       = resolveI18n(def['@description'], locale)
      if (def['@notification.template.title'])         t.TemplateSensitive = resolveI18n(def['@notification.template.title'], locale)
      if (def['@notification.template.publicTitle'])   t.TemplatePublic    = resolveI18n(def['@notification.template.publicTitle'], locale)
      if (def['@notification.template.subtitle'])      t.Subtitle          = resolveI18n(def['@notification.template.subtitle'], locale)
      if (def['@notification.template.groupedTitle'])  t.TemplateGrouped   = resolveI18n(def['@notification.template.groupedTitle'], locale)
      if (def['@notification.template.email.subject']) t.EmailSubject      = resolveI18n(def['@notification.template.email.subject'], locale)
      if (def['@notification.template.email.html'])    t.EmailHtml         = resolveI18n(def['@notification.template.email.html'], locale)
      return t
    })

    const type = {
      NotificationTypeKey: eventName,
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

    if (!type.DeliveryChannels && cds.env.requires?.notifications?.defaultEmailDelivery) {
      type.DeliveryChannels = [{ Type: 'MAIL', Enabled: true, DefaultPreference: true, EditablePreference: true }]
    }

    types.push(type)
  }

  return types
}

/**
 * Returns the locales for which to generate notification templates, based on the i18n keys
 * used in a notification event definition. Includes locales where at least one translation
 * differs from the default language.
 * @param {object} notifyEvent - A CDS event definition with notification annotations
 * @param {string} defaultLang - The default language code (e.g. 'en')
 * @returns {string[]} Locale codes, always starting with the default language
 */
function localesForKeys(notifyEvent, defaultLang) {
  const i18nKeys = Object.values(notifyEvent)
    .filter(v => typeof v === 'string')
    .flatMap(v => [...v.matchAll(/\{i18n>([^}]+)\}/g)].map(m => m[1]))
    .filter(Boolean)

  return [
    defaultLang,
    ...new Set(i18nKeys.flatMap(key =>
      Object.keys(cds.i18n.labels.all(key))
        .filter(locale => locale !== defaultLang && cds.i18n.labels.all(key)[locale] !== cds.i18n.labels.at(key, defaultLang))
    ))
  ]
}

/**
 * Resolves an {i18n>KEY} placeholder to its translated value for the given locale.
 * Plain strings are returned unchanged. Falls back to the raw placeholder if no translation is found.
 * @param {string} value - The annotation value, e.g. '{i18n>BOOK_ORDERED_TITLE}' or a plain string
 * @param {string} locale - The locale code to resolve the translation for (e.g. 'de')
 * @returns {string} The resolved translation, or the original value if not an i18n placeholder
 */
function resolveI18n(value, locale) {
  if (typeof value !== 'string') return value
  const match = value.match(/^\{i18n>([^}]+)\}$/)
  if (!match) return value
  return cds.i18n.labels.at(match[1], locale) ?? value
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
