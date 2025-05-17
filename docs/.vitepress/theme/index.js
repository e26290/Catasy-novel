// docs/.vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme';
import './custom.css';
import './custom-scripts.js';
import { onMounted } from 'vue'; // 確保 onMounted 被正確導入

const GA_MEASUREMENT_ID = 'G-961CE7DB24'; // 替換成你的 GA4 Measurement ID

export default {
    ...DefaultTheme,
    setup() {
        if (typeof window !== 'undefined') {
            onMounted(() => {
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', GA_MEASUREMENT_ID);

                // 創建並附加 script 標籤
                const script = document.createElement('script');
                script.async = true;
                script.src = "https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}";
                document.head.appendChild(script);

                console.log('Google Analytics 4 is initialized.');
            });
        }
    },
};
