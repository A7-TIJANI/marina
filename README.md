# Marina v2

International student admissions platform for Rwandan universities — full v2 rewrite per `marina-v2-specification.md`.

## Setup

```bash
cp .env.example .env   # fill in real values
npm install
npm run db:migrate     # creates tables from prisma/schema.prisma
npm run db:seed        # admin user + sample universities/FAQs/country info
npm run dev
```

Default admin login after seeding: `admin@marina.com` / `Admin@1234` — change this immediately.

## Notes for deployment

- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Upstash or Vercel KV) are **required** in production — the rate limiter fails closed without them (see `src/lib/security.ts`).
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob) is required for document/image uploads.
- `RESEND_API_KEY` is optional; without it, emails are logged to the console instead of sent, so local dev works without any email provider.
- Sharp-based image processing (`src/lib/storage.ts`) requires the Node.js runtime — no route in this app opts into the Edge runtime, so this works by default.
- `npm run build` runs `prisma generate` first (see `package.json`).

## Structure

See `marina-v2-specification.md` §3 for the full intended directory layout. Server actions live in `src/actions/`, not co-located with pages.
