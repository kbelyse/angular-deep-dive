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

## 2026-07-28 — Fetching real data with `httpResource`

**Built a `/posts` page that fetches from a real public API
(JSONPlaceholder) using `httpResource`** — the signal-based replacement for
"inject `HttpClient`, subscribe, remember to unsubscribe" that this app
hadn't needed until now. First time anything in the app talks to the
network.

**`provideHttpClient()` has to be added explicitly — it's not implied by
anything else:**

```ts
providers: [
  provideBrowserGlobalErrorListeners(),
  provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  provideHttpClient(),
];
```

Same "nothing is implicit" theme as the router and Signal Forms — every
capability the app has is a provider someone added on purpose, traceable to
one line in `app.config.ts`.

**`httpResource` only accepts a URL-returning _function_, never a plain
string — compiler caught this immediately:**

```ts
httpResource<Post[]>(POSTS_URL, { defaultValue: [] }); // TS2769, no overload matches
httpResource<Post[]>(() => POSTS_URL, { defaultValue: [] }); // correct
```

At first this looked like a typo-level mistake, but it isn't one — every
overload of `httpResource` (and its `.text`/`.blob`/`.arrayBuffer` variants)
takes `(ctx) => string | undefined`, never a bare `string`. That's
deliberate: the whole point of the "resource" abstraction is that it
re-fetches automatically when a signal the function reads changes. A plain
string could never express that, so the API doesn't offer the shortcut —
there's no "static" overload to fall back to, even for a URL that happens
not to depend on anything else right now.

**Validated the response instead of trusting `httpResource<Post[]>` to mean
what it says:** the generic parameter is a type-level promise, not a
runtime check — nothing stops the API from returning something that isn't
actually a `Post[]`. Same "avoid `any`, use `unknown` when uncertain" rule
from CLAUDE.md as the Signal Forms validators, applied to network data
instead of form input:

```ts
function isPost(value: unknown): value is Post {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'number' &&
    typeof candidate['title'] === 'string' &&
    typeof candidate['body'] === 'string'
  );
}

httpResource<Post[]>(() => POSTS_URL, {
  defaultValue: [],
  parse: (value) => {
    if (!Array.isArray(value) || !value.every(isPost)) {
      throw new Error('Received an unexpected posts response.');
    }
    return value;
  },
});
```

`parse` receives the raw JSON as `unknown`, not `Post[]` — the resource
can't know the shape is right, so the type system doesn't let it pretend to.
Throwing inside `parse` on a bad shape puts the resource into its `error`
state, same as an actual network failure would, so the rest of the
component doesn't need to know or care whether "failed" means "the server
was down" or "the server lied about what it sent."

**Nearly shipped a real bug: `resource.value()` throws in the error
state, even with a `defaultValue` set.** Read this in the actual
implementation, not the docs, after noticing the doc comment ("or throws an
error if the resource is in an error state") didn't say whether a
`defaultValue` changes that:

```ts
// _resource-chunk.mjs, roughly:
if (!streamValue) return defaultValue; // idle / before first response
if (status === 'loading' && error()) return defaultValue; // retrying after a failure
if (!isResolved(streamValue)) throw new ResourceValueError(error()); // settled in error
return streamValue.value;
```

`defaultValue` only covers "haven't got a response yet." Once a request
settles into an error, `.value()` throws — so a `@for` loop reading
`postsResource.value()` unconditionally would crash the whole template the
first time the API failed. Fixed by branching on `postsResource.status()`
and never evaluating `.value()` on the `'error'` branch:

```html
@if (postsResource.status() === 'error') {
<p class="error" role="alert">
  Couldn't load posts: {{ postsResource.error()?.message }}
  <button type="button" (click)="retry()">Retry</button>
</p>
} @else {
<ul class="posts-list">
  @for (post of postsResource.value(); track post.id) { ... }
</ul>
}
```

`retry()` is just `this.postsResource.reload()` — the resource remembers
its own request, `reload()` just re-runs it.

**Loading state via `aria-busy` + `aria-live`, error via `role="alert"` —
different ARIA patterns for different reasons.** The loading text sits in a
permanent `aria-live="polite"` region so a screen reader announces it
appearing _and_ disappearing without needing focus to be anywhere near it —
same reasoning as the count announcer from 07-21. The error message uses
`role="alert"`, which is implicitly assertive (interrupts immediately)
rather than polite — appropriate here because a failed request is something
the user needs to know about right away, not just eventually.

**Testing: `HttpTestingController` instead of hitting the real API,** so
tests are deterministic and don't depend on network access or
JSONPlaceholder staying up:

```ts
providers: [provideHttpClient(), provideHttpClientTesting()];
// ...
httpMock.expectOne(POSTS_URL).flush([{ id: 1, title: 'Signals', body: '...' }]);
```

`expectOne` fails the test immediately if the component made zero or more
than one request to that URL — a stronger assertion than just checking the
rendered result, since it also catches "fetched twice by accident" bugs.
`afterEach(() => httpMock.verify())` fails the test if any request went
unflushed, which is what caught my first draft of these tests: the
`beforeEach`'s `fixture.detectChanges()` fires the initial request whether
or not a given test cares about it, so _every_ test needs to flush it, even
ones only checking the heading renders.

**Same "state update happens via an effect, not synchronously" lesson as
the Signal Forms submit test from 07-24, and it generalizes:** after
`req.flush(...)`, `fixture.detectChanges()` alone doesn't show the new
value — needs `await fixture.whenStable()` first. This isn't specific to
forms; anything backed by a `resource()` updates its signals from an
internal effect, which runs on Angular's own schedule, not inline with
whatever triggered it. The pattern to reach for going forward, anywhere a
signal is fed by something async: flush/resolve the async source, then
`await fixture.whenStable()`, _then_ `detectChanges()` and assert.

**Later the same day: host bindings via the `host` object, not
`@HostBinding`/`@HostListener` — a CLAUDE.md rule the app hadn't actually
exercised yet.** Built `RowHighlight`, a small attribute directive applied
to each post row, and used it to close that gap for real instead of just
not-violating it by accident:

```ts
@Directive({
  selector: '[appRowHighlight]',
  host: {
    '[class.highlighted]': 'highlighted()',
    '(focusin)': 'focused.set(true)',
    '(focusout)': 'focused.set(false)',
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
  },
})
export class RowHighlight {
  protected readonly focused = signal(false);
  protected readonly hovered = signal(false);
  protected readonly highlighted = computed(() => this.focused() || this.hovered());
}
```

Everything about how this directive touches its host element — the class it
toggles, the events it listens for — is declared in one place in the
decorator, not scattered across `@HostBinding`/`@HostListener`-decorated
class members. Reads like a small manifest of "this is everything this
directive does to its host," which is the actual point of the rule, not
just a stylistic preference.

**`focus`/`blur` don't bubble; `focusin`/`focusout` do — this is why the
directive listens for the latter.** The directive sits on the `<li>`, but
the focusable thing is the post content inside it (made focusable with
`tabindex="0"` on the `<li>` itself, since post text isn't naturally
interactive). A listener for plain `focus` on the host would only fire if
the host element itself were the thing focused, never for a descendant.
`focusin`/`focusout` are the DOM's own answer to "delegate focus tracking
to an ancestor," exactly like `click` vs. needing delegation for
dynamically-added children — not an Angular-specific detail.

**Made the `<li>` itself focusable (`tabindex="0"`) rather than inventing a
focusable wrapper:** this also happens to be a real accessibility fix, not
just a peg to hang the directive on — before this, a keyboard user tabbing
through the page had no way to land on an individual post at all, since
none of its content (a heading, a paragraph) is naturally focusable.

**Testing a directive needs a host component — it can't be instantiated on
its own,** since a directive only does anything when applied to an element
in a template:

```ts
@Component({
  imports: [RowHighlight],
  template: `<div appRowHighlight><button type="button">focus me</button></div>`,
})
class TestHost {}
```

First time this app has needed that pattern — every previous `.spec.ts`
tested a component directly via `TestBed.createComponent`. Dispatched
`focusin`/`focusout` with `{ bubbles: true }` on the inner `<button>` (not
the host `<div>`) to prove the delegation actually works, and separately
`mouseenter`/`mouseleave` directly on the host `<div>` (correct, since those
don't bubble) to prove focus and hover are tracked independently — covered
by a fifth test that hovers and focuses at once, then removes only the
hover, and checks the row is still highlighted because focus is still
active.

**Still 07-28: `@defer`, a second, different kind of lazy loading from the
one already used everywhere in this app.** Route-level `loadComponent`
(used since 07-22) defers a whole _page_ until you navigate to it. `@defer`
defers a piece _within_ an already-rendered page — added a `RecentPosts`
preview widget to `Home` that doesn't download or render until scrolled
into view:

```html
@defer (on viewport) {
<app-recent-posts />
} @placeholder {
<p class="defer-placeholder">Recent posts will appear when you scroll here.</p>
} @loading (minimum 200ms) {
<p class="defer-loading">Loading recent posts…</p>
} @error {
<p class="error" role="alert">Couldn't load the recent posts widget.</p>
}
```

Confirmed this is a real, separate JS chunk the same way the 07-22 log
confirmed route-level splitting — the production build lists `recent-posts`
as its own lazy chunk, distinct from `home`. `Home` downloads without it;
the browser only fetches `RecentPosts`'s code once the placeholder actually
scrolls into the viewport.

**`@error` here is not the same thing as the `postsResource.status() ===
'error'` branch built into `Posts` and `RecentPosts` earlier today — easy
to conflate, so worth being precise about:** `@defer`'s `@error` block only
fires if the deferred _component's JavaScript chunk itself_ fails to
download (a real but rare failure — flaky network mid-navigation, a broken
deploy). It has nothing to do with `RecentPosts`'s own `httpResource` call
failing; that's already handled entirely inside `RecentPosts`'s own
template, exactly like `Posts` handles it, and would show up as "Couldn't
load recent posts right now" _inside_ the successfully-loaded widget, not
as the outer `@defer` `@error` block. Two independent failure modes, two
independent places they're handled, deliberately not conflated into one.

**Extracted `Post`/`parsePosts` out of `Posts` into `src/app/post.ts`
before writing `RecentPosts`, instead of copy-pasting the validation
logic:** the first time this app had two real consumers of the same
network shape. Copying it would mean two places that could quietly drift
out of sync about what a valid post looks like — the same reasoning as not
duplicating the `Favorites` service, just for a pure function/type instead
of a stateful singleton.

**Testing a `@defer` block needs `DeferBlockBehavior.Manual`, set at the
`TestBed` level, not inside `providers`:**

```ts
await TestBed.configureTestingModule({
  imports: [Home],
  providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  deferBlockBehavior: DeferBlockBehavior.Manual,
}).compileComponents();
```

First attempt put `{ deferBlockBehavior: DeferBlockBehavior.Manual }`
inside the `providers` array, which compiled fine but silently did nothing
useful — `providers` expects DI provider entries, not arbitrary config;
`deferBlockBehavior` is a sibling of `imports`/`providers`, part of
`TestModuleMetadata` itself. Once fixed, `fixture.getDeferBlocks()` returns
the deferred blocks in the template, and `deferBlock.render(DeferBlockState.X)`
drives one straight to `Placeholder` (the default), `Loading`, `Complete`,
or `Error` on command — without `Manual` mode, Angular tries to use the
_real_ trigger (an actual `IntersectionObserver` for `on viewport`), which
jsdom doesn't meaningfully support in a test.

## 2026-07-29 — Dynamic routes: `/posts/:id`, guards, and reactive resources

**Built a post detail page at `/posts/:id`** — the first dynamic route
segment in this app; every route so far (`/counter`, `/feedback`, `/posts`)
has been a fixed string. Ties together nearly everything from the last
week: routing, `httpResource`, services, and accessibility, in one feature.

**`withComponentInputBinding()` — route params become component inputs
directly, no `ActivatedRoute` injection or subscription:**

```ts
provideRouter(routes, withComponentInputBinding());
```

```ts
export class PostDetail {
  readonly id = input.required<string>();
}
```

The router matches the input name (`id`) against the route's param name
(`:id`) and sets it automatically on navigation — the same "nothing is
implicit, but the wiring is one line" pattern as `provideHttpClient()` from
07-28. The old way (`inject(ActivatedRoute).paramMap.pipe(map(...))`) still
exists and is sometimes necessary (query params, resolvers), but for the
common case of "this route segment is this input," this is strictly less
code and — because it's a signal-backed input, not an Observable — it can
be read directly inside `httpResource`'s URL function.

**Confirmed `httpResource` really is reactive, not just re-run once at
construction — the URL function re-executes when `id()` changes:**

```ts
protected readonly postResource = httpResource<Post>(() => `${POSTS_URL}/${this.id()}`, {
  parse: parsePost,
});
```

Proved this with a test, not just by reading the docs: change the `id`
input via `setInput`, and a _second_ HTTP request goes out to the new URL
without any manual `.reload()` call — `httpMock.expectOne` on the new URL
is what actually confirms it, a plain "does the right title render" check
wouldn't have caught a component that only fetched once at startup and
happened to still show stale-but-plausible data.

**`hasValue()` narrowing applied prospectively this time, not retroactively
fixing a bug like 07-28:** `httpResource<Post>` with no `defaultValue` types
`.value()` as `Post | undefined`. Wrote `@else if (postResource.hasValue())`
before ever touching `.value()` in the template, and it compiles under full
AOT template type-checking with `.value()` narrowed to plain `Post` inside
that branch — confirmed by running `ng build`, not just the dev test
runner, since template type-checking strictness differs between them.

**Functional guards (`CanActivateFn`) return a `UrlTree` to redirect,
not an imperative `router.navigate()` call:**

```ts
export const postIdGuard: CanActivateFn = (route) => {
  const id = route.paramMap.get('id');
  if (id !== null && /^\d+$/.test(id)) {
    return true;
  }
  return inject(Router).parseUrl('/posts');
};
```

Returning a `UrlTree` _is_ the redirect — the router treats it as "cancel
this navigation, go here instead" as part of resolving the guard's result,
rather than the guard returning `false` and separately triggering a second
navigation as a side effect. One return value fully describes the outcome,
which is also why it's trivial to test: call the guard directly, assert on
what it returned, no `Router.navigate` spy needed.

**What a guard checks vs. what a resource's error state checks — two
different failure modes on the same route, deliberately not merged:** the
guard rejects `/posts/abc` before any network request is made — a cheap,
synchronous, syntactic check ("is this a plausible id at all"). A
syntactically valid but nonexistent id, like `/posts/999999`, sails past
the guard and only fails once `httpResource` actually asks the API and gets
a 404 — that's `PostDetail`'s own error state, same UI as `Posts`'s error
state. Same "two independent failure modes, two independent places" theme
as `@defer`'s `@error` vs. a resource's `error` state from 07-28.

**Set the document title twice, deliberately layered:** the route's static
`title: 'Post · Angular Deep Dive'` (the router's built-in title strategy,
from 07-22) shows immediately on navigation, before any data has loaded.
Once the post arrives, an effect overwrites it with the real title:

```ts
constructor() {
  effect(() => {
    if (this.postResource.hasValue()) {
      this.documentTitle.setTitle(`${this.postResource.value().title} · Angular Deep Dive`);
    }
  });
}
```

Not a bug that the title briefly shows the generic fallback — that's the
intended behavior. The alternative (leaving the title blank until data
loads) would be worse: a real, if temporary, page title beats no title at
all while a network request is in flight.

**Two testing gotchas, both from forgetting the "actually the same"
assumption:**

- `app.routes.spec.ts`'s `provideRouter(routes)` needed the exact same
  `withComponentInputBinding()` passed to it as `app.config.ts`'s real
  `provideRouter` call — forgetting it there meant `id` was never bound,
  `httpResource`'s URL function silently never produced a real URL, and no
  request ever fired. The fix was obvious once suspected, but the failure
  itself (`expectOne` finding nothing) gave no hint that the _router
  config_, not the component, was the problem — worth remembering that
  route-param-dependent tests need the router wired identically to
  production, not just "a" router.
- Tried `await harness.fixture.whenStable()` **before** `httpMock.expectOne(...).flush(...)`,
  copying the "flush, then `whenStable`" pattern from 07-28 but in the
  wrong order — this hangs forever (5000ms Vitest timeout), because
  `whenStable()` waits for pending zone-tracked work to finish, and the
  pending HTTP request _is_ that work; it can't finish until the test
  itself flushes it. The rule is stricter than "call `whenStable` around
  async resource updates" — it's specifically "flush the request first,
  `whenStable` after," never before.

## 2026-07-30 — Functional interceptors and a global loading indicator

**Why a service in between, instead of the interceptor touching the DOM
directly:** `loadingInterceptor` only knows about one request at a time —
it has no idea whether other requests are in flight elsewhere in the app.
So it doesn't track "loading" itself; it just increments/decrements a
shared counter on `HttpLoading`, and `App` reads `isLoading()` to decide
what to show. Three separate concerns (counting, deciding, rendering)
instead of one interceptor trying to do all three:

```ts
@Injectable({ providedIn: 'root' })
export class HttpLoading {
  private readonly pendingRequests = signal(0);
  readonly isLoading = computed(() => this.pendingRequests() > 0);

  start(): void {
    this.pendingRequests.update((count) => count + 1);
  }

  stop(): void {
    this.pendingRequests.update((count) => Math.max(0, count - 1));
  }
}
```

The `Math.max(0, ...)` in `stop()` isn't defensive-programming-for-its-own-sake:
it's there because interceptors and resources can retry or cancel in ways
that could theoretically call `stop()` more times than `start()` for the
same logical request, and a negative count would mean `isLoading()` reports
`false` while a request is actually still pending. Cheap to guard, expensive
to debug if the counter drifts negative in production.

**Functional interceptors are just a function shaped like a middleware
step, registered once:**

```ts
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const httpLoading = inject(HttpLoading);
  httpLoading.start();
  return next(req).pipe(finalize(() => httpLoading.stop()));
};
```

```ts
provideHttpClient(withInterceptors([loadingInterceptor]));
```

`inject()` works here even though this isn't a class — `HttpInterceptorFn`
runs inside an injection context that the router/HttpClient sets up per
call, same trick `CanActivateFn` guards use (07-29). The important part is
`finalize()`, not `tap()` on the success path: `finalize` runs on
completion _or_ error _or_ unsubscribe, so a failed request (tested by
flushing a 500) still decrements the counter. A `tap()` on the response
would only fire on success and silently leave the counter stuck for every
failed request — verified this distinction with a dedicated test rather
than assuming `finalize` was the right choice.

**The indicator is a CSS transform, not a client-side percentage:** there's
no way to know how much of a fetch is actually left, so faking a real
progress percentage would be dishonest. Instead `.loading-bar--active`
triggers a `transform: scaleX(1)` over a slow 4-second easing curve — it
communicates "something is happening," and gets yanked to 0 immediately
once loading flips back to false, rather than trying to simulate real
progress it has no way to measure.

## 2026-07-30 — Content projection with `contentChildren()`: a Tabs component

**Why `Tab.active` is a plain signal, not an `input()`:** `input()` values
come from template bindings the _consumer_ writes — but the consumer's
markup is just `<app-tab title="…">…</app-tab>`, with no `[active]` binding
anywhere, because the consumer doesn't know which tab is selected; `Tabs`
does. So `Tabs` needs to reach into each projected `Tab` instance and tell
it directly, which is exactly what `contentChildren()` hands back — live
component instances, not just their rendered DOM:

```ts
readonly tabs = contentChildren(Tab);

constructor() {
  effect(() => {
    const selected = this.selectedIndex();
    this.tabs().forEach((tab, i) => (i === selected ? tab.activate() : tab.deactivate()));
  });
}
```

`activate()`/`deactivate()` are plain methods that flip an internal
`signal(false)`, exposed read-only as `active = this.activeState.asReadonly()`.
Using `input()` here would mean the consumer's template would need
`[active]="i === selectedIndex"` on every `<app-tab>` — pushing the
container's own bookkeeping out into whoever uses it. Keeping `active`
internal-but-controllable is what makes `<app-tabs><app-tab title="X">…</app-tab></app-tabs>`
work with zero wiring from the caller.

**Roving tabindex, not one tabindex per button:** every unselected tab
button gets `tabindex="-1"`, the selected one gets `tabindex="0"` — so
Tab key only ever stops once on the tablist, and arrow keys move both
selection _and_ focus within it. This is the WAI-ARIA tabs pattern, not an
arbitrary choice — a screen reader or keyboard-only user tabbing through
the page should encounter "the tablist" as a single stop, then use arrow
keys to explore it, the same way a native `<select>` behaves.

**`viewChildren()` for the buttons, `contentChildren()` for the tabs —
different query for different origin:** `Tab` instances come from
projected content (between `<app-tabs>` and `</app-tabs>`), but the
`<button>` elements the keyboard handler needs to `.focus()` are part of
`Tabs`'s _own_ template. Reaching for `contentChildren` on the buttons
would find nothing — they're not projected content — which is why the
buttons are queried with `viewChildren<ElementRef<HTMLButtonElement>>('tabButton')`
against a template reference variable instead.

**A static module-level counter for unique ids, not `crypto.randomUUID()`:**
`aria-controls`/`aria-labelledby` need ids that are stable and unique
per-instance across the whole page, not cryptographically unpredictable —
a simple `let nextTabId = 0` incremented per `Tab` construction is enough,
and avoids reaching for browser crypto APIs to solve a problem that doesn't
need them.

## 2026-07-31 — `linkedSignal()`: a default that resets, but stays overridable

`computed()` can't model this Posts-page preview feature: I want the
previewed post to default to the first post in the list, but I also want
the user to be able to click "Preview" on any other post and have that
stick. A plain `computed()` can only ever reflect its inputs — it has no
concept of "unless someone overrode me." `linkedSignal()` is the signal
primitive built for exactly this gap: writable like a `signal()`, but with
a computation that re-derives its value whenever the _source_ it reads
changes:

```ts
protected readonly selectedPostId = linkedSignal(
  () => this.postsResource.value()[0]?.id ?? null,
);

protected select(id: number): void {
  this.selectedPostId.set(id);
}
```

Clicking "Preview" on post #2 calls `.set(2)`, which sticks — the computed
default doesn't re-run just because time passes. But `postsResource.value()`
is the signal being read _inside_ the computation, so the moment it
produces a new array (a `reload()` after Retry, for instance), Angular
reruns the linked computation from scratch and `selectedPostId` snaps back
to the new first post, silently discarding whatever the user had clicked
before. That's not a bug to work around — it's the actual desired
behavior: a stale selection pointing at a post that may not even exist in
the new list would be worse than resetting. Verified with three tests: it
defaults to the first post, a click overrides it, and a `reload()` after
that override resets it — the third test is the one that actually
distinguishes `linkedSignal` from `computed` plus a boolean "has the user
touched this" flag, which is the naive way to hand-roll the same behavior.

**Why `selectedPost` and `readingMinutes` are separate `computed()`s, not
folded into the `linkedSignal`:** `selectedPostId` is the one piece of
state that needs the reset-on-source-change behavior; `selectedPost`
(looking the id up in the list) and `readingMinutes` (a word count off the
selected post's body) are pure derivations with no independent state of
their own. Keeping them as plain `computed()` chained off the
`linkedSignal` — rather than duplicating the lookup logic inside a bigger
linked computation — keeps each piece answerable to exactly one question.

**Accessible name collisions were a real bug, not a nitpick:** every row's
button says "Preview," which is fine visually but means a screen reader
user navigating by a buttons list hears "Preview, Preview, Preview…" with
no way to tell them apart. Adding `[attr.aria-label]="'Preview ' + post.title"`
keeps the visible label short while giving each button a distinct
accessible name — caught by writing a test that asserts on `aria-label`
per button, not by an automated audit.

## 2026-07-31 — A custom `PreloadingStrategy` for selective route preloading

Angular lazy-loads each feature route's JS on first navigation to it —
good for the initial bundle, but it means clicking "Posts" for the first
time pays a network round-trip the user notices. `withPreloading()` lets
the router fetch a lazy chunk in the background _after_ the app has
finished bootstrapping, so by the time someone actually clicks the link
the code is already sitting in memory. The built-in `PreloadAllModules`
strategy preloads everything, which defeats half the point of lazy-loading
routes that are rarely visited (like the not-found page) — a custom
`PreloadingStrategy` lets each route opt in individually:

```ts
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.data?.['preload'] ? load() : of(null);
  }
}
```

```ts
provideRouter(routes, withComponentInputBinding(), withPreloading(SelectivePreloadingStrategy));
```

Routes flagged `data: { preload: true }` (posts, counter — the two most
likely next stops from Home) get preloaded; everything else only loads on
actual navigation. The `Route`/`load` shape mirrors functional interceptors
and guards from the last two days: the router hands the strategy a plain
description of the route and a thunk to call if it wants the chunk fetched,
and the strategy just returns an observable — `load()`'s result if it
preloads, `of(null)` if it declines. No DOM, no component, nothing to
render; that's what made it possible to unit-test by calling `new
SelectivePreloadingStrategy().preload(...)` directly with a hand-built
`Route` and a `vi.fn()` in place of `load`, rather than standing up a full
router harness.

**Testing both "does it call load" and "does it resolve via DI" mattered
for different reasons:** the `new SelectivePreloadingStrategy()` tests
check the actual branching logic in isolation — no Angular test bed
needed. A separate test asserts `TestBed.inject(SelectivePreloadingStrategy)`
returns the same instance twice, which is really a test that
`providedIn: 'root'` is doing its job — a logic bug and a DI-wiring bug
are different failure modes, and a test suite that only checks one of them
can pass while the other is silently broken.

## 2026-08-04 — `effect()` as the DOM/localStorage sync point for a theme toggle

`ThemePreference` is a `providedIn: 'root'` service wrapping a single
`signal<'light' | 'dark'>`. What made it worth its own learning-log entry
isn't the signal — it's `effect()` used for what it's actually for:
pushing a signal's value out to something Angular doesn't own (here,
`localStorage` and `document.documentElement.dataset['theme']`), as
opposed to `computed()`, which can only produce a new in-memory value.

```ts
constructor() {
  effect(() => {
    const theme = this.theme();
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.dataset['theme'] = theme;
  });
}
```

**Initial value resolution order — stored preference, then system
preference, then a hardcoded default — happens once, outside the signal:**
`initialTheme()` runs synchronously when the `signal()` call is
constructed, reading `localStorage` first and falling back to
`matchMedia('(prefers-color-scheme: dark)').matches` only if nothing was
stored. This is deliberately _not_ reactive — if the OS-level theme
changes while the tab is open, this app doesn't follow it, because a
user's explicit in-app toggle should always win once they've made a
choice, and there's no way to tell "the user never chose" apart from
"the user chose light" once both are just the string `'light'` in
`localStorage`. A `null`/unset sentinel is what makes the fallback order
work at all.

**Testing this needed `vi.stubGlobal('matchMedia', …)`, not a real media
query:** jsdom doesn't implement `matchMedia`, so the three initial-value
tests (system prefers light, system prefers dark, stored choice overrides
system preference) each stub a fake `matchMedia` returning a fixed
`matches` boolean before injecting the service — the same shape jsdom
would provide if it had one, just deterministic. The toggle/persistence
test needed `TestBed.flushEffects()` after calling `.toggle()`: unlike
`computed()`, which recomputes lazily on read, `effect()` runs on
Angular's own scheduler, and a test asserting on `localStorage` or
`document.documentElement` right after calling a signal setter would be
racing that scheduler without the explicit flush.

**CSS custom properties, not a `[class.dark-mode]` binding on every
element:** `:root` and `:root[data-theme='dark']` in `styles.scss` define
the same six variable names (`--color-bg`, `--color-text`,
`--color-border`, etc.) with different values, and every themed rule in
`app.scss` references `var(--color-border)` instead of a literal hex
code. Flipping the theme is then one attribute write
(`document.documentElement.dataset['theme'] = 'dark'`) that the browser's
own cascade propagates everywhere a variable is used — no Angular
involvement needed for the actual repaint, and no per-component style
binding to keep in sync as new components get added.

## 2026-08-04 — Favorites survives a reload: the same hydrate/persist shape, reused

`Favorites` had an obvious gap since the day it was written: star a page,
reload the tab, the star is gone. `ThemePreference` had just solved this
exact problem for a single string, so `Favorites` reuses the same two-part
shape — a plain function that computes the signal's initial value by
reading `localStorage` at construction time, plus an `effect()` in the
constructor that writes back out on every change — rather than inventing
a different persistence pattern for what's structurally the same problem
one type up (a `Set<string>` instead of a single string):

```ts
function initialPaths(): ReadonlySet<string> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return new Set();
  try {
    const parsed: unknown = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
      return new Set(parsed);
    }
  } catch {
    // malformed JSON — fall through to an empty set below
  }
  return new Set();
}
```

**Why the malformed-JSON guard matters here specifically:** `localStorage`
is per-origin, unversioned, and editable by anything with page access —
including whatever the previous version of this app wrote there before
today's change existed at all. A `JSON.parse` that's allowed to throw
during service construction would take down the entire app shell (this
service is injected from `App` itself), not just the favorites feature —
one bad or hand-edited value in devtools shouldn't be a hard crash. The
`Array.isArray` + `every(typeof === 'string')` check is the same
narrow-then-trust validation shape as `parsePosts`/`parsePost` in
`post.ts`: don't trust an external value just because `JSON.parse`
didn't throw.

**Test isolation needed `localStorage.clear()` in both `beforeEach` and
`afterEach`, and `TestBed.resetTestingModule()` before re-injecting:**
`Favorites` is `providedIn: 'root'`, so once a test has called
`TestBed.inject(Favorites)`, later calls in the same test return the
_same_ instance — its `initialPaths()` already ran and won't re-read
`localStorage` no matter what gets written to it afterward. The hydration
tests need a fresh injector after seeding `localStorage`, which is what
`TestBed.resetTestingModule()` forces; skipping it would silently test
nothing, since the already-constructed singleton wouldn't notice the
seeded value.

## 2026-08-04 — `toObservable`/`toSignal` for a debounced search, and why not `linkedSignal`

Posts needed a search box that filters as you type, but without firing a
re-filter (and, in a real API, a re-request) on every keystroke. Signals
have no built-in `debounceTime` — `computed()` and `linkedSignal()` are
both synchronous, re-running the instant a dependency changes. RxJS still
owns "spread this out over time," so the debounce boundary is exactly
where `toObservable`/`toSignal` earn their keep: cross into RxJS for the
one operator signals can't do, then cross straight back:

```ts
protected readonly query = signal('');

private readonly debouncedQuery = toSignal(
  toObservable(this.query).pipe(debounceTime(250)),
  { initialValue: '' },
);

protected readonly filteredPosts = computed(() => {
  const query = this.debouncedQuery().trim().toLowerCase();
  const posts = this.postsResource.value();
  return query ? posts.filter((post) => post.title.toLowerCase().includes(query)) : posts;
});
```

`filteredPosts` itself is a plain `computed()` again once `debouncedQuery`
exists — the debounce is the only part of this that isn't expressible as
a pure, synchronous derivation, so it's the only part that leaves signal
-land.

**The empty-results message reads the _live_ `query()`, not
`debouncedQuery()`, on purpose:** `@if (query().trim() && filteredPosts().length === 0)`
gates on the raw input so the message only appears once there's
something typed — using `debouncedQuery` there instead would flash "No
posts match \"\"" for the 250ms between a keystroke and the debounce
firing, since `filteredPosts` (built from the stale, pre-debounce query)
would still read as non-matching for a config that hasn't caught up yet.
The message text itself still interpolates `query()` too, so it reflects
exactly what's in the box, not what's actually been searched for yet.

**Faking timers to test a debounce, and why `vi.useFakeTimers()` had to
scope to a nested `describe`:** the debounce tests dispatch a real
`input` event, then assert nothing changes at `+100ms` and something does
at `+250ms` — proving the debounce boundary actually holds, not just that
filtering works eventually. `vi.useFakeTimers()`/`vi.useRealTimers()` are
scoped to their own nested `describe('search filtering', …)` block rather
than the whole spec file, because every other test in `posts.spec.ts`
awaits `fixture.whenStable()`, which depends on Zone's real macrotask
queue — leaving fake timers on globally would hang those unrelated tests.

## 2026-08-04 — A `Pipe` to stop copy-pasting the reading-time math

`Posts` and `PostDetail` both wanted a reading-time estimate, and the
logic had already been written once (inside a `computed()` in `Posts`).
Copy-pasting that `computed()` into `PostDetail` would have meant two
copies of the same word-counting math to keep in sync forever. The fix
was two small extractions instead: a plain function pulled out of the
component entirely, then a thin `Pipe` wrapping it for template use in
both places.

```ts
// post.ts — pure, no Angular imports needed
export function readingTime(body: string): number {
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
```

```ts
// reading-time.ts
@Pipe({ name: 'readingTime' })
export class ReadingTime implements PipeTransform {
  transform(body: string): string {
    return `${readingTime(body)} min read`;
  }
}
```

```html
<p class="reading-time">{{ post.body | readingTime }}</p>
```

**Two extractions, not one, because they solve different problems:** the
plain `readingTime()` function is what's actually reusable and testable
in isolation — `readingTime('word '.repeat(400))` needs nothing from
Angular to assert on. The `Pipe` wrapping it exists only to make that
function callable from a template with `|` syntax and to own the display
formatting (`"N min read"`) so that string isn't duplicated at each call
site either. Testing them separately reflects that split: `post.spec.ts`
asserts on the numeric edge cases (rounds up, floors at 1, collapses
whitespace), `reading-time.spec.ts` asserts only on the pipe's own job —
formatting a number that's already correct.

**`new ReadingTime().transform(body)` needed no `TestBed` at all:** like
`SelectivePreloadingStrategy`, a pipe with no injected dependencies is
just a class with one method — instantiating it directly in the test is
both faster and a more direct signal of what's actually being tested
(the transform logic) than spinning up Angular's DI to get the same
instance back.

**Deleting `Posts`' old `readingMinutes` computed left `Posts` itself
smaller, not just not-bigger:** removing the now-redundant `computed()`
and its manual word-count math, in favor of one `import` and one pipe
usage in the template, is the kind of change that's easy to skip because
it "already works" — but the duplicate logic was a bug waiting for
`PostDetail`'s copy to drift from `Posts`' copy the next time either one
changed.
