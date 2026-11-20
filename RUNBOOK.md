# Running the app on-site (via Cloudflare Tunnel)

Use this when staff devices (phones/tablets) can't reach the laptop directly — e.g. on public Wi-Fi with client isolation. All commands are PowerShell, run from the repo root.

## 1. Start MongoDB (Docker)

Open **Docker Desktop** and wait until it says it's running, then:

```powershell
docker start local-mongodb
docker ps --filter name=local-mongodb      # STATUS should be "Up ..."
Test-NetConnection 127.0.0.1 -Port 27017   # TcpTestSucceeded : True
```

Optional — auto-start the container whenever Docker starts:

```powershell
docker update --restart unless-stopped local-mongodb
```

> If the app logs `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`, MongoDB is not running — repeat this step.

## 2. Check `.env.local`

Must contain `MONGODB_URI` (pointing at `localhost:27017/<db>`), `APP_PASSWORD`, `AUTH_SECRET`, and the `SMTP_*` values. Install deps if needed:

```powershell
npm install
```

## 3. Start the app on a random local port

Only one `next dev` can run per project — stop any other one first (e.g. one on port 3000).

```powershell
$port = Get-Random -Minimum 20000 -Maximum 60000
while (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) { $port = Get-Random -Minimum 20000 -Maximum 60000 }
"PORT = $port"
npx next dev -H 127.0.0.1 -p $port
```

Binding to `127.0.0.1` means nothing on the Wi-Fi can reach the app directly; only the tunnel can. Leave this window open.

## 4. Start the tunnel

In a **second** PowerShell window (replace `<PORT>` with the port printed above):

```powershell
npx -y cloudflared tunnel --no-autoupdate --url http://127.0.0.1:<PORT>
```

The first run downloads the cloudflared binary (can take a minute). Look for:

```text
Your quick Tunnel has been created! Visit it at:
https://<random-words>.trycloudflare.com
```

Open that URL on the phone/tablet and log in with `APP_PASSWORD`.

Notes:

- `next.config.ts` already has `allowedDevOrigins: ["*.trycloudflare.com"]`. Without it, Next.js blocks the JS bundles over the tunnel and the page won't be interactive.
- The URL changes every time cloudflared restarts — share the new one with staff.
- The URL is public; `APP_PASSWORD` is the only protection. Don't share it beyond staff.

## 5. Quick check

- Laptop: `http://127.0.0.1:<PORT>/login` loads.
- Tablet: tunnel URL loads, login works, `/jersey-only` shows data (proves MongoDB is connected).

## 6. Shut down

1. `Ctrl+C` in the cloudflared window.
2. `Ctrl+C` in the `next dev` window.
3. `docker stop local-mongodb` (optional).
4. If you added it earlier, remove the LAN firewall rule (admin PowerShell):

   ```powershell
   Remove-NetFirewallRule -DisplayName "Next dev 3000"
   ```

## Troubleshooting

| Symptom                                                  | Fix                                                                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Another next dev server is already running` (PID shown) | Stop that PID: `Stop-Process -Id <PID>`, then rerun step 3.                                                  |
| `ECONNREFUSED 127.0.0.1:27017`                           | Docker Desktop / `local-mongodb` not running → step 1.                                                       |
| Page loads but buttons do nothing                        | Check `allowedDevOrigins` in `next.config.ts`, restart `next dev`.                                           |
| Tunnel URL shows Cloudflare error 1033 / 502             | `next dev` isn't running or the port in the cloudflared command is wrong.                                    |
| Tunnel URL doesn't resolve right after creation          | Wait ~10–30 s; quick tunnels take a moment to propagate.                                                     |
