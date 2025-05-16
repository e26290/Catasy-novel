// docs/.vitepress/config.mjs
export default {
  title: "Fiction.exe｜小說閱讀",
  description: "Run error. Begin dream. 啟動錯誤，進入虛構。剩下的，就交給夢。",
  titleTemplate: 'Fiction.exe | :title', // 頁籤標題模板

  // 主題配置
  themeConfig: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
      alt: 'Fiction.exe Logo'
    },
    siteTitle: false,
    nav: [{ text: "所有小說", link: "/" }],
    footer: {
      message: '所有內容皆屬虛構。如有雷同，建議重新開機。',
      copyright: '© 2025 Fiction.exe',
    }
  },
};
