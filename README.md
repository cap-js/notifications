[![REUSE status](https://api.reuse.software/badge/github.com/cap-js/notifications)](https://api.reuse.software/info/github.com/cap-js/notifications)

# Notifications Plugin

The `@cap-js/notifications` package is a [CDS plugin](https://cap.cloud.sap/docs/node.js/cds-plugins#cds-plugin-packages) that provides support for publishing business notifications in SAP Build Work Zone.

### Table of Contents

- [Setup](#setup)
- [Getting Started](#getting-started)
- [Define Notification Types](#define-notification-types)
- [Send Notifications](#send-notifications)
- [API Reference](#api-reference)
- [Test-drive Locally](#test-drive-locally)
- [Run in Production](#run-in-production)
- [Advanced Usage](#advanced-usage)
  - [Custom Notification Types Path](#custom-notification-types-path)
  - [Custom Notification Type Prefix](#custom-notification-type-prefix)
  - [Custom Destination Name](#custom-destination-name)
  - [Authentication Identifier](#authentication-identifier)
  - [Default Email Delivery](#default-email-delivery)
  - [Outbox Behavior](#outbox-behavior)
  - [Low-level Notifications API](#low-level-notifications-api)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [Licensing](#licensing)


## Setup

**Requirements:** Node.js >= 20, `@sap/cds` >= 8.

To enable notifications, simply add this self-configuring plugin package to your project:

```sh
npm add @cap-js/notifications
```


## Getting Started

After installing the plugin, you can send notifications in two ways:

### Quick start: Direct notification

Send a simple notification using `notify()`:

```js
const alert = await cds.connect.to('notifications')

await alert.notify({
  recipients: ['user@example.com'],
  title: 'Book Order Received',
  description: 'Your order for "Wuthering Heights" is being processed.'
})
```

### Recommended: Define notification types

Define a notification event in your service model with `@notification`:

```cds
using { CatalogService } from './cat-service';

extend service CatalogService with {
  @notification: {
    template: {
      title: 'Book {{title}} Ordered',
      subtitle: '{{buyer}} ordered {{title}}'
    }
  }
  event BookOrdered {
    title : String;
    buyer : String;
  }
}
```

Emit the event from your service handler:

```js
this.on('submitOrder', async req => {
  // ... process order ...
  
  await this.emit('BookOrdered', {
    title: book.title,
    buyer: req.user.id,
    recipients: ['user@example.com']
  })
})
```

The plugin intercepts the event and sends the notification automatically. During local development, notifications are printed to the console. No BTP connection required.

To explore a complete working example, see the [Bookshop sample](https://github.com/cap-js/notifications/tree/main/tests/bookshop) in `tests/bookshop`.

---


## Define Notification Types

Notifications are based on *notification types*: templates that define the structure of notifications with titles, subtitles, and email content. These types can be defined in two ways, both of which can be used together and are merged at startup.

### 1. CDS Annotations (recommended)

The recommended approach is to define the notification type directly in your service model by annotating events with `@notification`. The plugin discovers and registers them automatically during startup.

```cds
using { CatalogService } from './cat-service';

extend service CatalogService with {
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
}
```

The notification type key is derived from the event name. Namespace prefixes are stripped, `my.bookshop.BookOrdered` becomes `BookOrdered`.

> [!Note]
> The plugin automatically injects a `recipients` element into every notification event at model-load time. You don't need to declare it yourself.

> [!IMPORTANT]
> The event must be contained within a service either by defining it directly inside a `service` or by using `extend service` / `using` to include it in an existing one.

**Common annotations:**

```cds
@notification: {
  template: {
    title        : 'Book {{title}} Ordered',
    publicTitle  : 'Book Ordered',
    subtitle     : '{{buyer}} ordered {{title}}',
    groupedTitle : 'Bookshop Updates', // Group header for multiple notifications
    email: {
      subject: 'Your order: {{title}}',
      html   : './email-template.html' // Path to HTML template or inline HTML
    }
  },
  priority: #HIGH // Priority: LOW, NEUTRAL, MEDIUM, HIGH
}
event BookOrdered { ... }
```

For a complete list of supported annotations and their mappings, see [Annotation Reference](#annotation-reference).

#### i18n support

The `@notification` annotation values support `{i18n>key}` syntax. The keys are automatically resolved against your project's i18n bundles at startup. Templates are generated for each locale where at least one translation differs from the default language.


```cds
@notification.template.title:    '{i18n>BOOK_ORDERED_TITLE}'
@notification.template.subtitle: '{i18n>BOOK_ORDERED_SUBTITLE}'
event BookOrdered { ... }
```

#### Priority

Notifications can be assigned different priority levels: `LOW`, `NEUTRAL` (default), `MEDIUM`, or `HIGH`. These priorities affect how notifications are displayed and sorted in SAP Build Work Zone.

Priorities can be set statically using `#` enum values, or dynamically using [CDS Expression Language (CXL)](https://cap.cloud.sap/docs/cds/cxl) with conditions evaluated at runtime.

**Static priority:**

```cds
@notification.priority: #HIGH
event BookOrdered { ... }
```

**Dynamic priority:**

Priority can be computed at runtime from event data using CDS ternary expressions evaluated against the database:

```cds
@notification.priority: (quantity > 5 ? #HIGH : #LOW)
event BookOrdered {
  quantity : Integer;
  title    : String;
}
```

Complex expressions using CDS functions are also supported:

```cds
@notification.priority: (days_between(orderDate, deliveryDate) > 7 ? #HIGH : #LOW)
event LateDelivery {
  orderDate    : Date;
  deliveryDate : Date;
}
```

Dynamic priority requires the event to be emitted via `this.emit(...)` so the plugin can intercept and evaluate it.

#### HTML email templates

The `email.html` annotation accepts either an inline HTML string or a path to an `.html` file relative to the `.cds` source file:

```cds
@notification: {
  template: {
    email: {
      subject: 'Your order: {{title}}',
      html   : './book-ordered-email.html'
    }
  }
}
event BookOrdered { ... }
```

#### Build integration

Running `cds build` processes all `@notification` annotated events and generates a merged `notification-types.json` to the build output, combining types from CDS annotations with any types from the JSON file.

### 2. JSON file

An alternative approach is to define notification types statically in `srv/notification-types.json` or a custom path (see [Custom Notification Types Path](#custom-notification-types-path)):

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

> [!Warning]
>
> i18n resolution, HTML file paths, and priority annotations (`@notification.priority`) are only available when using CDS annotations. The JSON file format uses pre-resolved strings.

### Email delivery

Email delivery can be configured for notification types in both approaches. It requires the SAP Alert Notification service with the `business-notifications` plan and a configured [SMTP mail destination](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/configuring-smtp-mail-destination).

> [!Warning]
>
> The `business-notifications` plan validates **all** of your notification types at registration time, not only the ones with email. This means every notification type in your app, even purely in-app ones, must have `TemplatePublic` (mapped from `publicTitle`) and `TemplateGrouped` (mapped from `groupedTitle`) set, or startup registration will fail.


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
      html   : './book-ordered-email.html'
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


## Send Notifications

There are two patterns for sending notifications.

### Pattern 1: Emit a CDS event (recommended)

If you defined your notification type as a CDS event with `@notification` annotation, you can simply emit the event from your service handler:

```js
this.on('submitOrder', async req => {
  const book = await SELECT.one.from('Books').where({ ID: req.data.book })

  await this.emit('BookOrdered', {
    title: book.title,
    buyer: req.user.id,
    recipients: ['reader@bookshop.example'],
  })
})
```

The plugin registers an event handler which forwards the notification to ANS. In addition, you can still register your own event handlers if you need to process the event yourself. The plugin's handler runs alongside it.

### Pattern 2: Call notify() directly

You can also connect to the notification service and call `notify()` directly. This works with or without pre-defined notification types.

**Simple notification** (no pre-defined type needed):

```js
const alert = await cds.connect.to('notifications')

await alert.notify({
  recipients: [ ...readers() ],
  priority: "HIGH",
  title: "New book arrived!",
  description: "Book 'Wuthering Heights' has been added to the catalogue."
})
```

> [!Warning]
>
> The simple API supports only `recipients`, `priority`, `title`, and `description`. For advanced properties use a named notification type or the [low-level API](#low-level-notifications-api).

**Named notification type:**

```js
await alert.notify('BookOrdered', {
  recipients: [ buyer.id ],
  data: {
    title: book.title,
    buyer: buyer.name,
  }
})
```

### Batch notifications

Pass an array to `notify()` to send multiple notifications in a single call. This triggers only one outbox event, reducing the number of transactions. If some notifications fail, successful ones are still delivered. Failures are logged as warnings, and the call only throws if **all** notifications fail.

```js
alert.notify('BookOrdered', [
  { recipients: [ buyer1.id ], data: { title: book.title, buyer: buyer1.name } },
  { recipients: [ buyer2.id ], data: { title: book.title, buyer: buyer2.name } },
])
```

> [!Warning]
>
> Batch sending is only available via `notify([...])`. CDS event emission dispatches one event per call.

Alternatively, you can use the default notification template:

```js
await alert.notify([
  { type: 'BookOrdered', recipients: [buyer1.id], data: { title: book1.title, buyer: buyer1.name } },
  { type: 'BookOrdered', recipients: [buyer2.id], data: { title: book2.title, buyer: buyer2.name } },
])
```

---

## API Reference

### Simple Notification

For `notify({ recipients, title, ... })`, no pre-defined notification type is needed. The plugin uses a built-in `Default` template.

| Parameter | Required | Description |
|---|---|---|
| `recipients` | yes | Array of recipient identifiers: email addresses or SAP BTP Global User IDs (UUIDs) |
| `title` | yes | Notification title string |
| `priority` | no | `LOW`, `NEUTRAL` (default), `MEDIUM`, or `HIGH` |
| `description` | no | Subtitle text |

### Named Notification Type

For `notify('TypeKey', payload)` or `notify({ type: 'TypeKey', ... })`, a notification using a pre-defined notification type is sent.

| Parameter | Required | Description |
|---|---|---|
| `recipients` | yes | Array of recipient identifiers: email addresses or SAP BTP Global User IDs (UUIDs) |
| `type` | yes | Notification type key (e.g. `'BookOrdered'`) |
| `data` | no | Key-value pairs used to fill mustache placeholders in the type template |
| `priority` | no | `LOW`, `NEUTRAL` (default), `MEDIUM`, or `HIGH` |

> **Note:** Recipients can be email addresses (e.g. `user@example.com`) or SAP BTP Global User IDs (UUID format, e.g. `a1b2c3d4-...`). In `auto` mode (default), the plugin detects the format per recipient and uses the correct key automatically. See [Authentication Identifier](#authentication-identifier) for details.

### Validation

- **Property values** must not exceed **255 characters**. Longer values cause the notification to be rejected.
- **TargetParameters values** longer than **250 characters** are silently dropped.
- **Event element names** must not exceed **128 characters**. Violations are caught at `cds build` time.

### Annotation Reference

Complete mapping of CDS annotations to notification fields:

| Annotation | ANS Field | Description |
|---|---|---|
| `@description` | `Description` | Notification type description |
| `@notification.template.title` | `TemplateSensitive` | Main notification title (supports placeholders) |
| `@notification.template.publicTitle` | `TemplatePublic` | Public fallback title |
| `@notification.template.subtitle` | `Subtitle` | Subtitle text |
| `@notification.template.groupedTitle` | `TemplateGrouped` | Group header for multiple notifications |
| `@notification.template.email.subject` | `EmailSubject` | Email subject line |
| `@notification.template.email.html` | `EmailHtml` | Inline HTML or path to `.html` file |
| `@Common.SemanticObject` | `NavigationTargetObject` | Navigation target object |
| `@Common.SemanticObjectAction` | `NavigationTargetAction` | Navigation action |
| `@notification.priority` | `Priority` | `LOW`, `NEUTRAL`, `MEDIUM`, or `HIGH` |


## Test-drive Locally

During local development, notifications are mocked and printed to the console. No external service is required.

<img width="700" alt="Notify to console" style="border-radius:0.5rem" src="_assets/notifyToConsole.png">


## Run in Production

### Prerequisites

Configure a [destination](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/enabling-notifications-for-custom-apps-on-sap-btp-cloud-foundry#configure-the-destination-to-the-notifications-service) named `SAP_Notifications` in your BTP subaccount. The plugin uses this destination to connect to the notification service in hybrid and production environments.

Notification types are automatically registered and kept in sync with the notification service each time the application starts. Any additions, changes, or removals to your notification types are applied on the next startup—no manual deployment step required.

Once deployed and integrated with SAP Build Work Zone, notifications appear under the Fiori notifications icon.

<img width="1300" alt="Sample Application Demo" style="border-radius:0.5rem;" src="_assets/incidentsNotificationDemo.gif">


## Advanced Usage

### Custom Notification Types Path

The plugin reads `srv/notification-types.json` as the default JSON types file. To use a different path:

```json
"cds": {
  "requires": {
    "notifications": {
      "types": "srv/my-notification-types.json"
    }
  }
}
```

### Custom Notification Type Prefix

To make notification type keys unique per application, the plugin prefixes them with the application name from `package.json` by default. To use a custom prefix:

```json
"cds": {
  "requires": {
    "notifications": {
      "prefix": "my-custom-prefix"
    }
  }
}
```

### Custom Destination Name

To override the default `SAP_Notifications` destination name:

```json
"cds": {
  "requires": {
    "notifications": {
      "destination": "MY_CUSTOM_DESTINATION"
    }
  }
}
```

### Authentication Identifier

`cds.env.requires.notifications.authenticationIdentifier` controls which recipient key is used when publishing notifications.

- `auto` (default): the recipient key is chosen per recipient. Values in UUID format are treated as SAP BTP Global User IDs and published with `GlobalUserId`; everything else is published with `RecipientId`. A warning is logged if a value is neither a UUID nor an email address. This allows mixing UUIDs and email addresses in the same `recipients` array without any configuration.
- `UserUUID`: always use `GlobalUserId`. Use this when the Work Zone authentication identifier is set to `User ID`.
- `RecipientId`: always use `RecipientId`. Use this when recipients are identified by email or login name.


> [!NOTE]
> For email notifications sent with a User ID, a destination to the Identity Directory Service (IDS) must be configured for the email address lookup.

For Work Zone authentication identifier configuration, see [Work Zone Subaccount Settings](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/subaccount-settings).

### Default Email Delivery

To enable email delivery for all notification types without annotating each one individually, set `defaultEmailDelivery` to `true`:

```json
"cds": {
  "requires": {
    "notifications": {
      "defaultEmailDelivery": true
    }
  }
}
```

This adds a `MAIL` delivery channel (enabled, default preference on, user-editable) to every notification type that does not already have a `deliveryChannels` annotation.

### Outbox Behavior

By default the notification service uses an outbox (`outbox: true`): `notify()` resolves as soon as the message is queued, not when it has been sent to ANS. To send synchronously and receive the HTTP response:

```json
"cds": {
  "requires": {
    "notifications": {
      "outbox": false
    }
  }
}
```

### Disabling the Plugin

To disable the plugin without removing it, set `enabled: false`:

```json
"cds": {
  "requires": {
    "notifications": {
      "enabled": false
    }
  }
}
```

This prevents the plugin from registering its hooks which results into no automatic `this.emit()` interception, no notification type registration, and no build task. Direct calls to `cds.connect.to('notifications').notify()` are not affected by this flag.

### Low-level Notifications API

For full control, pass the complete notification object directly as described in the [ANS API documentation](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/developing-cloud-foundry-applications-with-notifications).

#### With individual parameters

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
    { "Key": "string", "Value": "string" }
  ]
})
```

#### Passing the full notification object

```js
alert.notify({
  NotificationTypeKey: 'BookOrdered',
  NotificationTypeVersion: '1',
  Priority: 'NEUTRAL',
  Properties: [
    { Key: 'title', IsSensitive: false, Language: 'en', Value: 'Wuthering Heights', Type: 'String' },
    { Key: 'buyer', IsSensitive: false, Language: 'en', Value: 'reader@bookshop.com', Type: 'String' }
  ],
  Recipients: [
    { RecipientId: "reader1@bookshop.com" },
    { RecipientId: "reader2@bookshop.com" }
  ]
})
```


## Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/cap-js/notifications/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).


## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](CODE_OF_CONDUCT.md) at all times.


## Licensing

Copyright 2026 SAP SE or an SAP affiliate company and contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/cap-js/notifications).
