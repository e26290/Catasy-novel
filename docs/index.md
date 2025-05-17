---
title: 所有小說
layout: home
---

<script setup>
import { data as novels } from './novels.data.mjs'; 
import { withBase } from 'vitepress';
</script>

<h4 class="page-title">Fiction.exe ｜故事清單</h4>

<br>
Run error. Begin dream.<br>
啟動錯誤，進入虛構。剩下的，就交給夢。

<div v-if="novels && novels.length > 0" class="novel-list">
  <div v-for="novel in novels" :key="novel.id" class="novel-item">
    <a :href="withBase(novel.link)">
      <img v-if="novel.coverImage" :src="withBase(novel.coverImage)" :alt="novel.title + ' 封面'" class="novel-list-cover">
      <div class="card-body">
        <h3 class="card-title">{{ novel.title }}</h3>
        <!-- <p class="novel-list-author">作者：{{ novel.author }}</p> -->
        <span class="novel-list-status">{{ novel.status }}</span>
        <p class="novel-list-description">{{ novel.description }}</p>
        <a :href="withBase(novel.link)" class="read-more">開始閱讀</a>
      </div>
    </a>
  </div>
</div>
<p v-else>目前還沒有任何小說。</p>

<style scoped>

h1, h2, h3, h4, h5, h6, p {
  margin-top: 0;
  padding: 0;
  border: none;
}
ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

a {
    text-decoration: none;
    color: inherit;
}

.page-title {
  margin-top: 2rem;
}
.novel-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* 響應式網格佈局 */
  gap: 20px;
  margin-top: 30px;
}
.novel-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background-color: #fff;
}
.novel-item .card-body {
  padding: 1rem;
}
.novel-list-cover {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
}
.novel-list-author, .novel-list-status {
  color: var(--vp-c-text-2);
  margin: 2px 0;
}
.novel-list-status {
  position: absolute;
  top: 0.75rem;
  left: 0;
  background-color: #161210;
  color: #ffffff;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0 0.5rem 0.5rem 0;
}

.novel-list-description {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  flex-grow: 1;
  margin: 1rem 0;
  min-height: 64px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
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
  background-color: var(--vp-c-brand-3);
  color: white;
}
</style>
