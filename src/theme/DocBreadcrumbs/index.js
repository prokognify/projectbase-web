import React from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';

import navigationData from '@site/data/navigation.json';
import navigationConfig from '@site/data/navigation-config.json';

import styles from './styles.module.css';

// ---------------------------------------------------------------------------
// Find navigation data from current URL
// ---------------------------------------------------------------------------

function findBreadcrumbData(pathname) {
  const parts = pathname
      .split('/')
      .filter(Boolean);

  if (
      parts[0] !== 'docs' ||
      !parts[1] ||
      !parts[2] ||
      !parts[3]
  ) {
    return null;
  }

  const rootSlug =
      parts[1];

  const childSlug =
      parts[2];

  const nodeSlug =
      parts[3];

  // -----------------------------------------------------------------------
  // ROOT
  // -----------------------------------------------------------------------

  const root =
      navigationData.find(
          (item) =>
              item.slug ===
              rootSlug
      );

  if (!root) {
    return null;
  }

  // -----------------------------------------------------------------------
  // CHILD
  // -----------------------------------------------------------------------

  const children =
      root[
          navigationConfig.children
          ] ?? [];

  const child =
      children.find(
          (item) =>
              item.slug ===
              childSlug
      );

  if (!child) {
    return null;
  }

  // -----------------------------------------------------------------------
  // NODE
  // -----------------------------------------------------------------------

  const nodes =
      child[
          navigationConfig.node
          ] ?? [];

  const node =
      nodes.find(
          (item) =>
              item.slug ===
              nodeSlug
      );

  if (!node) {
    return null;
  }

  return {
    root,
    child,
    node,
  };
}

// ---------------------------------------------------------------------------
// First node helpers
// ---------------------------------------------------------------------------

function getRootFirstNode(root) {
  const children =
      root[
          navigationConfig.children
          ] ?? [];

  const firstChild =
      children[0];

  if (!firstChild) {
    return null;
  }

  const nodes =
      firstChild[
          navigationConfig.node
          ] ?? [];

  return nodes[0] ?? null;
}

function getChildFirstNode(child) {
  const nodes =
      child[
          navigationConfig.node
          ] ?? [];

  return nodes[0] ?? null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocBreadcrumbs() {
  const location =
      useLocation();

  const data =
      findBreadcrumbData(
          location.pathname
      );

  if (!data) {
    return null;
  }

  const {
    root,
    child,
    node,
  } = data;

  const rootFirstNode =
      getRootFirstNode(root);

  const childFirstNode =
      getChildFirstNode(child);

  return (
      <nav
          className={
            styles.breadcrumbs
          }
          aria-label="Breadcrumb"
      >

        {/* =============================================================
                ROOT
            ============================================================= */}

        {rootFirstNode ? (
            <Link
                to={
                  rootFirstNode.path
                }
                className={
                  styles.breadcrumbLink
                }
            >
              {root.name}
            </Link>
        ) : (
            <span
                className={
                  styles.currentBreadcrumb
                }
            >
                    {root.name}
                </span>
        )}

        <span
            className={
              styles.separator
            }
            aria-hidden="true"
        >
                ›
            </span>

        {/* =============================================================
                CHILD
            ============================================================= */}

        {childFirstNode ? (
            <Link
                to={
                  childFirstNode.path
                }
                className={
                  styles.breadcrumbLink
                }
            >
              {child.name}
            </Link>
        ) : (
            <span
                className={
                  styles.currentBreadcrumb
                }
            >
                    {child.name}
                </span>
        )}

        <span
            className={
              styles.separator
            }
            aria-hidden="true"
        >
                ›
            </span>

        {/* =============================================================
                NODE
            ============================================================= */}

        <span
            className={
              styles.currentBreadcrumb
            }
            aria-current="page"
        >
                {node.title}
            </span>

      </nav>
  );
}