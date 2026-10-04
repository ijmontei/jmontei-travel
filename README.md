This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

### Photo delivery and Hobby usage

All current photos use Sanity CDN URLs. `next.config.ts` selects the custom
loader in `src/lib/sanity.image-loader.ts`, so Next Image generates responsive
Sanity URLs instead of sending photos through Vercel's `/_next/image` endpoint.
Sanity handles resizing, modern formats, and caching; its bandwidth allowance
now applies to photo delivery. Existing Sanity crop parameters are preserved.
The loader requires Sanity image URLs; use `unoptimized` for future local images
or extend the loader deliberately for a different provider.

Run the loader checks with Node 22.18+ using
`node --test tests/sanity.image-loader.test.mjs`.
After deploying, check the browser Network panel: photo requests should go to
`cdn.sanity.io`, and Vercel Image Optimization Cache Writes should stop increasing
from this site's photo components. Prior deployments and other team projects
can still contribute usage. This change does not clear existing usage or unpause
the team; follow the recovery date or instructions in Vercel's notification.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
