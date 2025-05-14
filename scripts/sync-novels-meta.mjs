// scripts/sync-novels-meta.mjs
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer'; // 用於執行前的確認

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_PATH = path.join(__dirname, '..', 'docs');
const NOVELS_BASE_PATH = path.join(DOCS_PATH, 'novels');


const FM_STATUS_PUBLISHED = 'published';
const DISPLAY_STATUS_PUBLISHED = '已發布';

// 輔助函式：讀取小說目錄下的所有章節檔案及其 frontmatter
// (與 manage-chapters.mjs 中的 getChapters 類似，但可能需要調整以獲取更多排序所需資訊)
async function getNovelChapters(novelFolderPath) {
    const chapters = [];
    try {
        const files = await fs.readdir(novelFolderPath);
        for (const file of files) {
            if (file.startsWith('Ch-') && file.endsWith('.md')) {
                const chapterPath = path.join(novelFolderPath, file);
                try {
                    const content = await fs.readFile(chapterPath, 'utf-8');
                    const frontmatterMatch = content.match(/---([\s\S]*?)---/);
                    if (frontmatterMatch && frontmatterMatch[1]) {
                        const fm = yaml.load(frontmatterMatch[1]);
                        // 為了排序和 lastUpdated，我們需要 id, title, status, publishDate
                        chapters.push({
                            id: fm.id || file.replace('.md', ''),
                            title: fm.title || file.replace('.md', ''),
                            status: fm.status,
                            publishDate: fm.publishDate ? new Date(fm.publishDate) : null, // 轉換為 Date 物件方便比較
                            filePath: chapterPath, // 可能用於獲取檔案修改時間作為備選
                            frontmatter: fm, // 保存原始 frontmatter
                        });
                    }
                } catch (readError) {
                    console.warn(`⚠️ 無法讀取章節檔案 ${chapterPath} 的 frontmatter:`, readError.message);
                }
            }
        }
    } catch (dirError) {
        console.error(`❌ 讀取小說目錄 ${novelFolderPath} 時發生錯誤:`, dirError);
    }
    return chapters;
}

// 主執行函式
async function syncNovelsMeta() {
    console.log('🛠️  開始批量更新和維護小說元數據...');

    const { confirmExecution } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmExecution',
            message: '此操作將掃描所有小說，並根據已發布的章節更新其 index.md 中的章節列表和最後更新日期。是否繼續？',
            default: false,
        }
    ]);

    if (!confirmExecution) {
        console.log('操作已取消。');
        return;
    }

    let novelsProcessed = 0;
    let novelsUpdated = 0;

    try {
        if (!await fs.pathExists(NOVELS_BASE_PATH)) {
            console.error(`❌ 小說根目錄 ${NOVELS_BASE_PATH} 不存在。無法繼續。`);
            return;
        }

        const novelDirs = await fs.readdir(NOVELS_BASE_PATH, { withFileTypes: true });

        for (const dirent of novelDirs) {
            if (dirent.isDirectory()) {
                const novelId = dirent.name;
                const novelFolderPath = path.join(NOVELS_BASE_PATH, novelId);
                const novelIndexPath = path.join(novelFolderPath, 'index.md');

                novelsProcessed++;
                console.log(`\n🔎 正在處理小說: ${novelId}`);

                if (!await fs.pathExists(novelIndexPath)) {
                    console.warn(`   ⚠️ 小說 "${novelId}" 的 index.md 檔案不存在，跳過處理。`);
                    continue;
                }

                const allChaptersFromFileSystem = await getNovelChapters(novelFolderPath);
                const publishedChapters = allChaptersFromFileSystem
                    .filter(ch => ch.status === FM_STATUS_PUBLISHED)
                    .sort((a, b) => { // 按章節 ID (數字部分) 排序
                        const numA = parseInt(a.id.replace('Ch-', ''), 10);
                        const numB = parseInt(b.id.replace('Ch-', ''), 10);
                        return numA - numB;
                    });

                if (publishedChapters.length === 0) {
                    console.log(`   ℹ️ 小說 "${novelId}" 沒有已發布的章節。`);
                    // 即使沒有已發布章節，也可能需要更新 lastUpdated (例如基於小說 index.md 的修改時間)
                    // 或者將 chapters 列表清空
                }

                // 生成新的 chapters 列表供 frontmatter 使用
                const newFmChaptersList = publishedChapters.map(ch => ({
                    title: ch.title,
                    link: `/novels/${novelId}/${ch.id}`,
                }));

                // 決定新的 lastUpdated 日期
                let newLastUpdated = null;
                if (publishedChapters.length > 0) {
                    // 以最新發布章節的 publishDate 為準
                    const publishDates = publishedChapters
                        .map(ch => ch.publishDate)
                        .filter(date => date instanceof Date && !isNaN(date)); // 過濾掉無效日期
                    if (publishDates.length > 0) {
                        newLastUpdated = new Date(Math.max(...publishDates));
                    }
                }
                // 如果沒有已發布章節或 publishDate 無效，可以考慮使用小說 index.md 的修改時間
                // 或者保持現有的 lastUpdated (如果不想自動變更的話)
                // 為了簡單起見，如果沒有有效的 publishDate，我們暫時不主動修改 lastUpdated，除非 chapters 列表有變
                // 或者，我們總是設定一個當前時間，如果發生了變更
                const currentNovelIndexContent = await fs.readFile(novelIndexPath, 'utf-8');
                const currentFmMatch = currentNovelIndexContent.match(/---([\s\S]*?)---/);

                if (!currentFmMatch || !currentFmMatch[1]) {
                    console.warn(`   ⚠️ 無法讀取小說 "${novelId}" index.md 的 frontmatter，跳過更新。`);
                    continue;
                }

                const currentFm = yaml.load(currentFmMatch[1]);
                let needsUpdate = false;
                let updateReason = ""; // 追蹤更新原因

                // 比較 chapters 列表是否有變化
                const currentChaptersStr = JSON.stringify(currentFm.chapters || []);
                const newChaptersStr = JSON.stringify(newFmChaptersList);

                if (currentChaptersStr !== newChaptersStr) {
                    console.log(`   🔄 章節列表有變更，將從 ${currentChaptersStr} 更新為 ${newChaptersStr}。`);
                    currentFm.chapters = newFmChaptersList;
                    needsUpdate = true;
                    updateReason = "章節列表校準";
                } else {
                    console.log(`   ✅ 章節列表與現有 frontmatter 一致 (${newChaptersStr})。`);
                }

                // 決定新的 lastUpdated 日期
                let newCalculatedLastUpdated = null; // 用一個新變數名，避免與 currentFm.lastUpdated 混淆
                if (publishedChapters.length > 0) {
                    const publishDates = publishedChapters
                        .map(ch => ch.publishDate)
                        .filter(date => date instanceof Date && !isNaN(date));
                    if (publishDates.length > 0) {
                        newCalculatedLastUpdated = new Date(Math.max(...publishDates));
                    }
                }

                const currentLastUpdatedDate = currentFm.lastUpdated ? new Date(currentFm.lastUpdated) : null;

                if (newCalculatedLastUpdated) { // 如果有基於已發布章節的 newCalculatedLastUpdated
                    if (!currentLastUpdatedDate || newCalculatedLastUpdated > currentLastUpdatedDate) {
                        console.log(`   🔄 最後更新日期將從 ${currentLastUpdatedDate ? currentLastUpdatedDate.toISOString() : '未設定'} 更新為 ${newCalculatedLastUpdated.toISOString()} (基於最新發布章節)。`);
                        currentFm.lastUpdated = newCalculatedLastUpdated.toISOString();
                        needsUpdate = true; // 即使 chapters 列表沒變，lastUpdated 也可能更新
                        if (!updateReason) updateReason = "最新發布日期"; else updateReason += ", 最新發布日期";
                    }
                } else if (needsUpdate) { // 如果 chapters 列表發生了變化，但沒有已發布章節來確定 newCalculatedLastUpdated
                    console.log(`   🔄 ${updateReason}，且無已發布章節日期，將最後更新日期設為當前校準時間。`);
                    currentFm.lastUpdated = new Date().toISOString();
                    // needsUpdate 已經是 true 了
                }


                if (needsUpdate) {
                    // ... 寫回檔案 ...
                    console.log(`   ✅ 小說 "${novelId}" 的 index.md 元數據已更新。原因: ${updateReason || '未明確原因 (可能僅 lastUpdated 被認為需要更新)'}`);
                    novelsUpdated++;
                } else {
                    console.log(`   ℹ️ 小說 "${novelId}" 的元數據無需更新。`);
                }


                if (needsUpdate) {
                    const newFileContent = currentNovelIndexContent.replace(
                        /---([\s\S]*?)---/,
                        `---
${yaml.dump(currentFm)}---`
                    );
                    await fs.writeFile(novelIndexPath, newFileContent);
                    console.log(`   ✅ 小說 "${novelId}" 的 index.md 元數據已更新。`);
                    novelsUpdated++;
                } else {
                    console.log(`   ℹ️ 小說 "${novelId}" 的元數據無需更新。`);
                }
            }
        }

        console.log(`\n🎉 批量更新完成！`);
        console.log(`   總共處理小說數量: ${novelsProcessed}`);
        console.log(`   實際更新元數據的小說數量: ${novelsUpdated}`);

    } catch (error) {
        console.error('❌ 批量更新過程中發生錯誤:', error);
    }
}

// 判斷此腳本是否為被直接執行的主模組
const currentScriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentScriptPath) {
    syncNovelsMeta();
}

export const run = syncNovelsMeta;