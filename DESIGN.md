# Touch Grass design system

## Direction

A pocket field journal, illustrated, warm, quietly playful. The user selected this direction for the complete October 2026 redesign. The app should feel like something a curious walker keeps, with botanical specimens, photographs, short notes, and room to return. It must work quickly in one hand outdoors.

The previous oversized marketing hero, repeated dashboard cards, and large icon containers are retired. Compose screens around the actual task or content. Use illustrated covers, specimen sheets, editorial lists, and thin rules. Avoid decorative statistics, excessive subtitles, and generic icon grids.

## Palette and typography

The canonical tokens live in `packages/ui/src/styles/globals.css`.

- Paper `#f6f3ea`, clean page `#fcfaf4`, ink `#2f3828`, moss `#445b35`, secondary sage `#e8eadb`, muted text `#626957`, ochre `#e3c47a`.
- Fraunces supplies the journal headings, specimen names, and occasional italic annotations. DM Sans supplies controls and reading text. Fonts are self-hosted.
- Mobile page titles are 26px, section titles 20px, body 13px, supporting copy 11–12px. Form inputs stay 16px to prevent iOS zoom. Tiny 9–10px text is restricted to secondary navigation labels and short metadata.
- Spacing starts with 20px page gutters, 16–24px between content groups, and a 56px mobile app bar. Every interactive control retains at least a 44px target.
- Desktop uses a wider journal spread with paired content, never a stretched phone column or a dashboard grid.

## Component ownership

Shared shadcn Base UI controls live in `packages/ui/src/components`. The shared stylesheet owns their density, type, shape, and motion. `Button` has a `field` variant for the rounded camera/save action, `photo` for photograph selection, and `nav` for navigation. These are the only owners of those appearances.

Product compositions live in `apps/web/src/components`. `PhotoGallery` owns photograph selection for both draft capture and saved discoveries. `Photo` owns private blob loading and caching. `IdentificationDetails` owns result presentation in both places. `DiscoveryFields` owns the optional observation form.

## Original artwork

Generated for this redesign, then optimized to local WebP assets:

- `woodland-illustration.webp`: gouache and colored-pencil woodland, a broad oak, delicate foreground plants, and a winding path. Used as the illustrated cover and walking context.
- `oak-study.webp`: isolated oak twig, leaves, and acorns. Used as a specimen on the empty journal and capture guide.
- `fern-study.webp`: isolated fern and curled fiddlehead. Used for field notes, walking invitations, and auth.
- `icon.svg`: original vector grass mark. The two PNG PWA icons are generated from it.

Illustrations are decorative/editorial, not identification reference images or fabricated discoveries. Personal collections only show user photographs. Real photographs remain in the reading guides. Asset provenance and generation prompts are in `apps/web/public/images/ARTWORK.md`.

## Journeys and states

- Today presents one clear camera action, a walking invitation, and short reading notes. Returning users see their actual recent discoveries.
- Capture starts with a specimen in a viewfinder. After import, users can select detail photos, identify, and save. Optional nickname/place/notes live in a shadcn Collapsible to keep the main path short. Revisit notes open by default.
- Journal uses two photograph columns on phones, small specimen labels, and real counts. Search covers names, places, and notes. Draft recovery stays visible.
- Discovery uses the shared gallery, compact identification, optional alternative matches, and a dated visit record. Editing opens a bottom-aligned dialog on mobile.
- Places uses the real private map with a matching list. Empty state artwork does not suggest that pins already exist.
- Wander uses illustrated invitations with real progress, without points or deadlines.
- Settings uses compact, readable rows. Auth stays within a small phone screen, with no competing promotion.

## Motion and accessibility

Pressed controls respond immediately. The scan line only moves while identification runs. Result content reveals like a page being uncovered; photo thumbnails show selection, and disclosure panels preserve their place while opening. No scrolling hijacks, auto-playing scenery, or artificial loading delays. Honor reduced motion everywhere.

Provide keyboard focus, named controls, dialog titles, explicit disabled/loading/error states, and informative photo fallbacks. Warm muted text still needs at least 4.5:1 contrast for normal copy. Inspect at 320px, 390px, and desktop. Decorative images use empty alt text; informative artwork describes the scene.

## Reference library

The three direction-setting references above anchor the finished visual language. These additional references informed the comparison of capture, collection, and outdoor layouts:

| Reference | Useful angle |
| --- | --- |
| [Ronas IT — Plant Identification](https://dribbble.com/shots/24386530-Plant-Identification-Mobile-App) | Photo → identity → personal collection |
| [Diana Larussa — Collection Empty State](https://dribbble.com/shots/27688386-Collection-Empty-State-Plant-Scanner-App-Plant-Identification) | Explain the first useful action in an empty collection |
| [Michelle Malto — Hiking App](https://dribbble.com/shots/17234026-Hiking-app-Mobile-app-design) | Restrained outdoor palette |
| [Vektora — Hiking UI](https://dribbble.com/shots/15131429-Hiking-Apps-UI-Design-Concept) | Outdoor navigation and route context |
| [Caleb Yeboah — Nature Exploration](https://dribbble.com/shots/17269650-nature-exploration-mobile-ui-design) | Simple imagery-led exploration |
| [Aayush Mandal — Plant Care & Identification](https://dribbble.com/shots/27068452-Plant-Care-Identification-App-Mobile-UI-Design) | Quiet hierarchy and soft plant cards |
| [Abdus Sattar — Plant Care](https://dribbble.com/shots/26513755-Plant-Care-Mobile-App-Design) | Photo notes and personal plant history |
| [Marek Erben — Plant Management](https://dribbble.com/shots/21262748-Minial-and-clean-plant-management-mobile-application) | Identification and reference information in one journey |
| [Olha Kachmar — Hiking & Trail Exploration](https://dribbble.com/shots/27210659-Quick-UI-challenge-Hiking-Trail-Exploration-App) | Earth tones and compact outdoor information |

These are visual references, not evidence that their product claims or AI accuracy are validated. Touch Grass intentionally omits plant-health scores and household watering obligations.

## Public landing / campaign

The public homepage is `/`; the compact journal starts at `/explore`. Marketing uses the same paper, moss, forest, ochre, DM Sans, and Fraunces tokens, with its own scoped editorial scale in `apps/web/src/landing.css`. Never carry the campaign's oversized type or spacing into the journal.

The composition moves from an original painted meadow to a tabbed specimen sheet, a layered physical journal, three field notes, practical FAQs, and a botanical invitation. The primary action starts a journal; the explicit Sign in link opens the returning-user form. Sample discoveries are labeled and do not create records or invoke AI. All controls use the existing shadcn primitives. The shared Brand component owns the wordmark in both surfaces.

Motion is finite: meadow arrival, copy reveal, specimen transitions, and a small journal-cover movement on hover. Respect reduced motion; no scroll interception, autoplay carousel, or perpetual decoration. The hero is a single optimized WebP, with existing botanical cutouts reused below. Social artwork lives at `/images/touch-grass-social.jpg`.

References reviewed for composition, not copied assets:
- [La Fleur](https://lafleur.framer.website/) — immersive art direction and editorial section rhythm.
- [Altura](https://altura-olympus.framer.website/) — a dominant campaign image and product storytelling.
- [Evergreen](https://www.framer.com/marketplace/templates/evergreen/) — a confident nature-led palette.
