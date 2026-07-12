# Migrating to TBF 2

TBF 2 modernizes the runtime and dependency baseline while preserving the existing CommonJS package API.

## Requirements

- Node.js 24 or newer
- MongoDB compatible with the MongoDB Node.js driver 7

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
