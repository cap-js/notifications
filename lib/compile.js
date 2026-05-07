const cds = require('@sap/cds')

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

    const tmpl = { Language: 'en', TemplateLanguage: 'mustache' }
    if (def['@description'])       tmpl.Description      = def['@description']
    if (def['@notification.template.title'])          tmpl.TemplateSensitive = def['@notification.template.title']
    if (def['@notification.template.publicTitle'])    tmpl.TemplatePublic    = def['@notification.template.publicTitle']
    if (def['@notification.template.subtitle'])       tmpl.Subtitle          = def['@notification.template.subtitle']
    if (def['@notification.template.groupedTitle'])   tmpl.TemplateGrouped   = def['@notification.template.groupedTitle']
    if (def['@notification.template.email.subject'])  tmpl.EmailSubject      = def['@notification.template.email.subject']
    if (def['@notification.template.email.html'])     tmpl.EmailHtml         = def['@notification.template.email.html']

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

module.exports = { notificationTypesFromModel }
