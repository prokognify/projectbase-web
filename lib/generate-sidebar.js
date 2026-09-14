const fs = require('fs');
const path = require('path');

function generateSidebars(
    navigationPath = path.join(
        __dirname,
        '..',
        'data',
        'navigation.json'
    )
) {
    const configPath = path.join(
        __dirname,
        '..',
        'data',
        'navigation-config.json'
    );

    const raw =
        fs.readFileSync(
            navigationPath,
            'utf-8'
        );

    const navigation =
        JSON.parse(raw);

    const config =
        JSON.parse(
            fs.readFileSync(
                configPath,
                'utf-8'
            )
        );

    const sidebars = {};

    const childrenKey =
        config.children;

    const nodeKey =
        config.node;

    navigation
        .slice()
        .sort(
            (a, b) =>
                (a.sortOrder || 0) -
                (b.sortOrder || 0)
        )
        .forEach((root) => {

            const children =
                root[childrenKey] || [];

            children
                .slice()
                .sort(
                    (a, b) =>
                        (a.sortOrder || 0) -
                        (b.sortOrder || 0)
                )
                .forEach((child) => {

                    const sidebarId =
                        `${root.slug}-${child.slug}`;

                    const nodes =
                        child[nodeKey] || [];

                    const items =
                        nodes
                            .slice()
                            .sort(
                                (a, b) =>
                                    (a.sortOrder || 0) -
                                    (b.sortOrder || 0)
                            )
                            .map(
                                (node) =>
                                    node.path.replace(
                                        /^\/?docs\//,
                                        ''
                                    )
                            );

                    if (
                        items.length === 0
                    ) {
                        return;
                    }

                    sidebars[sidebarId] =
                        items;
                });
        });

    return sidebars;
}

module.exports =
    generateSidebars;