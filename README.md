# Five.

A logbook for five-minute work blocks.

## What this is

Five is small. It does one thing: it records that you worked for five minutes, and then another five minutes, and it keeps a count. You can label each block with a tag ("reading", "tidying", "email") or leave it unlabeled. Over time the ledger accumulates, and you can see — as proportion and as total — where the minutes went.

That is the entire feature set. The deliberate omissions matter as much as the inclusions. There are no streaks. No levels. No badges or points. No daily target and no weekly goal. No push notifications nagging you back. No social layer, no leaderboards, no AI coach offering suggestions. The app does not congratulate you for consistency, and it does not shame you for gaps.

## Why

The five-minute rule is a psychological trick that works because it lies to the mind just enough to get past the mind's defenses. Most failures to begin a task are really failures to finalize the commitment — the task feels large, the mind bargains, and the bargain is usually "later." Five minutes is too small to bargain with. There is nothing to procrastinate against. Once motion starts, continuing is usually easier than stopping, so you extend. One five becomes another five, and another. When you look back at the end, you have done far more than the initial commitment would have predicted.

This pattern has names in the behavioral-psychology literature — BJ Fogg's Tiny Habits, Mel Robbins' 5-Minute Rule, the idea of implementation intentions — but knowing the name is not what makes it work. What makes it work is doing it.

The one thing that might make it stop working is the quiet voice that whispers *but what have you actually done, really, over all these weeks?* That voice is corrosive, and unanswered, it eats through the practice. The logbook exists to answer it with evidence. Each entry is a small bit of proof. The total hours logged, displayed plainly as a number, is proof at a different scale. The seven-day chart is proof at another scale still. Nothing else. No elaboration. The ledger is quiet, and its quietness is the point.

## Design choices

The primary design principle is that friction is the enemy. Logging a block is a single tap. The log button is the first thing visible on the screen. Tags can be added after the fact, never before — the app never interrupts you with a dialog box asking what you just did. Confirmation is haptic, not modal. If the five minutes passed without you noticing, you can still press the button and it counts.

The aesthetic is a ledger, not a tracker. Serif numbers. Cream paper. Hairline rules. Sequential entry IDs (#0001, #0002) because watching that counter climb is satisfying in a way that colorful progress bars are not. No emoji, no mascots, no motivational copy beyond a single line at the bottom.

Tags are retrofittable and multi-valued. You can log first and label later. A single block can carry several tags — not because you are doing several things at once, but because one thing often has facets. "Reading" is sometimes also "english"; "writing" is sometimes also "thinking-on-paper." The block remains one block — the minutes do not multiply — but the labels name the act in full. To make this fluid in practice, a logged entry stays briefly *open* after creation: for fifteen seconds, any chip tap or typed activity adds to that entry instead of starting a new one. Tap "reading," tap "english," and you have one block with two facets. After the window closes (or after you start a new block explicitly), subsequent taps create fresh entries again. Tags normalize to lowercase so "Reading" and "reading" group automatically. The most-used tags surface as chips at the top.

The app is offline-first. The UI responds to your taps from local cache and syncs in the background. You never wait on the network to log something.

## Architecture

The app is split into small browser-loaded modules under `src/` (libraries, reusable components, log-specific hooks/components, root bootstrap). There is still no build step. Open `index.html` in a browser — or serve the folder from GitHub Pages — and Babel Standalone transpiles each JSX module on load.

React 18, Tailwind CSS, and the Supabase client all load from CDNs. Babel Standalone transpiles the JSX at page load. This trades a slightly slower cold start (a few hundred milliseconds of Babel work) for zero tooling. For a single-user app that lives behind an "Add to Home Screen" icon, this trade is correct.

State lives in three places. The React component holds working state. `localStorage` holds a cache of the current ledger plus a queue of pending writes. Supabase Postgres is the source of truth. Each write is optimistic: the entry appears on screen instantly, enters the queue, and the queue flushes to Supabase in the background. If the network is down the queue holds; when the browser fires the `online` event again, flush runs automatically. Other signed-in devices receive new entries through Supabase Realtime — Postgres logical replication exposed as a WebSocket — typically within one or two seconds.

Authentication is email and password. Magic links are more elegant in theory, but they fail in practice on iOS PWAs: tapping the link in Mail opens Safari, which is a different storage context than the home-screen-installed app, so the session establishes in the wrong place and the PWA still thinks you are signed out. Passwords are boring and familiar, work in any context without URL handoffs, and Supabase persists the session as a refresh token in local storage that renews automatically on each open — so in practice you sign in once per device and stay signed in. Row-Level Security enforces that each user's `auth.uid()` can only read and write rows where `user_id` matches. The anon key baked into the HTML is public by design; Supabase's security model assumes it will be, because the enforcement happens in the database, not in the client.

The schema is one table. Each entry has a timestamp-based ID (collision-resistant enough for a single human typing as fast as possible), a `user_id` foreign key, a lowercase `note`, and a `created_at` for audit. No joins. No updates except for note edits. No referential complexity.

## Nuances and honest limits

iOS does not let a web app run a timer while the screen is off. This is not a bug that can be fixed; it is a platform decision. The workaround is to delegate timing to iOS itself — *Hey Siri, set an alarm for 5 minutes* — because iOS alarms ring until dismissed, which matches the "subtle but persistent" behavior the user wants. The in-app timer, kept for sessions where the screen stays on, acquires a Wake Lock so the display does not dim mid-block.

Safari auto-zooms when an input's font size is below 16 pixels. This is an accessibility behavior that cannot be disabled, only avoided. All inputs in the app are therefore exactly 16px. `touch-action: manipulation` on interactive elements removes the 300ms tap delay and the double-tap-to-zoom gesture, so taps register immediately on phones.

Sync conflicts are handled by doing almost nothing. Each entry has a unique ID generated from `Date.now()` on the creating device. Two devices cannot generate the same ID within the same millisecond in practice, and if they did, one insert would simply fail while the other succeeded — no data loss, at worst a single missed entry. Deletes are idempotent. Edits are last-write-wins on the `note` column alone. This is the least clever sync strategy possible, and it is correct for an app with a single user on multiple devices.

Data portability is first-class. Entries live in an ordinary Postgres table; export them as CSV from the Supabase Table Editor, or run `pg_dump` on the whole database. Migrating to another backend later is a matter of rewriting one file.

## Setup

Create a free project at supabase.com. In the SQL Editor run the schema below. In Database → Replication, toggle the `entries` table on so other devices get live updates. In Authentication → URL Configuration, set the Site URL to wherever the app is hosted (a GitHub Pages URL works), and under Authentication → Providers → Email turn off "Confirm email" so sign-in becomes a single magic-link step. Copy the Project URL and the anon public key from Settings → API into `src/lib/config.js`. Deploy. Sign in.

```sql
create table entries (
  id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp bigint not null,
  note text default '',
  created_at timestamptz default now()
);

alter table entries enable row level security;

create policy "own entries readable"   on entries for select using (auth.uid() = user_id);
create policy "own entries insertable" on entries for insert with check (auth.uid() = user_id);
create policy "own entries updatable"  on entries for update using (auth.uid() = user_id);
create policy "own entries deletable"  on entries for delete using (auth.uid() = user_id);
```

On each device you want to use, open the URL in Safari, then Share → Add to Home Screen. The app launches fullscreen and behaves like a native one.

## The practice

The app contains a small section called *the practice* — reachable from a link at the bottom of the main view. It holds the philosophy behind the logbook: why five minutes, why a logbook, the one-thing-at-a-time principle with its nuance about facets and layers, and the deliberate absence of streaks and badges. It is explicitly a beginning, not a final statement. It will be revised, corrected, and expanded as the practice matures. What is there now is a scaffold.

## A closing note

This is a tool made in the spirit of doing one small thing, then another. It is not a productivity system. It is evidence you can show yourself that effort happened — a record that turns ephemeral minutes into something countable, so the quiet voice has less room to lie.
