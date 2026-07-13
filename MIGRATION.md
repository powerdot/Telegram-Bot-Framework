# Migrating to TBF 2

TBF 2 modernizes the runtime and dependency baseline while preserving the existing CommonJS package API.

## Requirements

- Node.js 24 or newer
- No external database is required when using the default SQLite storage
- MongoDB compatible with the MongoDB Node.js driver 7 when using the MongoDB adapter

## Storage

TBF 2 uses SQLite by default and creates `./data/tbf.sqlite`:

```ts
TBF({ telegram: { token } });
```

Choose the database explicitly with the new storage option:

```ts
storage: { driver: "sqlite", filename: "./data/bot.sqlite" }
```

```ts
storage: {
  driver: "mongodb",
  url: "mongodb://localhost:27017",
  dbName: "bot"
}
```

The old `mongo` option still selects MongoDB, but is deprecated. Existing component code using `db`, `db.user.collection()`, `db.tempData`, and `db.messages` works with either adapter. SQLite implements a deliberately limited portable query subset: equality, `$lt`, `$lte`, `$gt`, `$gte`, `$in`, sorting, and limits.

## Dependency updates

- Express 5
- MongoDB Node.js driver 7
- Telegraf 4.16
- TypeScript 7 for framework development

The deprecated `request` package and unused Axios, proxy-agent, Webpack, `module-alias`, and Moment dependencies have been removed. Applications that imported any of them indirectly through TBF must declare their own direct dependencies.

## Development commands

```bash
npm run typecheck
npm test
npm run build
npm run check
```

The example scripts now use `tsx` and Node.js built-in watch mode instead of `ts-node` and `nodemon`.

## Telegram events and API methods

Components can subscribe to arbitrary Telegram update types through `events`. Existing `message` and `callback_query` routing remains compatible.

TBF now automatically acknowledges callback queries before running their actions. This clears Telegram's inline-button loading indicator before a page edits the message or replaces its keyboard. Expired callback acknowledgements are ignored and do not prevent routing.

Action handlers now expose `reply`, media helpers, `sendPoll`, `sendLocation`, `sendChatAction`, `react`, and the generic `api(method, payload)` escape hatch. The generic API method is intentionally loosely typed so applications can use a newly released Telegram method before Telegraf and TBF publish updated types.

Long-running operations can use `withChatAction("typing", callback)` to keep Telegram's activity status alive until the callback settles. An action or message handler can instead declare `chatAction: "typing"`; no status is sent unless one of these opt-in forms is used.

Set `chatActions.stopOnNavigation: true` to stop refreshing active chat actions before `goToAction`, `goToPage`, `goToPlugin`, or `openPage` starts the next action. It defaults to `false` for compatibility.

## Page navigation and runtime lifecycle

`await openPage()` now waits for the selected page action to finish. This fixes the previous promise contract, which resolved immediately after starting the action.

Page cleanup can be controlled with global `clearChatOnPageOpen`, component `clearChatOnOpen`, or transition `clearChat`. All are optional and the fallback remains `true`, preserving historical behavior. `spamProtection` is also configurable and defaults to `true`.

Page cleanup is applied consistently for `openPage()`, `goToPage()`, and inline-button navigation between different components. Callback actions within the currently open component do not trigger page-level cleanup.

The returned TBF application now has an idempotent `stop(signal?)` method. Automatic `SIGINT` and `SIGTERM` handling is opt-in through `gracefulShutdown.handleSignals` and defaults to `false`.

`stop()` also tolerates Telegraf's `Bot is not running!` state, allowing storage-only CLI, seed, and migration processes to shut down without an `AggregateError`. Other shutdown failures are still reported.

## Publishing a release

Run `npm run release:dry-run` and bump `package.json` before merging a release into `master`. A push to `master` triggers `.github/workflows/publish.yml`, runs the complete prepublish check, publishes the missing version through npm Trusted Publishing, and creates a GitHub Release tagged `v<version>`. Existing npm versions and releases are not duplicated.
