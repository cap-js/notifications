# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
The format is based on [Keep a Changelog](http://keepachangelog.com/).

## Version 1.0.0 - Unreleased

### Added

- Support for defining notification types via CDS `@notification` annotations as an alternative to `srv/notification-types.json`.
- Support for email delivery channels via `@notification.deliveryChannels` in CDS annotations and `DeliveryChannels` in the JSON format.
- Support for email templates via `@notification.template.email.subject` and `@notification.template.email.html` in CDS annotations, and `EmailSubject` / `EmailHtml` in JSON templates. The `email.html` annotation accepts an inline HTML string or a path to an `.html` file relative to the `.cds` source file.
- i18n support for CDS annotation string values using `{i18n>key}` syntax. 
- Notification types are automatically registered and kept in sync with the notification service on application startup when running in hybrid or production mode.
- Allows to send notifications of `@notification`-annotated events  via `this.emit()` 
- Batch notifications: `notify()` now accepts an array of notification objects. Each item is sent individually; partial failures are logged as warnings and the call only throws if all items fail.
- Static and dynamic notification priority via `@notification.priority`. Accepts a fixed enum value (`#HIGH`, `#LOW`, etc.) or a CDS ternary expression evaluated against event data at runtime (e.g. `(quantity > 5 ? #HIGH : #LOW)`).
- `cds.env.requires.notifications.defaultEmailDelivery` option to enable email delivery for all notification types globally without per-event annotation.
- `cds build` integration: annotated events are compiled and written to `notification-types.json` in the build output, merged with any types from the JSON file.
- Log full response body and headers when the `notifications` logger is enabled at debug level.
- Return the full HTTP response from the REST notification handler when `outbox:false` 
- Validation of ANS length constraints at emit time: `Properties` values exceeding 255 characters throw an error; `TargetParameters` values exceeding 250 characters are silently dropped. Event element names exceeding 128 characters are caught at `cds build` time.

### Fixed

- Fixed `#EnumValue` enum references in `@notification.deliveryChannels`. The `{ "#": "..." }` CSN form produced by the CDS compiler was not handled by `resolveEnum`, causing a `TypeError` at runtime.
- Improved error messages when notification type registration fails, now surfacing the ANS error detail instead of a raw HTTP error dump.
- New default `auto` for `cds.env.requires.notifications.authenticationIdentifier`. Each recipient is inspected: UUID values are published with `GlobalUserId`, everything else with `RecipientId`, with a warning when a value is neither a UUID nor an email. The previous values `UserUUID` and `RecipientId` are still supported for an explicit choice.


## Version 0.3.0 - 2026/1/9

### Added

- Support switching the recipients identifier to GlobalUserId by setting `cds.env.requires.notifications.authenticationIdentifier` to 'UserUUID'

### Fixed

- Plugin now correctly works in a hybrid setup

## Version 0.2.5 - 2025/6/5

### Fixed

- Add Apache-2.0

## Version 0.2.4 - 2025/5/29

### Fixed

- Fix versions


## Version 0.2.3 - 2024/10/22

### Fixed

- Fix cds build failure


## Version 0.2.2 - 2024/10/21

### Fixed

- Build issues fixed


## Version 0.2.1 - 2024/9/16

### Fixed

- Compatibility to `@sap/cds` 8


## Version 0.2.0 - 2024/3/29

### Fixed

- Fixed code smells and Dependabot alerts

## Version 0.1.0 - 2023/10/30

### Added

- Initial release
