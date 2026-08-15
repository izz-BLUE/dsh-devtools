# Contributing

## Install

```bash
pnpm install --frozen-lockfile
```

Requires Node.js `^22.19.0 || >=24.0.0` and pnpm `11.7.0` (see `packageManager` in `package.json`).

## Test

```bash
pnpm typecheck
pnpm test
```

## Build

```bash
pnpm build
```

Build output goes to `lib/`, which is gitignored. To verify the publishable artifact:

```bash
pnpm pack
```

## Scope

dsh-devtools is a **read-only, metadata-first runtime profiler**. It observes agent runtime events and renders them in the DevTools conversation tab. It must never:

- modify agent behavior, execution, or session state;
- capture or persist prompt content, tool arguments, or model outputs;
- add side effects beyond displaying metadata.

New features should stay within this boundary.

## Privacy boundary

Only durable event metadata (timings, durations, counts, reasons, usage aggregates) crosses the profiler path. Do not introduce payload logging, secret capture, or anything that would change what data leaves the harness process.

## Pull request expectations

- Keep changes focused; one logical change per PR.
- Add or update tests for logic changes (run `pnpm test`, the suite must stay green).
- Typecheck and build must pass locally before opening the PR.
- Do not bump versions or publish; releases are handled separately.
- Do not change package metadata (repository, files, peerDependencies) unless the PR is about packaging.
