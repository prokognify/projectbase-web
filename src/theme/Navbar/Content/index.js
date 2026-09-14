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