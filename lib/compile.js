const cds = require('@sap/cds')

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

  const projectFiles = Object.entries(cds.i18n.labels.files)
    .filter(([folder]) => !folder.includes('node_modules'))
    .flatMap(([, files]) => files)
  const candidateLocales = new Set(
    projectFiles
      .map(f => f.match(/^i18n_(.+)\.properties$/)?.[1])
      .filter(Boolean)
  )

  const enTexts = cds.i18n.labels.texts4('en')

  for (const def of model.definitions) {
    if (def.kind !== 'event') continue
    if (!Object.keys(def).some(k => k === '@notification' || k.startsWith('@notification.'))) continue

    const i18nKeys = Object.values(def)
      .filter(v => typeof v === 'string')
      .map(v => v.match(/^\{i18n>([^}]+)\}$/)?.[1])
      .filter(Boolean)

    const localeTexts = [
      { locale: 'en', texts: enTexts },
      ...Array.from(candidateLocales)
        .map(locale => ({ locale, texts: cds.i18n.labels.texts4(locale) }))
        .filter(({ texts }) => i18nKeys.some(key => texts[key] && texts[key] !== enTexts[key]))
    ]

    const templates = localeTexts.map(({ locale, texts }) => {
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

function resolveI18n(value, texts) {
  if (typeof value !== 'string') return value
  const match = value.match(/^\{i18n>([^}]+)\}$/)
  if (!match) return value
  return texts[match[1]] ?? value
}

module.exports = { notificationTypesFromModel }
