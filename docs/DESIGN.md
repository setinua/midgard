# DESIGN.md — «Мідгард»

Archaeology news media. Feel: a serious newspaper with a sense of deep time — dense, calm, trustworthy, not a museum brochure.
Direction comes from the two approved style references (`midgard_homepage_corrected.png`, `midgard_article_corrected.png`): navy masthead, white page, blue section bars, bold headlines, dense news lists. Since 25 Nov 2026 all text is set in one family (Inter); the serif survives only in the logo. Composition and block counts come from ТЗ 1.1, not from the references.

## Color

All text pairs pass WCAG AA (ratio on white unless noted).

| Token | Value | Role |
| --- | --- | --- |
| `--navy-900` | `#0B2545` | Masthead, footer, section-tab labels. White text on it 15.4:1 |
| `--navy-800` | `#13315C` | Main nav bar, hover on navy. White text 13:1 |
| `--blue-600` | `#1F5FA8` | Primary: links, section titles text, active rubric, focus ring. 6.4:1 |
| `--blue-100` | `#E6EEF8` | Section bar fill, «Джерело» box, rubric chips. Blue-600 on it 5.5:1 |
| `--blue-200` | `#C9D6E8` | Muted text on navy (tagline, service links). 10.4:1 on navy |
| `--ink-900` | `#14181F` | Headlines, body text. 17.8:1 |
| `--ink-600` | `#4A5565` | Lead text, meta (author), captions. 7.6:1 |
| `--ink-500` | `#6B7685` | Timestamps, dates, counters. 4.6:1 — small text minimum |
| `--line` | `#D9DEE5` | Dividers between list items, card borders |
| `--surface` | `#FFFFFF` | Page background |
| `--surface-2` | `#F3F6FA` | Sidebars on article page, search field, footer top |
| `--bronze-700` | `#8A5A12` | Single accent: «Текст дня» kicker, epoch labels. Text-safe 5.9:1 |
| `--bronze-400` | `#C08A2E` | Decorative only (thin rules, gold half of the emblem, gold ruins column). Never for text |
| `--ad-fg` / `--ad-bg` | `#9A3412` / `#FFF1E6` | «Реклама» label. 6.6:1 |
| `--success` `--warning` `--error` | `#1E7B4A` `#9A6700` `#B42318` | Forms and CMS states only |

No dark mode in v1. No gradients except the photo overlay on the masthead.

## Typography

Fonts must support Ukrainian Cyrillic (і, ї, є, ґ, ’). Free, self-hosted, `font-display: swap`. Fonts by Russian foundries (ParaType, Golos) are deliberately not used.

- **Source Serif 4** — logo only: wordmark «МІДГАРД» (header and footer) and the tagline. Weights 600, 700, Cyrillic + Latin subsets. Token `--logo-font`.
- **Inter** — body, UI, meta. Weights 400, 500, 600.

| Token | Size / line | Font, weight | Use |
| --- | --- | --- | --- |
| `--t-display` | 38 / 44, −0.015em (mobile 30 / 36) | Inter 700 | Article H1, rubric page title |
| `--t-h1` | 30 / 36, −0.015em | Inter 700 | «Текст дня» headline |
| `--t-h2` | 24 / 30, −0.01em | Inter 700, blue-600 | H2 inside article |
| `--t-h3` | 19 / 25 | Inter 700 | H3 in article, card headline large |
| `--t-card` | 16 / 21 | Inter 600 | List and card headlines |
| `--t-body` | 18 / 30 | Inter 400 | Article text, max 68ch |
| `--t-ui` | 15 / 22 | Inter 400/500 | Lead, nav, sidebar items |
| `--t-meta` | 13 / 18 | Inter 500 | Time, date, author, captions, chips |
| `--t-label` | 13 / 16, caps, +0.06em | Inter 600 | Section-tab labels, kicker |

## Spacing and layout

- 4-based scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Container 1200px, gutters 24px. Desktop grid 12 columns.
- Homepage tier 1: 3 + 6 + 3 columns. Tier 2: 4 + 4 + 4. Article: 8 (text column max 68ch) + 4 sidebar.
- Breakpoints: mobile < 768, tablet 768–1279 (2 columns), desktop ≥ 1280.
- Between homepage tiers: 48px. Between list items: 12px with a 1px `--line` divider.

## Shape and depth

- Radius: 0 for photos and section bars (newspaper), 4px for chips, inputs, buttons, «Джерело» box; 999px for author avatars only.
- Shadows: none. Separation is by rules and fills.

## Components

- **Masthead**: navy-900 band; ghosted ruins at the right (opacity .18) with two opaque accent columns, gold then pale; service links left, socials right; lockup from 768 px aligned to the left edge of the container (centred on mobile): emblem (hand axe, 44 px) + wordmark «МІДГАРД» (Serif 700, tracking +0.04em) | divider | tagline «ЗАГУБЛЕНИЙ СВІТ ЛЮДЕЙ» (Serif 600 caps, blue-200).
- **Main nav**: white bar, five items, Inter 600 16px, ink-900; active/hover underline 3px blue-600. Search icon at the right.
- **Rubric rows**: two rows on `--blue-100`; navy-900 label chip on the left («Регіони світу», «Епохи»); items Inter 500 14px separated by «·»; epochs row scrolls horizontally on overflow, never wraps to 3 lines.
- **Section header**: navy-900 label tab (Inter 600 caps, white) with a 12px angled right edge, followed by a full-width 4px blue-100 bar; optional «Усі … →» link on the right in blue-600.
- **News list item**: time (meta, ink-500, tabular numbers) + headline (`--t-card`). Divider below.
- **Card with thumb**: 96×64 thumb (3:2) + headline; columns variant adds author with 24px avatar.
- **Lead card («Текст дня»)**: kicker in bronze-700, 16:10 photo, H1, lead, meta «Автор · дата».
- **Partner card**: like card with thumb + date + «Реклама» chip (ad colors).
- **Buttons**: primary blue-600 fill / white text; secondary blue-600 1px outline; quiet text link. Hover darkens 8%, focus 2px blue-600 ring with 2px offset, disabled 40% opacity.
- **Chips (tags)**: blue-100 fill, blue-600 text, radius 4.
- **Source box**: blue-100 fill, info icon, «Джерело:» + links.
- **Quote (`blockquote`)**: Inter 600 20/30, navy-800, 3px bronze-400 rule on the left; in interviews answers are quotes.
- **Facebook button** (article meta bar): one 40×40 outline button, opens the project's Facebook in a new tab; no share buttons.
- **Edit button** (logged-in editors only): fixed 48×48 blue-600 square with a pencil, bottom-left, opens the article in the admin.
- **Breadcrumbs**: meta size, ink-500, «›» separators, links blue-600.
- **Footer**: navy-900, three columns of links, RSS, social, © line.

## Imagery and icons

- Real archaeological photography only, with credit. Thumbnails 3:2, lead 16:10, OG 1200×630.
- Icons: Lucide (outline, 1.75px stroke), 20px in UI, 16px in meta.
- Logo emblem: a two-tone knapped-stone hand axe (gold left half bronze-400, pale right half blue-100), `src/components/Emblem.tsx`; favicons use it on a navy tile. Brand asset: do not redraw or recolour.

## Avoid

Purple/blue gradients, glass effects, centered hero sections, identical three-card rows, emoji icons, fake view counters.
