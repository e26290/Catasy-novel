---
title: 落在肩上的光
novelTitle: 《落在肩上的光》Where the light fell
novelId: where-the-light-fell
description: 不老勇者Ｘ新進冒險家，如果世界陷入危機，你願意再挺身而出嗎？（暫定簡介）
author: 卡塔西
genre:
  - 奇幻
  - 冒險
tags:
  - 耽美
status: 尚在挖坑
coverImage: /images/b.jpg
createdAt: "2025-07-04T06:18:03.893Z"
lastUpdated: "2025-07-04T06:18:03.901Z"
chapters: []
aside: true
---

<script setup>
import { useData, withBase } from 'vitepress'
const { frontmatter } = useData()
</script>

<div class="page-layout novel-intro-page">
<div class="cover-box">
<img v-if="frontmatter.coverImage" :src="withBase(frontmatter.coverImage)" :alt="frontmatter.novelTitle + ' 封面'" class="novel-cover">
</div>

# {{ frontmatter.novelTitle }}

<p class="novel-meta">
    作者：{{ frontmatter.author }}
    <span>狀態：{{ frontmatter.status }}</span>
    <span>類型：{{ frontmatter.genre.join(', ') }}</span>
    <span v-if="frontmatter.tags && frontmatter.tags.length">標籤：{{ frontmatter.tags.join(', ') }}</span>
</p>

## 故事簡介

{{ frontmatter.description || "這本小說還沒有簡介..." }}

## 章節列表

  <p v-if="!frontmatter.chapters || frontmatter.chapters.length === 0">目前還沒有發布任何章節。</p>
  <ul v-else>
      <li v-for="chapter in frontmatter.chapters" :key="chapter.link">
          <a :href="withBase(chapter.link)">{{ chapter.title }}</a>
      </li>
  </ul>
</div>

<style scoped>
/* 你可以在 docs/.vitepress/theme/custom.css 中定義 .page-layout, .novel-intro-page, .cover-box, .novel-cover, .novel-meta 的通用樣式 */
/* 如果這裡的 scoped style 是空的，可以移除它 */
</style>
