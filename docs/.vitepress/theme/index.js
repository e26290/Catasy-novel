// docs/.vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import { useData } from 'vitepress';
import './custom.css';
import './custom-scripts.js';
import R18Warning from './components/R18Warning.vue';
import { onMounted } from 'vue';

const GA_MEASUREMENT_ID = 'G-961CE7DB24';

export default {
    ...DefaultTheme,
    Layout: () => {
        return h(DefaultTheme.Layout, null, {
            // 'doc-before' 是 VitePress 預設主題的一個「插槽」(slot)
            // 它的位置就在每篇文章 Markdown 內容的上方
            'doc-before': () => {
                const { frontmatter } = useData();
                // 檢查當前頁面的 frontmatter 是否有 r18: true
                // 如果有，就渲染 R18Warning 元件，否則什麼都不做
                return frontmatter.value.r18 ? h(R18Warning) : null;
            },
        });
    },
    setup() {
        if (typeof window !== 'undefined') {
            const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
            
            if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', GA_MEASUREMENT_ID);

                const script = document.createElement('script');
                script.async = true;
                script.src = scriptSrc;
                document.head.appendChild(script);

                console.log('Google Analytics 4 is initialized.');
            }
        }
    },
};
