<template>
    <DefaultTheme.Layout>
        <ClientOnly>
            <template #aside-top>
                <Analytics />
                <p>Analytics Test</p>
            </template>
        </ClientOnly>
    </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from "vitepress/theme";
import { Analytics } from "@vercel/analytics/react";
import { ClientOnly } from "vitepress";
import { onMounted } from "vue"; // 確保 onMounted 被正確導入

onMounted(() => {
    console.log("Layout.vue is mounted!"); // 測試訊息
});
</script>