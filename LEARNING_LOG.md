# Angular Learning Log

Personal notes as I go, mostly so I can look back and explain *why* something
is built the way it is, not just what it does.

## 2026-07-20 — Project setup, boot process, first component

**How the app actually boots:**
1. Browser loads `src/index.html`. Only meaningful line: `<app-root></app-root>`,
   an empty tag with no behavior yet.
2. `src/main.ts` runs: `bootstrapApplication(App, appConfig)`.
3. `appConfig` (in `app.config.ts`) builds the dependency-injection registry —
   router, zone-based change detection, error listeners.
4. Angular instantiates `App` (from `app.ts`) and mounts it into `<app-root>`,
   rendering `app.html`.
5. `app.html` references `<app-counter />`, which Angular resolves via `App`'s
   `imports` array and mounts in turn, rendering `counter.html`.

So the component tree is rooted at `App`, and everything else nests inside it.
`index.html` never changes — it's a static shell. `app.html` is the first
thing Angular itself renders.

**Project structure, what each piece is for:**
- `angular.json` — the build recipe (entry file, style language, asset paths).
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.spec.json` — TS compiler
  rules; app and test code use separate configs because tests need Vitest's
  global types and a different output dir.
- `src/styles.scss` — global, unscoped styles.
- Each component is a quartet: `.ts` (class), `.html` (template), `.scss`
  (styles scoped to that component only), `.spec.ts` (tests).
- `app.routes.ts` — currently an empty array, so `<router-outlet>` renders
  nothing. Routing is a later topic.

**Signals, not plain fields, for state:**
- `OnPush` change detection is the *default* now (unset = OnPush). Under
  OnPush, a component only re-renders when an `@Input()` changes by
  reference, a signal it reads changes, or an event fires inside it.
- A plain mutated class field can look like it works only because a click
  handler runs inside the same component. State changed from outside (a
  subscription, `setTimeout`, a parent) would silently fail to re-render.
  Signals are the actual thing OnPush watches for.
- `computed()` is memoized — it only re-runs when its dependencies change,
  not on every change-detection pass. Matters once you're deriving something
  expensive (filtering/sorting a large dataset) instead of simple math.
- `update((v) => v + 1)` operates on the current value; `set()` replaces it
  outright. Use `update` when deriving the next state from the last one.

**Testing:** test through the public interface (rendered DOM, clicks), not
by reaching into a component's internal state. `count` and `doubled` on
`Counter` are `protected` on purpose — only the template can read them
directly, tests go through button clicks and rendered text instead.

**Dependency injection is a second, separate graph from the component tree.**
Components nest because of what renders inside what. Providers registered in
`app.config.ts` are a flat registry available to anything via `inject()`,
without manually passing them down through every intermediate component.
This is also how unrelated components (siblings, or anything not in a direct
parent/child line) share state — through a common injected service, since
there's no implicit global mutable state.

**Component communication (not used yet, but the mechanism):**
- Parent → child: `input()` — parent sets `<app-counter [start]="5" />`,
  child declares `start = input(0)`.
- Child → parent: `output()` — child does `this.changed.emit(value)`, parent
  listens with `(changed)="onChanged($event)"`.
- Unrelated components: shared injectable service, not direct reference.

**Why `npm start` instead of `ng serve` directly:** the global `ng` on this
machine is actually an unrelated tool (`ng-common`/ngspice) — a naming
collision, not Angular CLI. `npm start` (and `npx ng`) resolve to this
project's *local* `node_modules/.bin/ng`, matching the exact version pinned
in `package-lock.json`, regardless of what's globally installed. It also
means the same three commands (`npm start`, `npm test`, `npm run build`)
work the same way across any Node project, not just Angular ones.

## 2026-07-21 — Version upgrades

**Upgrade one major version at a time (17 → 18 → 19 → ... → 22), never skip:**
- `ng update @angular/core@18 @angular/cli@18`, verify, commit, repeat.
- Each version's `ng update` schematics (automated codemods) assume you're
  migrating from the immediately previous version. Skipping a hop means
  losing that automation and inheriting several versions' worth of manual
  cleanup at once.
- Angular keeps deprecated APIs working for at least one major version before
  removal — that window is only useful if you actually stop at each version.
- One hop at a time = a working, tested checkpoint after each step, and if
  something breaks, it's obvious which version caused it.

**Why not rewrite from scratch:** throws away everything `ng update`
automates plus all existing tests and accumulated edge-case fixes, for a
large reinvestment with no functional gain. Only makes sense for small,
low-stakes, or already-obsolete projects — not something with real usage
depending on it.

**Tool:** [update.angular.io](https://update.angular.io) — enter current and
target version, get the exact ordered command sequence.
