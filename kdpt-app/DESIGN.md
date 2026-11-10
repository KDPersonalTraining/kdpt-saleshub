# KDPT design rules

One product, not a set of screens. Every screen in the client app and the
coach portal follows these rules. If something isn't covered here, choose
the plainer option.

## What makes the app look generic today

Measured in the client app's stylesheet and screens (2 November):

| Problem | Today | Rule below |
| --- | --- | --- |
| Too many shapes | 37 different corner radii | 3 radii |
| Too many text sizes | 25 font sizes, 9px to 60px | 7 sizes |
| Decoration | 21 gradients, 22 shadows, 53 tinted colours | Flat surfaces, hairlines, no glows |
| Icons in coloured boxes | 40 tinted icon tiles | Plain icons; boxes only for the brand mark |
| Colour competing | 95 uses of five accent colours | Mint for action; the others only when they mean something |
| Mixed icon styles | Filled two-tone icons alongside line icons | One line-icon family (Lucide), one stroke weight |
| Cards everywhere | Cards in cards, groups in cards | Lists on the page; a card only for one tappable thing |
| Overrides | 19 `!important` | None in new code |

## Principles

1. **One job per screen.** The most important thing is the biggest and comes first. Everything else waits until it's needed (sheets, "more" rows), rather than being shrunk.
2. **Say it, don't decorate it.** Labels on actions. Numbers set in type, not inside widgets.
3. **Calm by default, colour with meaning.** Mostly black, white and grey. Colour means "do this", "done", "careful" or "problem".
4. **Built for gym hands and older eyes.** Large targets, high contrast, nothing that depends on precise taps.
5. **Precise.** Things line up on one grid. Equal things look equal everywhere.

## Colour

| Token | Use | Never |
| --- | --- | --- |
| `--ink` #000 | Page background | |
| `--raise` #121413 | Sheets, the one card on a screen, input fields | Cards inside cards |
| `--line` rgba(255,255,255,.09) | Hairline dividers | Thick borders |
| `--text` #f5f7f6 / `--text-2` #b3b9b6 / `--text-3` #8d9490 | Primary, secondary and supporting text | Supporting text below 4.5:1 contrast |
| `--mint` #7ed597 | Brand. The one primary action per screen. "Done". Progress. | Decoration, large backgrounds |
| `--amber` #ffb45e | Needs attention (due, waiting, skipped) | Celebrations, decoration |
| `--coral` #ff6b5e | Pain, errors, destructive actions | Anything else |
| `--violet` #a99bff | KAI only | Any other section |

Sections (Training, Fuel, Progress, Bookings) don't get their own colours on
screen. Chart lines may use secondary colours to tell series apart.

## Type

Montserrat for headings and numbers, Poppins for text. Seven sizes:

| Size | Use |
| --- | --- |
| 12 | Captions, labels in capitals (letter-spaced) |
| 14 | Supporting text |
| 16 | Body text, list rows, buttons |
| 20 | Section headings |
| 28 | Screen titles |
| 40 | Key numbers (a stat, the timer in a card) |
| 64 | Workout mode: the weight and reps being logged |

Numbers use tabular figures, so they don't jump as they change.

## Space and shape

- **Spacing** on a 4-point grid: 4, 8, 12, 16, 24, 32, 48. The page gutter is 20.
- **Radii:**
  - 12 for controls and inputs
  - 20 for sheets and the occasional card
  - fully round only for small toggles and progress dots
- **Depth, kept quiet (round 2).** Groups of content sit on lit cards: a subtle top-to-bottom dark gradient, a 1px edge at 7% white, radius 20. No coloured glows.
- **One photo hero per screen** at most (Home, Train): the next workout on a real gym photo with a dark fade, so text always reads. Swap in Kyle's own photos when he has them.
- **Motion:** sections rise in with a short stagger on open; anything tappable presses in slightly. Both switch off when the phone asks for reduced motion.
- **Floating tab bar,** inset 12px from the edges, so content scrolls behind it.

## Icons

- [Lucide](https://lucide.dev) line icons only, at a 1.75 stroke.
- 20px in lists and buttons, 24px in navigation.
- No icon on a coloured background, except the KDPT and KAI marks.
- An icon on its own is allowed only for back, close and play. Everything else gets a word.

## Components

- **Buttons:**
  - Primary: mint, one per screen.
  - Secondary: raised grey.
  - Text button: no background.
  - Heights: 56 in the client app (64 in workout mode), 40 in the coach portal.
  - Destructive actions use coral text, and need a confirmation.
- **List rows:** title (16), optional supporting line (14), optional value on the right, hairline between rows. The whole row is the tap target, at least 56 high.
- **Sheets:** slide up from the bottom for anything secondary (how to do it, swap, pain, portions). They close with a tap outside, a swipe or the Close button.
- **States:** every list has an empty state that says what to do next. Loading shows the layout's shape, not a spinner. Offline shows one banner, never a dead button.

## Motion

- 150–250 ms, ease-out, used only to show that something changed: a set ticked, the rest starting, the next exercise sliding in.
- Nothing loops or pulses.
- The phone's "reduce motion" setting turns movement off.

## Client app and coach portal

- **Client app:** calm and spacious. One thing at a time, large controls, minimal numbers unless the client wants them.
- **Coach portal:** dense but ordered. Tables and lists with clear columns, filters and actions in fixed places, and the same buttons and states as the client app.

## Milestone 1: workout mode

The workout is the most-used screen and gets its own environment:

- **Full screen.** The tab bar, Home and every other distraction go away. The top bar has Exit, elapsed time with the exercise position, and Pause.
- **A progress line** under the top bar, one segment per exercise.
- **The current set is the screen:**
  - the exercise name
  - "Set 2 of 3"
  - weight and reps in 64px figures, with large − and + buttons; tapping a figure lets you type it
  - the target and last time underneath in plain words
  - one big **Complete set** button
- **Completed sets** sit underneath as a short list. Tapping one lets you correct it.
- **Labelled secondary actions** in one row: How to, Swap, Pain, Skip.
- **Rest** takes over the screen after each set, showing what's next. It can be extended, paused or skipped.
- **Between exercises,** a short "done" moment: sets and total for that exercise, an optional "how hard was it?", then **Up next** with a Start button. The rest keeps counting in the corner.
- **Pause** stops the clock. **Exit** offers *Save and leave* (resume from Home), *Finish now* (summary of what's done) or *Keep going*. Nothing traps the client, and nothing is lost.
- **The summary** shows time, sets and kg lifted as big plain figures, new records, and a short recap per exercise.

The workout logic, saved progress, rules and tests stay as they are. Only how it looks and how you move through it changes.

## Round 3: keeping it from looking machine-made

Checked against two lists Kyle shared ("20 ways to unslop AI designs" and "20 ways to make beautiful animations").

- **Labels are plain words.** Small labels above headings are sentence case at 14px, not spaced-out capitals. A label that only repeats the heading is removed (no "Nutrition" above Fuel).
- **No filler badges.** A tag appears only when it tells you something the screen doesn't already, such as "In progress". There's no "Coach" badge next to Kyle, and no category tag that repeats the post title.
- **Readable quiet text:** secondary grey is #9ba29e.
- **Headings wrap evenly** (`text-wrap: balance`), and numbers keep their width (tabular figures).
- **Nested shapes match.** A badge inside a card is either a circle or follows the card's radius minus its padding.
- **Loading screens show the outline** of the page in grey blocks, not a blank page.
- **Motion:**
  - Entrances ease out.
  - Rows follow each other 30ms apart.
  - Taps press to 0.97 straight away.
  - Sheets open in 240ms.
  - Exits are shorter than entrances.
  - The menu has one lit pill that slides between tabs (ease-in-out).
  - Toggle knobs stretch about 12% while pressed.
  - A finished set pulses once, and ticks fade in from a soft blur.
  - Nothing bounces.
