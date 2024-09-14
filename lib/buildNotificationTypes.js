const { supportedANSLanguages } = require("./utils");
const cds = require("@sap/cds");
const path = require("path");
const {TextBundle} = require('@sap/textbundle');

function buildNotificationType(_) {
  const notificationType = {
    NotificationTypeKey: _.NotificationTypeKey,
    NotificationTypeVersion: _.NotificationTypeVersion,
    Templates: _.Templates?.map(t => ({
      Language: t.Language,
      TemplateSensitive: t.TemplateSensitive,
      TemplatePublic: t.TemplatePublic,
      TemplateGrouped: t.TemplateGrouped,
      Subtitle: t.Subtitle,
      Description: t.Description,
      TemplateLanguage: t.TemplateLanguage,
      EmailSubject: t.EmailSubject,
      EmailHtml: t.EmailHtml,
      EmailText: t.EmailText
    })),
    Actions: _.Actions?.map(a => ({
      ActionId: a.ActionId,
      ActionText: a.ActionText,
      GroupActionText: a.GroupActionText,
    })),
    DeliveryChannels: _.DeliveryChannels?.map(d => ({
      Type: d.Type,
      Enabled: d.Enabled,
      DefaultPreference: d.DefaultPreference,
      EditablePreference: d.EditablePreference
    }))
  }
  return JSON.parse(JSON.stringify(notificationType));
}

const preprocessTypes = function (types) {
  if (!cds.env.requires.notifications) cds.env.requires.notifications = {}
  if (!cds.env.requires.notifications.defaults) cds.env.requires.notifications.defaults = {}

  for (let i = 0; i < types.length; i++) {
    const notificationType = types[i]
    if (notificationType.ID) {
      notificationType.NotificationTypeKey = notificationType.ID;
    }
    if (!notificationType.NotificationTypeVersion) notificationType.NotificationTypeVersion = "1"
    if (!notificationType.Templates) { //-> Languages not manually specified
      notificationType.Templates = [];
      for (const language in supportedANSLanguages) {
        const textBundle = new TextBundle(path.join(cds.root, (cds.env.i18n?.folders[0] ?? '_i18n') + '/notifications' ), language);
        const newTemplate = {
          Language: language,
          TemplateLanguage: 'Mustache'
        }
        const getVal = (property) => textBundle.getText(notificationType[property]?.code ?? notificationType[property], (notificationType[property]?.args ?? []).map(a => `{{${a}}}`))
        if (notificationType.TemplateSensitive) newTemplate.TemplateSensitive = getVal('TemplateSensitive');
        if (notificationType.TemplatePublic) newTemplate.TemplatePublic = getVal('TemplatePublic');
        if (notificationType.TemplateGrouped) newTemplate.TemplateGrouped = getVal('TemplateGrouped');
        if (notificationType.Subtitle) newTemplate.Subtitle = getVal('Subtitle');
        if (notificationType.Description) newTemplate.Description = getVal('Description');
        if (notificationType.EmailSubject) newTemplate.EmailSubject = getVal('EmailSubject');
        if (notificationType.EmailHtml) newTemplate.EmailHtml = getVal('EmailHtml');
        if (notificationType.EmailText) newTemplate.EmailText = getVal('EmailText');
        notificationType.Templates.push(newTemplate)
      }
    }

    if (notificationType.DeliveryChannels && !Array.isArray(notificationType.DeliveryChannels)) {
      const deliveryChannels = []
      for (const option in notificationType.DeliveryChannels) {
        deliveryChannels.push({
          Type: option.toUpperCase(),
          Enabled: !!notificationType.DeliveryChannels[option],
          DefaultPreference: !!notificationType.DeliveryChannels[option],
          EditablePreference: !!notificationType.DeliveryChannels[option]
        })
      }
      notificationType.DeliveryChannels = deliveryChannels;
    }

    //
    if (!cds.env.requires.notifications.defaults[notificationType.NotificationTypeKey])
      cds.env.requires.notifications.defaults[notificationType.NotificationTypeKey] = {}
    if (!cds.env.requires.notifications.defaults[notificationType.NotificationTypeKey][notificationType.NotificationTypeVersion]) {
      cds.env.requires.notifications.defaults[notificationType.NotificationTypeKey][notificationType.NotificationTypeVersion] = {
        priority: notificationType.Priority ?? 'Neutral',
        navigation: notificationType.Navigation ? {
          semanticObject : notificationType.SemanticObject ?? notificationType.semanticObject,
          semanticAction : notificationType.SemanticAction ?? notificationType.semanticAction,
        } : null,
        minDaysBetweenNotifications: notificationType.MinDaysBetweenNotifications ?? 0,
        properties : notificationType.Properties ?? {},
        targetParameters : notificationType.TargetParameters ? new Set(...notificationType.TargetParameters) : new Set()
      }
    }

    types[i] = buildNotificationType(notificationType)
  }
}

module.exports = {
  preprocessTypes
}
