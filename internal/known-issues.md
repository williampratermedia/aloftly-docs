# Known issues

## Mintlify's edge cache breaks sidebar navigation on docs.aloftly.com

**Status:** open — **Mintlify-side infrastructure issue.** Not fixable from this repo or from our DNS.
**Diagnosed:** 2026-08-06

### Symptom

On `docs.aloftly.com`, sidebar links show the correct URL on hover but clicking does nothing. No console errors. Typing a URL directly or reloading works fine.

### Where the caching happens

Our DNS is correct and is **not** the cause:

```
docs.aloftly.com  →  CNAME  →  cname.mintlify.builders
cname.mintlify.builders  →  162.159.143.13, 172.66.3.9 (Cloudflare IPs)
```

The CNAME target is Mintlify's own domain, and **Mintlify** fronts their platform with Cloudflare. Our Cloudflare zone is DNS-only (grey cloud), which is exactly what Mintlify's setup guide requires. The `x-vercel-*` headers on responses are Mintlify's hosting, not ours.

By contrast, `aloftly.mintlify.app` resolves to `66.33.60.67` and returns `Server: Vercel` with no Cloudflare headers — that hostname bypasses Mintlify's edge cache, and navigation works there.

### Root cause

Mintlify's Cloudflare edge is serving HTML documents that are 36–60 hours stale, from **several different builds at once**, while serving fresh RSC payloads. Measured 2026-08-06:

| Response | Build (`x-served-version`) | Mintlify client | `cf-cache-status` | `age` |
| --- | --- | --- | --- | --- |
| `/` | `dpl_6aNrMYSxAu9VarQRQ28LBLvWKEeb` | 0.0.3391 | HIT | ~60h |
| `/quickstart` | `dpl_3Xej2axUDvBYHWwqWzTLaemwyfXc` | 0.0.3395 | HIT | ~36h |
| `/integrations/intelligems` | `dpl_3Xej2axUDvBYHWwqWzTLaemwyfXc` | 0.0.3395 | HIT | ~36h |
| RSC (`/?_rsc=…`) | `dpl_4NzKiWVX1MfcZ6AAfHaSYtgcgScF` | 0.0.3407 | HIT | ~43m |

These are cached despite the origin sending `cache-control: no-store, no-cache, must-revalidate, max-age=0`.

The docs site is a Next.js App Router app. On a link click the router intercepts the event (verified: `defaultPrevented === true`) and fetches an RSC payload. The browser pins its build with an `x-deployment-id: dpl_3Xej…` request header — Vercel skew protection — but the edge answers from cache with a payload built by `dpl_4NzK…`. The module graphs don't match, so the router silently aborts. `window.next.router.push()` is also a no-op, confirming the router, not the links, is what is broken.

A cache-busting query string still returns `cf-cache-status: HIT`, so the cache key ignores query strings.

### Evidence it is not a repo problem

Identical content navigates correctly on `aloftly.mintlify.app`, where every asset comes from a single deployment (`dpl_4sj1y6YapSzDrgGCFZSWj32ncNRX`). Mintlify's own docs site navigates normally. Nothing in `docs.json`, the MDX pages, or `.mintignore` contributes.

### Fix

**Contact Mintlify support** and ask them to purge the edge cache for `docs.aloftly.com`. Useful details to include: custom domains are serving 36–60 hour stale HTML from multiple builds while RSC payloads are current, which breaks App Router client-side navigation via deployment skew; `aloftly.mintlify.app` is unaffected.

Do **not** expect a redeploy to fix it — at least three deployments (`6aNr`, `3Xej`, `4NzK`) have shipped without evicting the older cached documents.

Until it is resolved, `aloftly.mintlify.app` is a working URL.

### Verifying the fix

```bash
curl -sI https://docs.aloftly.com/ | grep -iE 'x-served-version|cf-cache-status|age'
curl -sI https://docs.aloftly.com/quickstart | grep -iE 'x-served-version|cf-cache-status|age'
curl -sI -H 'rsc: 1' 'https://docs.aloftly.com/?_rsc=probe' | grep -iE 'x-served-version|cf-cache-status|age'
```

All three must report the **same** `x-served-version`. Then click a sidebar link in a fresh browser tab.
