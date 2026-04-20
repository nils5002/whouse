# Deploy-Strategie (Git + produktive Serverkopplung)

Diese Struktur trennt dauerhaft:

- Git-gesteuerten Code (`/opt/web/cloud_web`)
- produktive, serverspezifische Laufzeitdateien (`/opt/web/cloud_web_runtime`)

Damit bleiben Cloudflare-/Tunnel-/Secret-Dateien auf dem Server erhalten und werden nicht durch `git pull` ueberschrieben.

## Verzeichnisprinzip

- Repo-Code: `/opt/web/cloud_web`
- Laufender Stack-Code (Deploy-Ziel): `/opt/stacks/cloud_web`
- Runtime (nicht in Git): `/opt/web/cloud_web_runtime`
  - `.env`
  - `docker-compose.prod.yml`
  - `cloudflared/` (falls Tunnel-Konfig hier liegt)
  - weitere Secrets / Certs

## One-Time Setup auf dem Server

1. Repo auf dem Server im Zielpfad vorhanden halten (z. B. `/opt/web/cloud_web`).
2. Runtime bootstrap ausfuehren:

```sh
cd /opt/web/cloud_web
sh deploy/server/bootstrap_runtime.sh
```

3. Runtime-Dateien pruefen/erganzen:
   - `/opt/web/cloud_web_runtime/.env`
   - `/opt/web/cloud_web_runtime/docker-compose.prod.yml`
   - optional `/opt/web/cloud_web_runtime/cloudflared/*`

Beispielvorlagen liegen in:

- `deploy/server/example-runtime/.env.prod.example`
- `deploy/server/example-runtime/docker-compose.prod.yml.example`

## Deploy (Server)

```sh
cd /opt/web/cloud_web
sh deploy/server/deploy.sh main
```

Das Script macht:

1. `git fetch` + `git pull --ff-only`
2. Schonenden Code-Sync von `/opt/web/cloud_web` nach `/opt/stacks/cloud_web` (ohne Runtime-/Secret-Dateien)
3. `docker compose` nur mit Runtime-Dateien:
   - `docker-compose.prod.yml` aus Runtime (serverlokal)
   - `.env` aus Runtime (serverlokal)
4. `up -d --build --remove-orphans`

## Deploy (lokal getriggert)

Optionaler Helfer:

```powershell
powershell -ExecutionPolicy Bypass -File deploy/local/deploy-prod.ps1 -Server "root@SERVER_IP" -ServerAppDir "/opt/web/cloud_web" -Branch "main"
```

Der Helfer pusht zuerst den Branch und triggert dann das Server-Deploy-Script per SSH.
