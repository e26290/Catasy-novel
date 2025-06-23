---
title: Catsay 新詩選集
novelTitle: 《Catsay 新詩選集》free-verse
novelId: free-verse
description: 收列新詩選集
author: 卡塔西
genre:
  - 新詩
  - 心情抒發
tags:
  - 同人
status: 連載中
coverImage: /images/a.jpg
createdAt: "2025-06-23T02:42:02.756Z"
lastUpdated: "2025-06-23T03:11:11.451Z"
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
  li {
    list-style-type: square;
  }
</style>
