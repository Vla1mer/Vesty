# Vesty

Real-time messenger. ASP.NET Core 9 + SignalR, React 19 + TypeScript, PostgreSQL.

Direct and group chats, live messaging, replies, reactions, pinned messages, avatars and file attachments, group roles and permissions, invite links, friends, privacy settings and blocking, JWT auth. Message content and uploaded files are encrypted at rest.

There are two ways to run it: [with Docker](#run-with-docker), which needs nothing else installed, and [without Docker](#run-without-docker), which needs PostgreSQL and an S3-compatible storage of your own.

## Run with Docker

The only requirement is [Docker](https://www.docker.com/products/docker-desktop).

```bash
git clone https://github.com/Vla1mer/Vesty.git
cd Vesty
docker compose up
```

Open `http://localhost:5173`.

That starts four containers:

| Container | What it is | Address |
| --- | --- | --- |
| `vesty-web` | React client | `http://localhost:5173` |
| `vesty-api` | ASP.NET Core API and SignalR hubs | `http://localhost:8080` |
| `vesty-db` | PostgreSQL 17 | `localhost:5433` |
| `vesty-storage` | MinIO — avatars and attachments | `localhost:9000`, console on `9001` |

Database migrations are applied automatically on the first run.

To stop: `docker compose down`. Add `-v` to delete the database and uploaded files as well.

> PostgreSQL is published on host port **5433**, not 5432, so it does not collide with a PostgreSQL you may already have installed. Inside the Docker network the API still reaches it on 5432.

## Run without Docker

Requires [.NET SDK 9+](https://dotnet.microsoft.com/download), [Node.js 20+](https://nodejs.org), PostgreSQL and an S3-compatible object storage.

Object storage is not optional: avatars and attachments are stored through an S3 client, and there is no filesystem fallback. Any S3-compatible service will do — the steps below use [MinIO](https://min.io/download), which is a single binary and runs fine without Docker.

### 1. PostgreSQL

Install [PostgreSQL](https://www.postgresql.org/download/) and create the database:

```sql
CREATE USER vesty WITH PASSWORD 'vesty';
CREATE DATABASE vesty OWNER vesty;
```

### 2. Object storage

```powershell
# Windows
$env:MINIO_ROOT_USER = "vesty"
$env:MINIO_ROOT_PASSWORD = "vestyvesty"
.\minio.exe server C:\vesty-data --console-address ":9001"
```

```bash
# Linux / macOS
MINIO_ROOT_USER=vesty MINIO_ROOT_PASSWORD=vestyvesty \
  minio server ~/vesty-data --console-address ":9001"
```

These credentials are the ones `appsettings.Example.json` already expects.

The bucket is created on the first upload, so there is nothing to prepare by hand.

### 3. API

Create `backend/Vesty/appsettings.json` and paste this in. It matches the setup above and runs as is:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Cors": {
    "AllowedOrigins": [ "http://localhost:5173", "https://localhost:5173" ]
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=vesty;Username=vesty;Password=vesty;"
  },
  "JwtSettings": {
    "validIssuer": "VestyAPI",
    "validAudience": "https://localhost:5001",
    "expires": 60,
    "secretKey": "vesty-local-development-jwt-secret-not-for-production"
  },
  "Storage": {
    "Endpoint": "localhost:9000",
    "AccessKey": "vesty",
    "SecretKey": "vestyvesty",
    "Bucket": "vesty-attachments",
    "UseSsl": false
  },
  "MessageEncryption": {
    "Key": "dmVzdHktbG9jYWwtZGV2ZWxvcG1lbnQta2V5LTAwMDE="
  }
}
```

What to change:

| Setting | When to change it |
| --- | --- |
| `ConnectionStrings.DefaultConnection` | `Port=5432` is for a PostgreSQL you installed yourself. Use **5433** if the database runs in Docker. Adjust the database, user and password if you did not use the SQL from step 1. |
| `Storage` | Ready for a local MinIO. For a hosted S3 set `Endpoint` as `host:port` without a scheme, put in your own keys and set `"UseSsl": true`. |
| `JwtSettings.secretKey` | **Replace before exposing the app to anything but your own machine** — this value is public. Any random string of 32+ characters. |
| `MessageEncryption.Key` | Same, and set it *before* storing any data: messages and files are encrypted with it, so changing it later makes everything already stored unreadable. 32 random bytes in base64. |
| `Cors.AllowedOrigins` | Only if you move the client off `localhost:5173`. |

To generate your own keys:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))   # Windows
openssl rand -base64 32                                                            # Linux / macOS
```

The same content is kept in `backend/Vesty/appsettings.Example.json` if you would rather copy the file than paste.

Trust the development certificate, then start the API:

```bash
dotnet dev-certs https --trust        # then restart the browser
cd backend && dotnet run --project Vesty/Vesty.csproj --launch-profile https
```

Migrations are applied on startup.

### 4. Client

```bash
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`. The client talks to `https://localhost:7033` by default, which is where the API above is listening. Swagger is served on `https://localhost:7033/swagger` — it is registered only in the Development environment, so the Docker setup does not expose it.

## Configuration

### Docker

The defaults in `docker-compose.yml` are enough to run the project locally, so no setup is needed to try it out. They are development values and are public — **any deployment reachable from outside your machine must override them**, otherwise stored messages can be decrypted and tokens forged by anyone who has read this repository.

To set your own values, copy the template:

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

### Without Docker

The same settings live in `backend/Vesty/appsettings.json`, which is gitignored — copy it from `appsettings.Example.json` as shown above.

To point the client at a different API, create `frontend/.env`:

```
VITE_API_URL=https://localhost:7033
```

That file is gitignored too. If it exists it wins over the default, so a stale value there is worth checking when the client cannot reach the API.

> Set `MESSAGE_KEY` (or `MessageEncryption.Key`) before storing any data and keep it unchanged: messages and files are encrypted with it, so replacing the key makes everything already stored permanently unreadable.

## Ports

| | With Docker | Without Docker |
| --- | --- | --- |
| Client | `http://localhost:5173` | `http://localhost:5173` |
| API | `http://localhost:8080` | `https://localhost:7033` |
| API docs | not exposed | `https://localhost:7033/swagger` |
| PostgreSQL | `localhost:5433` | `localhost:5432` |
| Object storage | `localhost:9000` | `localhost:9000` |

## Development

For hot reload, run the two apps on your machine and keep the infrastructure in Docker:

```bash
docker compose up -d db storage
```

Then follow steps 3 and 4 of [Run without Docker](#run-without-docker), with one change: set the connection string port to **5433**, since PostgreSQL is reached through the port the container publishes.

## Tests

```bash
cd frontend && npm test          # Vitest
cd backend && dotnet test        # xUnit
```

The backend suite spins up throwaway PostgreSQL and MinIO containers through Testcontainers, so it needs Docker even if you run the app without it. The frontend suite does not.

## Layout

```
backend/Vesty       web layer — controllers, SignalR hubs
backend/Services    business logic, DTOs
backend/Repository  EF Core, migrations
backend/Entities    models
backend/Shared      exceptions, error models, paging and filtering
backend/Vesty.Tests integration tests
frontend/src/store  RTK Query — data layer, SignalR events patch the same cache
frontend/src/pages  routed screens
```
