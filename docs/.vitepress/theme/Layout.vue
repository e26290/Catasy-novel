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

</script>