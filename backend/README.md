# BinMap Supabase Backend

The backend uses Supabase PostgreSQL, PostGIS, Auth, and private Storage. Next.js route handlers in
`frontend/app/api` form the public server boundary for anonymous writes.

## Next process

If you are continuing setup now, follow this order:

1. Create or open your Supabase project.
2. Copy `frontend/.env.example` to `frontend/.env.local`.
3. Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Apply the SQL migration from `backend/supabase/migrations/202606220001_binmap_schema.sql`.
5. Apply `backend/supabase/seed.sql` if you want the Chandigarh demo dustbins.
6. Start the frontend and test `/map`, `/add-dustbin`, and `/admin`.
7. Create an admin user in Supabase Auth and promote that profile to `admin`.

If you want the shortest possible local test path, run the following from `backend` after the Supabase CLI is installed:

```powershell
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Then restart the frontend:

```powershell
cd ..\frontend
npm run dev
```

## Create the project

1. Create a Supabase project.
2. Install the Supabase CLI or use the SQL editor in the Supabase dashboard.
3. Apply `supabase/migrations/202606220001_binmap_schema.sql`.
4. Apply `supabase/seed.sql` to add the five Chandigarh demo dustbins.
5. Copy `frontend/.env.example` to `frontend/.env.local` and enter the project values.
6. Restart the Next.js development server.

The service-role key is server-only. Never prefix it with `NEXT_PUBLIC_` or expose it to browser
code.

## Local Supabase CLI

From `backend`:

```powershell
supabase start
supabase db reset
```

To link and deploy migrations to a hosted project:

```powershell
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Create the first admin

Create a user with email and password in Supabase Authentication. Then promote that user in the SQL
editor:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

The administrator can then sign in at `/admin`.

## Security model

- Public map reads only return approved dustbins.
- Anonymous dustbin submissions and reports are validated by Next.js API routes.
- Pending submissions, reports, and private images are not publicly readable.
- Admin API routes validate the Supabase access token and the `profiles.role` value.
- The included in-memory rate limit is appropriate for development and early testing. Replace it
  with a shared rate-limit store and CAPTCHA before a public launch across multiple server instances.

## API routes

- `GET /api/dustbins?lat=...&lng=...&radius=3000`
- `POST /api/dustbins` using multipart form data
- `POST /api/dustbins/:id/reports`
- `GET /api/admin/moderation`
- `PATCH /api/admin/dustbins/:id`
- `PATCH /api/admin/reports/:id`
