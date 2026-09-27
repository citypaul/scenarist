# Google Indexing: Trailing-Slash URL Variants and Removed Pages

**Date:** 2026-09-27
**Status:** ✅ RESOLVED in code. Search Console follow-up is manual (see below).
**Rules this produced:** [apps/docs/CONTRIBUTING.md → Search Indexing](../../apps/docs/CONTRIBUTING.md#search-indexing)

## Symptom

A Google search for an exact sentence from the Quick Start page returned no results. On 2026-09-27, Search Console reported 12 pages indexed and 55 not indexed:

| Reason                                   | Pages |
| ---------------------------------------- | ----- |
| Crawled – currently not indexed          | 45    |
| Alternate page with proper canonical tag | 6     |
| Not found (404)                          | 4     |
| Page with redirect                       | 0     |

The sitemap index had last been read on 2026-01-02, and showed 0 discovered pages.

## What was ruled out

The live site had no blocking signals: `robots.txt` allows all crawlers, there were no `noindex` meta tags or `X-Robots-Tag` headers, the canonical tags were correct, and the sitemap listed all 52 pages.

## Root causes

### 1. Slashless URL variants

Every page is served at its trailing-slash URL, and its canonical tag names that URL. Two things produced a second, slashless URL for each page:

- **Authored links omitted the slash.** `CONTRIBUTING.md` told authors to write `[Title](/path)`. Crawling the live site found 340 of about 3,100 internal links in that form, on every page, including the homepage's calls to action.
- **Cloudflare answers `/path` with a `307` temporary redirect** to `/path/`. Google treats a temporary redirect as a weak signal. It listed slashless URLs such as `/getting-started/why-scenarist` under "Crawled – currently not indexed", and none under "Page with redirect". In other words, it was treating each slashless URL as a page of its own instead of consolidating it onto the canonical one.

### 2. Removed pages without redirects

Four pages were deleted in early December 2025, shortly after the sitemap was first submitted on 2025-11-30, and all four still returned 404. They were most likely the 4 URLs in "Not found (404)":

| Old URL                                    | Replaced by                          |
| ------------------------------------------ | ------------------------------------ |
| `/concepts/default-mocks/`                 | `/scenarios/default-scenarios/`      |
| `/concepts/dynamic-responses/`             | `/scenarios/overview/`               |
| `/concepts/scenario-format/`               | `/scenarios/basic-structure/`        |
| `/frameworks/nextjs-app-router/rsc-guide/` | `/frameworks/nextjs-app-router/rsc/` |

## Resolution

| Change                                                                                                | Where                                                                             |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Rewrote 300 authored links to end in `/`                                                              | `apps/docs/src/`                                                                  |
| Generated a `301` rule per built page from `/path` to `/path/`, overriding Cloudflare's default `307` | `apps/docs/integrations/trailing-slash-redirects.ts`                              |
| Added `301` redirects for the four removed pages                                                      | `redirects` in `apps/docs/astro.config.mjs`                                       |
| Started a list of every URL ever published                                                            | `apps/docs/published-pages.json`                                                  |
| Added tests for all of the above                                                                      | `apps/docs/tests/playwright/trailing-slash.spec.ts` and `published-pages.spec.ts` |

## Gotchas

- **The Cloudflare adapter writes `_redirects` before other integrations run.** It appends rules for Astro's `redirects` config in its own `astro:build:done` hook. An integration that overwrites `dist/client/_redirects` silently drops those rules, so `trailing-slash-redirects.ts` merges with the existing file instead.
- **The adapter's `_redirects` has no final newline.** Appending blindly glues the next rule onto its last line. The integration splits the file into lines and rewrites it.
- **Exact-path `_redirects` rules override Cloudflare's trailing-slash `307`.** A `/path /path/ 301` rule does not match `/path/`, so it cannot loop, and query strings are carried through.

## Search Console follow-up (manual)

1. Resubmit `sitemap-index.xml`, and also submit `sitemap-0.xml` directly.
2. Click **Validate fix** on "Crawled – currently not indexed" and on "Not found (404)".
3. Use URL Inspection → **Request indexing** on key pages.

Fixing these signals does not force Google to index a page. Pages that stay "Crawled – currently not indexed" after the site has been recrawled need stronger external signals, such as links from other sites.
