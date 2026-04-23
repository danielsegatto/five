# Five.

A quiet logbook for five-minute work blocks.

## Run it locally

Just open `index.html` in a browser. That's it — no build step, no install.

## Deploy to GitHub Pages

1. **Create a new repo on GitHub.** Any name works. If you name it `five` (or anything else), your app will be served at `https://<your-username>.github.io/five/`. If you name it exactly `<your-username>.github.io`, it becomes your main GitHub Pages site at the root.
2. **Upload `index.html`** to the repo — either via the web UI ("Add file → Upload files") or with git:
   ```bash
   git clone https://github.com/<your-username>/<repo>.git
   cd <repo>
   # copy index.html in here
   git add index.html
   git commit -m "initial"
   git push
   ```
3. **Enable Pages.** In the repo on GitHub: *Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / folder: `/ (root)` → Save.*
4. Wait a minute. The URL appears at the top of the Pages settings.

## Put it on your iPhone

Open the URL in Safari → Share → **Add to Home Screen**. It launches fullscreen like a native app. Your data is stored in the browser (`localStorage`), so it persists between visits on that device.

Do not clear Safari website data for this domain, or entries will be lost. If you want to be safe, export from the browser console:
```js
copy(localStorage.getItem("entries"))
```

## Notes

- All data stays on your device. Nothing is sent anywhere.
- The app works offline after the first load (the CDN scripts cache).
- iOS will not run a timer while the screen is off — use `Hey Siri, set an alarm for 5 minutes` for screen-off sessions.
