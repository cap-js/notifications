const { executeHttpRequest, buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { getNotificationDestination, doesKeyExist, getPrefix, getNotificationTypesKeyWithPrefix } = require("./utils");

const NOTIFICATION_TYPES_API_ENDPOINT = "v2/NotificationType.svc";

const defaultTemplate = {
  "NotificationTypeKey": getNotificationTypesKeyWithPrefix("Default"),
  "NotificationTypeVersion": "1",
  "Templates": [
    {
      "Language": "en",
      "Description": "Other Notifications",
      "TemplatePublic": "{{text}}",
      "TemplateSensitive": "{{text}}",
      "TemplateGrouped": "Other Notifications",
      "TemplateLanguage": "mustache",
      "Subtitle": "{{text}}"
    }
  ]
}

function createNotificationTypesMap(notificationTypesJSON) {
  const types = {};

  // add default template
  const defaultNotificationTemplateKey = defaultTemplate.NotificationTypeKey;
  types[defaultNotificationTemplateKey] = {};
  types[defaultNotificationTemplateKey]["1"] = defaultTemplate;

  // add user provided templates
  notificationTypesJSON.forEach((notificationType) => {
    const notificationTypeKeyWithPrefix = getNotificationTypesKeyWithPrefix(notificationType.NotificationTypeKey);

    // update the notification type key with prefix
    notificationType.NotificationTypeKey = notificationTypeKeyWithPrefix;

    if (!doesKeyExist(types, notificationTypeKeyWithPrefix)) {
      types[notificationTypeKeyWithPrefix] = {};
    }

    types[notificationTypeKeyWithPrefix][notificationType.NotificationTypeVersion] = notificationType;
  });

  return types;
}

async function getNotificationTypes() {
  const notificationDestination = await getNotificationDestination();
  const response = await executeHttpRequest(notificationDestination, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes?$format=json&$expand=Templates,Actions,DeliveryChannels`,
    method: "get",
  });
  return response.data.d.results;
}

async function createNotificationType(notificationType) {
  const notificationDestination = await getNotificationDestination();
  const csrfHeaders = await buildCsrfHeaders(notificationDestination, {
    url: NOTIFICATION_TYPES_API_ENDPOINT,
  });

  console.log(
    `Notification Type of key ${notificationType.NotificationTypeKey} and version ${notificationType.NotificationTypeVersion} was not found. Creating it...`
  );

  const response = await executeHttpRequest(notificationDestination, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes`,
    method: "post",
    data: notificationType,
    headers: csrfHeaders,
  });
  return response.data.d;
}

async function updateNotificationType(id, notificationType) {
  const notificationDestination = await getNotificationDestination();
  const csrfHeaders = await buildCsrfHeaders(notificationDestination, {
    url: NOTIFICATION_TYPES_API_ENDPOINT,
  });
  
  console.log(
    `Detected change in notification type of key ${notificationType.NotificationTypeKey} and version ${notificationType.NotificationTypeVersion}. Updating it...`
  );

  const response = await executeHttpRequest(notificationDestination, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes(guid'${id}')`,
    method: "patch",
    data: notificationType,
    headers: csrfHeaders,
  });
  return response.status;
}

async function deleteNotificationType(notificationType) {
  const notificationDestination = await getNotificationDestination();
  const csrfHeaders = await buildCsrfHeaders(notificationDestination, {
    url: NOTIFICATION_TYPES_API_ENDPOINT,
  });

  console.log(
    `Notification Type of key ${notificationType.NotificationTypeKey} and version ${notificationType.NotificationTypeVersion} not present in the types file. Deleting it...`
  );

  const response = await executeHttpRequest(notificationDestination, {
    url: `${NOTIFICATION_TYPES_API_ENDPOINT}/NotificationTypes(guid'${notificationType.NotificationTypeId}')`,
    method: "delete",
    headers: csrfHeaders,
  });
  return response.status;
}

function _createChannelsMap(channels) {
  const channelMap = {};

  channels.forEach((channel) => {
    channelMap[channel.Type] = channel;
  })

  return channelMap;
}

function areDeliveryChannelsSame(oldChannels = [], newChannels = []) {
  if(oldChannels.length !== newChannels.length) {
    return false;
  }

  const oldChannelsMap = _createChannelsMap(oldChannels);
  const newChannelsMap = _createChannelsMap(newChannels);

  for(type of Object.keys(oldChannelsMap)) {
    if(!(type in newChannelsMap)) return false;
    
    const oldChannel = oldChannelsMap[type];
    const newChannel = newChannelsMap[type];

    // TODO: Check if language is not there
    const same =
      oldChannel.Type == newChannel.Type.toUpperCase() &&
      oldChannel.Enabled == newChannel.Enabled &&
      oldChannel.DefaultPreference == newChannel.DefaultPreference &&
      oldChannel.EditablePreference == newChannel.EditablePreference;

    if(!same) return false;
    delete newChannelsMap[type];
  }

  return Object.keys(newChannelsMap).length == 0;
}

function _createActionsMap(actions) {
  const actionsMap = {};

  actions.forEach((action) => {
    actionsMap[ActionId] = action;
  })

  return actionsMap;
}

function areActionsSame(oldActions = [], newActions = []) {
  if(oldActions.length !== newActions.length) {
    return false;
  }

  const oldActionsMap = _createActionsMap(oldActions);
  const newActionsMap = _createActionsMap(newActions);

  for(actionId of Object.keys(oldActionsMap)) {
    if(!(actionId in newActionsMap)) return false;

    const oldAction = oldActionsMap[actionId];
    const newAction = newActionsMap[actionId];

    const same =
      oldAction.Language == newAction.Language.toUpperCase() &&
      oldAction.ActionId == newAction.ActionId &&
      oldAction.ActionText == newAction.ActionText &&
      oldAction.GroupActionText == newAction.GroupActionText &&
      oldAction.Nature == newAction.Nature;

    if(!same) return false;
    delete newAction[actionId];
  }

  return Object.keys(newActionsMap).length == 0;
}

function _createTemplatesMap(templates, toCaps) {
  const templatesObj = {};

  templates.forEach((template) => {
    
    if(toCaps) {
      template.Language = template.Language.toUpperCase();
    }

    templatesObj[template.Language] = template;
  })

  return templatesObj;
}

function areTemplatesSame(oldTemplates = [], newTemplates = []) {
  if(oldTemplates.length !== newTemplates.length) {
    return false;
  }

  const oldTemplatesMap = _createTemplatesMap(oldTemplates);
  const newTemplatesMap = _createTemplatesMap(newTemplates, true);

  for(language of Object.keys(oldTemplatesMap)) {
    if(!(language in newTemplatesMap)) return false;
    
    const oldTemplate = oldTemplatesMap[language];
    const newTemplate = newTemplatesMap[language];

    const same =
      oldTemplate.Language == newTemplate.Language &&
      oldTemplate.TemplatePublic == newTemplate.TemplatePublic &&
      oldTemplate.TemplateSensitive == newTemplate.TemplateSensitive &&
      oldTemplate.TemplateGrouped == newTemplate.TemplateGrouped &&
      oldTemplate.Description == newTemplate.Description &&
      oldTemplate.TemplateLanguage == newTemplate.TemplateLanguage.toUpperCase() &&
      oldTemplate.Subtitle == newTemplate.Subtitle &&
      oldTemplate.EmailSubject == newTemplate.EmailSubject &&
      oldTemplate.EmailText == newTemplate.EmailText &&
      oldTemplate.EmailHtml == newTemplate.EmailHtml;

    if(!same) return false;
    delete newTemplatesMap[language];
  }

  return Object.keys(newTemplatesMap).length == 0;
}

function isNotificationTypeSame(oldNotificationType, newNotificationType) {
  // if(oldNotificationType.IsGroupable != newNotificationType.IsGroupable) {
  //   return false;
  // }

  if(!areTemplatesSame(oldNotificationType.Templates.results, newNotificationType.Templates)) {
    return false;
  }

  if(!areActionsSame(oldNotificationType.Actions.results, newNotificationType.Actions)) {
    return false;
  }

  if(!areDeliveryChannelsSame(oldNotificationType.DeliveryChannels.results, newNotificationType.DeliveryChannels)) {
    return false;
  }

  return true;
}

async function processNotificationTypes(notificationTypes) {
  const prefix = getPrefix();

  // get notficationTypes
  const existingTypes = await getNotificationTypes();

  // iterate through notification types
  for(let existingType of existingTypes) {
    if(!existingType.NotificationTypeKey.startsWith(`${prefix}/`)) {
      continue;
    }

    // if the type isn't present in the JSON file, delete it
    if(notificationTypes[existingType.NotificationTypeKey] === undefined || notificationTypes[existingType.NotificationTypeKey][existingType.NotificationTypeVersion] === undefined) {
      await deleteNotificationType(existingType);
      continue;
    }

    const newType = JSON.parse(JSON.stringify(notificationTypes[existingType.NotificationTypeKey][existingType.NotificationTypeVersion]));

    // if the type is there then verify if everything is same or not
    if(!isNotificationTypeSame(existingType, newType)) {
      await updateNotificationType(existingType.NotificationTypeId, notificationTypes[existingType.NotificationTypeKey][existingType.NotificationTypeVersion])
    } else {
      console.log(
        `Notification Type of key ${existingType.NotificationTypeKey} and version ${existingType.NotificationTypeVersion} unchanged.`
      );
    }

    delete notificationTypes[existingType.NotificationTypeKey][existingType.NotificationTypeVersion];
    if(Object.keys(notificationTypes[existingType.NotificationTypeKey]).length == 0) {
      delete notificationTypes[existingType.NotificationTypeKey];
    }
  }

  // create notification types that aren't there
  for(let notificationTypeKey in notificationTypes) {
    for(let notificationTypeVersion in notificationTypes[notificationTypeKey]) {
      await createNotificationType(notificationTypes[notificationTypeKey][notificationTypeVersion]);
    }
  }
}

module.exports = {
  createNotificationTypesMap,
  processNotificationTypes
}