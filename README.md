# iCloud Sorter Web

Web-Oberflaeche und HTTP-API fuer das bestehende `cloud`-Projekt. Das Backend nutzt weiterhin die Logik aus `cloud/cloud.py`, packt sie aber in einen FastAPI-Dienst mit Job-Verwaltung und Live-Logs. Das Frontend ist ein React/Vite-Client, der den Lauf konfiguriert und ueberwacht.

## Struktur

```
cloud_web/
|-- backend/
|   |-- app/
|   |   |-- main.py            # FastAPI App & Endpunkte
|   |   |-- models.py          # Pydantic Modelle
|   |   |-- services/
|   |   |   |-- job_manager.py  # Verwaltung paralleler Laeufe
|   |   |   `-- sorter_job.py   # Wrapper um cloud.cloud mit Logging & 2FA
|   |   `-- utils.py           # OCR- und Dateityp-Erkennung
|   `-- requirements.txt
`-- frontend/
    |-- package.json          # React + Vite Setup
    |-- src/
    |   |-- App.tsx           # UI mit Formularen, Log, 2FA Dialog
    |   |-- components/       # JobLog & StatusBadge
    |   `-- types.ts          # Typdefinitionen fuer API Payloads
    `-- vite.config.ts
```

## Backend starten

Voraussetzung: Das bestehende Python-Umfeld, in dem `cloud/cloud.py` bereits laeuft (inklusive Abhaengigkeiten wie `pyicloud`, `PyPDF2`, `python-docx`, OCR-Pakete ...).

```powershell
cd cloud_web\backend
python -m venv .venv             # optional
.venv\Scripts\activate          # Windows PowerShell
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Hinweise:
- `main.py` ergaenzt den `PYTHONPATH` automatisch so, dass das Nachbarprojekt `cloud/` gefunden wird. Starte daher den Server innerhalb dieses Repositorys.
- Die wichtigsten Endpunkte:
  - `GET /api/defaults` - liefert Voreinstellungen, erkannte OCR-Engines, Standard-Dateitypen.
  - `POST /api/jobs` - startet einen Sortierlauf und gibt eine Job-ID zurueck.
  - `GET /api/jobs/{id}` - Status + Log eines Jobs (Polling fuer das Frontend).
  - `POST /api/jobs/{id}/2fa` - akzeptiert den Zwei-Faktor-Code, falls `cloud.connect_icloud` ihn anfordert.
  - `POST /api/jobs/{id}/stop` - bricht den Lauf ab.
  - `GET /api/llm/models` - liest verfuegbare Modelle aus einem OpenAI/Ollama-kompatiblen Endpoint.
- Logs werden im Speicher gehalten (letzte 1500 Zeilen) und als Stringliste geliefert.

## Frontend starten

```powershell
cd cloud_web\frontend
npm install
npm run dev          # startet Frontend und Backend gemeinsam
```

Der Dev-Task verwendet `concurrently` und ruft intern `npm run dev:backend` (uvicorn) sowie `npm run dev:frontend` (Vite) auf.
- Falls du nur das Frontend brauchst: `npm run dev:frontend`
- Falls du das Backend separat starten willst: `npm run dev:backend`

Standardmaessig erwartet das Frontend das Backend unter `http://localhost:8000`. Bei Bedarf kann in der Entwicklungsumgebung `VITE_API_BASE` gesetzt werden (z. B. `.env` oder Kommandozeile) - ansonsten greift der Default.

## Umgang mit Zwei-Faktor-Authentifizierung

Wenn iCloud einen 2FA-Code verlangt, setzt der Backend-Job den Status `awaiting_2fa` und blockiert, bis der Code ueber `POST /api/jobs/{id}/2fa` uebermittelt wird. Das React-Frontend zeigt dafuer automatisch einen Dialog an.

## Weiteres

- Im Frontend kannst du im Abschnitt "Zugangsdaten & LLM" mit dem Button "Anmelden" den iCloud-Login testen. Optionaler 2FA-Code zeigt dir sofort, ob die Anmeldung klappt.
- Die OCR-Erkennung erfolgt wie in der Desktop-Variante. Falls keine Engine verfuegbar ist, kann trotzdem sortiert werden (Textextraktion aus PDF/TXT funktioniert weiterhin).
- `dry_run` erlaubt das Durchspielen ohne tatsaechliches Verschieben. Fuer echte Laeufe den Haken entfernen.
- Die Job-Verwaltung laesst momentan nur einen parallelen Lauf zu. Weitere Startversuche liefern `409` (Konflikt).
# Warehouse2.0
