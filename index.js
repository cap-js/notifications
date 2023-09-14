const notifier = require("./lib/notifications");

var ent = {
  d: {
    results: [
      {
        __metadata: {
          id: "https://notifications.cfapps.sap.hana.ondemand.com:443/odatav2/NotificationType.svc/NotificationTypes(guid'dc36f7d3-b4e3-40e8-81a2-9f1334b51a41')",
          uri: "https://notifications.cfapps.sap.hana.ondemand.com:443/odatav2/NotificationType.svc/NotificationTypes(guid'dc36f7d3-b4e3-40e8-81a2-9f1334b51a41')",
          type: "com.SAP.OData.V2.NotificationTypeService.NotificationType",
        },
        NotificationTypeId: "dc36f7d3-b4e3-40e8-81a2-9f1334b51a41",
        NotificationTypeKey: "NewApp",
        NotificationTypeVersion: "0.1",
        IsGroupable: true,
        Templates: {
          results: [
            {
              __metadata: {
                id: "https://notifications.cfapps.sap.hana.ondemand.com:443/odatav2/NotificationType.svc/Templates(NotificationTypeId=guid'dc36f7d3-b4e3-40e8-81a2-9f1334b51a41',Language='EN')",
                uri: "https://notifications.cfapps.sap.hana.ondemand.com:443/odatav2/NotificationType.svc/Templates(NotificationTypeId=guid'dc36f7d3-b4e3-40e8-81a2-9f1334b51a41',Language='EN')",
                type: "com.SAP.OData.V2.NotificationTypeService.Template",
              },
              NotificationTypeId: "dc36f7d3-b4e3-40e8-81a2-9f1334b51a41",
              Language: "EN",
              TemplatePublic: "New application is ready",
              TemplateSensitive: "New application!",
              TemplateGrouped: "The new application is ready",
              Description: null,
              TemplateLanguage: "DEFAULT",
              Subtitle: "Application notification",
              EmailSubject: null,
              EmailText: null,
              EmailHtml: null,
            },
          ],
        },
        Actions: {
          results: [],
        },
        DeliveryChannels: {
          results: [],
        },
      },
      {
        __metadata: {
          id: "https://notifications.cfapps.sap.hana.ondemand.com:443/odatav2/NotificationType.svc/NotificationTypes(guid'dc36f7d3-b4e3-40e8-81a2-9f1334b51a41')",
          uri: "https://notifications.cfapps.sap.hana.ondemand.com:443/odatav2/NotificationType.svc/NotificationTypes(guid'dc36f7d3-b4e3-40e8-81a2-9f1334b51a41')",
          type: "com.SAP.OData.V2.NotificationTypeService.NotificationType",
        },
        NotificationTypeId: "dc36f7d3-b4e3-40e8-81a2-9f1334b51a41",
        NotificationTypeKey: "NewApp",
        NotificationTypeVersion: "0.3",
        IsGroupable: true,
        Templates: {
          results: [
            {
              __metadata: {
                id: "https://notifications.cfapps.sap.hana.ondemand.com:443/odatav2/NotificationType.svc/Templates(NotificationTypeId=guid'dc36f7d3-b4e3-40e8-81a2-9f1334b51a41',Language='EN')",
                uri: "https://notifications.cfapps.sap.hana.ondemand.com:443/odatav2/NotificationType.svc/Templates(NotificationTypeId=guid'dc36f7d3-b4e3-40e8-81a2-9f1334b51a41',Language='EN')",
                type: "com.SAP.OData.V2.NotificationTypeService.Template",
              },
              NotificationTypeId: "dc36f7d3-b4e3-40e8-81a2-9f1334b51a41",
              Language: "EN",
              TemplatePublic: "New application is ready",
              TemplateSensitive: "New application!",
              TemplateGrouped: "The new application is ready",
              Description: null,
              TemplateLanguage: "DEFAULT",
              Subtitle: "Application notification",
              EmailSubject: null,
              EmailText: null,
              EmailHtml: null,
            },
          ],
        },
        Actions: {
          results: [],
        },
        DeliveryChannels: {
          results: [],
        },
      },
    ],
  },
};

var nt = [
  {
    NotificationTypeKey: "NewApp",
    NotificationTypeVersion: "0.1",
    IsGroupable: true,
    Templates: {
      results: [
        {
          Language: "EN",
          TemplatePublic: "New application is ready",
          TemplateSensitive: "New application!",
          TemplateGrouped: "The new application is ready",
          TemplateLanguage: "DEFAULT",
          Subtitle: "Application notification",
        },
      ],
    }
  },
  {
    NotificationTypeKey: "NewApp",
    NotificationTypeVersion: "0.2",
    IsGroupable: true,
    Templates: [
      {
        Language: "EN",
        TemplatePublic: "New application is ready",
        TemplateSensitive: "New application!",
        TemplateGrouped: "The new application is ready",
        TemplateLanguage: "DEFAULT",
        Subtitle: "Application notificationaaaaaa",
      },
    ],
  }
];

var nt2 = [
  {
    NotificationTypeKey: "UpdateUrgency",
    NotificationTypeVersion: "1",
    IsGroupable: true,
    Templates:
      {
        results:
          [
            {
              Language: "EN",
              TemplatePublic: "Incident '{{name}}' from '{{customer_name}}' Urgency Update",
              TemplateSensitive: "Incident '{{name}}' from '{{customer_name}}' Urgency Update",
              TemplateGrouped: "Incident Urgency Update",
              Description: null,
              TemplateLanguage: "MUSTACHE",
              Subtitle: "New Urgency: {{new_urgency}} | Old Urgency: {{old_urgency}}",
              EmailSubject: null,
              EmailText: null,
              EmailHtml: null,
            },
          ],
      },
    Actions: { results: [] },
    DeliveryChannels: { results: [] },
  },
  {
    NotificationTypeKey: "NewIncident",
    IsGroupable: true,
    Templates:
      {
        results:
          [
            {
              Language: "EN",
              TemplatePublic: "New Incident '{{name}}'",
              TemplateSensitive: "New Incident '{{name}}' from '{{customer_name}}'",
              TemplateGrouped: "New Incident {{count_total}}",
              Description: null,
              TemplateLanguage: "MUSTACHE",
              Subtitle: "Status: {{status}} | Urgency: {{urgency}}",
              EmailSubject: null,
              EmailText: null,
              EmailHtml: null,
            },
          ],
      },
    Actions: { results: [] },
    DeliveryChannels: { results: [] },
  },
  {
    NotificationTypeKey: "Default",
    NotificationTypeVersion: "1",
    IsGroupable: true,
    Templates:
      {
        results:
          [
            {
              Language: "EN",
              TemplatePublic: "{{title}}",
              TemplateSensitive: "{{title}}",
              TemplateGrouped: "Other Notifications",
              Description: "Other Notifications",
              TemplateLanguage: "MUSTACHE",
              Subtitle: "{{description}}",
              EmailSubject: null,
              EmailText: null,
              EmailHtml: null,
            },
          ],
      },
    Actions: { results: [] },
    DeliveryChannels: { results: [] },
  },
  {
    NotificationTypeKey: "UpdateStatus",
    IsGroupable: true,
    Templates:
      {
        results:
          [
            {
              Language: "EN",
              TemplatePublic: "Incident '{{name}}' Status Update",
              TemplateSensitive: "Incident '{{name}}' Status Update",
              TemplateGrouped: "Incident Status Update",
              Description: null,
              TemplateLanguage: "MUSTACHE",
              Subtitle: "New Status: {{new_status}} | Old Status: {{old_status}}",
            },
          ],
      },
    Actions: { results: [] },
    DeliveryChannels: { results: [] },
  },
]

console.log(notifier.applyNotificationTypes(nt2));
