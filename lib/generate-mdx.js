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

    // -----------------------------------------------------------------------
    // ROOT
    // -----------------------------------------------------------------------

    for (const root of roots) {
        const rootSlug = requireSlug(
            root.slug,
            STRAPI_ROOT,
            root.name
        );

        // ---------------------------------------------------------------
        // ROOT index.mdx (uses the collection's own mdxContent)
        // ---------------------------------------------------------------

        const rootDir = path.join(OUTPUT_DIR, rootSlug);
        fs.mkdirSync(rootDir, { recursive: true });

        const rootIndexPath = path.join(rootDir, 'index.mdx');

        const rootFrontmatter = buildFrontmatter({
            title: root.name,
            description: root.description,
            sortOrder: root.sortOrder,
        });

        fs.writeFileSync(
            rootIndexPath,
            rootFrontmatter + (root.mdxContent ?? ''),
            'utf8'
        );

        fileCount += 1;

        console.log(
            `  ✓ ${path.relative(process.cwd(), rootIndexPath)}`
        );

        // -------------------------------------------------------------------
        // CHILDREN
        // -------------------------------------------------------------------

        const children = normalizeList(root[STRAPI_CHILDREN]);

        for (const child of children) {
            const childSlug = requireSlug(
                child.slug,
                STRAPI_CHILDREN,
                child.name
            );

            // ---------------------------------------------------------------
            // NODE
            // ---------------------------------------------------------------

            const nodes = normalizeList(child[STRAPI_NODE]);

            for (const node of nodes) {
                const nodeSlug = requireSlug(
                    node.slug,
                    STRAPI_NODE,
                    node.title || node.name
                ).replace(/\.mdx$/i, '');

                const dir = path.join(
                    OUTPUT_DIR,
                    rootSlug,
                    childSlug
                );

                const filePath = path.join(
                    dir,
                    `${nodeSlug}.mdx`
                );

                const frontmatter = buildFrontmatter({
                    title: node.title || node.name,
                    rootName: root.name,
                    childName: child.name,
                });

                fs.mkdirSync(dir, { recursive: true });

                fs.writeFileSync(
                    filePath,
                    frontmatter + (node.mdxContent ?? ''),
                    'utf8'
                );

                fileCount += 1;

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

    if (fileCount === 0) {
        console.log(
            `⚠ No ${STRAPI_NODE} were found under ${STRAPI_ROOT} → ${STRAPI_CHILDREN}.`
        );
    }
}

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

function buildFrontmatter({
                              title,
                              rootName,
                              childName,
                          }) {
    const yamlString = (value) =>
        JSON.stringify(value ?? '');

    return [
        '---',
        `title: ${yamlString(title)}`,
        `sidebar_label: ${yamlString(title)}`,
        `root_name: ${yamlString(rootName)}`,
        `child_name: ${yamlString(childName)}`,
        '---',
        '',
        '',
    ].join('\n');
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