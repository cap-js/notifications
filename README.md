
The `@cap-js/notifications` package is a [CDS plugin](https://cap.cloud.sap/docs/node.js/cds-plugins#cds-plugin-packages) providing out-of-the box support for publishing business notifications.

### Table of Contents

- [Setup](#setup)
- [Usage](#usage)
  - [Update Notification Configuration](#update-notification-configuration)
    - [Notification Destination](#notification-destination)
    - [Notification Types Path](#notification-types-path)
  - [Add Notification Types](#add-notification-types)
  - [Update handlers to publish notification](#update-handlers-to-publish-notification)
    - [Simple Notificaiton with title](#simple-notificaiton-with-title)
    - [Simple Notificaiton with title & description](#simple-notificaiton-with-title)
    - [Custom Notifications with notification types](#simple-notificaiton-with-title)
  - [Sample Application with notifications](#sample-application-with-notifications)
  - [Preview](#preview)
    -[In Local Environment](#in-local-environment)
    -[In Production Environment](#in-production-environment)
- [Contributing](#contributing)
  - [Code of Conduct](#code-of-conduct)
- [Licensing](#licensing)

## Setup

To enable notifications, simply add this self-configuring plugin package to your project:

```sh
 npm add @cap-js/notifications 
```

```sh
 cds add notifications 
```
## Usage

In this guide, we use the [Incidents Management reference sample app](https://github.com/cap-js/incidents-app) as the base, to publish notifications.

### Update Notification Configuration

You can add the notification types in the `notificationtype.json` file.

Sample: If you want to send the notification when the new incident is reported, you can modify the `notificationtypes.json` as below:

```jsonc
[
  {
    "NotificationTypeKey": "IncidentReported",
    "NotificationTypeVersion": "1",
    "Templates": [
      {
        "Language": "en",
        "TemplatePublic": "Incident Reported",
        "TemplateSensitive": "Incident '{{name}}' Reported",
        "TemplateGrouped": "New Incidents",
        "TemplateLanguage": "mustache",
        "Subtitle": "Incident '{{name}}' reported by '{{customer}}'."
      }
    ]
  }
]
```

#### Notification Destination

#### Notification Types Path

### Add Notification Types

### Update handlers to publish notification

#### Simple Notificaiton with title
#### Simple Notificaiton with title & description
#### Custom Notifications with notification types

### Sample Application with notifications

### Preview
#### In Local Environment
#### In Production Environment

## Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/cap-js/change-tracking/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).


### Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](CODE_OF_CONDUCT.md) at all times.


## Licensing

Copyright 2023 SAP SE or an SAP affiliate company and contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/cap-js/change-tracking).



