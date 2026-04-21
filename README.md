<h1 align="center">RED — The Agentic-Native Starter Kit</h1>

<p align="center">
  <strong>Ship your agentic startup by the weekend.</strong>
</p>

<p align="center">
  From hackathon prototype to production SaaS — RED gives you the Agentic-Native stack in 90 minutes.<br />
  So your next 3 months build the product, not the plumbing.
</p>

<p align="center">
  <a href="https://red.dev3o.com"><strong>Website</strong></a> &bull;
  <a href="https://red-demo.dev3o.com"><strong>Live Demo</strong></a> &bull;
  <a href="https://red.dev3o.com/docs"><strong>Docs</strong></a> &bull;
  <a href="https://red.dev3o.com/#pricing"><strong>Pricing</strong></a> &bull;
  <a href="https://github.com/agentic-dev3o/red/issues"><strong>Issues</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/create-red-app?label=create-red-app&color=D4483B" alt="npm version" />
  <img src="https://img.shields.io/github/stars/agentic-dev3o/red?style=flat&label=stars%20%2F%2010k&color=D4483B" alt="GitHub Stars" />
</p>

<p align="center">
  <em>⭐ <strong>10,000 stars → RED becomes fully open source.</strong> See <a href="#-the-10k-pledge">The 10k Pledge</a>.</em>
</p>

---

## Why RED

Every SaaS is becoming agentic. Most starter kits bolt a streaming chat on top of a Next.js boilerplate and call it a day. RED picks a side: the AI Module is the **spine**, and the SaaS plumbing wraps around it.

- **5 AI primitives, production-grade** — multi-party streaming, message queue, boundaries (per-project brain), agent abstraction, sync tasks.
- **The headliner: external async tasks** — long-running work, off the main thread, streams progress back and notifies on completion. Deep research, batch scraping, multi-step agent pipelines, video renders — the things LLM wrappers can't do.
- **SaaS-complete, not Frankenstack** — passkeys & 2FA auth, orgs & RBAC, metered billing (Autumn + Stripe), admin dashboard, audit logs, i18n, transactional email, waitlist.
- **One opinionated stack** — Convex · React 19 · Bun · Vite · Tailwind v4 · shadcn/ui · Better Auth · Zod · Autumn · Resend · Lingui · Biome.
- **Deploy anywhere** — managed free-tier cloud (Convex + Cloudflare) or self-hosted on your own box. Same codebase.

[**Explore RED on red.dev3o.com →**](https://red.dev3o.com)

---

## Try It In 60 Seconds

Break anything — the database wipes every 4 hours.

**[→ Open the live demo (admin access)](https://red-demo.dev3o.com)**

Or scaffold your own project once you have a license:

```bash
bun create red-app my-saas --license YOUR_LICENSE_KEY
cd my-saas
claude
/red-init
```

One command validates your license, downloads the latest stable release, verifies its SHA-256 checksum, and extracts a ready-to-use project with the Claude skills pre-installed.

---

## ⭐ The 10k Pledge

**When this repository reaches 10,000 GitHub stars, RED becomes fully open source.**

No strings. No conditions. No small print. The entire codebase — CLI, boilerplate, AI Module, Claude skills — flips to a permissive open-source license the day we cross 10,000 ⭐.

Every star moves that needle. If you think Agentic-Native tooling should be accessible to every builder on the planet, **[hit the star button at the top of this page ↑](https://github.com/agentic-dev3o/red)**.

<p align="center">
  <a href="https://github.com/agentic-dev3o/red">
    <img src="https://img.shields.io/github/stars/agentic-dev3o/red?style=for-the-badge&label=stars%20toward%2010k&color=D4483B&logo=github" alt="Stars toward 10k" />
  </a>
</p>

---

## 🗣️ Feature Requests & Bug Reports

This repository is RED's public home — where the community reports bugs, requests features, and helps shape the roadmap.

- 🐛 **[Report a bug](https://github.com/agentic-dev3o/red/issues/new?template=bug_report.md)** — CLI, scaffolding, license validation, or the RED boilerplate itself.
- 💡 **[Request a feature](https://github.com/agentic-dev3o/red/issues/new?template=feature_request.md)** — AI Module primitives, stack decisions, developer experience.
- 💬 **[Start a discussion](https://github.com/agentic-dev3o/red/discussions)** — questions, stack tradeoffs, "is this the right tool for my use case?".

Before opening an issue, please search existing ones — there is a fair chance someone hit the same thing.

### Built with RED

Shipping a product on RED? We'd love to feature it. [Open a PR against `SHOWCASE.md`](https://github.com/agentic-dev3o/red/edit/main/SHOWCASE.md) with a link, a one-line description, and a screenshot.

---

## About This Repo

This repo serves two purposes:

- **Public CLI (`create-red-app`)** — open source, published to npm under MIT. This is what buyers use to scaffold and upgrade RED projects.
- **Community home** — issues, discussions, showcase, and the star-tracked road to open source.

The product source (boilerplate + AI Module + Claude skills) is private today and delivered as signed, checksum-verified release archives through the CLI. It flips to open source when the 10k pledge triggers.

---

## CLI Reference

The CLI is published to npm as [`create-red-app`](https://www.npmjs.com/package/create-red-app). Run it without installing:

```bash
# Bun (recommended)
bun create red-app <directory> --license <key>

# Or via bunx / npx
bunx create-red-app <directory> --license <key>
npx  create-red-app <directory> --license <key>
```

### Commands

#### Scaffold a new project

```bash
bun create red-app <directory> --license <key> [--version <ver>]
```

Validates the license, downloads the latest stable release (or a pinned `--version`), verifies SHA-256 integrity, and extracts into the target directory with `.red-license`, `.red-version`, and Claude skills intact.

#### List available releases

```bash
bunx create-red-app versions
```

Outputs semver-sorted JSON to stdout. Includes prereleases, marks the latest stable.

#### Show release details

```bash
bunx create-red-app info <version>
```

Outputs normalised release metadata as JSON — changelog, migration manifest (always a parsed object), checksum, and more.

#### Download a release

```bash
bunx create-red-app download <version>
```

Downloads and extracts a release to a temp directory without touching your project. Outputs JSON with `version`, `archiveFileName`, `archivePath`, and `extractedPath`. Inspection primitive used by the `red-update` Claude skill.

### Options

| Flag | Description |
|------|-------------|
| `--license <key>` | License key. Also read from the `RED_LICENSE_KEY` env var or `.red-license` in the current directory. |
| `--version <ver>` | Pin the scaffold to a specific release version. |
| `--api-url <url>` | Override the license API base URL (staging / local dev). |
| `-h, --help` | Show help. |
| `-v, --version` | Show CLI version. |

---

## License

- **CLI (`create-red-app`)** — MIT. See [LICENSE](LICENSE).
- **RED boilerplate, AI Module, and Claude skills** — commercial license per tier. [See pricing →](https://red.dev3o.com/#pricing)

Both flip to a fully permissive open-source license when this repository reaches **10,000 ⭐**. See [The 10k Pledge](#-the-10k-pledge).

---

<p align="center">
  Built by <a href="https://dev3o.com"><strong>dev3o</strong></a> — the boring parts that actually matter.
</p>
