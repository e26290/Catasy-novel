// scripts/create-novel.js

import inquirer from "inquirer"; // ESM 方式
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url"; // 需要這個來模擬 __dirname

// ESM 中沒有 __dirname，需要這樣模擬
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// VitePress 的 docs 資料夾路徑
const DOCS_PATH = path.join(__dirname, "..", "docs"); // 從 scripts 目錄回到上一層再進入 docs
const NOVELS_BASE_PATH = path.join(DOCS_PATH, "novels");
const PUBLIC_IMAGES_PATH = path.join(DOCS_PATH, "public", "images"); // 假設封面圖片放在 public/images

// 提問函式
async function askNovelDetails() {
    const questions = [
        {
            type: "input",
            name: "novelId",
            message: "請輸入小說的英文 ID (例如: my-awesome-novel, 將作為目錄名稱):",
            validate: function (value) {
                if (value.length && /^[a-z0-9-]+$/.test(value)) {
                    // 簡單驗證 ID 格式
                    // 檢查目錄是否已存在
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
            name: "title",
            message: "請輸入小說的完整標題:",
            validate: function (value) {
                return value.length ? true : "標題不能為空。";
            },
        },
        {
            type: "input",
            name: "description",
            message: "請輸入小說的簡介 (用於 SEO 和元描述):",
        },
        {
            type: "input",
            name: "author",
            message: "請輸入作者筆名:",
            default: "我的筆名", // 可以設置一個預設值
        },
        {
            type: "input",
            name: "genre",
            message: "請輸入小說類型 (多個類型用逗號分隔, 例如: 奇幻, 冒險):",
            default: "未分類",
        },
        {
            type: "input",
            name: "tags",
            message: "請輸入小說標籤 (多個標籤用逗號分隔, 例如: 原創, 穿越):",
            default: "",
        },
        {
            type: "input",
            name: "coverImage",
            message:
                "請輸入封面圖片的路徑 (相對於 public/images/ 資料夾, 例如: covers/my-novel-cover.jpg):",
            default: "",
            filter: function (value) {
                if (value && !value.startsWith('/images/')) {
                    return `/images/${value.replace(/^images\//i, '')}`;
                }
                return value;
            },
            validate: async function (value, answers) {
                if (!value) {
                    // 允許不提供封面圖片
                    return true;
                }
                const imagePath = path.join(
                    PUBLIC_IMAGES_PATH,
                    value.replace(/^\/images\//, "")
                );
                try {
                    await fs.access(imagePath); // 檢查檔案是否存在且可讀
                    return true;
                } catch (error) {
                    // 提示使用者圖片不存在，但允許繼續 (因為圖片可能後續才放)
                    console.warn(
                        `\n   ⚠️  警告：封面圖片 ${imagePath} 目前不存在或無法讀取。請確保之後將圖片放置到正確位置。`
                    );
                    return true; // 或者 return '錯誤訊息' 來強制要求圖片存在
                }
            },
        },
    ];
    return inquirer.prompt(questions);
}

// 主執行函式
async function createNovel() {
    console.log("🚀 歡迎使用小說創建工具！");

    try {
        const answers = await askNovelDetails();

        const novelFolderPath = path.join(NOVELS_BASE_PATH, answers.novelId);
        const novelIndexPath = path.join(novelFolderPath, "index.md");

        // 1. 創建小說目錄
        await fs.ensureDir(novelFolderPath);
        console.log(`✅ 成功創建小說目錄: ${novelFolderPath}`);

        // 2. 準備 frontmatter 內容
        const frontmatter = {
            title: `${answers.title} - 作品簡介`, // VitePress 頁面標題通常會這樣
            novelTitle: answers.title, // 保留原始小說標題
            novelId: answers.novelId,
            description: answers.description,
            author: answers.author,
            genre: answers.genre ? answers.genre.split(',').map(g => g.trim()).filter(g => g) : [],
            tags: answers.tags ? answers.tags.split(',').map(t => t.trim()).filter(t => t) : [],
            status: "尚在挖坑", // 預設狀態
            coverImage: answers.coverImage || "", // 如果為空則設為空字串
            createdAt: new Date().toISOString(), // 創建日期
            lastUpdated: new Date().toISOString(), // 最後更新日期 (初始時與創建日期相同)
            chapters: [], // 初始時沒有章節
            aside: true, // 根據之前的需求，小說簡介頁預設不顯示右側錨點
            // 你可以在這裡加入更多預設的 frontmatter 欄位
        };

        // 3. 準備 Markdown 內容
        const markdownContent = `
# {{ frontmatter.novelTitle }}

<script setup>
import { useData, withBase } from 'vitepress'
const { frontmatter } = useData()
</script>

${frontmatter.coverImage
                ? `<img :src="withBase(frontmatter.coverImage)" alt="${frontmatter.novelTitle} 封面" class="novel-cover" style="max-width: 300px; margin-bottom: 20px;">\n`
                : ""
            }
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
`;

        const fileContent = `---
${yaml.dump(frontmatter)}---  
${markdownContent}
`;

        // 4. 寫入 index.md 檔案
        await fs.writeFile(novelIndexPath, fileContent);
        console.log(`✅ 成功創建小說簡介頁: ${novelIndexPath}`);
        console.log("🎉 小說創建完成！");
        console.log(
            `   下一步建議：可以開始為 "${answers.title}" 創建第一個章節了。`
        );
    } catch (error) {
        if (error.isTtyError) {
            console.error(
                "❌ 錯誤：Inquirer 無法在當前的環境中執行 (例如，當透過管道執行時)。"
            );
        } else {
            console.error("❌ 創建小說過程中發生錯誤:", error);
        }
    }
}

// 判斷此腳本是否為被直接執行的主模組
const currentScriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] === currentScriptPath) {
    createNovel();
}

// 匯出函式，以便將來被 CLI 主工具調用
export const run = createNovel;
