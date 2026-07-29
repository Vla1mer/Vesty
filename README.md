# Vesty

Real-time messenger. ASP.NET Core 9 + SignalR, React 19 + TypeScript, PostgreSQL.

Direct and group chats, live messaging, replies, reactions, pinned messages, avatars, JWT auth. Message content is encrypted at rest.

## Requirements

Docker Desktop · [.NET SDK 9+](https://dotnet.microsoft.com/download) · [Node.js 20+](https://nodejs.org)

## Run it

**1. Start the database**

```bash
docker compose up -d db
```

**2. Create the config**

```bash
cp backend/Vesty/appsettings.Example.json backend/Vesty/appsettings.json
```

Fill in two values in that file:

- `JwtSettings.secretKey` — any random string, 32+ characters
- `MessageEncryption.Key` — 32 random bytes in base64:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))   # Windows
openssl rand -base64 32                                                            # Linux / macOS
```

**3. Trust the dev certificate**

```bash
dotnet dev-certs https --trust
```

Then restart the browser. Skipping this makes every API call fail silently.

**4. Start the server**

```bash
cd backend && dotnet run --project Vesty/Vesty.csproj --launch-profile https
```

Migrations run automatically on startup.

**5. Start the client**

```bash
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`. API docs: `https://localhost:7033/swagger`

## Notes

The database container uses port **5433** so it won't clash with a local PostgreSQL. Data persists in the `db-data` volume; `docker compose down -v` wipes it.

Config files hold secrets and are not tracked in git.

## Layout

```
backend/Vesty       web layer — controllers, SignalR hubs
backend/Services    business logic, DTOs
backend/Repository  EF Core, migrations
frontend/src/store  RTK Query — data layer, SignalR events patch the same cache
```
