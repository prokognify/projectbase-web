# 🚀 Production & Deployment Automation

Welcome to the deployment guidebook! By the end of this page, your Docusaurus site will:

- ✅ Auto-deploy from GitHub → Vercel
- ✅ Auto-rebuild whenever content changes in Strapi
- ✅ Have fast, client-side local search

This guide follows the **Collection / Section / Content** architecture used throughout the KnowledgeBase platform.

:::info[What You'll Need]
A GitHub account, a Vercel account, a running Strapi instance, and a Docusaurus project ready to ship. That's it — let's go.
:::

---

## 🧩 1. Production Deployment Setup

> Link the project to a GitHub repository and configure Vercel for automated deployments, including setting the production API environment variable.

### Step 1 — Push your codebase to GitHub

Initialize Git, commit your project, and push it to a new repository (e.g. `knowledgebase-web`).

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:<your-username>/knowledgebase-web.git
git branch -M main
git push -u origin main
```

:::tip[Line Endings on Windows]
Seeing `LF will be replaced by CRLF` warnings? That's just Git normalizing line endings — completely safe to ignore.
:::

### Step 2 — Set the production environment variable

Before deploying, point your build scripts at the **production** Strapi API instead of your local one.

In `.env`:

```bash title=".env"
STRAPI_PRODUCTION_URL=https://knowledgebase-core.onrender.com
```

Then, in both `generate-mdx.js` and `generate-navigation.js`, switch which URL is active:

```js title="generate-mdx.js / generate-navigation.js"
// ✅ Activate — used in production
const STRAPI_URL = (process.env.STRAPI_PRODUCTION_URL).replace(/\/+$/, '');

// ⛔ Deactivate — local development only
// const STRAPI_URL = (process.env.STRAPI_DEVELOPMENT_URL).replace(/\/+$/, '');
```

:::warning[Don't Forget to Push]
Commit and push this change — Vercel builds from your **remote** branch, not your local files.

```bash
git add .
git commit -m "Ready for production"
git push
```
:::

### Step 3 — Deploy on Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New → Project**.
3. Import your `knowledgebase-web` GitHub repository.
4. Confirm the framework preset (Docusaurus) and click **Deploy**.

That's it — Vercel now builds and redeploys automatically on every push to `main`. 🎉

---

## 🔁 2. Strapi-Triggered Rebuilds

> Create and integrate a Vercel Deploy Hook with Strapi webhooks, ensuring the site automatically rebuilds and redeploys upon Content changes.

Static sites don't know when your CMS content changes — so we'll teach Strapi to *tell* Vercel.

### Step 1 — Create a Deploy Hook in Vercel

1. Open your project on **vercel.com**.
2. Go to **Settings → Git → Deploy Hooks**.
3. Name it something clear, e.g. `strapi-content-update`.
4. Choose the branch to build from (usually `main`).
5. Click **Create Hook** — Vercel generates a unique URL:

```text
https://api.vercel.com/v1/integrations/deploy/prj_xxxxxxx/xxxxxxxxxx
```

:::danger[Keep This URL Private]
Anyone with this URL can trigger a deployment. Treat it like a secret — don't commit it to your repo.
:::

### Step 2 — Add a Webhook in Strapi

1. Open your **Strapi admin panel**.
2. Go to **Settings → Webhooks** (under *Global Settings*).
3. Click **Create new webhook** and fill in:

| Field | Value |
|---|---|
| **Name** | `Trigger Vercel Rebuild` |
| **URL** | Paste the Vercel Deploy Hook URL from Step 1 |
| **Headers** | None needed |
| **Events** | ☑ Create · ☑ Update · ☑ Delete · ☑ Publish · ☑ Unpublish |

:::tip[Scope It Down]
Limit the webhook to specific Content types if you only need certain Collections to trigger a rebuild — this avoids unnecessary redeploys.
:::

4. Click **Save**.

### Step 3 — Test the pipeline

1. In Strapi, publish (or edit) an entry in a Content type you selected.
2. Head to **Vercel → your project → Deployments** — a new deployment should start within seconds.
3. Wait for the build to finish (typically 30s–2min).
4. Refresh your live site and confirm the change appears. ✅

:::note[Something Not Firing?]
In Strapi, go to **Settings → Webhooks → your webhook** and check the delivery log at the bottom. A `200` means success; anything else means the request failed. Also double-check the Vercel URL was copied in full, with no trailing spaces.
:::

---

## 🔎 3. Local Search Integration

> Install and configure the `@easyops-cn/docusaurus-search-local` plugin, updating the swizzled navbar to render the search bar for client-side Content indexing.

This is a community-maintained, fully client-side search plugin — no external service required.

### Step 1 — Install the plugin

```bash
npm install --save @easyops-cn/docusaurus-search-local
```

:::note[About Those npm Warnings]
Deprecation notices and audit warnings from unrelated packages are normal in most Docusaurus projects — they won't affect the search plugin.
:::

### Step 2 — Configure `docusaurus.config.js`

Register the theme and set your indexing preferences:

```js title="docusaurus.config.js"
themes: [
  [
    require.resolve('@easyops-cn/docusaurus-search-local'),
    {
      hashed: true,
      language: ['en'],
      indexDocs: true,
      indexBlog: false,
      indexPages: false,
      docsRouteBasePath: '/docs',
      searchBarShortcut: true,
      searchBarShortcutHint: true,
      searchBarPosition: 'right',
    },
  ],
]
```

<details>
<summary>So, complete replaceable code for `docusaurus.config.js` </summary>

```

import {themes as prismThemes} from 'prism-react-renderer';

const config = {
    title: 'KnowledgeBase Web',
    tagline: 'Knowledge will be organized',
    favicon: 'img/favicon.ico',

    future: {
        v4: true,
    },

    url: 'https://knowledgebase-web.vercel.app',
    baseUrl: '/',

    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },


    presets: [
        [
            'classic',
            ({
                docs: {
                    sidebarPath: './sidebars.js',
                    editUrl: 'https://github.com/devarifur007/knowledgebase-web',
                },

                theme: {
                    customCss: './src/css/custom.css',
                },
            }),
        ],
    ],

    themes: [
        [
            require.resolve('@easyops-cn/docusaurus-search-local'),
            {
                hashed: true,
                language: ['en'],
                indexDocs: true,
                indexBlog: false,
                indexPages: false,
                docsRouteBasePath: '/docs',
                searchBarShortcut: true,
                searchBarShortcutHint: true,
                searchBarPosition: 'right',
            },
        ],
    ],

    themeConfig: {
        colorMode: {
            respectPrefersColorScheme: true,
        },

        navbar: {
            logo: {
                alt: 'KnowledgeBase',
                src: 'img/logo-light.svg',
            },

            items: [],
        },

        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    },
};

export default config;

```

</details>

### Step 3 — Render the search bar in a swizzled navbar

If you've swizzled `Navbar/Content`, the plugin **won't** auto-inject its search bar — you must render it explicitly.

```jsx title="src/theme/Navbar/Content/index.js"
import SearchBar from '@theme/SearchBar';

// ...inside your navbar's right-hand items:
<div className="navbar__items navbar__items--right">
  {/* Local Search */}
  <SearchBar />

  {/* ...other navbar items */}
</div>
```

<details>
<summary>So, complete replaceable code for `src/theme/Navbar/Content/index.js` </summary>

```jsx title="src/theme/Navbar/Content/index.js"

import React, {useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import {useThemeConfig} from '@docusaurus/theme-common';

import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';

import navigationData from '@site/data/navigation.json';
import navigationConfig from '@site/data/navigation-config.json';

import SearchBar from '@theme/SearchBar';

import styles from './styles.module.css';

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function getCurrentRoot(pathname) {
    const parts = pathname
        .split('/')
        .filter(Boolean);

    if (
        parts[0] !== 'docs' ||
        !parts[1]
    ) {
        return null;
    }

    return parts[1];
}

function getCurrentChild(pathname) {
    const parts = pathname
        .split('/')
        .filter(Boolean);

    if (
        parts[0] !== 'docs' ||
        !parts[1] ||
        !parts[2]
    ) {
        return null;
    }

    return parts[2];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NavbarContent() {
    const location = useLocation();
    const themeConfig = useThemeConfig();

    const [
        collectionSwitcherOpen,
        setCollectionSwitcherOpen,
    ] = useState(false);

    const currentRootSlug = useMemo(
        () =>
            getCurrentRoot(
                location.pathname
            ),
        [location.pathname],
    );

    const currentChildSlug = useMemo(
        () =>
            getCurrentChild(
                location.pathname
            ),
        [location.pathname],
    );

    const currentRoot =
        navigationData.find(
            (root) =>
                root.slug ===
                currentRootSlug,
        );

    const isRootPage =
        Boolean(currentRoot);

    const showingRoots =
        !isRootPage ||
        collectionSwitcherOpen;

    // -----------------------------------------------------------------------
    // Dynamically access the hierarchy
    // -----------------------------------------------------------------------

    const children =
        currentRoot?.[
            navigationConfig.children
            ] ?? [];

    return (
        <>
            {/* Mobile menu */}
            <NavbarMobileSidebarToggle />

            {/* Logo */}
            <NavbarLogo />

            {/* Main navigation */}
            <div className="navbar__items navbar__items--left">

                <div className={styles.navigationViewport}>

                    {/* =====================================================
                        CHILD NAVIGATION
                    ===================================================== */}

                    <div
                        className={[
                            styles.navigationLayer,
                            showingRoots
                                ? styles.navigationLayerHidden
                                : styles.navigationLayerVisible,
                        ].join(' ')}
                    >

                        {children.map((child) => {

                            const nodes =
                                child[
                                    navigationConfig.node
                                    ] ?? [];

                            const firstNode =
                                nodes[0];

                            if (!firstNode) {
                                return null;
                            }

                            const isActive =
                                child.slug ===
                                currentChildSlug;

                            return (
                                <Link
                                    key={child.slug}
                                    to={firstNode.path}
                                    className={[
                                        'navbar__link',
                                        isActive
                                            ? 'navbar__link--active'
                                            : '',
                                    ].join(' ')}
                                >
                                    {child.name}
                                </Link>
                            );
                        })}

                        {/* Root Switcher */}

                        {isRootPage && (
                            <button
                                type="button"
                                className={[
                                    'navbar__link',
                                    styles.collectionSwitcherButton,
                                ].join(' ')}
                                onClick={() =>
                                    setCollectionSwitcherOpen(
                                        true
                                    )
                                }
                                aria-label="Open Project Switcher"
                                aria-expanded={
                                    collectionSwitcherOpen
                                }
                            >
                                <span
                                    className={
                                        styles.menuIcon
                                    }
                                >
                                    ☰
                                </span>

                                <span>
                                    Projects
                                </span>
                            </button>
                        )}

                    </div>

                    {/* =====================================================
                        ROOT NAVIGATION
                    ===================================================== */}

                    <div
                        className={[
                            styles.navigationLayer,
                            styles.collectionNavigationLayer,
                            showingRoots
                                ? styles.navigationLayerVisible
                                : styles.navigationLayerHidden,
                        ].join(' ')}
                    >

                        {navigationData.map((root) => {

                            const children =
                                root[
                                    navigationConfig.children
                                    ] ?? [];

                            const firstChild =
                                children[0];

                            const nodes =
                                firstChild?.[
                                    navigationConfig.node
                                    ] ?? [];

                            const firstNode =
                                nodes[0];

                            if (!firstNode) {
                                return null;
                            }

                            const isCurrent =
                                root.slug ===
                                currentRootSlug;

                            return (
                                <Link
                                    key={root.slug}
                                    to={firstNode.path}
                                    className={[
                                        'navbar__link',
                                        isCurrent
                                            ? 'navbar__link--active'
                                            : '',
                                    ].join(' ')}
                                    onClick={() =>
                                        setCollectionSwitcherOpen(
                                            false
                                        )
                                    }
                                >
                                    {root.name}
                                </Link>
                            );
                        })}

                        {/* Close */}

                        {isRootPage && (
                            <button
                                type="button"
                                className={[
                                    'navbar__link',
                                    styles.closeButton,
                                ].join(' ')}
                                onClick={() =>
                                    setCollectionSwitcherOpen(
                                        false
                                    )
                                }
                            >
                                <span>✕</span>
                                <span>Close</span>
                            </button>
                        )}

                    </div>

                </div>

            </div>

            {/* =============================================================
                RIGHT SIDE
            ============================================================= */}

            <div className="navbar__items navbar__items--right">

                <SearchBar />

                {themeConfig.navbar.items
                    ?.filter(
                        (item) =>
                            item.position === 'right',
                    )
                    .map((item, index) => {

                        if (
                            item.type ===
                            'search'
                        ) {
                            return null;
                        }

                        if (
                            item.type ===
                            'html'
                        ) {
                            return (
                                <div
                                    key={index}
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            item.value ??
                                            '',
                                    }}
                                />
                            );
                        }

                        if (item.href) {
                            return (
                                <a
                                    key={index}
                                    href={item.href}
                                    className="navbar__link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {item.label}
                                </a>
                            );
                        }

                        return null;
                    })}

                <NavbarColorModeToggle />

            </div>
        </>
    );
}

```
</details>

:::tip[Naming Consistency]
Notice the helper functions `getCurrentCollection()` and `getCurrentSection()` in the navbar — these reflect the **Collection / Section / Content** architecture used across the whole platform, replacing the older "Subject / Module / Topic" naming.
:::

### Step 4 — Verify locally

```bash
npm run clear
npm run build
npm run serve
```

Open your site and check the navbar — the search bar should appear. Try the keyboard shortcut **`Ctrl + K`** to open it instantly. ⌨️

### Step 5 — Ship to production

```bash
git add .
git commit -m "Add local search"
git push
```

Vercel takes it from there — running `npm install`, then `npm run build`, then serving the `build/` directory.

---

## 📋 Quick Reference: Build Commands

| Environment | Commands |
|---|---|
| **Local development** | `npm run start` |
| **Local production test** | `npm run build` → `npm run serve` |
| **Vercel production** | `npm run build` (Vercel serves `build/` automatically) |

:::info[Missing `dotenv`?]
If your scripts rely on environment variables outside of Docusaurus' own handling, install it with:

```bash
npm i dotenv
```

`dotenv` loads variables from your `.env` file into `process.env`, following [The Twelve-Factor App](https://12factor.net/config) methodology of keeping config separate from code.
:::

---

## ✅ You're Done!

Your site now has a complete automation loop:

**GitHub push → Vercel build → Live site**, plus **Strapi Content change → Auto-rebuild → Live site**, all searchable instantly with local search. 🎊