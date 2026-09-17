# `@cap-js/notifications` — Developer Knowledge Base

**What this is:** A CDS plugin that adds business notification support to SAP CAP applications. It sends notifications to SAP Build WorkZone via the SAP Alert Notification Service (ANS). New developers need no prior knowledge of ANS to use it — the plugin handles all the plumbing.

---

## Architecture Overview

```
Your CDS Service
      │
      ├─ @notification event fired  ──► cds-plugin.js (service.on "*")
      │                                       │
      └─ @notifications entity CRUD ──► cds-plugin.js (service.after "*")
                                               │
                                        NotificationService (srv/service.js)
                                        .emit() / .notify()
                                               │
                              ┌────────────────┴──────────────────┐
                          development                        hybrid/production
                        NotifyToConsole                      NotifyToRest
                       (logs to console)              (HTTP POST to ANS via SAP Cloud SDK)
```

The plugin registers itself as a CDS service named `notifications`. Application code never talks to ANS directly.

---

## Two Ways to Trigger a Notification

### 1. `@notification` on a CDS event

```cds
event OrderPlaced @(notification, notification.title: 'Order {orderId} placed') {
  orderId : String;
  recipients : array of String;
}
```

- Intercepted by `service.on("*")` in `cds-plugin.js`
- The `recipients` field is **always required** and **auto-injected** into the event definition at model-load time if not declared (`cds-plugin.js` lines 7–14) — this is a strict runtime contract, not optional
- Key elements (annotated `key`) go into `TargetParameters`; everything else goes into `Properties`

### 2. `@notifications` on a CDS entity

```cds
entity Orders @(notifications: [{
  type: 'OrderShipped', on: ['UPDATE'],
  recipients: $self.buyerEmail,
  where: { xpr: [...] }
}]) { ... }
```

- Intercepted by `service.after("*")` in `cds-plugin.js`
- When a `where` clause is present, the plugin runs an additional `SELECT.one` against the database per entity per notification hook to verify the condition — the database evaluates the CDS expression, which is simpler than re-implementing expression logic in JS. This is an extra DB round-trip; accepted tradeoff because large bulk operations triggering entity notifications are uncommon.
- Added in v1.1.0 (September 2026)

### Deprecated: JSON notification types file

It is also possible to define notification types via a hand-authored `srv/notification-types.json` file (configured via `cds.requires.notifications.types`). **This approach is deprecated and will be removed in a future version.** New code should use CDS `@notification` annotations exclusively.

---

## Transport Backends

| Mode                | Class                    | When active                   |
| ------------------- | ------------------------ | ----------------------------- |
| `notify-to-console` | `srv/notifyToConsole.js` | `[development]` (default)     |
| `notify-to-rest`    | `srv/notifyToRest.js`    | `[hybrid]` and `[production]` |

The active backend is wired in `package.json` under `cds.requires` — no code changes needed to switch.

---

## Key Configuration Options (`cds.requires.notifications`)

| Option                     | Default                    | Notes                                                                                                                                                       |
| -------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`                     | `notify-to-console` in dev | Set to `notify-to-rest` for production                                                                                                                      |
| `destination`              | `"SAP_Notifications"`      | **Required name for WorkZone channel** — ANS enforces this; plugin throws at startup if a different name is used with `DeliveryChannels: [{ Type: "WEB" }]` |
| `prefix`                   | `"$app-name"`              | Prepended to all `NotificationTypeKey` values. `$app-name` reads from `package.json`. Cached after first call — module-level variable in `lib/utils.js`     |
| `authenticationIdentifier` | `"auto"`                   | Per-recipient: UUID → `GlobalUserId`, anything else → `RecipientId`. Override with `"UserUUID"` or `"RecipientId"`                                          |
| `outbox`                   | `true`                     | Notifications are queued and sent asynchronously. `await notify()` resolves when queued, not when delivered                                                 |
| `channels`                 | `["workzone"]`             | Default delivery channels for all notification types                                                                                                        |
| `types`                    | —                          | Path to a `notification-types.json` file for hand-authored types (deprecated — see above)                                                                   |
| `enabled`                  | `true`                     | Set to `false` to disable the entire plugin                                                                                                                 |

---

## Startup Sync (production/hybrid only)

On `cds.once("served")`, when `kind === "notify-to-rest"`, the plugin calls `processNotificationTypes()` in `lib/notificationTypes.js`. This:

1. Fetches all existing notification types from ANS
2. Deletes types no longer in the local definition (scoped to this app's prefix only — other apps' types are skipped)
3. Updates types whose templates, actions, or delivery channels changed
4. Creates types that don't exist yet
5. Ensures the built-in `Default` type exists

This runs sequentially at startup and is blocking. It's idempotent — safe to run on every deploy.

---

## Outbox & Error Handling

With `outbox: true` (default), failed notifications are retried by the CAP outbox queue. The plugin marks errors as **unrecoverable** when ANS returns a 4xx response (except 429) — `srv/notifyToRest.js` lines 42–45:

- `error.unrecoverable = true` tells the CAP outbox to not retry
- If `maxAttempts` is configured: the task's attempt counter is immediately exhausted
- If no `maxAttempts`: the task is deleted from the outbox immediately
- **429 (rate limited) is excluded** — those are recoverable and will be retried

Errors in the `service.on/after` notification hooks are caught and logged but never bubble up to the original request — a notification failure never breaks the business operation.

---

## Known Issues & Gotchas

**1. `setGlobalLogLevel("error")` silences all Cloud SDK output**

`cds-plugin.js` line 77 mutes the entire `@sap-cloud-sdk` logger globally at startup. This prevents SDK chatter from polluting the CAP console — but it also means if you're debugging a destination resolution problem, you'll see nothing. To re-enable: temporarily comment out this line or override the log level in your Cloud SDK config.

**2. CSRF token fetched per notification, not per batch**

`srv/notifyToRest.js` calls `buildHeadersForDestination` inside `_postOne`, so a batch of N notifications makes N CSRF token requests before any POSTs. CSRF tokens are session-scoped and could be fetched once per batch. This hasn't caused production issues and wasn't revisited when batching was added.

**3. `TODO: Check if language is not there` in `areDeliveryChannelsEqual`**

`lib/notificationTypes.js` line 170. The delivery channel comparison doesn't account for channels that have no `Language` field. Not known to cause failures in practice.

**4. Stale `coverage/` folder committed to the repo**

`coverage/` is in `.gitignore` but was committed anyway. It's stale and references a deleted file `lib/content-deployment.js` (a previous implementation that was removed). Ignore the entire folder.

---

## Value Length Constraints

| Field                           | Limit     | Behavior when exceeded                                  |
| ------------------------------- | --------- | ------------------------------------------------------- |
| `Properties[].Value`            | 255 chars | **Throws** (event path); silently dropped (entity path) |
| `TargetParameters[].Value`      | 250 chars | Silently dropped                                        |
| Event element name (key length) | 128 chars | Caught at `cds build` time, throws                      |

The asymmetry between event and entity paths for property value length is a known inconsistency — entity notifications silently filter long values in `lib/utils.js`, while event notifications throw via `applyValueLengthConstraints`.

---

## Where to Look for What

| Question                                        | File                       |
| ----------------------------------------------- | -------------------------- |
| How notifications are triggered automatically   | `cds-plugin.js`            |
| `notify()` / `emit()` API surface               | `srv/service.js`           |
| Building the ANS payload from event/entity data | `lib/utils.js`             |
| Compiling CDS annotations → notification types  | `lib/compile.js`           |
| Syncing types with ANS at startup               | `lib/notificationTypes.js` |
| `cds build` integration                         | `lib/build.js`             |
| Console output (dev mode)                       | `srv/notifyToConsole.js`   |
| HTTP transport (production)                     | `srv/notifyToRest.js`      |
| Integration test app                            | `tests/bookshop/`          |
