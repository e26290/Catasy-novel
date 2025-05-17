<template>
    <DefaultTheme.Layout>
        <template #aside-top>
            <ClientOnly>
                <Analytics />
            </ClientOnly>
        </template>
    </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from "vitepress/theme";
import { Analytics } from "@vercel/analytics/react";
import { ClientOnly } from "vitepress";

onMounted(() => {  // 在元件掛載後執行
  console.log('Layout.vue is mounted!'); // 加入這個測試訊息
});
</script>