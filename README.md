# david.mn

A small, static personal homepage built with [Astro](https://astro.build/).

## Edit the site

The homepage copy and manually curated links live in:

```text
src/data/site.ts
```

Shared page styles live in `src/styles/global.css`.

## Local development

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Astro will print the local URL, usually `http://localhost:4321`.

## Build

```sh
npm run build
```

The static site is written to `dist/`.

## Deploy

Pushes to `master` deploy automatically to GitHub Pages using
`.github/workflows/deploy.yml`.

The site uses the custom domain `david.mn`. Its domain record is stored at
`public/CNAME`, so Astro includes it in every build. In the repository's GitHub
Pages settings, the deployment source must be set to **GitHub Actions**.
