[![REUSE status](https://api.reuse.software/badge/github.com/cap-js/notifications)](https://api.reuse.software/info/github.com/cap-js/notifications)

# Notifications Plugin

The `@cap-js/notifications` package is a [CDS plugin](https://cap.cloud.sap/docs/node.js/cds-plugins#cds-plugin-packages) that provides support for publishing business notifications in SAP Build Work Zone.

### Table of Contents

- [Setup](#setup)
- [Send Notifications](#send-notifications)
- [Use Notification Types](#use-notification-types)
- [API Reference](#api-reference)
- [Test-drive Locally](#test-drive-locally)
- [Run in Production](#run-in-production)
- [Advanced Usage](#advanced-usage)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [Licensing](#licensing)


## Setup

To enable notifications, simply add this self-configuring plugin package to your project:

```sh
 npm add @cap-js/notifications
```

In this guide, we use the [Bookshop reference sample app](https://github.com/capire/bookshop) as the basis for publishing notifications.


## Send Notifications

With that you can use the NotificationService as any other CAP Service like so in you event handlers:

```js
const alert = await cds.connect.to('notifications')
```

You can use the following signature to send the simple notification with title and description

```js
alert.notify({
  recipients: [ ...readers() ],
  priority: "HIGH",
  title: "New book arrived!",
  description: "Book 'Wuthering Heights' has been added to the catalogue."
})
```

> **Note:** The simple API supports only: `recipients`, `priority`, `title`, and `description`. For advanced properties like `ActorId`, `NavigationTargetObject`, `TargetParameters`, etc., use a [named notification type](#use-notification-types) or the [low-level API](#low-level-notifications-api).

* **priority** - Priority of the notification, this argument is optional, it defaults to NEUTRAL
* **description** - Subtitle for the notification, this argument is optional


## Use Notification Types

The plugin supports two ways to define notification types. These can be combined with types from both sources are merged at startup.

### 1. Add notification types

#### Option A: CDS Annotations

The recommended approach is to annotate CDS events directly in your service model. The plugin discovers these at startup and registers them as notification types automatically. No separate file is needed.

Define events in your `srv/` model and annotate them with `@notification`:

```cds
@description: 'Sent when a book is ordered'
@notification: {
  template: {
    title        : 'Book {{title}} Ordered',
    publicTitle  : 'Book Ordered',
    subtitle     : '{{buyer}} ordered {{title}}',
    groupedTitle : 'Bookshop Updates'
  }
}
@Common.SemanticObject: 'Books'
@Common.SemanticObjectAction: 'display'
event BookOrdered {
  title : String;
  buyer : String;
}
```

Any event with at least one `@notification` annotation (the bare `@notification` flag or any `@notification.*` property) is picked up as a notification type. The notification type key is derived from the event name. Namespace prefixes are stripped, so `my.bookshop.BookOrdered` becomes `BookOrdered`.

> **Note:** The plugin automatically injects a `recipients` element into every notification event at model-load time, no need to declare it yourself.

> **Note:** Be sure that the event is contained within a service. This can be done by wrapping the event with a service or using the keyword `using` to include the event within an existing service.

The following annotations are supported:

| Annotation | Notification field |
|---|---|
| `@description` | `Description` |
| `@notification.template.title` | `TemplateSensitive` |
| `@notification.template.publicTitle` | `TemplatePublic` |
| `@notification.template.subtitle` | `Subtitle` |
| `@notification.template.groupedTitle` | `TemplateGrouped` |
| `@notification.template.email.subject` | `EmailSubject` |
| `@notification.template.email.html` | `EmailHtml` |
| `@Common.SemanticObject` | `NavigationTargetObject` |
| `@Common.SemanticObjectAction` | `NavigationTargetAction` |

Annotation values support `{i18n>key}` syntax. Keys are resolved against your project's `_i18n/i18n.properties` English labels at startup:

```cds
@notification.template.title:    '{i18n>BOOK_ORDERED_TITLE}'
@notification.template.subtitle: '{i18n>BOOK_ORDERED_SUBTITLE}'
event BookOrdered { ... }
```

**Build integration:** Running `cds build` also processes `@notification`-annotated events and writes a merged `notification-types.json` to the build output. This file combines types derived from your CDS annotations with any types defined in the JSON file.

#### Option B: JSON file

As an alternative (or in addition) to CDS annotations, you can define types statically in `srv/notification-types.json`:

```json
[
  {
    "NotificationTypeKey": "BookOrdered",
    "NotificationTypeVersion": "1",
    "Templates": [
      {
        "Language": "en",
        "TemplatePublic": "Book Ordered",
        "TemplateSensitive": "Book '{{title}}' Ordered",
        "TemplateGrouped": "Bookshop Updates",
        "TemplateLanguage": "mustache",
        "Subtitle": "{{buyer}} ordered {{title}}."
      }
    ]
  }
]
```

#### Email Delivery

To enable email delivery for a notification type, add `deliveryChannels` and email template fields. Both definition approaches support this.

**Via CDS annotations:**

```cds
@notification: {
  template: {
    title        : 'Book {{title}} Ordered',
    publicTitle  : 'Book Ordered',
    subtitle     : '{{buyer}} ordered {{title}}',
    groupedTitle : 'Bookshop Updates',
    email: {
      subject: 'Your order: {{title}}',
      html   : '<p>Thanks for ordering <b>{{title}}</b>!</p>'
    }
  },
  deliveryChannels: [{ channel: #Mail, enabled: true, defaultPreference: true, editablePreference: true }]
}
event BookOrdered { ... }
```

**Via JSON:**

```json
{
  "NotificationTypeKey": "BookOrdered",
  "Templates": [
    {
      "Language": "en",
      "TemplatePublic": "Book Ordered",
      "TemplateSensitive": "Book '{{title}}' Ordered",
      "TemplateGrouped": "Bookshop Updates",
      "TemplateLanguage": "mustache",
      "EmailSubject": "Your order: {{title}}",
      "EmailHtml": "<p>Thanks for ordering <b>{{title}}</b>!</p>"
    }
  ],
  "DeliveryChannels": [
    { "Type": "MAIL", "Enabled": true, "DefaultPreference": true, "EditablePreference": true }
  ]
}
```

> **Note:** Email delivery requires the SAP Alert Notification service with the `business-notifications` plan and a corresponding BTP destination. The `business-notifications` plan enforces that `TemplatePublic` and `TemplateGrouped` are set on all notification types (including those without email).

### 2. Use pre-defined types in your code like that:

```js
  await alert.notify ('BookOrdered', {
    recipients: [ buyer.id ],
    data: {
      title: book.title,
      buyer: buyer.name,
    }
  })
```

## API Reference

* **recipients** - List of the recipients, this argument is mandatory
* **type** - Notification type key, this argument is mandatory
* **priority** - Priority of the notification, this argument is optional, it defaults to NEUTRAL
* **data** - A key-value pair that is used to fill a placeholder of the notification type template, this argument is optional


## Test-drive Locally
In local environment, when you publish notification, it is mocked to publish the nofication to the console.

<img width="700" alt="Notify to console" style="border-radius:0.5rem" src="_assets/notifyToConsole.png">


## Run in Production

#### Notification Destination

As a pre-requisite to publish the notification, you need to have a [destination](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/enabling-notifications-for-custom-apps-on-sap-btp-cloud-foundry#configure-the-destination-to-the-notifications-service) configured to publish the notification. The plugin is pre-configured to use destination name `SAP_Notifications` by default for hybrid and production environments. You can override this in your application's CDS configuration if needed (see [Advanced Usage](#advanced-usage) section below). 

#### Integrate with SAP Build Work Zone

Once application is deployed and integrated with SAP Build Work Zone, you can see the notification under Fiori notifications icon!

<img width="1300" alt="Sample Application Demo" style="border-radius:0.5rem;" src="_assets/incidentsNotificationDemo.gif">

#### Notification Type Registration

Notification types are automatically registered and synced with the notification service each time the application starts in hybrid or production mode. No manual `cds build` or content deployment step is required as any additions, changes, or removals to your notification types (whether defined via CDS annotations or JSON) are applied on the next startup.


## Advanced Usage

### Custom Notification Types Path

Notifications plugin configures `srv/notification-types.json` as default notification types file. If you are using different file, you can update the file path in `cds.env.requires.notifications.types` 

### Custom Notification Type Prefix

To make notification types unique to the application, prefix is added to the type key. By default, `application name` is added as the prefix. You can update the `cds.env.requires.notifications.prefix` if required.

### Authentication Identifier

`cds.env.requires.notifications.authenticationIdentifier` controls which recipient key the plugin uses when publishing notifications. Supported values:

- `auto` (default): the recipient key is chosen per recipient. Values matching the UUID format are published with `GlobalUserId`, everything else with `RecipientId`. If a value is neither a UUID nor an email a warning is logged. This allows mixing UUIDs and emails in the same `recipients` array without additional configuration.
- `UserUUID`: always publish with `GlobalUserId`. Use this when the authentication identifier in Work Zone is set to `User ID`.
- `RecipientId`: always publish with `RecipientId`. Use this when recipients are identified by email or login name.

Note, that in order for E-Mail Notifications to be sent for notifications published with a User ID, a destination to the IDS needs to be configured for the lookup of the corresponding email address.

For the Work Zone Authentication Identifier configuration details refer to: [Work Zone Subaccount Settings](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/subaccount-settings)

### Value Length Constraints

The ANS API enforces maximum lengths on `Properties` and `TargetParameters` values. The plugin validates these automatically when emitting a notification:

- **`Properties`**: if any `Value` exceeds **255 characters**, an error is thrown and the notification is not sent.
- **`TargetParameters`**: entries whose `Value` exceeds **250 characters** are silently removed before the notification is sent.

These constraints are applied in the `on` handler before the notification reaches the transport layer.

### Low-level  Notifications API

You can use these two signature to send the custom notification with pre-defined notification types.

#### With pre-defined parameters

By using this approach you can send notifications with the predefined parameters - recipients, data, priority, type and other parameters listed in the [API documentation](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/developing-cloud-foundry-applications-with-notifications) 

```js
alert.notify({
  recipients: [...readers()],
  type: "BookOrdered",
  priority: 'NEUTRAL',
  data: {
    title: book.title,
    buyer: buyer.name,
  },
  OriginId: "Example Origin Id",
  NotificationTypeVersion: "1",
  ProviderId: "/SAMPLEPROVIDER",
  ActorId: "BACKENDACTORID",
  ActorDisplayText: "ActorName",
  ActorImageURL: "https://some-url",
  NotificationTypeTimestamp: "2022-03-15T09:58:42.807Z",
  TargetParameters: [
    {
      "Key": "string",
      "Value": "string"
    }
   ]
  })
```

#### Passing the whole notification object

By using this approach you need to pass the whole notification object as described in the [API documentation](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/developing-cloud-foundry-applications-with-notifications)

```js
alert.notify({
  NotificationTypeKey: 'BookOrdered',
  NotificationTypeVersion: '1',
  Priority: 'NEUTRAL',
  Properties: [
    {
      Key: 'title',
      IsSensitive: false,
      Language: 'en',
      Value: 'Wuthering Heights',
      Type: 'String'
    },
    {
      Key: 'buyer',
      IsSensitive: false,
      Language: 'en',
      Value: 'reader@bookshop.com',
      Type: 'String'
    }
  ],
  Recipients: [{ RecipientId: "reader1@bookshop.com" },{ RecipientId: "reader2@bookshop.com" }]
})
```

## Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/cap-js/change-tracking/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).


## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](CODE_OF_CONDUCT.md) at all times.


## Licensing

Copyright 2023 SAP SE or an SAP affiliate company and contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/cap-js/change-tracking).
