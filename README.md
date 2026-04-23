# Five.

A quiet logbook for five-minute work blocks. Syncs across devices via Supabase.

## One-time setup (about 10 minutes)

### 1. Create a Supabase project

- Go to [supabase.com](https://supabase.com) and sign up (free).
- Click **New project**. Name it anything (e.g. `five`), pick a region close to you, set a database password (you won't need it again), create.
- Wait ~1 minute for it to provision.

### 2. Create the table

In the project dashboard, open **SQL Editor** (left sidebar) → **New query** → paste the following → click **Run**:

```sql
create table entries (
  id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp bigint not null,
  note text default '',
  created_at timestamptz default now()
);

alter table entries enable row level security;

create policy "own entries readable"
  on entries for select using (auth.uid() = user_id);
create policy "own entries insertable"
  on entries for insert with check (auth.uid() = user_id);
create policy "own entries updatable"
  on entries for update using (auth.uid() = user_id);
create policy "own entries deletable"
  on entries for delete using (auth.uid() = user_id);
```

### 3. Enable realtime on the table

**Database** → **Replication** → find the `entries` table in the list → toggle it **on**. (This is what makes entries appear on your other devices within seconds.)

### 4. Copy your keys into `index.html`

**Project Settings → API**. Copy:
- **Project URL** (looks like `https://xyzabc.supabase.co`)
- **anon public** key (a long string starting with `eyJ…`)

Open `index.html` in a text editor. Near the top, find:

```js
const SUPABASE_URL  = "YOUR_SUPABASE_URL";
const SUPABASE_ANON = "YOUR_SUPABASE_ANON";
```

Replace with your values.

> The anon key is **safe to publish**. Supabase is designed for these keys to be public — the Row-Level Security policies you just created enforce that each user sees only their own rows.

### 5. Deploy

Commit `index.html` to your GitHub repo. Enable Pages: **Settings → Pages → Source: Deploy from a branch → main / root**. Your app is live at `https://<your-username>.github.io/<repo>/`.

### 6. Sign in on each device

- Open the URL on your phone. Enter your email. Tap the link Supabase sends you.
- Repeat on your laptop.
- Both devices stay signed in for a long time (Supabase refreshes the session automatically).

## How syncing works

- Every log is written **optimistically** to the screen first, then sent to Supabase in the background.
- If you're offline, the entry queues up locally and flushes when you reconnect.
- Other devices receive updates in real time via a subscription, usually within 1–2 seconds.
- A small dot in the header shows sync state: green = synced, amber = syncing, grey = offline, red = error.

## Data portability

Your entries live in a real SQL table you control. To export, go to Supabase's Table Editor → `entries` → export CSV. To move to a different stack later, `pg_dump` works — it's Postgres.

## Privacy note

Data is stored on Supabase's infrastructure (hosted on AWS). If you'd rather self-host, Supabase is open-source and can be run on your own server; the `index.html` works against any Supabase-compatible endpoint.

## iPhone home screen

Open in Safari → Share → Add to Home Screen. Launches fullscreen, looks like a native app.
