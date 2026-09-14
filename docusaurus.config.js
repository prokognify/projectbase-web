import {themes as prismThemes} from 'prism-react-renderer';

const config = {
  title: 'ProjectBase',
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