'use strict';

const fs = require('fs');
const path = require('path');

loadEnvFile();

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const STRAPI_URL =
    (process.env.STRAPI_PRODUCTION_URL || '')
        .replace(/\/+$/, '');

const STRAPI_ROOT =
    process.env.STRAPI_ROOT;

const STRAPI_CHILDREN =
    process.env.STRAPI_CHILDREN;

const STRAPI_NODE =
    process.env.STRAPI_NODE;

const STRAPI_API_TOKEN =
    process.env.STRAPI_API_TOKEN || '';

const OUTPUT_DIR =
    path.join(process.cwd(), 'data');

const OUTPUT_FILE =
    path.join(
        OUTPUT_DIR,
        'navigation.json'
    );

const PAGE_SIZE = 100;

// ----------------------------------------------------------------------------
// Validate configuration
// ----------------------------------------------------------------------------

function validateConfig() {
    const required = {
        STRAPI_PRODUCTION_URL: STRAPI_URL,
        STRAPI_ROOT,
        STRAPI_CHILDREN,
        STRAPI_NODE,
    };

    for (const [key, value] of Object.entries(required)) {
        if (!value) {
            throw new Error(
                `Missing required environment variable: ${key}`
            );
        }
    }
}

// ----------------------------------------------------------------------------
// Fetch JSON
// ----------------------------------------------------------------------------

async function fetchJSON(url) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
        headers.Authorization =
            `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response =
        await fetch(url, { headers });

    if (!response.ok) {
        const body =
            await response.text()
                .catch(() => '');

        throw new Error(
            `Strapi request failed (${response.status} ${response.statusText}) for ${url}\n${body}`
        );
    }

    return response.json();
}

// ----------------------------------------------------------------------------
// Strapi normalizers
// ----------------------------------------------------------------------------

function getAttrs(entity) {
    if (!entity) return {};

    return entity.attributes
        ? entity.attributes
        : entity;
}

function getRelationItems(relation) {
    if (!relation) return [];

    if (Array.isArray(relation)) {
        return relation;
    }

    if (Array.isArray(relation.data)) {
        return relation.data;
    }

    if (relation.data) {
        return [relation.data];
    }

    return [];
}

function bySortOrder(a, b) {
    return (
        (a.sortOrder || 0) -
        (b.sortOrder || 0)
    );
}

// ----------------------------------------------------------------------------
// Fetch all ROOT entities
// ----------------------------------------------------------------------------

async function fetchAllRoots() {
    const roots = [];

    let page = 1;
    let pageCount = 1;

    do {
        const query = [
            `populate[${encodeURIComponent(STRAPI_CHILDREN)}][populate][${encodeURIComponent(STRAPI_NODE)}]=true`,
            `pagination[page]=${page}`,
            `pagination[pageSize]=${PAGE_SIZE}`,
        ].join('&');

        const url =
            `${STRAPI_URL}/api/${STRAPI_ROOT}?${query}`;

        const json =
            await fetchJSON(url);

        const pageItems =
            Array.isArray(json.data)
                ? json.data
                : [];

        roots.push(...pageItems);

        pageCount =
            json.meta &&
            json.meta.pagination
                ? json.meta.pagination.pageCount
                : 1;

        page += 1;

    } while (page <= pageCount);

    return roots;
}

// ----------------------------------------------------------------------------
// Build navigation
// ----------------------------------------------------------------------------

function buildNavigationTree(rawRoots) {
    const tree =
        rawRoots.map((rawRoot) => {
            const root =
                getAttrs(rawRoot);

            const rootSlug =
                root.slug;

            // ---------------------------------------------------------------
            // CHILDREN
            // ---------------------------------------------------------------

            const children =
                getRelationItems(
                    root[STRAPI_CHILDREN]
                )
                    .map((rawChild) => {
                        const child =
                            getAttrs(rawChild);

                        const childSlug =
                            child.slug;

                        // ---------------------------------------------------
                        // NODE
                        // ---------------------------------------------------

                        const nodes =
                            getRelationItems(
                                child[STRAPI_NODE]
                            )
                                .map((rawNode) => {
                                    const node =
                                        getAttrs(rawNode);

                                    return {
                                        title:
                                            node.title ||
                                            node.name,

                                        slug:
                                        node.slug,

                                        sortOrder:
                                            node.sortOrder ||
                                            0,

                                        path:
                                            `/docs/${rootSlug}/${childSlug}/${node.slug}`,
                                    };
                                })
                                .sort(bySortOrder);

                        return {
                            name:
                            child.name,

                            slug:
                            childSlug,

                            sortOrder:
                                child.sortOrder ||
                                0,

                            [STRAPI_NODE]:
                            nodes,
                        };
                    })
                    .sort(bySortOrder);

            return {
                name:
                root.name,

                slug:
                rootSlug,

                sortOrder:
                    root.sortOrder ||
                    0,

                [STRAPI_CHILDREN]:
                children,
            };
        });

    return tree.sort(bySortOrder);
}

// ----------------------------------------------------------------------------
// Write navigation.json
// ----------------------------------------------------------------------------
const CONFIG_FILE = path.join(OUTPUT_DIR, 'navigation-config.json');

function writeNavigationFile(navigationTree) {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(
            OUTPUT_DIR,
            {recursive: true}
        );
    }

    fs.writeFileSync(
        OUTPUT_FILE,
        JSON.stringify(
            navigationTree,
            null,
            2
        ) + '\n',
        'utf8'
    );

    const config = {
        root: STRAPI_ROOT,
        children: STRAPI_CHILDREN,
        node: STRAPI_NODE,
    };

    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(
            config,
            null,
            2
        ) + '\n',
        'utf8'
    );
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main() {
    validateConfig();

    console.log(
        `\n→ Fetching content tree from ${STRAPI_URL} ...`
    );

    console.log(
        `→ Structure: ${STRAPI_ROOT} → ${STRAPI_CHILDREN} → ${STRAPI_NODE}`
    );

    const rawRoots =
        await fetchAllRoots();

    console.log(
        `→ Fetched ${rawRoots.length} ${STRAPI_ROOT}(s) from Strapi.`
    );

    const navigationTree =
        buildNavigationTree(rawRoots);

    const childCount =
        navigationTree.reduce(
            (sum, root) =>
                sum +
                root[STRAPI_CHILDREN].length,
            0
        );

    const nodeCount =
        navigationTree.reduce(
            (sum, root) =>
                sum +
                root[STRAPI_CHILDREN]
                    .reduce(
                        (childSum, child) =>
                            childSum +
                            child[STRAPI_NODE].length,
                        0
                    ),
            0
        );

    writeNavigationFile(
        navigationTree
    );

    console.log(
        `✔ navigation.json generated: ` +
        `${navigationTree.length} ${STRAPI_ROOT}(s), ` +
        `${childCount} ${STRAPI_CHILDREN}(s), ` +
        `${nodeCount} ${STRAPI_NODE}(s)`
    );

    console.log(
        `✔ Written to: ${path.relative(
            process.cwd(),
            OUTPUT_FILE
        )}\n`
    );
}

main().catch((error) => {
    console.error(
        '\n✖ Failed to generate navigation.json'
    );

    console.error(
        error.message || error
    );

    process.exit(1);
});

// ----------------------------------------------------------------------------
// .env loader
// ----------------------------------------------------------------------------

function loadEnvFile() {
    const envPath =
        path.join(
            process.cwd(),
            '.env'
        );

    if (!fs.existsSync(envPath)) {
        return;
    }

    const contents =
        fs.readFileSync(
            envPath,
            'utf8'
        );

    contents
        .split('\n')
        .forEach((rawLine) => {
            const line =
                rawLine.trim();

            if (
                !line ||
                line.startsWith('#')
            ) {
                return;
            }

            const equalsIndex =
                line.indexOf('=');

            if (equalsIndex === -1) {
                return;
            }

            const key =
                line
                    .slice(
                        0,
                        equalsIndex
                    )
                    .trim();

            let value =
                line
                    .slice(
                        equalsIndex + 1
                    )
                    .trim();

            if (
                (value.startsWith('"') &&
                    value.endsWith('"')) ||
                (value.startsWith("'") &&
                    value.endsWith("'"))
            ) {
                value =
                    value.slice(
                        1,
                        -1
                    );
            }

            if (!(key in process.env)) {
                process.env[key] = value;
            }
        });
}