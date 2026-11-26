# Vesty

[![CI](https://github.com/Vla1mer/Vesty/actions/workflows/ci.yml/badge.svg)](https://github.com/Vla1mer/Vesty/actions/workflows/ci.yml)

A real-time messenger built with ASP.NET Core 9, SignalR, React 19 + TypeScript, and PostgreSQL.

Features:
- direct and group chats with live delivery;
- replies, reactions and pinned messages;
- typing indicator, online status and unread counters;
- avatars and file attachments;
- group roles and permissions, and invite links;
- friends, privacy settings and blocking;
- JWT auth with refresh tokens;
- Polish and English UI, light and dark themes.

Message content and uploaded files are encrypted at rest with AES-GCM.

## Contents

- [How it works](#how-it-works)
- [Run with Docker](#run-with-docker)
- [Run without Docker](#run-without-docker)
- [Development setup](#development-setup)
- [Configuration](#configuration)
- [Tests](#tests)
- [Project layout](#project-layout)
- [Troubleshooting](#troubleshooting)

## How it works

Every change goes through the REST API: sending a message, editing a group, accepting a friend request. That includes validation, permission checks and error codes. The change is saved to PostgreSQL first. After that, the server pushes an event over SignalR to every affected user.

Each connection joins a `user-{id}` group. So an event reaches all of a user's devices, and chat membership changes do not touch SignalR groups.

SignalR events are not stored. When a client reconnects, it marks its cached data as stale and fetches it again over REST. A dropped connection therefore delays messages but never loses them, because the database is the source of truth.

The client keeps server data in an RTK Query cache. REST responses and SignalR events both update that one cache, so components do not care where the data came from.

## Run with Docker

The only requirement is [Docker Desktop](https://www.docker.com/products/docker-desktop) on Windows/macOS, or Docker Engine with the Compose plugin on Linux. Make sure it is running: Docker Desktop shows *Engine running*.

```bash
git clone https://github.com/Vla1mer/Vesty.git
cd Vesty
docker compose up -d --build
docker compose ps        # all four containers should be running, db and storage healthy
```

Open `http://localhost:5173`.

The first run builds the images, which takes a few minutes. Database migrations are applied automatically when the API starts.

| Container | What it is | Address |
| --- | --- | --- |
| `vesty-web` | React client served by nginx | `http://localhost:5173` |
| `vesty-api` | ASP.NET Core API and SignalR hub | `http://localhost:8080` |
| `vesty-db` | PostgreSQL 17 | `localhost:5433` |
| `vesty-storage` | MinIO, for avatars and attachments | `localhost:9000`, console on `http://localhost:9001` |

To stop it: `docker compose down`. Add `-v` to also delete the database and uploaded files.

PostgreSQL is published on host port **5433**, not 5432, so it does not collide with a PostgreSQL you may already have installed.

To look inside:

```bash
docker exec -it vesty-db psql -U vesty -d vesty      # \dt lists tables; Messages.Content is ciphertext
docker compose logs api                              # API log
```

The MinIO console logs in with `vesty` / `vestyvesty`. Swagger is not available here, because the container runs in the Production environment. See [Run without Docker](#run-without-docker).

## Run without Docker

Requirements:
- [.NET SDK 9+](https://dotnet.microsoft.com/download) (the SDK, not only the runtime);
- [Node.js](https://nodejs.org) **20.19+ or 22.12+**, which is what Vite 8 needs;
- PostgreSQL;
- an S3-compatible object storage.

Object storage is not optional. Avatars and attachments go through an S3 client, and there is no filesystem fallback.

### 1. PostgreSQL

Install [PostgreSQL](https://www.postgresql.org/download/) 17 or newer on the default port 5432.

On Windows, select *PostgreSQL Server* and *Command Line Tools* in the installer. Stack Builder at the end is not needed.

Open *SQL Shell (psql)*, press Enter through the prompts and type the `postgres` password. Then run:

```sql
CREATE USER vesty WITH PASSWORD 'vesty';
CREATE DATABASE vesty OWNER vesty;
```

Tables are created by migrations when the API starts.

### 2. Object storage

These steps use [SeaweedFS](https://github.com/seaweedfs/seaweedfs/releases), which is a single binary. On Windows download **`windows_amd64.zip`**; the `large_disk`, `full` and `weed-volume` builds are not what you want. Unpack it so that `weed.exe` sits directly in the folder, for example `C:\seaweedfs`. Then start it in its own terminal and keep that terminal open:

```powershell
# Windows
cd C:\seaweedfs
.\weed.exe server -s3 -s3.port=9000 -dir=C:\vesty-data
```

```bash
# Linux / macOS
./weed server -s3 -s3.port=9000 -dir=~/vesty-data
```

The bucket is created on the first upload. SeaweedFS accepts any access key out of the box, so the keys from the example config work as they are.

MinIO would work just as well, but it no longer publishes free binaries or Docker images. That is why the Docker setup uses an archived MinIO image.

### 3. API

Copy the example config. Copy it rather than rename it, because `appsettings.json` is gitignored:

```bash
cp backend/Vesty/appsettings.Example.json backend/Vesty/appsettings.json
# PowerShell: Copy-Item backend\Vesty\appsettings.Example.json backend\Vesty\appsettings.json
```

It already matches steps 1 and 2. See [Configuration](#configuration) for what each value means.

Trust the development certificate once, then **fully restart the browser**. Without this the page loads, but login fails, because the browser refuses to call the API:

```bash
dotnet dev-certs https --trust
```

Start the API:

```bash
cd backend/Vesty
dotnet run --launch-profile https
```

It is ready when the log shows `Now listening on: https://localhost:7033`. Swagger is at `https://localhost:7033/swagger`.

You can also open `backend/Vesty.sln` in Visual Studio, pick the **Vesty** project and the **https** profile, and press F5. Do not run it from both Visual Studio and the terminal at once, because port 7033 would already be taken.

### 4. Client

In another terminal:

```bash
cd frontend
npm install        # first time only
npm run dev
```

Open `http://localhost:5173`. To try live messaging, register a second account in a private window and put the two windows side by side.

## Development setup

For hot reload, keep the infrastructure in Docker and run the two apps on your machine:

```bash
docker compose up -d db storage
```

Then follow steps 3 and 4 above, with one change: set `Port=5433` in the connection string. PostgreSQL is reached through the port that the container publishes.

New migration:

```bash
cd backend
dotnet ef migrations add <Name> --project Repository/Repository.csproj --startup-project Vesty/Vesty.csproj
```

## Configuration

### Without Docker: `backend/Vesty/appsettings.json`

| Setting | When to change it |
| --- | --- |
| `ConnectionStrings.DefaultConnection` | `Port=5432` is for a PostgreSQL you installed yourself, `5433` for the one in Docker. Adjust the database, user and password if you did not use the SQL from step 1. |
| `Storage` | Ready for the local storage from step 2. For a hosted S3, set `Endpoint` as `host:port` without a scheme, use your own keys and set `"UseSsl": true`. |
| `JwtSettings.secretKey` | **Replace it before the app is reachable from outside your machine**, because this value is public. Use any random string of 32+ characters. |
| `MessageEncryption.Key` | Same as above. 32 random bytes in base64, set **before** any data is stored. See the warning below. |
| `Cors.AllowedOrigins` | Only if the client moves off `localhost:5173`. |

The client calls `https://localhost:7033` by default. To point it somewhere else, create `frontend/.env` with `VITE_API_URL=...`. That file is gitignored and overrides the default. Check it first when the client cannot reach the API.

### With Docker: `.env`

`docker compose up` needs no setup, because `docker-compose.yml` ships development values for every secret and port. Those values are public. **Anything reachable from outside your machine must override them**, otherwise anyone who has read this repository can decrypt stored messages and forge tokens.

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | token signing key, 32+ characters |
| `MESSAGE_KEY` | message and file encryption key, 32 bytes in base64 |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | database credentials |
| `MINIO_USER`, `MINIO_PASSWORD`, `MINIO_BUCKET` | object storage credentials |
| `DB_PORT`, `API_PORT`, `CLIENT_PORT`, `STORAGE_PORT`, `STORAGE_CONSOLE_PORT` | host ports |
| `API_URL`, `CLIENT_URL` | addresses baked into the client build and the CORS allowlist |

`.env.example` holds placeholders, not working values. `MESSAGE_KEY` in particular is not valid base64, so copying the file unchanged makes the API fail on startup. Fill in real keys:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))   # Windows
```

```bash
openssl rand -base64 32                                                            # Linux / macOS
```

**Set the encryption key before storing any data, and never change it afterwards.** Messages and files are encrypted with it, so a new key makes everything already stored permanently unreadable.

### Ports

| | With Docker | Without Docker |
| --- | --- | --- |
| Client | `http://localhost:5173` | `http://localhost:5173` |
| API | `http://localhost:8080` | `https://localhost:7033` |
| API docs | not exposed | `https://localhost:7033/swagger` |
| PostgreSQL | `localhost:5433` | `localhost:5432` |
| Object storage | `localhost:9000` | `localhost:9000` |

## Tests

```bash
cd backend && dotnet test        # xUnit, Moq, Testcontainers
cd frontend && npm test          # Vitest, Testing Library
```

The backend suite covers unit and integration tests. The integration tests run the whole API in memory through `WebApplicationFactory`, against throwaway PostgreSQL and MinIO containers started by Testcontainers. So the suite **needs Docker even if you run the app without it**. It never touches the app's own database. The first run pulls the images and takes longer.

The frontend suite needs only Node.js.

Code coverage: `dotnet test --collect:"XPlat Code Coverage"` writes `coverage.cobertura.xml` under `TestResults`.

GitHub Actions runs three jobs on every push and pull request:
- backend build and tests;
- frontend tests and build;
- Docker image builds.

## Project layout

```
backend/Vesty         web layer: controllers, SignalR hub (Hubs/), auth and error handling setup
backend/Services      business logic, DTOs, encryption (Cryptography/), object storage (Storage/)
backend/Repository    EF Core context, repositories, migrations
backend/Entities      data models
backend/Shared        exceptions, error model, paging and filtering
backend/Vesty.Tests   unit and integration tests
frontend/src/api      HTTP client, token handling
frontend/src/lib      SignalR connection and event subscriptions
frontend/src/store    RTK Query: data layer, SignalR events patch the same cache
frontend/src/pages    routed screens
frontend/src/components, hooks, i18n, validation   UI building blocks, translations, form schemas
```

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `docker`: *error during connect* | Docker Desktop is not running. Start it and wait for *Engine running*. |
| *no configuration file provided* | `docker compose` was run outside the repository root. |
| *port is already allocated* | Another program uses 5173, 8080, 5433, 9000 or 9001. Change the port in `.env`, or stop that program. Without Docker, port 9000 may be held by the `vesty-storage` container. |
| `vesty-api` keeps restarting | Run `docker compose logs api`. Usually `MESSAGE_KEY` in `.env` is not a valid 32-byte base64 key. |
| The page loads, but login does not work (without Docker) | The dev certificate is not trusted, or the browser was not restarted after `dotnet dev-certs https --trust`. Opening `https://localhost:7033/swagger` shows a certificate warning in that case. |
| The API cannot connect to the database | PostgreSQL is not running, the SQL from step 1 was not run, or the port in `appsettings.json` is wrong (5432 native, 5433 Docker). |
| The API fails with an error about `MessageEncryption:Key` | `appsettings.json` is missing, or the key is not 32 bytes in base64. |
| Avatars and attachments do not upload | The object storage is not running: either the `vesty-storage` container or the `weed` terminal. |
| `.\weed.exe` is not recognized | `weed.exe` is not in the current folder. Either the wrong archive was downloaded, or the binary sits in a subfolder. |
| `npm`: *running scripts is disabled on this system* | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once in PowerShell. |
| `npm run dev` complains about the Node.js version | Node.js is older than 20.19. Install the current LTS. |
| `dotnet` or `node` is not recognized right after installing | Open a new terminal so it picks up the updated PATH. |
| Backend tests fail with *Docker is either not running or misconfigured* | The tests need Docker (see [Tests](#tests)). |
