// scripts/manage-chapters.mjs
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_PATH = path.join(__dirname, '..', 'docs');
const NOVELS_BASE_PATH = path.join(DOCS_PATH, 'novels');

// 中文狀態常量
const FM_STATUS_PUBLISHED = 'published';
const FM_STATUS_UNPUBLISHED = 'unpublished';
const DISPLAY_STATUS_PUBLISHED = '已發布';
const DISPLAY_STATUS_UNPUBLISHED = '未發布';
const STATUS_UNKNOWN = '未知狀態';

// 輔助函式：列出所有小說 (與 create-chapter.mjs 中的類似)
async function listNovels() {
    // (與 create-chapter.mjs 中的 listNovels 函式相同，可以考慮提取為共用模組)
    // 為了簡潔，這裡先複製過來，之後可以重構
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
                            value: dirent.name,
                            novelTitle: fm.novelTitle || dirent.name,
                            novelIndexFm: fm, // 儲存小說 index.md 的 frontmatter
                            novelIndexPath: indexPath, // 儲存小說 index.md 的路徑
                        });
                    } else {
                        novels.push({ name: `${dirent.name} (無法讀取標題)`, value: dirent.name, novelTitle: dirent.name, novelIndexFm: null, novelIndexPath: indexPath });
                    }
                } catch (error) {
                    novels.push({ name: `${dirent.name} (index.md 讀取失敗)`, value: dirent.name, novelTitle: dirent.name, novelIndexFm: null, novelIndexPath: indexPath });
                }
            }
        }
        if (novels.length === 0) {
            console.log(' 🤔 目前還沒有任何小說。');
            return null;
        }
        return novels;
    } catch (error) {
        console.error('❌ 讀取小說列表時發生錯誤:', error);
        return null;
    }
}

// 輔助函式：讀取小說目錄下的所有章節檔案及其 frontmatter
async function getChapters(novelFolderPath) {
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
                        chapters.push({
                            fileName: file,
                            filePath: chapterPath,
                            id: fm.id || file.replace('.md', ''),
                            title: fm.title || file.replace('.md', ''),
                            status: fm.status || 'unknown', // 如果沒有 status，則為 unknown
                            publishDate: fm.publishDate,
                            frontmatter: fm,
                            originalContent: content, // 保存原始文件内容，方便写回
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

// 輔助函式：更新 Markdown 檔案的 frontmatter
async function updateChapterFrontmatter(chapter, updates) {
    const newFrontmatter = { ...chapter.frontmatter, ...updates };
    const newContent = chapter.originalContent.replace(
        /---([\s\S]*?)---/,
        `---
${yaml.dump(newFrontmatter)}---`
    );
    await fs.writeFile(chapter.filePath, newContent);
}

// 輔助函式：更新小說 index.md 的 chapters 列表和 lastUpdated
async function updateNovelIndex(novelData, publishedChapters) {
    if (!novelData.novelIndexFm || !novelData.novelIndexPath) {
        console.warn(`⚠️ 無法更新小說 "${novelData.novelTitle}" 的索引檔案，因為缺少必要資訊。`);
        return;
    }

    const updatedNovelFm = { ...novelData.novelIndexFm };
    updatedNovelFm.lastUpdated = new Date().toISOString();
    updatedNovelFm.chapters = publishedChapters
        .sort((a, b) => { // 按章節 ID (數字部分) 排序
            const numA = parseInt(a.id.replace('Ch-', ''), 10);
            const numB = parseInt(b.id.replace('Ch-', ''), 10);
            return numA - numB;
        })
        .map(ch => ({
            title: ch.title,
            link: `./${ch.id}`, // 相對路徑，例如 ./Ch-1
        }));

    try {
        const originalIndexContent = await fs.readFile(novelData.novelIndexPath, 'utf-8');
        const newIndexContent = originalIndexContent.replace(
            /---([\s\S]*?)---/,
            `---
${yaml.dump(updatedNovelFm)}---`
        );
        await fs.writeFile(novelData.novelIndexPath, newIndexContent);
        console.log(`✅ 已更新小說 "${novelData.novelTitle}" 的索引檔案 (chapters 列表和 lastUpdated)。`);
    } catch (error) {
        console.error(`❌ 更新小說 "${novelData.novelTitle}" 索引檔案時發生錯誤:`, error);
    }
}


// 主執行函式
async function manageChapters() {
    console.log('📚 歡迎使用章節發布/撤回工具！');

    const novels = await listNovels();
    if (!novels || novels.length === 0) return;

    const { selectedNovelData } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedNovelData',
            message: '請選擇要操作的小說:',
            choices: novels.map(n => ({ name: n.name, value: n })), // 將整個 novel 物件作為 value
        },
    ]);

    const novelFolderPath = path.join(NOVELS_BASE_PATH, selectedNovelData.value); // selectedNovelData.value 是 novelId
    const allChaptersInDir = await getChapters(novelFolderPath);

    const unpublishedChapters = allChaptersInDir.filter(ch => ch.status === 'unpublished' || ch.status === 'unknown');
    const publishedChaptersList = allChaptersInDir.filter(ch => ch.status === 'published');

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: '請選擇要執行的操作:',
            choices: [
                { name: '發布章節', value: 'publish' },
                { name: '撤回章節', value: 'unpublish' },
                new inquirer.Separator(),
                { name: '返回', value: 'back' },
            ],
        },
    ]);

    if (action === 'back') {
        console.log('操作取消。');
        return;
    }

    if (action === 'publish') {
        if (unpublishedChapters.length === 0) {
            console.log('🟢 這本小說目前沒有未發布的章節。');
            return;
        }
        const { chaptersToPublish } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'chaptersToPublish',
                message: '請選擇要發布的章節 (可多選):',
                choices: unpublishedChapters.map(ch => ({
                    name: `${ch.title} (ID: ${ch.id}, 狀態: ${ch.status})`,
                    value: ch,
                })),
                validate: (answer) => answer.length > 0 ? true : '至少選擇一個章節。'
            },
        ]);

        for (const chapter of chaptersToPublish) {
            await updateChapterFrontmatter(chapter, {
                status: FM_STATUS_PUBLISHED,
                publishDate: new Date().toISOString(), // 發布日期設為當前
            });
            console.log(`🚀 已發布章節: ${chapter.title}`);
            // 將剛發布的章節加入到已發布列表，以更新 novel index
            const existing = publishedChaptersList.find(c => c.id === chapter.id);
            if (existing) {
                existing.status = 'published';
                existing.title = chapter.title; // 確保標題是最新的
            } else {
                publishedChaptersList.push({ ...chapter, status: 'published' });
            }
        }
        // 更新小說 index.md
        await updateNovelIndex(selectedNovelData, publishedChaptersList);


    } else if (action === 'unpublish') {
        if (publishedChaptersList.length === 0) {
            console.log('🟢 這本小說目前沒有已發布的章節可以撤回。');
            return;
        }
        const { chaptersToUnpublish } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'chaptersToUnpublish',
                message: '請選擇要撤回的章節 (可多選):',
                choices: publishedChaptersList.map(ch => ({
                    name: `${ch.title} (ID: ${ch.id})`,
                    value: ch,
                })),
                validate: (answer) => answer.length > 0 ? true : '至少選擇一個章節。'
            },
        ]);

        for (const chapter of chaptersToUnpublish) {
            await updateChapterFrontmatter(chapter, {
                status: FM_STATUS_UNPUBLISHED,
            });
            console.log(`💨 已撤回章節: ${chapter.title}`);
        }
        // 從已發布列表中移除，並更新小說 index.md
        const remainingPublished = publishedChaptersList.filter(
            ch => !chaptersToUnpublish.some(unpubCh => unpubCh.id === ch.id)
        );
        await updateNovelIndex(selectedNovelData, remainingPublished);
    }

    console.log('🎉 操作完成！');
}


// 判斷此腳本是否為被直接執行的主模組
const currentScriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentScriptPath) {
    manageChapters();
}

export const run = manageChapters;