# upload.tommyy.dev

Content management dashboard for uploading media to Cloudflare R2 with embeddable links for Discord and other platforms.

Styled to match [tommyy.dev](https://tommyy.dev).

## Architecture

| Domain | Purpose |
|---|---|
| `upload.tommyy.dev` | Next.js app — dashboard + embed pages |
| `cdn.tommyy.dev` | Cloudflare R2 — direct file serving |

## Setup

```sh
git clone https://github.com/dowoge/upload.tommyy.dev.git
cd upload.tommyy.dev
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Bucket public URL, e.g. `https://cdn.tommyy.dev` (no trailing slash) |
| `ADMIN_PASSWORD` | Dashboard password |
| `NEXT_PUBLIC_APP_URL` | App URL, e.g. `https://upload.tommyy.dev` (no trailing slash) |

Point `cdn.tommyy.dev` to your R2 bucket as a custom domain in Cloudflare.

Caddy config for the app:

```caddyfile
upload.tommyy.dev {
    reverse_proxy localhost:3000
}
```

Run locally:

```sh
npm run dev
```

Build for production:

```sh
npm run build
npm start
```

Sessions are in-memory and reset on restart — just re-enter your password.

## Embeds

Each upload produces two links:

| Link | Example | Use |
|---|---|---|
| **Direct** | `https://cdn.tommyy.dev/abc_photo.png` | Hotlinking |
| **Embed** | `https://upload.tommyy.dev/view/abc_photo.png` | Discord/Twitter rich previews via OG tags |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── api/
│   │   ├── auth/route.ts
│   │   ├── upload/route.ts
│   │   ├── files/route.ts
│   │   └── files/[key]/route.ts
│   └── view/[key]/page.tsx
└── lib/
    ├── r2.ts
    ├── auth.ts
    └── types.ts
```

## License

MIT