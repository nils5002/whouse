# cloud_web

Professionelle Fullstack-Struktur fuer iCloud-Sorter + WMS mit FastAPI, SQLAlchemy, Alembic und React/Vite.

## Architektur (aktuell)

```text
cloud_web/
├── backend/
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── alembic.ini
│   ├── Dockerfile
│   ├── app/
│   │   ├── config/
│   │   │   └── settings.py
│   │   ├── database/
│   │   │   ├── base.py
│   │   │   ├── models.py
│   │   │   ├── seed_from_wms_json.py
│   │   │   └── session.py
│   │   ├── repositories/
│   │   │   ├── asset_repository.py
│   │   │   ├── hardware_import_repository.py
│   │   │   └── wms_repository.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── db_assets.py
│   │   │   ├── defaults.py
│   │   │   ├── hardware_import.py
│   │   │   ├── health.py
│   │   │   ├── jobs.py
│   │   │   ├── llm.py
│   │   │   └── wms.py
│   │   ├── schemas/
│   │   │   ├── asset.py
│   │   │   ├── hardware_import.py
│   │   │   ├── job.py
│   │   │   └── wms.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── excel_import_service.py
│   │   │   ├── hardware_import/
│   │   │   │   ├── importer.py
│   │   │   │   ├── mapper.py
│   │   │   │   ├── parser.py
│   │   │   │   ├── types.py
│   │   │   │   └── validator.py
│   │   │   ├── job_manager.py
│   │   │   ├── llm_service.py
│   │   │   ├── sorter_job.py
│   │   │   ├── wms_service.py
│   │   │   └── wms_store.py  # legacy json store
│   │   ├── errors.py
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── asset-ui/
│       ├── components/
│       │   └── WmsPageView.tsx
│       ├── config/
│       │   └── navigation.ts
│       ├── hooks/
│       │   ├── useTheme.ts
│       │   └── useWmsController.ts
│       ├── services/
│       │   └── wmsApi.ts
│       └── App.tsx
├── Hardwarebestand/
├── .env.example
└── docker-compose.yml
```

## Backend lokal starten

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## Datenbank

Standard ist SQLite:
- `DATABASE_URL=sqlite:///./app/data/app.db`
- `DB_AUTO_CREATE_SCHEMA=true` (dev-friendly auto `create_all`)

Fuer produktive/saubere Migrationen:
- `DB_AUTO_CREATE_SCHEMA=false`
- nur Alembic (`alembic upgrade head`)

Optional PostgreSQL via Docker:

```powershell
docker compose up -d postgres backend
```

## .env Beispiel

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+psycopg://cloud_user:cloud_password@postgres:5432/cloud_web
DB_AUTO_CREATE_SCHEMA=false
CORS_ORIGINS=*
WMS_SEED_LEGACY_ON_STARTUP=true
WMS_LEGACY_JSON_PATH=app/data/wms_db.json
HARDWARE_IMPORT_PATH=/app/data/hardware_imports
OPENAI_API_KEY=
OPENAI_BASE_URL=
VITE_API_BASE=http://127.0.0.1:8000
```

## Hardware Excel-Import

Der Import ist als Pipeline gebaut:
- `parser`: liest gueltige Excel-Dateien (`.xlsx`, `.xlsm`)
- `validator`: prueft Pflichtfelder und Formate (IP, MAC)
- `mapper`: mappt Excel-Zeile auf Asset-Payload
- `importer`: idempotentes Upsert ueber `serial_number`

API:
- `POST /api/import/hardware?dry_run=false` startet den Import
- `GET /api/import/hardware/{run_id}` liefert Status + Fehlerzeilen

Beispiel:

```powershell
curl -X POST "http://127.0.0.1:8000/api/import/hardware?dry_run=true"
```

Import-Logs:
- `hardware_import_runs` (Run-Metadaten)
- `hardware_import_row_errors` (Zeilenfehler)

## Docker + Import-Ordner

Der Importpfad wird nicht im Code hart kodiert. Die App liest nur `HARDWARE_IMPORT_PATH`.

`docker-compose.yml` mountet den lokalen Bestand in den Container:
- `./Hardwarebestand:/app/data/hardware_imports:ro`

Damit gilt:
1. Dateien lokal in `Hardwarebestand/` ablegen.
2. Container starten.
3. Import-Endpoint aufrufen.
4. Daten landen idempotent in der DB (Create/Update, keine Serial-Duplikate).

## WMS: JSON -> DB

Aktive WMS-Endpunkte (`/api/wms/*`) laufen ueber SQL-Repository/Service.

Legacy-Import beim Startup:
- `WMS_SEED_LEGACY_ON_STARTUP=true`
- `WMS_LEGACY_JSON_PATH=app/data/wms_db.json`

`backend/app/services/wms_store.py` bleibt vorerst als Legacy-Komponente erhalten.

## Frontend starten

```powershell
cd frontend
npm install
npm run dev
```

## Frontend + Backend mit einem Befehl starten

```powershell
cd D:\DEV\cloud_web
npm run dev
```

API-Basis:
- `VITE_API_BASE=http://127.0.0.1:8000`

## API Hinweis

- Bestehende WMS-Endpunkte (`/api/wms/*`) bleiben erhalten.
- DB-CRUD-Beispielroute: `/api/db/assets`.
- Neuer Import-Endpoint: `/api/import/hardware`.
