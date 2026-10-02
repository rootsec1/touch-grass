# Touch Grass

Touch Grass is a mobile-first PWA for getting to know the trees and plants on everyday walks. Photograph a discovery, learn identifying features, keep a private journal, and return to the same tree through the seasons.

## Product contract

- Explore is useful before sign-in. Identification is a suggestion, never a verified fact. Save uncertain discoveries and original photographs.
- Email/password authentication backs up the journal. Google OAuth is optional and shown only when configured.
- Distinguish unique species from individual trees and repeat visits. Never populate a user's collection with sample discoveries.
- Photos, precise locations, and notes are private. Sharing is explicit and excludes coordinates. No public leaderboard, feed, streak pressure, foraging advice, or invented age/health measurements.
- Capture saves locally before networking. Offline drafts are visible, retryable, and removable. Never discard a draft because upload or identification failed.
- Gentle challenges reward new discoveries and revisits. A field guide helps users learn to recognize plants themselves.
- Notifications are opt-in, support testing and removal, and concern trees the user follows. Installation is suggested after value, never forced.

## Main journeys

1. Explore → capture/import → optional location → identification → save locally or sign in to back up.
2. Journal → discovery → follow/edit → add a visit → compare photos over time.
3. Map → own located discoveries → entry. An accessible list is always available.
4. Settings → install, reminders, export, account, privacy.

## Verification

Exercise auth, ownership boundaries, real image upload/storage, identification success and failure, journal CRUD, revisits, offline drafts, synchronization, manifest/service worker, notification subscription and delivery, responsive layouts, keyboard and reduced-motion behavior. Document external blockers honestly.

## Public discovery journey

Visitors arrive on an illustrated marketing page at `/`, can try a labeled Look / Learn / Keep sample, read the existing field notes, or enter the app at `/explore`. Primary CTAs go to account creation; Sign in opens `/login?mode=signin`. The installed PWA starts at `/explore` and retains its original app identity and scope. Both public and app entry shells are precached, without caching private API responses.
