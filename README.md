# L&M Enterprises Railway Migration

This folder contains a Railway-ready copy of the public `lnmenterprises.ca` site.

## What was migrated

- The live public CSS and JavaScript bundle from the Manus-hosted site
- Cleaned HTML shell without Manus editor/runtime scripts
- A small Express server for SPA routing on Railway
- Clean `robots.txt` and `sitemap.xml` that no longer expose admin routes

## What was not migrated

- Manus admin login
- Manus auth callbacks
- Any Manus-only backend or editor features

The original admin flow is tied to Manus account auth and will need to be rebuilt separately if you want an admin on Railway.

## Local run

```bash
npm install
npm start
```

## Railway deploy

1. Push this folder to a GitHub repo.
2. Create a new Railway project from that repo.
3. Set the root directory to `lnmenterprises-railway` if the repo contains other folders.
4. Railway should detect Node automatically and run `npm start`.
5. Point your custom domain at the new Railway service after you verify the site.

## Next recommended rebuilds

- Replace the broken social preview image with a proper branded image
- Remove or rebuild any `/blog` or other routes that still depend on Manus-only APIs
- Build a new admin dashboard with Railway-friendly auth and storage
