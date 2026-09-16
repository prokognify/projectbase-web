import {themes as prismThemes} from 'prism-react-renderer';

const config = {
  title: 'ProjectBase',
  tagline: 'Project will be organized',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://projectbase-web-umber.vercel.app/',
  baseUrl: '/',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // ------------------------------------------------------------
  // Markdown
  // ------------------------------------------------------------

  markdown: {
    mermaid: true,
  },

  // ------------------------------------------------------------
  // Presets
  // ------------------------------------------------------------

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/prokognify/projectbase-web',
        },

        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  // ------------------------------------------------------------
  // Themes
  // ------------------------------------------------------------

  themes: [
    '@docusaurus/theme-mermaid',

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

  // ------------------------------------------------------------
  // Theme configuration
  // ------------------------------------------------------------

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },

    navbar: {
      logo: {
        alt: 'ProjectBase',
        src: 'img/logo-light.svg',
      },

      items: [],
    },

    // ----------------------------------------------------------
    // Mermaid
    // ----------------------------------------------------------

    mermaid: {
      theme: {
        light: 'neutral',
        dark: 'dark',
      },
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;