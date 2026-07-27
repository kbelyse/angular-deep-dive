# Angular Learning Log

Personal notes as I go, mostly so I can look back and explain _why_ something
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

- `OnPush` change detection is the _default_ now (unset = OnPush). Under
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
project's _local_ `node_modules/.bin/ng`, matching the exact version pinned
in `package-lock.json`, regardless of what's globally installed. It also
means the same three commands (`npm start`, `npm test`, `npm run build`)
work the same way across any Node project, not just Angular ones.

## 2026-07-21 — Version upgrades & component communication

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

**Built `input()`/`output()` for real — split `Counter`'s two buttons into a
new `CounterButton` component:**

```ts
// counter-button.ts
export class CounterButton {
  readonly label = input.required<string>();
  readonly pressed = output<void>();

  onClick(): void {
    this.pressed.emit();
  }
}
```

```html
<!-- counter.html -->
<app-counter-button label="-" (pressed)="decrement()" />
<span class="count">{{ count() }}</span>
<app-counter-button label="+" (pressed)="increment()" />
```

- `CounterButton` is dumb on purpose — it doesn't know what "increment" or
  "decrement" means, only that it was clicked. `Counter` stays the only place
  that owns state and decides what a click means. Data flows down (`label`),
  events flow up (`pressed`).
- `input.required<string>()` instead of a default value: there's no sane
  default for a button's label, so making it required means the compiler
  rejects `<app-counter-button />` used without one, instead of silently
  shipping an empty button.
- `output<void>()`, no payload: the child isn't sending data, just signaling
  "I was pressed" — the parent already knows what that means based on which
  instance fired. Contrast with an output that _would_ carry data, like a
  search box emitting the typed string.
- Testing an `output()` directly: `component.pressed.subscribe(spy)`, then
  click and assert the spy fired — same idea as subscribing to any event
  emitter, no template needed for a unit test.
- Testing a `.required` input: must call `fixture.componentRef.setInput(...)`
  _before_ the first `detectChanges()`, or Angular throws (`NG0950`) because
  the required input was never supplied.
- Confirmed by running the existing `Counter` tests unchanged after the
  refactor: they still find `<button>` elements via
  `fixture.nativeElement.querySelectorAll('button')`, which proves a child
  component's rendered DOM really does nest inside the parent's tree in the
  test fixture — `ViewEncapsulation.Emulated` (the default) only scopes CSS,
  it doesn't hide or isolate the DOM structure itself.

**Accessibility pass on `CounterButton` — required by the CLAUDE.md rules
(WCAG AA, AXE-clean), and a real gap, not a theoretical one:**

- `-` and `+` alone give a screen reader nothing to say beyond "minus" /
  "plus" — no context for what they control. Added a second required input,
  `ariaLabel`, kept separate from the visual `label` on purpose: there's no
  way to derive "Decrease count" from `"-"` programmatically without baking
  assumptions into a component meant to be reusable for any pair of actions.
- Bound it with `[attr.aria-label]`, not a plain property binding — ARIA
  attributes are HTML attributes, not reliably reflected DOM properties, so
  `attr.` binding is the correct Angular idiom for anything in `aria-*`.
- Added `aria-live="polite"` to the `.count` span in `counter.html`. Without
  it, nothing announces that the count changed unless focus happens to be on
  that exact element — a keyboard/screen-reader user pressing the button
  gets no feedback that anything happened.
- `:focus-visible` on the button in `counter-button.scss` isn't decorative —
  it's WCAG 2.4.7 (visible focus indicator). CSS resets often strip the
  browser's default outline, so it needs to be declared explicitly.

**Styling, and what view encapsulation actually guarantees:**

- `counter.scss` / `counter-button.scss` were empty until now — every
  component gets its own scoped stylesheet, and a plain `button { ... }`
  selector in `counter-button.scss` can only ever match buttons rendered
  inside `CounterButton`'s own template. It can't leak out to restyle
  unrelated buttons elsewhere, and no page-wide style can reach in here
  either — that's what `ViewEncapsulation.Emulated` (the default) buys you.
- `font-variant-numeric: tabular-nums` on `.count` stops the layout jittering
  as the digit count changes — `9` and `10` render at different natural
  widths in most fonts otherwise.

**Added a Reset control — first real use of `set()` instead of `update()`:**

```ts
reset(): void {
  this.count.set(0);
}
```

This is the case `set()` is actually for: resetting to zero doesn't depend
on the current value at all, so there's nothing to derive — `update(() => 0)`
would work but is needless indirection when you already know the new value
outright.

**Bug this exposed:** `CounterButton`'s button had a fixed `width: 2.5rem`,
sized for single characters like `-`/`+`. Adding a "Reset" label overflowed
it. Fixed by switching to `min-width` + horizontal padding — a small but
real lesson in not hardcoding assumptions from the first use case into a
component meant to be reused for others.

## 2026-07-22 — Routing

**Still one HTML page.** `index.html` never reloads. "Navigating" means
swapping which component is mounted inside `<router-outlet>` while
everything outside it (the header) stays exactly as it was. `app.routes.ts`
is the map from URL path to component — it was `[]` until today, which is
why the outlet rendered nothing.

**`routerLink` vs `href`:** a plain `<a href="/counter">` throws away the
whole running app and asks the server for a fresh document. `routerLink`
intercepts the click, updates the URL via the History API, and swaps the
outlet's content client-side — no reload, no lost state.

**`loadComponent` instead of the old `loadChildren` + module pattern.**
Lazy-loading a route under NgModules meant lazy-loading a whole module:
`loadChildren: () => import('./home/home.module').then(m => m.HomeModule)`.
Now a route lazy-loads a single component directly — one less layer.
Confirmed structurally: `app.ts` no longer imports `Counter` at all. `App`
doesn't know `Counter` exists until someone actually navigates to `/counter`
and the router resolves it.

**Built `Home` + moved `Counter` behind `/counter`, added a nav bar:**

```ts
// app.routes.ts
export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },
  { path: 'counter', loadComponent: () => import('./counter/counter').then((m) => m.Counter) },
  { path: '**', loadComponent: () => import('./not-found/not-found').then((m) => m.NotFound) },
];
```

- `**` (wildcard) matches literally any path, so it has to be **last** — the
  router matches top-to-bottom and stops at the first hit. If it came first
  it would swallow `/` and `/counter` too, and neither would ever render.
- `[routerLinkActiveOptions]="{ exact: true }"` on the Home link only —
  `routerLinkActive` defaults to a prefix match, so the link to `/` would
  stay marked active even while on `/counter` (every path "starts with" the
  root) unless told to require an exact match. The Counter link doesn't need
  this since nothing else starts with `/counter`.

**Testing routing behavior, not just component existence:** used
`RouterTestingHarness` from `@angular/router/testing` to actually navigate
to a URL in a test and assert on what rendered — `RouterTestingHarness.create('/counter')`
then check the DOM, which proves the _lazy-loaded_ route resolves to the
right component, not just that the component works in isolation. Also wrote
a test that navigates to an unknown path and confirms `NotFound` renders,
which is really a test that the route ordering is correct.

**Fixing tests broken by adding `RouterLink`/`RouterOutlet` usage:** any test
that renders a component using `routerLink` needs a router actually
registered in `TestBed`, via `provideRouter(routes)` (or `provideRouter([])`
if the test doesn't care about real navigation targets) — otherwise Angular
throws `NG0201: No provider found for ActivatedRoute`.

**`aria-current` — the active nav link was only distinguishable visually
(a CSS class), which tells a screen reader user nothing about which page
they're on:**

```html
<a
  routerLink="/counter"
  routerLinkActive="active"
  #counterLink="routerLinkActive"
  [attr.aria-current]="counterLink.isActive ? 'page' : null"
></a>
```

`#counterLink="routerLinkActive"` is a template reference variable that
exports the directive instance itself (its `exportAs`), exposing the live
`.isActive` boolean it already tracks internally. Binding to `null` when
inactive removes the attribute entirely — the correct move, since binding
an empty string would still leave the attribute present with no value.
`aria-current="page"` is the standard ARIA convention for marking the
current page inside a set of navigation links.

**Per-route document titles — a built-in router feature, no extra service:**

```ts
{ path: 'counter', title: 'Counter · Angular Deep Dive', loadComponent: ... }
```

The router's default title strategy reads `route.title` and sets
`document.title` automatically on navigation — confirmed in a test via
`TestBed.inject(Title).getTitle()` after navigating with
`RouterTestingHarness`. No `withTitleStrategy` or manual `document.title =`
assignment needed for the default behavior.

**Self-check on today's routing work — corrected two things I had fuzzy:**

- `routerLink` vs `href` isn't just "doesn't reload the JS file." A hard
  navigation (`href`) tears down the **entire running app instance** —
  every signal resets, the router's own internal state resets, the nav bar
  itself gets destroyed and rebuilt from nothing (it only _looks_ unchanged
  because it re-renders identically). `routerLink` never tears any of that
  down; only the outlet's content swaps. The nav "staying the same" is a
  symptom of the whole app persisting, not a special case just for the nav.
- The wildcard-must-be-last rule isn't about route order generally — it's
  specifically about `**` being the _only_ greedy matcher in this config.
  `path: ''` matches only the exact root URL, `path: 'counter'` matches only
  `/counter` — neither can accidentally swallow the other, so their relative
  order doesn't matter. Only a pattern that matches _any_ path has to be
  positioned last.
- The concrete, observable version of "`app.ts` doesn't know `Counter`
  exists until it's needed": open the Network tab, load the site fresh —
  one JS chunk. Click "Counter" — a second chunk request fires right then.
  That's `loadComponent`'s dynamic `import()`, not just a code-organization
  nicety; the browser genuinely hasn't downloaded that code yet.

## 2026-07-24 — Signal Forms

**Built a `/feedback` page: name/email/message, validated, accessible,
submits and resets.** First real form in the app, and the first time using
`@angular/forms/signals` (stable since v22) instead of template-driven or
reactive forms — CLAUDE.md calls this out as the preferred approach for new
forms, so this was the natural next thing to try after routing.

**The core shape — one signal, one `form()` call, no `FormGroup`:**

```ts
private readonly model = signal<FeedbackFormValue>({ ...initialValue });

protected readonly feedbackForm = form(this.model, (path) => {
  required(path.name, { message: 'Enter your name.' });
  required(path.email, { message: 'Enter your email address.' });
  email(path.email, { message: 'Enter a valid email address.' });
  required(path.message, { message: 'Enter a message.' });
  minLength(path.message, 10, { message: 'Say a bit more — at least 10 characters.' });
});
```

No `FormBuilder`, no `FormControl`/`FormGroup` tree to keep in sync with a
model by hand — `form()` wraps the model signal directly and the second
argument is a schema function describing validation against a `path` object
that mirrors the model's shape (`path.name`, `path.email`, ...).

**`feedbackForm.name` is a `FieldTree`, not a value — it's callable to get
state:** `feedbackForm.name` is what you bind to the DOM (`[formField]`).
Calling it, `feedbackForm.name()`, returns a `FieldState` snapshot with
`.value()`, `.touched()`, `.valid()`, `.errors()`, etc. Easy to trip on this
in a template: `feedbackForm.name` (the tree, for binding) vs
`feedbackForm.name()` (the state, for reading) look almost identical but do
completely different things.

**`[formField]` replaces the whole `ControlValueAccessor` dance for plain
`<input>`/`<textarea>`:**

```html
<input id="name" type="text" [formField]="feedbackForm.name" />
```

No `formControlName`, no `ReactiveFormsModule` import, no manual
`(input)`/`(blur)` wiring — the directive reads the native element type and
binds value + touched + disabled automatically. Confirmed this really is
live, two-way, native-event-driven by testing through the DOM: dispatching a
plain `input` `Event` on the native element (no Angular test harness needed)
updates `feedbackForm.name().value()`.

**`valid()` is not `!invalid()`** — the one non-obvious API detail: `valid()`
is false while a validator is still pending even with zero errors so far;
`invalid()` only reflects actual errors, ignoring pending state. They only
agree once nothing is pending. Didn't hit this directly (no async validators
here — `email`/`required`/`minLength` are all synchronous) but the
disabled-submit binding (`feedbackForm().invalid() || feedbackForm().submitting()`)
is deliberately built from `invalid()`, not `!valid()`, so it'll keep working
correctly once an async validator (e.g. checking an email against a server)
gets added later.

**Errors carry their own message, gated on `touched()` so nothing red shows
before the user has interacted with a field:**

```html
@if (feedbackForm.name().touched() && feedbackForm.name().invalid()) {
<p id="name-error" class="error" role="alert">{{ feedbackForm.name().errors()[0].message }}</p>
}
```

`{ message: '...' }` on `required()`/`email()`/`minLength()` sets
`.message` on the resulting `ValidationError` directly — no separate
error-code-to-copy mapping needed. Paired with `[attr.aria-invalid]` and
`[attr.aria-describedby]` pointing at the error's `id`, same reasoning as
`CounterButton`'s `ariaLabel` from 07-21: a sighted user sees the red text
near the field, a screen-reader user needs the field and its error
explicitly associated, which plain visual proximity doesn't provide.

**`[formRoot]` + `submission.action` is the built-in way to wire up submit,
same "prefer the framework feature" lesson as the router's title strategy:**

```ts
form(this.model, schemaFn, {
  submission: {
    action: async () => {
      this.submitted.set(true);
      this.feedbackForm().reset(initialValue);
    },
  },
});
```

```html
<form class="feedback-form" [formRoot]="feedbackForm"></form>
```

`formRoot` listens for the native `submit` event, calls `preventDefault()`,
and runs `submission.action` only if the form is actually valid — otherwise
a manual `(submit)="onSubmit($event)"` handler would be redoing logic the
framework already has.

**`reset(value?)` does two things in one call — resets `touched`/`dirty`
_and_ sets the value if you pass one.** Learned this from reading the type
signature, not the first thing I reached for: my first instinct was
`this.model.set(initialValue)` to clear the form after a successful submit,
but that only resets the _value_ — `touched` stays `true`, so a blanked
required field would immediately show its error again, right after a
successful submission. `feedbackForm().reset(initialValue)` clears both at
once, which is the actual "start over" behavior a user submitting the form
would expect.

**Testing without any Angular-specific form test harness — plain DOM
events, because `[formField]` binds to native elements:**

```ts
el.value = value;
el.dispatchEvent(new Event('input'));
el.dispatchEvent(new Event('blur'));
```

`input` updates the value, `blur` marks the field touched — both ordinary
DOM events, no `ReactiveFormsModule` test utilities or `TestBed` form
helpers needed. The one thing that did need care: `[formRoot]`'s submit
handler calls `submit()` without awaiting it, so the success message and
reset don't happen synchronously after dispatching the `submit` event —
the test has to `await fixture.whenStable()` before asserting, or it
checks state from before the submission's async action actually ran.

## 2026-07-27 — Services and dependency injection, for real this time

**Finally built the thing the 07-20 log entry only described:** "unrelated
components share state through a common injected service, since there's no
implicit global mutable state." Added a `Favorites` service — a page can be
starred from a toggle button in the header (`App`), and the starred list
shows up on `Home`. `App` and `Home` are not parent/child in any direct
sense relevant here beyond both sitting under the router outlet; neither
knows the other exists. They only agree on state because both `inject()`
the same singleton.

**The service itself — plain signal state behind a small API, no module:**

```ts
@Injectable({ providedIn: 'root' })
export class Favorites {
  private readonly paths = signal<ReadonlySet<string>>(new Set());
  readonly all = computed(() => Array.from(this.paths()));

  isFavorite(path: string): boolean {
    return this.paths().has(path);
  }

  toggle(path: string): void {
    this.paths.update((current) => {
      const next = new Set(current);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }
}
```

`providedIn: 'root'` registers it with the application's root injector the
first time anything asks for it — no `providers: [Favorites]` array to
remember to add anywhere, and exactly one instance exists for the whole app
(confirmed by two separately-created component fixtures in the same test
sharing state, see below).

**CLAUDE.md says prefer `@Service` over `@Injectable({ providedIn: 'root' })`
for new services — checked, and it doesn't exist yet in this project's
installed version:**

```
grep -rn "class Service\b\|declare function Service" node_modules/@angular/core/**/*
# no matches — @angular/core is 22.0.7
```

Used `@Injectable` instead, same as CLAUDE.md's own fallback wording
implies for anything pre-`@Service`. Worth re-checking after a future
`ng update` — this is a "the rule doesn't apply _yet_" situation, not a
decision to ignore it, same category as the wildcard-route rule from
07-22: something that's genuinely conditional, not universal, and worth
verifying against the real installed code rather than assuming.

**`isFavorite()` is a plain method, not a `computed()`, and still reacts
correctly — because the _template binding_ is the reactive context, not
the method:**

```html
[attr.aria-pressed]="isCurrentPageFavorite()"
```

`isCurrentPageFavorite()` calls `this.favorites.isFavorite(this.currentPath())`,
which reads `this.paths()` synchronously inside that call chain. Angular
tracks every signal read that happens during a binding's evaluation,
regardless of how many plain function calls it passes through on the way —
memoizing with `computed()` is about avoiding _recomputation_ cost, not a
requirement for reactivity itself. Only reached for `computed()` on `all()`
because building an array from the model is real work worth caching if
`all()` were read from multiple places (it's read from both `Home`'s `@for`
and its `.length > 0` check, so it already is).

**Turned the router into a signal instead of using the async pipe —
`toSignal` from `@angular/core/rxjs-interop`:**

```ts
protected readonly currentPath = toSignal(
  this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects),
  ),
  { initialValue: this.router.url },
);
```

CLAUDE.md's guidance to prefer the async pipe is about _templates_ consuming
observables directly. Here the value needed to be readable from
`toggleFavorite()`, a plain method, not just a template expression — a
signal can be read anywhere (`.()`), an observable can't without
subscribing. `toSignal` is the bridge for exactly this case: an RxJS-only
source (router events) that a signal-based rest of the component needs to
read synchronously. `initialValue: this.router.url` matters — without it
the signal starts as `undefined` until the first `NavigationEnd` fires,
and the app's _current_ location genuinely is known immediately via
`router.url`, so there's no reason to wait for an event to get it.

**`aria-pressed`, not a CSS class alone, for the toggle button — same
reasoning as `aria-current` from 07-22:** a filled vs. outline star (★/☆)
is a purely visual signal. `[attr.aria-pressed]="isCurrentPageFavorite()"`
tells assistive tech this is a two-state toggle, not a plain action button,
and its current state — the ARIA "pressed button" pattern, distinct from
`aria-current` (which marks _location_, not a toggleable state). Paired
`aria-label` swaps between "Add"/"Remove" so the announced action always
matches what a click will actually do next, not a static label describing
the icon.

**The clearest proof yet that DI is a flat, app-wide registry:** in
`app.spec.ts`, `TestBed.inject(Favorites)` returns the _same_ instance the
`App` fixture's toggle button mutates — no wiring between the test and the
component beyond both going through `TestBed`. Same again in `home.spec.ts`,
a completely separate spec file, separate fixture, same singleton. This is
the concrete version of "a flat registry available to anything via
`inject()`" from 07-20 — not two services that happen to have identical
data, literally one object being read and written from unrelated places.
