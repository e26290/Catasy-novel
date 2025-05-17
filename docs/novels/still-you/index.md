---
title: 此生不識君，亦為君沉淪
novelTitle: 《此生不識君，亦為君沉淪》Still-you
novelId: still-you
description: 醒來那天，謝憐發現自己成了鄉野村民，還有一個可愛的弟弟叫花城。問題是——他記不得這人生，但心卻早已動搖。這場夢，怎麼越走越真？
author: 卡塔西
genre:
  - 耽美
  - 奇幻
  - 骨科
  - 戀愛
  - 架空
  - 同人
tags:
  - 天官賜福
  - 暗戀成真
  - 肉菜均衡
  - 花謝
  - 夢境世界
status: 連載中
coverImage: /images/still-you.jpg
createdAt: "2025-05-14T09:22:02.654Z"
lastUpdated: "2025-05-15T05:44:01.780Z"
chapters:
  - title: 第一章：夢始之前
    link: /novels/still-you/Ch-1
  - title: 第二章：夢起・鄉村冬雪
    link: /novels/still-you/Ch-2
aside: true
---

<script setup>
import { useData, withBase } from 'vitepress'
const { frontmatter } = useData()
</script>

<div class="page-layout novel-intro-page">
<div class="cover-box">
<img :src="withBase(frontmatter.coverImage)" alt="此生不識君，亦為君沉淪 Still You 封面" class="novel-cover">
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
