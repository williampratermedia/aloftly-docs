# Known issues

## Mintlify's edge cache breaks sidebar navigation on docs.aloftly.com

**Status: RESOLVED 2026-08-07** by publishing a real content change (the Metric Library, commit `0eaa114`). The Mintlify build ran instead of being skipped, and the edge cache was replaced: every document *and* the RSC payloads now serve the same build (`dpl_2HoC…`) with no `age`, so the deployment skew that broke the router is gone.

**Recurrence risk:** the underlying defect is unfixed. Cached HTML on this custom-hostname path still never revalidates on its own, so if Mintlify ships a platform build while this site sits unpublished for a long stretch, the skew can return. **The remedy is to publish any real content change** — a no-op push of mintignored files will not work, because Mintlify skips the build. If it recurs and a publish does not clear it, escalate to Mintlify support with the evidence below.

**Diagnosed:** 2026-08-06 · **Resolved:** 2026-08-07

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

### Why our domain and not other Mintlify sites

Sampled 2026-08-06. Our hostname is the only one being cached:

| Domain | CNAME target | Terminates at | `CF-Cache-Status` | Doc vs RSC build |
| --- | --- | --- | --- | --- |
| **docs.aloftly.com** | `cname.mintlify.builders` | Mintlify's Cloudflare | **HIT** | **mismatch** |
| docs.mem0.ai | (own proxied zone) | own Cloudflare | DYNAMIC | match |
| docs.novu.co | (own proxied zone) | own Cloudflare | DYNAMIC | match |
| docs.windsurf.com | `cname.vercel-dns.com` | Vercel | — | match |
| docs.unstructured.io | `unstructured-53.mintlify.app` | Vercel | — | match |

`cname.mintlify.builders` is the target [Mintlify's current docs specify](https://www.mintlify.com/docs/customize/custom-domain), so **our DNS is correct**. It routes through Mintlify's newer custom-hostname proxy (`x-mint-proxy-version: 1.0.0-prod`, Cloudflare for SaaS). The comparison sites are all on older paths that bypass that proxy. The defect is in the new path, which is why it has gone unnoticed.

The working sites' cache ages clustered tightly at ~11,700–11,900s, indicating a global purge when platform build `dpl_4NzK` rolled out. Our entries survived that purge and keep aging monotonically — they never revalidate.

### What has been ruled out

- **Our repo.** Identical content navigates correctly on `aloftly.mintlify.app`, all from one build (`dpl_4sj1…`). The `<Card href>` on the landing page renders correctly there — the missing `href` seen on the broken domain is an artifact of the mixed-build page, not a content bug.
- **Our DNS.** Matches Mintlify's documented CNAME target; our Cloudflare zone is DNS-only, as their guide requires.
- **Our Cloudflare.** DNS-only means our zone never proxies these requests.
- **A no-op republish.** Pushing `internal/`-only commits did not help — GitHub reports `Mintlify Deployment: completed/skipped`, because every changed file is mintignored. **This means "does a real publish clear it?" is still untested.**

### Fix (what worked)

**Publishing a real content change cleared it.** Before: `/` on `dpl_6aNr` (~60h), `/quickstart` and `/integrations/intelligems` on `dpl_3Xej` (~36h), RSC on `dpl_4NzK`. After publishing the Metric Library: all documents and RSC on `dpl_2HoC`, no `age` header.

The build must actually run. An earlier push of `internal/`-only commits reported `Mintlify Deployment: completed/skipped` because every changed file is mintignored, and the cache was untouched — which is why this remedy read as untested until now.

**If it recurs and a publish does not clear it, contact Mintlify support.** Include: `docs.aloftly.com` (custom hostname via `cname.mintlify.builders`) returns `CF-Cache-Status: HIT` on HTML despite the origin sending `cache-control: no-store`; documents went 36–60h stale across builds while RSC payloads stayed current; the resulting deployment skew silently breaks App Router navigation; other Mintlify custom domains return `DYNAMIC`; `aloftly.mintlify.app` is unaffected. Ask why the hostname is cacheable at all.

Two riskier options, **not to be attempted without Mintlify confirming**: re-provisioning the custom hostname (`removeCustomDomain` / `addCustomDomainV2`, or `retriggerCustomHostnameValidation`) may reset the cache state but risks certificate downtime; re-pointing the CNAME at `aloftly.mintlify.app` bypasses the broken proxy (this is effectively what unstructured.io does) but may not have a valid certificate for our hostname on that path.

Until resolved, `aloftly.mintlify.app` is a working URL.

### Verifying the fix

```bash
curl -sI https://docs.aloftly.com/ | grep -iE 'x-served-version|cf-cache-status|age'
curl -sI https://docs.aloftly.com/quickstart | grep -iE 'x-served-version|cf-cache-status|age'
curl -sI -H 'rsc: 1' 'https://docs.aloftly.com/?_rsc=probe' | grep -iE 'x-served-version|cf-cache-status|age'
```

All three must report the **same** `x-served-version`. Then click a sidebar link in a fresh browser tab.
