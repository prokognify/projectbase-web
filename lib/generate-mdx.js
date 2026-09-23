'use strict';

const fs = require('fs');
const path = require('path');

loadDotEnvIfPresent();

// ---------------------------------------------------------------------------
// Environment configuration
// ---------------------------------------------------------------------------

const STRAPI_URL = (process.env.STRAPI_PRODUCTION_URL || '').replace(/\/+$/, '');

const STRAPI_ROOT = process.env.STRAPI_ROOT;
const STRAPI_CHILDREN = process.env.STRAPI_CHILDREN;
const STRAPI_NODE = process.env.STRAPI_NODE;

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

const OUTPUT_DIR = process.env.DOCS_OUTPUT_DIR
    ? path.resolve(process.env.DOCS_OUTPUT_DIR)
    : path.join(process.cwd(), 'docs');

// ---------------------------------------------------------------------------
// Validate configuration
// ---------------------------------------------------------------------------

function validateConfig() {
    const required = {
        STRAPI_PRODUCTION_URL: STRAPI_URL,
        STRAPI_ROOT,
        STRAPI_CHILDREN,
        STRAPI_NODE,
    };

    for (const [key, value] of Object.entries(required)) {
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
    }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main().catch((err) => {
    console.error('\n❌ MDX generation failed:');
    console.error(err.message);
    process.exit(1);
});

async function main() {
    validateConfig();

    console.log(`→ Fetching content tree from ${STRAPI_URL} ...`);
    console.log(
        `→ Structure: ${STRAPI_ROOT} → ${STRAPI_CHILDREN} → ${STRAPI_NODE}`
    );

    const roots = await fetchAllRoots();

    if (!roots.length) {
        console.log(`⚠ No ${STRAPI_ROOT} found in Strapi.`);
        resetOutputDir(OUTPUT_DIR);
        return;
    }

    resetOutputDir(OUTPUT_DIR);

    let fileCount = 0;
    let nodeFileCount = 0;

    // -----------------------------------------------------------------------
    // ROOT (collection)
    // -----------------------------------------------------------------------

    for (const root of roots) {
        const rootSlug = requireSlug(
            root.slug,
            STRAPI_ROOT,
            root.name
        );

        const rootDir = path.join(OUTPUT_DIR, rootSlug);

        fs.mkdirSync(rootDir, { recursive: true });

        // ---------------------------------------------------------------
        // Collection landing page: docs/<root-slug>/<root-slug>.mdx
        // (was previously docs/<root-slug>/index.mdx)
        // ---------------------------------------------------------------

        const rootFilePath = path.join(rootDir, `${rootSlug}.mdx`);

        const rootFrontmatter = buildFrontmatter({
            title: root.name,
            sidebar_label: root.name,
            root_name: root.name,
        });

        fs.writeFileSync(
            rootFilePath,
            rootFrontmatter + (root.mdxContent ?? ''),
            'utf8'
        );

        fileCount += 1;

        console.log(
            `  ✓ ${path.relative(process.cwd(), rootFilePath)}`
        );

        // -------------------------------------------------------------------
        // CHILDREN (sections)
        // -------------------------------------------------------------------

        const children = normalizeList(root[STRAPI_CHILDREN]);

        for (const child of children) {
            const childSlug = requireSlug(
                child.slug,
                STRAPI_CHILDREN,
                child.name
            );

            const childDir = path.join(rootDir, childSlug);

            fs.mkdirSync(childDir, { recursive: true });

            // ---------------------------------------------------------------
            // Section landing page (NEW): docs/<root-slug>/<child-slug>/<child-slug>.mdx
            // Rendered at e.g. /docs/react-js/react-the-complete-guide
            // ---------------------------------------------------------------

            const childFilePath = path.join(childDir, `${childSlug}.mdx`);

            const childFrontmatter = buildFrontmatter({
                title: child.name,
                sidebar_label: child.name,
                root_name: root.name,
                child_name: child.name,
            });

            fs.writeFileSync(
                childFilePath,
                childFrontmatter + (child.mdxContent ?? ''),
                'utf8'
            );

            fileCount += 1;

            console.log(
                `  ✓ ${path.relative(process.cwd(), childFilePath)}`
            );

            // -----------------------------------------------------------
            // NODE (content items)
            // -----------------------------------------------------------

            const nodes = normalizeList(child[STRAPI_NODE]);

            for (const node of nodes) {
                const nodeSlug = requireSlug(
                    node.slug,
                    STRAPI_NODE,
                    node.title || node.name
                ).replace(/\.mdx$/i, '');

                if (nodeSlug === childSlug) {
                    console.warn(
                        `  ⚠ ${STRAPI_NODE} slug "${nodeSlug}" collides with its parent ${STRAPI_CHILDREN} slug — it will overwrite the section landing page.`
                    );
                }

                const filePath = path.join(
                    childDir,
                    `${nodeSlug}.mdx`
                );

                const frontmatter = buildFrontmatter({
                    title: node.title || node.name,
                    sidebar_label: node.title || node.name,
                    root_name: root.name,
                    child_name: child.name,
                });

                fs.writeFileSync(
                    filePath,
                    frontmatter + (node.mdxContent ?? ''),
                    'utf8'
                );

                fileCount += 1;
                nodeFileCount += 1;

                console.log(
                    `  ✓ ${path.relative(process.cwd(), filePath)}`
                );
            }
        }
    }

    console.log(
        `\n✅ Done. Wrote ${fileCount} MDX file(s) to ${path.relative(
            process.cwd(),
            OUTPUT_DIR
        )}/`
    );

    if (nodeFileCount === 0) {
        console.log(
            `⚠ No ${STRAPI_NODE} were found under ${STRAPI_ROOT} → ${STRAPI_CHILDREN}.`
        );
    }
}

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

function buildFrontmatter(fields) {
    const yamlString = (value) => JSON.stringify(value ?? '');

    const lines = ['---'];

    for (const [key, value] of Object.entries(fields)) {
        lines.push(`${key}: ${yamlString(value)}`);
    }

    lines.push('---', '', '');

    return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Fetch all ROOT entities
// ---------------------------------------------------------------------------

async function fetchAllRoots() {
    const pageSize = 100;
    let page = 1;
    let all = [];

    while (true) {
        const query = [
            `populate[${encodeURIComponent(STRAPI_CHILDREN)}][populate][${encodeURIComponent(STRAPI_NODE)}]=true`,
            `pagination[page]=${page}`,
            `pagination[pageSize]=${pageSize}`,
        ].join('&');

        const url =
            `${STRAPI_URL}/api/${STRAPI_ROOT}?${query}`;

        const json = await strapiFetch(url);

        const items = normalizeList(json);

        all = all.concat(items);

        const pagination =
            json &&
            json.meta &&
            json.meta.pagination;

        if (
            !pagination ||
            page >= pagination.pageCount
        ) {
            break;
        }

        page += 1;
    }

    return all;
}

// ---------------------------------------------------------------------------
// Strapi fetch
// ---------------------------------------------------------------------------

async function strapiFetch(url) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
        headers.Authorization =
            `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response = await fetch(url, {
        headers,
    });

    if (!response.ok) {
        const body =
            await response.text().catch(() => '');

        throw new Error(
            `Strapi request failed (${response.status} ${response.statusText}) for ${url}\n${body}`
        );
    }

    return response.json();
}

// ---------------------------------------------------------------------------
// Strapi v4 / v5 normalizers
// ---------------------------------------------------------------------------

function normalizeEntity(entity) {
    if (!entity) return null;

    return entity.attributes
        ? {
            id: entity.id,
            ...entity.attributes,
        }
        : entity;
}

function normalizeList(value) {
    if (!value) return [];

    let array;

    if (Array.isArray(value)) {
        array = value;
    } else if (Array.isArray(value.data)) {
        array = value.data;
    } else if (value.data) {
        array = [value.data];
    } else {
        return [];
    }

    return array
        .map(normalizeEntity)
        .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function requireSlug(slug, kind, label) {
    if (
        !slug ||
        typeof slug !== 'string' ||
        !slug.trim()
    ) {
        throw new Error(
            `${kind} "${label || '(untitled)'}" is missing a slug.`
        );
    }

    return slug.trim();
}

function resetOutputDir(dir) {
    fs.rmSync(dir, {
        recursive: true,
        force: true,
    });

    fs.mkdirSync(dir, {
        recursive: true,
    });
}

// ---------------------------------------------------------------------------
// Minimal .env loader
// ---------------------------------------------------------------------------

function loadDotEnvIfPresent() {
    const envPath =
        path.join(process.cwd(), '.env');

    if (!fs.existsSync(envPath)) {
        return;
    }

    const lines =
        fs.readFileSync(envPath, 'utf8')
            .split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        if (
            !trimmed ||
            trimmed.startsWith('#')
        ) {
            continue;
        }

        const eq =
            trimmed.indexOf('=');

        if (eq === -1) {
            continue;
        }

        const key =
            trimmed.slice(0, eq).trim();

        let value =
            trimmed.slice(eq + 1).trim();

        value =
            value.replace(
                /^["']|["']$/g,
                ''
            );

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}
