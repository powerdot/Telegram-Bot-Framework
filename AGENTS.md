# Telegram Bot Framework: agent notes

## Project purpose

TBF is a page-oriented Telegram bot framework. Its core abstraction is a component (`page` or `plugin`) with named actions, message handlers and Telegram event handlers. Keep additions centered on navigation, component execution, Telegram transport conveniences, storage and runtime lifecycle. Do not move application-specific domain logic into the framework.

Examples of application concerns that do not belong in core:

- private-chat-only policies;
- voice transcription jobs;
- lesson/session progress;
- attempt repositories and domain-specific idempotency locks.

Generic middleware hooks or reusable concurrency primitives may belong in core, but must not encode one bot's domain model.

## Runtime and package

- Package: `@powerdot/telegram_bot_framework`
- Supported runtime: Node.js 24 or newer
- Package format: CommonJS-compatible output in `lib/`
- Source: TypeScript in `src/`
- `lib/` is generated and tracked. Change `src/`, then run the build; do not hand-edit generated files.
- Telegraf remains the Telegram transport for 2.0. Do not replace it without an explicit transport-adapter migration plan.
- Telegraf long-polling `bot.launch()` remains pending until polling stops. TBF startup must resolve from Telegraf's `onLaunch` callback, not by awaiting the polling Promise. Keep the regression test in `test/bot_startup.test.ts`.

Important dependencies:

- Telegraf 4.16
- Express 5
- MongoDB driver 7
- built-in `node:sqlite`

## Commands

Use Node.js 24 (`nvm use` uses `.nvmrc`).

```bash
npm ci
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run check
npm run release:dry-run
```

`npm run check` is the required local verification path:

```text
typecheck -> tests with coverage thresholds -> build -> CommonJS smoke import
```

Coverage gates are enforced by Node's native test runner:

- lines: 95%
- branches: 85%
- functions: 99%

CI is in `.github/workflows/ci.yml` and runs on Node.js 24. Publishing is in `.github/workflows/publish.yml` and is triggered by a published GitHub Release.

## Compatibility policy

New optional parameters must preserve historical behavior when omitted.

Rules:

1. `undefined` means old behavior.
2. Preserve explicit `false`; use nullish coalescing (`??`), not `||`, for boolean defaults.
3. New behavior that did not previously exist is opt-in by default.
4. A setting that controls existing behavior defaults to the old value.
5. Intentional default changes require a major version, migration notes and regression tests.
6. Bug fixes to a broken public contract do not require compatibility flags. Example: `await openPage()` must wait for the page action.

Current compatibility defaults are centralized in `src/config.ts` and tested in `test/config.test.ts`:

```ts
{
  autoRemoveMessages: true,
  clearChatOnPageOpen: true,
  spamProtection: true,
  debug: false,
  gracefulShutdown: { handleSignals: false }
}
```

Do not reintroduce shallow config merging with `Object.assign`. Extend `resolveConfig()` and its regression tests.

## Page navigation and cleanup

`openPage()` waits for the selected action to finish.

Chat cleanup on programmatic page opening has this priority:

```text
openPage({ clearChat })
-> Component({ clearChatOnOpen })
-> config.clearChatOnPageOpen
-> true
```

`clearChatOnPageOpen` and `autoRemoveMessages` are separate concerns:

- `clearChatOnPageOpen`: immediate cleanup during page navigation;
- `autoRemoveMessages`: periodic cleanup of old tracked messages.

Do not make disabling one implicitly disable the other.

Actions and message handlers also support their existing `clearChat` behavior.

## Telegram context and API

TBF normalizes these optional context fields:

- `ctx.chatId`
- `ctx.fromId`
- `ctx.senderChatId`

They are not interchangeable. `chatId` identifies the conversation, `fromId` identifies a user when Telegram provides one, and `senderChatId` covers channel/anonymous-chat senders.

Components can subscribe to arbitrary Telegraf update types through `events`. Unrouted updates are delivered only to subscribed components. Do not query chat routing state for global/unrouted events.

Action bindings expose convenience methods for replies, media, polls, locations, reactions and chat actions. `this.api(method, payload)` is the forward-compatible escape hatch for Telegram methods not yet covered by Telegraf/TBF types.

Telegraf exposes much of Telegram through `ctx`; avoid duplicating every Bot API method in TBF. Add convenience methods only when they integrate with TBF behavior such as message tracking, page navigation or normalized context.

Never log the complete Telegraf context or Telegram client: it contains the bot token. Debug logs must use explicit allowlisted fields such as update ID/type, `chatId`, `fromId` and `senderChatId`.

## Storage

Storage is behind the interfaces in `src/storage/types.ts`.

- SQLite is the default for TBF 2 and uses `./data/tbf.sqlite`.
- MongoDB remains supported with `storage.driver: "mongodb"`.
- Legacy `mongo: { url, dbName }` configuration remains supported but deprecated.
- `:memory:` SQLite is used in tests.

SQLite is a small document store over `node:sqlite`, not a general SQL ORM. Its portable query subset is intentionally limited to:

- equality;
- `$lt`, `$lte`, `$gt`, `$gte`, `$in`;
- sorting and limits;
- insert, update, updateMany, upsert, delete.

Any storage behavior used by the public `db.*` facade should be defined structurally and tested against the storage contract. Do not leak MongoDB-only types or internal import paths into the public API.

The switch from implicit MongoDB to default SQLite is an intentional 2.0 breaking change and is documented in `MIGRATION.md`.

## Lifecycle

The object returned by `TBF()` has an idempotent `stop(signal?)` method. It must attempt all cleanup stages even if one fails:

- stop Telegraf;
- clear the auto-remove interval;
- close the HTTP server;
- close the storage client;
- report accumulated shutdown errors.

Automatic `SIGINT`/`SIGTERM` registration is opt-in through `gracefulShutdown.handleSignals`. The default is `false`; a library must not take ownership of the host process without permission.

## Testing expectations

For changes to core behavior:

- add or update a focused unit/contract test;
- preserve the coverage thresholds;
- test explicit `false` and omitted/default behavior for new config flags;
- test the built package entry point, not only source TypeScript;
- run `npm run check` before handoff;
- run `npm run release:dry-run` for packaging or release changes.

Tests must not require real Telegram credentials or a running MongoDB server. Use mocked Telegraf contexts and `:memory:` SQLite unless the task explicitly introduces a separate integration environment.

## Publishing

- `prepublishOnly` runs the complete check automatically.
- `npm run release:dry-run` validates package contents without publishing.
- `npm run release:publish` performs a real registry mutation; never run it without explicit user authorization.
- GitHub Release tags must match `package.json` (`v2.0.0` or `2.0.0`).
- npm Trusted Publishing must be configured for `.github/workflows/publish.yml`; do not add a long-lived npm token unless explicitly required.

## Documentation and proposals

- `README.md` documents current public behavior.
- `MIGRATION.md` documents 2.0 changes and compatibility notes.
- `by_ai.md` is a proposal/input document, not a source of truth. Evaluate each suggestion against the page-oriented TBF concept and this compatibility policy before implementation.
- Prefer explicit TODOs or design notes over inventing behavior that has not been agreed.
