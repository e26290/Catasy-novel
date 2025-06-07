// scripts/create-chapter.mjs
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_PATH = path.join(__dirname, '..', 'docs');
const NOVELS_BASE_PATH = path.join(DOCS_PATH, 'novels');

// 輔助函式：列出所有小說供選擇
async function listNovels() {
    try {
        const novelDirs = await fs.readdir(NOVELS_BASE_PATH, { withFileTypes: true });
        const novels = [];
        for (const dirent of novelDirs) {
            if (dirent.isDirectory()) {
                const indexPath = path.join(NOVELS_BASE_PATH, dirent.name, 'index.md');
                try {
                    const content = await fs.readFile(indexPath, 'utf-8');
                    const frontmatterMatch = content.match(/---([\s\S]*?)---/);
                    if (frontmatterMatch && frontmatterMatch[1]) {
                        const fm = yaml.load(frontmatterMatch[1]);
                        novels.push({
                            name: `${fm.novelTitle || dirent.name} (ID: ${dirent.name})`,
                            value: dirent.name, // 小說目錄名稱 (ID)
                            novelTitle: fm.novelTitle || dirent.name, // 用於後續顯示
                        });
                    } else {
                        novels.push({ name: `${dirent.name} (無法讀取標題)`, value: dirent.name, novelTitle: dirent.name });
                    }
                } catch (error) {
                    // 如果 index.md 不存在或無法讀取，仍然列出目錄
                    novels.push({ name: `${dirent.name} (index.md 讀取失敗)`, value: dirent.name, novelTitle: dirent.name });
                }
            }
        }
        if (novels.length === 0) {
            console.log(' 🤔 目前還沒有任何小說。請先使用 "create-novel" 工具創建一本小說。');
            return null;
        }
        return novels;
    } catch (error) {
        console.error('❌ 讀取小說列表時發生錯誤:', error);
        return null;
    }
}

// 輔助函式：建議下一個章節 ID
async function suggestNextChapterId(novelDir) {
    try {
        const files = await fs.readdir(novelDir);
        const chapterFiles = files.filter(file => /^Ch-\d+\.md$/.test(file)); // 匹配 Ch-1.md, Ch-2.md 等
        if (chapterFiles.length === 0) {
            return 'Ch-1';
        }
        const chapterNumbers = chapterFiles.map(file => parseInt(file.match(/Ch-(\d+)\.md$/)[1], 10));
        const maxChapterNumber = Math.max(...chapterNumbers);
        return `Ch-${maxChapterNumber + 1}`;
    } catch (error) {
        console.warn('⚠️ 讀取現有章節以建議 ID 時發生錯誤，將預設為 Ch-1:', error);
        return 'Ch-1'; // 如果出錯，預設為 Ch-1
    }
}


// 主執行函式
async function createChapter() {
    console.log('📖 歡迎使用章節創建工具！');

    try {
        const novels = await listNovels();
        if (!novels || novels.length === 0) return; // 如果沒有小說，則退出

        const { selectedNovelId, novelTitle } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedNovelId',
                message: '請選擇要為哪本小說創建章節:',
                choices: novels.map(n => ({ name: n.name, value: n.value })), // inquirer choices
                filter: (val) => { // 獲取選中小說的完整標題
                    const selectedNovel = novels.find(n => n.value === val);
                    return { id: val, title: selectedNovel.novelTitle };
                }
            },
        ]);

        // 從 filter 返回的物件中提取 id 和 title
        const actualNovelId = selectedNovelId.id;
        const actualNovelTitle = selectedNovelId.title;

        const novelFolderPath = path.join(NOVELS_BASE_PATH, actualNovelId);

        const suggestedId = await suggestNextChapterId(novelFolderPath);

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'chapterId',
                message: `請輸入章節 ID (例如: Ch-1, Ch-2):`,
                default: suggestedId,
                validate: async function (value) {
                    if (!/^Ch-\d+$/.test(value)) {
                        return '章節 ID 格式應為 "Ch-" 後面跟著數字 (例如 Ch-1)。';
                    }
                    const chapterPath = path.join(novelFolderPath, `${value}.md`);
                    if (await fs.pathExists(chapterPath)) {
                        return `章節檔案 ${value}.md 已經存在於小說 "${actualNovelTitle}" 中，請輸入一個新的 ID。`;
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'chapterTitle',
                message: '請輸入章節的標題:',
                validate: function (value) {
                    return value.length ? true : '章節標題不能為空。';
                },
            },
            {
                type: 'confirm',
                name: 'isR18',
                message: '🔞 本章是否為 R18 內容？',
                default: false, // 預設為 false
            },
        ]);

        const chapterFilePath = path.join(novelFolderPath, `${answers.chapterId}.md`);

        // 準備 frontmatter
        const frontmatter = {
            title: answers.chapterTitle,
            id: answers.chapterId, // 章節的 ID，例如 Ch-1
            novelTitle: actualNovelTitle, // 所屬小說的標題，方便參考
            novelId: actualNovelId, // 所屬小說的 ID
            status: "unpublished", // 預設為未發布
            createdAt: new Date().toISOString(),
            ...(answers.isR18 && { r18: true }),
        };

        // 準備 Markdown 內容模板
        const markdownContent = `
# {{ frontmatter.title }}

<script setup>
import { useData } from 'vitepress'
const { frontmatter } = useData()
// 如果需要 withBase，可以取消註解下一行
// import { withBase } from 'vitepress'
</script>

---
(這裡是 ${actualNovelTitle} - ${answers.chapterTitle} 的正文內容...)
---
`;

        const fileContent = `---
${yaml.dump(frontmatter)}---
${markdownContent}
`;

        await fs.writeFile(chapterFilePath, fileContent);
        console.log(`✅ 成功為小說 "${actualNovelTitle}" 創建章節: ${chapterFilePath}`);

        // 更新小說 index.md 的 lastUpdated 和 chapters 列表 (可選，但推薦)
        const novelIndexPath = path.join(novelFolderPath, 'index.md');
        try {
            const novelIndexContent = await fs.readFile(novelIndexPath, 'utf-8');
            const frontmatterMatch = novelIndexContent.match(/---([\s\S]*?)---/);
            if (frontmatterMatch && frontmatterMatch[1]) {
                const novelFM = yaml.load(frontmatterMatch[1]);
                novelFM.lastUpdated = new Date().toISOString(); // 更新最後更新時間

                // 如果要在小說簡介頁維護一個所有章節的列表 (不論是否發布)
                // 這裡的 chapters 列表通常用於顯示已發布的，所以這裡是否添加未發布的章節取決於你的設計
                // 為了簡單起見，我們先不直接修改 novelFM.chapters，發布時再處理
                // novelFM.chapters = novelFM.chapters || [];
                // novelFM.chapters.push({ title: answers.chapterTitle, link: `./${answers.chapterId}` }); // 相對路徑

                const newNovelIndexFileContent = novelIndexContent.replace(
                    /---([\s\S]*?)---/,
                    `---
${yaml.dump(novelFM)}---`
                );
                await fs.writeFile(novelIndexPath, newNovelIndexFileContent);
                console.log(`✏️ 已更新小說 "${actualNovelTitle}" 的最後更新日期。`);
            }
        } catch (error) {
            console.warn(`⚠️ 更新小說 "${actualNovelTitle}" 的 index.md 時發生錯誤:`, error);
        }


        const { editNow } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'editNow',
                message: '是否立即在預設編輯器中開啟此章節檔案？',
                default: false,
            },
        ]);

        if (editNow) {
            // 嘗試使用 'open' (macOS) 或 'xdg-open' (Linux) 或 'start' (Windows) 命令開啟檔案
            const open = (await import('open')).default; // 使用 open 套件
            try {
                await open(chapterFilePath);
            } catch (error) {
                console.warn(`⚠️ 無法自動開啟檔案 ${chapterFilePath}。請手動開啟。`, error);
            }
        }

        console.log('🎉 章節創建完成！');

    } catch (error) {
        if (error.isTtyError) {
            console.error('❌ 錯誤：Inquirer 無法在當前的環境中執行。');
        } else {
            console.error('❌ 創建章節過程中發生錯誤:', error);
        }
    }
}

// 判斷此腳本是否為被直接執行的主模組
const currentScriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentScriptPath) {
    createChapter();
}

export const run = createChapter;