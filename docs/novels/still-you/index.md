---
title: 此生不識君，亦為君沉淪 Still You - 作品簡介
novelTitle: 此生不識君，亦為君沉淪 Still You
novelId: still-you
description: 醒來那天，謝憐發現自己成了鄉下藥農，還多了一個叫花城的弟弟。問題是——他記不得這人生，但心卻早已動搖。這場夢，怎麼越走越真？
author: 卡塔西
genre:
  - 奇幻
  - 冒險
  - 戀愛
  - 骨科
tags:
  - 同人
  - 天官賜福
  - 耽美
status: 尚在挖坑
coverImage: /images/a.jpg
createdAt: '2025-05-14T09:22:02.654Z'
lastUpdated: '2025-05-14T09:32:59.129Z'
chapters:
  - title: 第一章：夢始之前
    link: /novels/still-you/Ch-1
aside: true
---

# {{ frontmatter.novelTitle }}

<script setup>
import { useData, withBase } from 'vitepress'
const { frontmatter } = useData()
</script>

<img :src="withBase(frontmatter.coverImage)" alt="此生不識君，亦為君沉淪 Still You 封面" class="novel-cover" style="max-width: 300px; margin-bottom: 20px;">

<p class="novel-meta">
    作者：{{ frontmatter.author }} | 狀態：{{ frontmatter.status }} | 類型：{{ frontmatter.genre.join(', ') }}
    <span v-if="frontmatter.tags && frontmatter.tags.length">| 標籤：{{ frontmatter.tags.join(', ') }}</span>
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

<style scoped>
.novel-cover {
    display: block;
    margin-left: auto;
    margin-right: auto;
}
.novel-meta {
    text-align: center;
    font-size: 0.9em;
    color: #666;
    margin-bottom: 30px;
}
</style>
