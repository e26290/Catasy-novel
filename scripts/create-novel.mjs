// scripts/create-novel.mjs

import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_PATH = path.join(__dirname, "..", "docs");
const NOVELS_BASE_PATH = path.join(DOCS_PATH, "novels");
const PUBLIC_IMAGES_PATH = path.join(DOCS_PATH, "public", "images");

// 從 update-novel-status.mjs 引入中文狀態，或在這裡重新定義
const STATUS_PLANNING = '尚在挖坑'; // 預設初始狀態
// const STATUS_SERIALIZING = '連載中';
// const STATUS_COMPLETED = '已完結';

async function askNovelDetails() {
    const questions = [
        {
            type: "input",
            name: "novelId",
            message: "請輸入小說的英文 ID (例如: still-you, 將作為目錄名稱):",
            // ... (validate 邏輯保持不變) ...
            validate: function (value) {
                if (value.length && /^[a-z0-9-]+$/.test(value)) {
                    const novelDir = path.join(NOVELS_BASE_PATH, value);
                    if (fs.existsSync(novelDir)) {
                        return "這個小說 ID (目錄) 已經存在，請輸入一個新的 ID。";
                    }
                    return true;
                }
                return "請輸入有效的小說 ID (小寫字母、數字、連字號)。";
            },
        },
        {
            type: "input",
            name: "rawTitle", // 改名為 rawTitle，以便區分
            message: "請輸入小說的原始標題 (例如: 此生不識君，亦為君沉淪):",
            validate: function (value) {
                return value.length ? true : "標題不能為空。";
            },
        },
        {
            type: "input",
            name: "englishOrSubtitle", // 新增提問，用於 novelTitle
            message: "請輸入小說的英文名或副標題 (可選，例如: Still-you):",
            default: "",
        },
        {
            type: "input",
            name: "description",
            message: "請輸入小說的簡介:",
        },
        {
            type: "input",
            name: "author",
            message: "請輸入作者筆名:",
            default: "卡塔西", // 根據你的範例修改預設值
        },
        {
            type: "input",
            name: "genre",
            message: "請輸入小說類型 (多個用逗號分隔, 例如: 奇幻,冒險,戀愛):",
            default: "奇幻,冒險",
        },
        {
            type: "input",
            name: "tags",
            message: "請輸入小說標籤 (多個用逗號分隔, 例如: 同人,天官賜福):",
            default: "同人",
        },
        {
            type: "input",
            name: "coverImage",
            message: "請輸入封面圖片的路徑 (相對於 public/images/, 例如: a.jpg 或 covers/b.png):",
            default: "/images/default-cover.jpg", // 提供一個預設封面路徑
            filter: function (value) {
                if (value && !value.startsWith('/images/')) {
                    return `/images/${value.replace(/^images\//i, '')}`;
                }
                return value;
            },
            // ... (validate 圖片是否存在邏輯保持不變) ...
            validate: async function (value, answers) {
                if (!value) return true;
                const imagePath = path.join(PUBLIC_IMAGES_PATH, value.replace(/^\/images\//, ""));
                try {
                    await fs.access(imagePath);
                    return true;
                } catch (error) {
                    console.warn(`\n   ⚠️  警告：封面圖片 ${imagePath} 目前不存在或無法讀取。請確保之後將圖片放置到正確位置。`);
                    return true;
                }
            },
        },
        {
            type: 'list', // 讓使用者選擇初始狀態
            name: 'initialStatus',
            message: '請選擇小說的初始狀態:',
            choices: [STATUS_PLANNING, '連載中', '已完結'], // 使用中文狀態
            default: STATUS_PLANNING,
        },
        {
            type: 'confirm',
            name: 'aside',
            message: '是否在該小說簡介頁顯示右側錨點導覽 (On this page)？',
            default: true, // 根據你的範例，預設為 true
        }
    ];
    return inquirer.prompt(questions);
}

async function createNovel() {
    console.log("🚀 歡迎使用小說創建工具！");

    try {
        const answers = await askNovelDetails();

        // 組合 novelTitle
        let novelTitleDisplay = `《${answers.rawTitle}》`;
        if (answers.englishOrSubtitle) {
            novelTitleDisplay += answers.englishOrSubtitle;
        }

        const novelFolderPath = path.join(NOVELS_BASE_PATH, answers.novelId);
        const novelIndexPath = path.join(novelFolderPath, "index.md");

        await fs.ensureDir(novelFolderPath);
        console.log(`✅ 成功創建小說目錄: ${novelFolderPath}`);

        const frontmatter = {
            title: answers.rawTitle, // 頁面標籤的 title 直接用原始標題
            novelTitle: novelTitleDisplay, // 用於頁面 H1 顯示的完整小說標題
            novelId: answers.novelId,
            description: answers.description,
            author: answers.author,
            genre: answers.genre ? answers.genre.split(',').map(g => g.trim()).filter(g => g) : [],
            tags: answers.tags ? answers.tags.split(',').map(t => t.trim()).filter(t => t) : [],
            status: answers.initialStatus, // 使用者選擇的中文初始狀態
            coverImage: answers.coverImage || "",
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            chapters: [],
            aside: answers.aside, // 使用者選擇的 aside 設定
        };

        // 根據你的新格式調整 Markdown 內容
        const markdownContent = `
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
`;

        const fileContent = `---
${yaml.dump(frontmatter)}---
${markdownContent}
`;

        await fs.writeFile(novelIndexPath, fileContent);
        console.log(`✅ 成功創建小說簡介頁: ${novelIndexPath}，請檢查內容是否符合新格式。`);
        console.log("🎉 小說創建完成！");

    } catch (error) {
        if (error.isTtyError) {
            console.error("❌ 錯誤：Inquirer 無法在當前的環境中執行。");
        } else {
            console.error("❌ 創建小說過程中發生錯誤:", error);
        }
    }
}

const currentScriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentScriptPath) {
    createNovel();
}

export const run = createNovel;