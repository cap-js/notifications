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

  for (const def of Object.values(cds.reflect(model).definitions)) {
    if (def.kind !== 'event') continue
    if (!Object.keys(def).some(k => k === '@notification' || k.startsWith('@notification.'))) continue

    const eventName = def.name.split('.').pop()
    const violations = Object.keys(def.elements ?? {}).filter(name => name.length > 128)
    if (violations.length) {
      throw new Error(
        `Event '${eventName}' has elements exceeding the maximum key length of 128 characters: ${violations.map(n => `'${n}'`).join(', ')}`
      )
    }

    const tmpl = { Language: 'en', TemplateLanguage: 'mustache' }
    if (def['@description'])                          tmpl.Description       = resolveI18n(def['@description'])
    if (def['@notification.template.title'])          tmpl.TemplateSensitive = resolveI18n(def['@notification.template.title'])
    if (def['@notification.template.publicTitle'])    tmpl.TemplatePublic    = resolveI18n(def['@notification.template.publicTitle'])
    if (def['@notification.template.subtitle'])       tmpl.Subtitle          = resolveI18n(def['@notification.template.subtitle'])
    if (def['@notification.template.groupedTitle'])   tmpl.TemplateGrouped   = resolveI18n(def['@notification.template.groupedTitle'])
    if (def['@notification.template.email.subject'])  tmpl.EmailSubject      = resolveI18n(def['@notification.template.email.subject'])
    if (def['@notification.template.email.html'])     tmpl.EmailHtml         = resolveI18n(def['@notification.template.email.html'])

    const type = {
      NotificationTypeKey: eventName,
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
  const match = value.match(/^\{i18n>([^}]+)\}$/)
  if (!match) return value
  return cds.i18n?.labels?.at(match[1], 'en') ?? value
}

module.exports = { notificationTypesFromModel }
