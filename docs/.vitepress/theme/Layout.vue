<template>
    <DefaultTheme.Layout>
        <template #aside-top>
            <p>Layout Test</p>
        </template>
    </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from "vitepress/theme";
import { onMounted } from "vue";

onMounted(() => {
    console.log("Layout.vue is mounted!");
});
</script>