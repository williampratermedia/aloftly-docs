# Known issues

## Cloudflare edge cache breaks sidebar navigation on docs.aloftly.com

**Status:** open — fix is in Cloudflare, not in this repo.
**Diagnosed:** 2026-08-06

### Symptom

On `docs.aloftly.com`, sidebar links show the correct URL on hover but clicking does nothing. No console errors. Typing a URL directly or reloading works fine.

### Root cause

`docs.aloftly.com` is proxied through Cloudflare (orange cloud), and a cache rule is caching the HTML **despite** the origin sending `cache-control: no-store, no-cache, must-revalidate, max-age=0`. Cloudflare serves a stale document from an old Mintlify build while serving fresh RSC payloads from a newer build:

| Response | Build (`x-served-version`) | Mintlify client | `cf-cache-status` | `age` |
| --- | --- | --- | --- | --- |
| HTML document | `dpl_3Xej2axUDvBYHWwqWzTLaemwyfXc` | 0.0.3395 | HIT | 127510s (~35h) |
| RSC payload (`/?_rsc=…`) | `dpl_4NzKiWVX1MfcZ6AAfHaSYtgcgScF` | 0.0.3407 | HIT | 717s |

The docs site is a Next.js App Router app. On a link click, the router intercepts the event (verified: `defaultPrevented === true`) and fetches an RSC payload. The browser pins its build with an `x-deployment-id: dpl_3Xej…` request header — Vercel's skew protection — but Cloudflare answers from its own cache with a payload built by `dpl_4NzK…`. The module graphs don't match, so the router silently aborts. `window.next.router.push()` is also a no-op, confirming the router — not the links — is what's broken.

A cache-busting query string still returns `cf-cache-status: HIT`, so the cache rule ignores query strings in its cache key.

### Evidence it is not a repo problem

Identical content on Mintlify's own domain works correctly: on `aloftly.mintlify.app`, sidebar clicks navigate, and every asset comes from a single deployment (`dpl_4sj1y6YapSzDrgGCFZSWj32ncNRX`). Mintlify's own docs site also navigates normally. Nothing in `docs.json`, the MDX pages, or `.mintignore` contributes.

### Fix

Preferred — follow [Mintlify's custom domain guidance](https://www.mintlify.com/docs/customize/custom-domain) and **disable proxying for the `docs` CNAME (set it to DNS only / grey cloud)**. Mintlify already serves through Vercel's CDN; the Cloudflare proxy adds no caching benefit and causes this skew.

If the proxy must stay on:

1. Add a Cache Rule for hostname `docs.aloftly.com` with **Bypass cache** (do not use "Cache Everything" on this hostname).
2. Set SSL/TLS to **Full (strict)** and disable **Always Use HTTPS** on Edge Certificates, or Let's Encrypt renewal for the domain will fail.

Either way, **purge the Cloudflare cache for `docs.aloftly.com`** afterward — the stale entry does not expire on its own.

### Verifying the fix

```bash
curl -sI https://docs.aloftly.com/ | grep -iE 'x-served-version|cf-cache-status'
curl -sI -H 'rsc: 1' 'https://docs.aloftly.com/?_rsc=probe' | grep -iE 'x-served-version|cf-cache-status'
```

Both must report the **same** `x-served-version`. Then click a sidebar link in a fresh browser tab.
