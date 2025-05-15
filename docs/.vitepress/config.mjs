// docs/.vitepress/config.mjs
export default {
    title: "Fiction.exe｜小說閱讀",
    description: "Run error. Begin dream. 啟動錯誤，進入虛構。剩下的，就交給夢。",

    // 主題配置
    themeConfig: {
        logo: {
          light: '/logo-light.svg', // 淺色模式下的 Logo
          dark: '/logo-dark.svg',   // 深色模式下的 Logo
          alt: 'Fiction.exe Logo'   // (可選) Logo 的 alt 文字
        },
        siteTitle: false,
        nav: [{ text: "所有小說", link: "/" }],
    },
};
