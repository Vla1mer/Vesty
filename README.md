# Vesty

Real-time messenger. ASP.NET Core 9 + SignalR, React 19 + TypeScript, PostgreSQL.

Direct and group chats, live messaging, replies, reactions, pinned messages, avatars, JWT auth. Message content is encrypted at rest.

## Run it

The only requirement is [Docker](https://www.docker.com/products/docker-desktop).

```bash
git clone https://github.com/Vla1mer/Vesty.git
cd Vesty
docker compose up
```

Open `http://localhost:5173`.

That starts three containers — PostgreSQL, the API and the client. Database migrations are applied automatically on the first run.

To stop: `docker compose down`. Add `-v` to delete the database as well.

## Configuration

The defaults in `docker-compose.yml` are enough to run the project locally, so no setup is needed to try it out.

For anything beyond local use, copy the template and set your own secrets:

```bash
cp .env.example .env
```

- `JWT_SECRET` — any random string, 32+ characters
- `MESSAGE_KEY` — 32 random bytes in base64:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))   # Windows
openssl rand -base64 32                                                            # Linux / macOS
```

The same file also controls ports (`API_PORT`, `CLIENT_PORT`, `DB_PORT`) and database credentials.

## Development without Docker

Requires [.NET SDK 9+](https://dotnet.microsoft.com/download) and [Node.js 20+](https://nodejs.org).

Start only the database, then run both apps locally:

```bash
docker compose up -d db

cp backend/Vesty/appsettings.Example.json backend/Vesty/appsettings.json
# fill in JwtSettings.secretKey and MessageEncryption.Key

dotnet dev-certs https --trust        # then restart the browser
cd backend && dotnet run --project Vesty/Vesty.csproj --launch-profile https
```

```bash
cd frontend && npm install && npm run dev
```

Client on `http://localhost:5173`, API on `https://localhost:7033`, API docs on `https://localhost:7033/swagger`.

## Layout

```
backend/Vesty       web layer — controllers, SignalR hubs
backend/Services    business logic, DTOs
backend/Repository  EF Core, migrations
frontend/src/store  RTK Query — data layer, SignalR events patch the same cache
```
