const cds = require('@sap/cds')

const ANS_SUPPORTED_LANGUAGES = [
  'en', 'af', 'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'es', 'et', 'fi', 'fr', 'he', 'hi',
  'hr', 'hu', 'id', 'is', 'it', 'ja', 'km', 'ko', 'lt', 'lv', 'ms', 'nb', 'nl', 'no', 'pl',
  'pt', 'ro', 'ru', 'sh', 'sk', 'sl', 'sr', 'sv', 'th', 'tr', 'uk', 'vi', 'zh-Hans', 'zh-Hant'
]

function resolveEnum(val) {
  if (val && typeof val === 'object' && '=' in val) return val['=']
  return val
}

function notificationTypesFromModel(model) {
  if (!model) return []
  const types = []

  for (const def of Object.values(cds.reflect(model).definitions)) {
    if (def.kind !== 'event') continue
    if (!Object.keys(def).some(k => k === '@notification' || k.startsWith('@notification.'))) continue

    const templates = ANS_SUPPORTED_LANGUAGES.map(lang => {
      const tmpl = { Language: lang, TemplateLanguage: 'mustache' }
      if (def['@description'])                          tmpl.Description       = resolveI18n(def['@description'], lang)
      if (def['@notification.template.title'])          tmpl.TemplateSensitive = resolveI18n(def['@notification.template.title'], lang)
      if (def['@notification.template.publicTitle'])    tmpl.TemplatePublic    = resolveI18n(def['@notification.template.publicTitle'], lang)
      if (def['@notification.template.subtitle'])       tmpl.Subtitle          = resolveI18n(def['@notification.template.subtitle'], lang)
      if (def['@notification.template.groupedTitle'])   tmpl.TemplateGrouped   = resolveI18n(def['@notification.template.groupedTitle'], lang)
      if (def['@notification.template.email.subject'])  tmpl.EmailSubject      = resolveI18n(def['@notification.template.email.subject'], lang)
      if (def['@notification.template.email.html'])     tmpl.EmailHtml         = resolveI18n(def['@notification.template.email.html'], lang)
      return tmpl
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

function resolveI18n(value, locale = 'en') {
  if (typeof value !== 'string') return value
  const match = value.match(/^\{i18n>([^}]+)\}$/)
  if (!match) return value
  return cds.i18n?.labels?.at(match[1], locale)
      ?? cds.i18n?.labels?.at(match[1], 'en')
      ?? value
}

module.exports = { notificationTypesFromModel }
