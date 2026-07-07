# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
The format is based on [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

### Added

- Batch notification API: pass an array as the second argument to `notify()` to send multiple notifications in a single outbox event. Each notification is dispatched independently, failures do not block the others.
- Validation of `Properties` and `TargetParameters` value lengths when emitting notifications. Property values exceeding 255 characters throw an error; `TargetParameters` entries with values longer than 250 characters are silently dropped before the notification is sent.
- Log full response body and headers when the `notifications` logger is enabled at debug level.

### Changed

- `IsSensitive` is now set to `true` for all notification properties.
- Return the full HTTP response from the REST notification handler.
  Note: With outbox enabled (default), the application's `await notify()` resolves when
  the message is queued; the return value is only available when `outbox: false`.
- Support for defining notification types via CDS `@notification` annotations as an alternative to `srv/notification-types.json`.
- Support for email delivery channels via `@notification.deliveryChannels` in CDS annotations and `DeliveryChannels` in the JSON format.
- Support for email templates via `@notification.template.email.subject` and `@notification.template.email.html` in CDS annotations, and `EmailSubject` / `EmailHtml` in JSON templates.
- i18n support for CDS annotation string values using `{i18n>key}` syntax.
- Notification types are automatically registered and kept in sync with the notification service on application startup when running in hybrid or production mode.

### Fixed

- Fixed `#EnumValue` enum references in `@notification.deliveryChannels` — the `{ "#": "..." }` CSN form produced by the CDS compiler was not handled by `resolveEnum`, causing a `TypeError` at runtime.
- Improved error messages when notification type registration fails, now surfacing the ANS error detail instead of a raw HTTP error dump.
- New default `auto` for `cds.env.requires.notifications.authenticationIdentifier`. Each recipient is inspected: UUID values are published with `GlobalUserId`, everything else with `RecipientId`, with a warning when a value is neither a UUID nor an email. The previous values `UserUUID` and `RecipientId` are still supported for an explicit choice.
  In practice this means the plugin "just works" without configuration: applications can pass emails, UUIDs, or a mix of both, and the correct recipient key is chosen per value — no upfront configuration about Work Zone's authentication identifier required.

## Version 0.3.0

### Added

- Support switching the recipients identifier to GlobalUserId by setting `cds.env.requires.notifications.authenticationIdentifier` to 'UserUUID'

### Fixed

- Plugin now correctly works in a hybrid setup

## Version 0.2.5

### Fixed

- Add Apache-2.0

## Version 0.2.4

### Fixed

- Fix versions


## Version 0.2.3

### Fixed

- Fix cds build failure


## Version 0.2.2

### Fixed

- Build issues fixed


## Version 0.2.1

### Fixed

- Compatibility to `@sap/cds` 8


## Version 0.2.0

### Fixed

- Fixed code smells and Dependabot alerts

## Version 0.1.0

### Added

- Initial release
