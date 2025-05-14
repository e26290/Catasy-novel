---
title: 所有小說
layout: home
---

<script setup>
import { data as novels } from './novels.data.mjs'; 
import { withBase } from 'vitepress';
</script>

# 所有小說

歡迎來到我的小說世界！

<div v-if="novels && novels.length > 0" class="novel-list">
  <div v-for="novel in novels" :key="novel.id" class="novel-item">
    <a :href="withBase(novel.link)">
      <img v-if="novel.coverImage" :src="withBase(novel.coverImage)" :alt="novel.title + ' 封面'" class="novel-list-cover">
      <h2>{{ novel.title }}</h2>
    </a>
    <p class="novel-list-author">作者：{{ novel.author }}</p>
    <p class="novel-list-status">狀態：{{ novel.status }}</p>
    <p class="novel-list-description">{{ novel.description }}</p>
    <a :href="withBase(novel.link)" class="read-more">點此閱讀 &raquo;</a>
  </div>
</div>
<p v-else>目前還沒有任何小說。</p>

<style scoped>
.novel-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* 響應式網格佈局 */
  gap: 20px;
  margin-top: 30px;
}
.novel-item {
  border: 1px solid var(--vp-c-divider);
  padding: 20px;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  display: flex;
  flex-direction: column;
}
.novel-item h2 {
  margin-top: 0;
  font-size: 1.5em;
  border-bottom: none;
}
.novel-list-cover {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 15px;
}
.novel-list-author, .novel-list-status {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  margin: 2px 0;
}
.novel-list-description {
  font-size: 0.95em;
  color: var(--vp-c-text-1);
  flex-grow: 1;
  margin-bottom: 15px;
}
.read-more {
  display: inline-block;
  padding: 8px 15px;
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg-soft);
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s;
  align-self: flex-start;
}
.read-more:hover {
  background-color: var(--vp-c-brand-2);
}
</style>
