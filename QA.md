# Verification — 2 October 2026

## Public deployment verification

- Native GitHub connections deploy `main` to the personal Railway project and Vercel Hobby project. Verified a pushed commit reached both platforms. Railway waited for the successful GitHub Actions check before releasing the API.
- CI passes migrations, six package type checks, two integration tests with 35 assertions, and both production builds. CI storage is an isolated S3rver protocol fixture; the deployed Railway bucket was tested separately with actual uploads and reads.
- On `https://touch-grass-journal.vercel.app`, registered a temporary email/password account, signed in again, imported a photograph, received a real Gemini identification, saved it, followed the tree, and edited its notes. Railway PostgreSQL confirmed the saved fields.
- Authenticated photo requests returned 200 with `private, no-store`; the same photo returned 401 without a session. The direct and proxied health endpoints both verified database connectivity.
- Blocked network requests in the page and service workers, reloaded the saved discovery, and confirmed its edited notes and photo remained available while a fresh health request failed. Both landing and app shells are precached. This is a simulated network outage, not a physical-device flight-mode test.
- Inspected the deployed mobile sign-in and saved discovery. The sign-in accessibility check reported zero violations. Production screenshots are in ignored `artifacts/deploy/`.
- Production testing found a late session update could restore the local account label after sign-out. Sign-out now reloads the public page to discard mounted session observers, and the shared session hook clears the label when the server confirms a signed-out session. Repeated the live sign-in/sign-out journey and verified the server session, cached identity, and private journal/photo caches were empty.
- Deleted the test discovery through the app, verified its object returned 404 from Railway storage, and removed the temporary QA account. Closed the browser and stopped local verification processes.

Google OAuth remains intentionally deferred. Native camera, phone installation, and actual OS push delivery still require the physical-device checks listed below.

## Automated checks

- `bun run check-types`: all six package checks passed.
- `bun run build`: API and web production builds passed, including the custom PWA worker and precache manifest.
- `bun run test`: two tests, 33 assertions passed against the real local PostgreSQL database and MinIO bucket.
- `bun run --cwd apps/server eval:ai`: real Gemini requests passed the tree-photograph and blank-image cases. The blank image returned `isPlant: false`; the tree returned a structured suggestion. This verifies the integration and basic rejection behavior, not species accuracy.
- `git diff --check`: passed.

The integration test creates separate temporary accounts and checks authentication, unauthorized requests, image decoding, private response headers, cross-account photo access, invalid coordinates, duplicate concurrent uploads/saves/visits, editing, notification endpoint rejection, failed test-notification reporting, removal of database records and S3 objects, CSRF origin rejection, and session revocation. It removes its own fixtures afterwards. Species-count checks exclude genus-only and unresolved names.

## Live browser checks

Used the T3 collaborative browser at 390px and 1280px through a temporary HTTPS tunnel, then the installed agent-browser after the collaborative preview disconnected. Also checked 320px layouts.

- Registered a real email/password test account; wrong-password errors and successful sign-in exercised.
- Imported an actual image; received a real Gemini result; saved the photograph in MinIO and the journal entry in PostgreSQL; reopened the entry.
- Edited the nickname, followed the tree, added a photographed return visit and seasonal stage, and verified challenge progress.
- Added a **simulated test coordinate** through the geolocation callback; checked the real OpenStreetMap basemap, private marker, and matching list entry. This was not a live GPS measurement.
- Saved an offline draft, restored connectivity, and synced it without duplication.
- Aborted the identification request in the browser, verified the recovery message and retained photograph, restored requests, retried Gemini successfully, and saved the discovery.
- Stopped the production web server and reopened `/journal`: the service worker served the app, both cached photos remained visible, and the journal explicitly showed its saved-copy notice.
- Verified the production worker registered and controlled routes. Capture remained usable offline within the loaded app; a guest could keep and discard a local draft. Full reload resilience was separately verified with the production web server stopped.
- Opened and visually inspected home, auth, empty/populated journal, capture, identification/detail, edit dialog, map, challenges, guide, and settings screens.
- Checked keyboard movement inside the edit dialog, Escape dismissal, deletion confirmation, reduced-motion media behavior, and account-cache removal on sign-out.
- Ran axe-core WCAG A/AA checks. Journal, capture, guide, and settings had zero violations after fixes. Home and detail also had zero violations; image-backed captions and Base UI focus guards required manual review. The map includes a named region and an accessible discovery list.

## Fixes found during verification

- Corrected the initial server-rendered shell so the client hydrates.
- Marked shadcn link renderers with Base UI's `nativeButton={false}`.
- Made concurrent uploads and saves idempotent and cleaned unused stored photos on deletion.
- Generated the PWA worker after both TanStack build environments; added cached-shell fallback for network failures and server errors.
- Copied the live file input's `FileList` before asynchronous work, preventing input reset from erasing a pending selection.
- Increased inactive-tab contrast and touch height; darkened the shared muted-text token.
- Removed empty toast actions, added recoverable network copy, and preserved guest offline drafts.

## Remaining device/setup checks

- **Google sign-in is deliberately deferred.** The optional provider is wired but no OAuth credentials were requested again.
- **Actual push delivery is unverified.** The HTTPS preview browser had notification permission but `PushManager.subscribe()` failed with “push service not available.” The UI reports failure without claiming success. Subscription storage, endpoint validation, scheduler, test delivery, and expired-subscription cleanup are implemented; a supported installed phone/browser must complete the delivery check.
- Native camera capture, iOS Add to Home Screen, OS-level push display, and storage eviction require physical-device testing. File import and browser-level PWA behavior were exercised here.
- Do not rebuild over a running production output directory. Stop the server locally first; use atomic releases when deploying.

Local screenshots are in ignored `artifacts/qa/`; selected collaborative screenshots also remain in this thread. The temporary QA account, discoveries, return visit, and stored photos were removed; object deletion was verified. Test servers, browser, and HTTPS tunnel were stopped.

## Pocket journal redesign verification

The complete UI was redesigned after the user selected an illustrated pocket field journal. This pass replaced the large home hero and repeated challenge cards, compacted shared primitives, introduced original artwork and a new app mark, added a shared photograph selector, folded optional capture notes into a shadcn Collapsible, and adapted editing dialogs to the bottom of phone screens.

- Inspected home, empty and populated journal, capture, identification, saved discovery, return visit, edit dialog, map, challenges, guides, settings, and auth. Captured mobile and desktop screens in ignored `artifacts/redesign/`.
- Checked 320px, 390px, and 1280px widths. No horizontal overflow. Narrow page titles are 24–27px; text inputs remain 16px. Reduced-motion mode reduces transitions to effectively zero.
- Registered a temporary account, imported photographs, made two live Gemini identification requests, switched between detail photographs, added notes and a **simulated** location, saved, followed, edited the nickname, and saved a photographed return visit. PostgreSQL confirmed the discovery and visit retained their selected seasonal stages.
- Verified journal search matches note text, following filters retain followed entries, and unmatched searches show the empty result. Real OpenStreetMap tiles and the custom marker rendered. The marker is keyboard focusable and the list remains available.
- Keyboard focus stayed in the editing dialog. Corrected a race that allowed opening Edit while a follow update was pending. Corrected named-group semantics for photo selection and journal totals, and restored 44px seasonal toggle targets.
- axe WCAG A/AA found zero violations on home, journal, capture, saved detail, challenges, guide, settings, and auth. Base UI focus guards, Leaflet attribution, and the illustration annotation required manual review; the annotation uses opaque paper backing and shared text colors.
- `bun run check-types`, `bun run build`, and the existing 33 integration assertions passed. No backend or database schema changes were needed for the redesign.
- Confirmed the production service worker precaches all three new illustrations. Stopped the production web server, reloaded the home page, and verified the shell and every illustration still loaded.
- The temporary redesign account, discovery, visit, and three stored photos were removed. S3 deletion was verified. Browser and test servers were stopped.

The earlier physical-device and push-delivery limitations still apply. This pass did not claim a native camera, OS install prompt, or phone push delivery test.

## Landing campaign verification — October 2, 2026

- Reviewed the public landing at 320 × 740, 390 × 844, and 1440 × 1000. Checked all sections, specimen states, an expanded FAQ, and both auth modes. No horizontal overflow at the narrowest width. Final screenshots are in ignored `artifacts/landing/`.
- Clicked the header Sign in through to `/login?mode=signin` (email/password only), switched to signup (name field present), and checked the primary signup CTA. Today opens `/explore` and remains the active app tab. Field-note links open their existing articles.
- Exercised all three sample tabs, keyboard arrow + Enter activation, and FAQ expansion. Sample controls make no AI requests or journal writes.
- Axe WCAG 2 A/AA: zero violations on desktop and mobile. Image-backed/rotated content requires manual contrast review; inspected it visually, and gave the secondary hero link an opaque paper background. Reduced-motion emulation disables the hero reveal; global reduced-motion rules also suppress transitions.
- `bun run check-types`: all 6 packages passed. `bun run build`: both apps passed. `bun run test`: 2 tests, 33 assertions passed against real local auth/database/storage, with test fixtures cleaned up.
- Production worker activated successfully. Manifest preserves `id: /` and `scope: /` and starts at `/explore`. Confirmed both entry shells cached. With the production web server stopped, `/explore`, `/`, and `/capture` opened successfully; meadow and journal illustrations remained available. No private API caching was added.
- The branded 1200 × 630 social image returns HTTP 200 and was visually inspected. Physical-device installation, native camera, and OS notification delivery retain the limitations recorded above; this landing change does not re-test those integrations.

## Browser capability and sharing audit — October 5, 2026

The iPhone report exposed a missing Push API on a valid service-worker registration. The old sign-out expression throws before contacting auth. Reproduced that condition in the collaborative browser, then verified the fix clears the real server session and cached identity. Optional reminder cleanup failures no longer block session revocation; authentication errors still report failure. Notification permission is requested directly from the user action before asynchronous registration lookup.

- Added nine browser-capability regression tests (18 assertions) to the root CI test command: absent service workers/registrations/push manager, rejected registration/subscription access, independent server/browser unsubscribe failures, failed auth revocation, and unavailable local caches. Existing real PostgreSQL/MinIO integration tests pass (35 assertions).
- Live browser: email/password signup, wrong password and successful sign-in; invalid photo rejection; image import; forced identification network failure with retained draft; successful retry against real Gemini; save/reopen; edit; follow; photographed return visit and seasonal stage; note search and unmatched search; challenge progress; map tiles, marker and accessible list using a **simulated** coordinate; JSON export containing the discovery and visit; denied-notification feedback; installation-help dialog; sign-out with the actual registration's push manager removed.
- Denying `localStorage.setItem` reproduced a full-page error in the signed-in app. Account-cache writes/removal now tolerate denied storage while preserving the live session.
- Confirmed the production service worker controls the app. With the web server stopped, a fresh journal navigation loaded the cached shell and saved journal data. The browser still reported a network connection; this tests server-unavailable recovery, not airplane mode.
- Inspected mobile navigation and app screens at 320/390px and the desktop settings dialog at 1280px. Camera and neighbouring labels share a baseline; camera artwork has 8px clearance above it, all navigation targets are 54px tall, and safe-area padding remains. Injected a long unbroken error at 320px: document width stayed 320px. The mechanical design scan reported only a pre-existing collapsible-height animation, outside this change.
- Verified generated homepage and three field-note documents have one canonical URL, indexable public metadata, complete Open Graph/Twitter image metadata and real page text without JavaScript. The default app shell is `noindex`. The sitemap contains only public canonical URLs. The existing illustrated 1200 × 630 share JPEG was visually reviewed and returns HTTP 200 from the custom domain.

Physical iOS camera capture, OS installation and push delivery remain unverified; Google OAuth remains intentionally deferred. Platform-specific social preview caches and search rankings cannot be validated before merge/deployment and recrawling.

Final checks: `bun run check-types`, `bun run build`, `bun run test` (11 tests / 53 assertions) and `git diff --check` passed. Repeated the denied-local-storage browser case on the final production build: Settings and Sign out remained usable. Deleted the temporary discovery through the confirmation dialog and verified both photo endpoints return 404.

## iPhone photo persistence — October 5, 2026

The reported camera and library failures were investigated through read-only Railway account/session queries and API logs. The affected account had iPhone Safari sessions but no uploaded photos or discoveries. No account data was changed.

- Reproduced the exact “Couldn't read this photograph” message in real WebKit with an ordinary application image. Image decoding succeeded; saving the draft failed. Direct IndexedDB probes accepted text and ArrayBuffer records but rejected Blob records through `idb-keyval` with a null error. This explains the misleading image-reading fallback before any upload.
- Drafts and private downloaded photos now share one bytes/MIME codec. Existing Blob records remain readable and are converted on their next write. Genuine draft-storage failures now produce a persistence error and preserve the previous stored draft.
- Four new regression tests cover byte/MIME round trips, draft metadata, legacy records, account isolation, sign-out cache cleanup, and failed writes. Web test files run with Bun's module isolation so their mocks cannot affect other suites.
- On the local production web build in WebKit at iPhone dimensions, exercised both photo inputs, a two-photo draft restored after reload, guest draft claiming after email/password signup, actual MinIO uploads and PostgreSQL saves, both saved photos after reload, discovery deletion, and sign-out. No page errors were recorded; the saved-entry screen was visually inspected.
- Cached photos remained visible with the browser context offline. WebKit reported an internal navigation error during the offline reload, so this pass does not establish a clean full offline navigation. The binary-storage round trips and online reloads passed independently.
- `bun run check-types`, `bun run build`, `bun run test` (15 tests / 72 assertions), and `git diff --check` passed. Temporary local accounts, discoveries, and stored objects were removed after verification.

The T3 browser reported unavailable, so this pass used an isolated WebKit browser. File inputs were populated programmatically; physical iPhone camera/library pickers and the affected phone's storage state still need a device retest after deployment. No image-decoder dependency, server change, or database migration was added.
