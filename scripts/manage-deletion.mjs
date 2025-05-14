// scripts/manage-deletion.mjs
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_PATH = path.join(__dirname, '..', 'docs');
const NOVELS_BASE_PATH = path.join(DOCS_PATH, 'novels');

// --- 輔助函式 (部分與 delete-chapter.mjs 相同或類似) ---

async function listNovelsForSelection(purpose = "操作") { // 新增 purpose 參數
    try {
        const novelDirs = await fs.readdir(NOVELS_BASE_PATH, { withFileTypes: true });
        const novels = [];
        for (const dirent of novelDirs) {
            if (dirent.isDirectory()) {
                const novelId = dirent.name;
                const indexPath = path.join(NOVELS_BASE_PATH, novelId, 'index.md');
                let novelTitle = novelId;
                let originalContent = null;
                let frontmatter = {};

                if (await fs.pathExists(indexPath)) {
                    try {
                        originalContent = await fs.readFile(indexPath, 'utf-8');
                        const frontmatterMatch = originalContent.match(/---([\s\S]*?)---/);
                        if (frontmatterMatch && frontmatterMatch[1]) {
                            frontmatter = yaml.load(frontmatterMatch[1]);
                            novelTitle = frontmatter.novelTitle || frontmatter.title || novelId;
                        }
                    } catch (readError) {
                        console.warn(`⚠️ 無法讀取小說 "${novelId}" 的 index.md: ${readError.message}`);
                    }
                } else {
                    console.warn(`⚠️ 小說 "${novelId}" 的 index.md 檔案不存在。`);
                }
                novels.push({
                    name: `${novelTitle} (ID: ${novelId})`,
                    value: { // 包含刪除小說和刪除章節都可能需要的資訊
                        id: novelId,
                        title: novelTitle,
                        folderPath: path.join(NOVELS_BASE_PATH, novelId), // 小說資料夾路徑
                        indexPath: await fs.pathExists(indexPath) ? indexPath : null,
                        originalContent: originalContent,
                        frontmatter: frontmatter,
                    }
                });
            }
        }
        if (novels.length === 0) {
            console.log(` 🤔 目前還沒有任何小說可以${purpose}。`);
            return null;
        }
        return novels;
    } catch (error) {
        console.error(`❌ 讀取小說列表以供${purpose}時發生錯誤:`, error);
        return null;
    }
}

async function getAllNovelChapters(novelFolderPath) {
    // (與 delete-chapter.mjs 中的 getAllNovelChapters 函式相同)
    const chapters = [];
    try {
        if (!await fs.pathExists(novelFolderPath)) return [];
        const files = await fs.readdir(novelFolderPath);
        for (const file of files) {
            if (file.startsWith('Ch-') && file.endsWith('.md')) {
                const chapterPath = path.join(novelFolderPath, file);
                try {
                    const content = await fs.readFile(chapterPath, 'utf-8');
                    const frontmatterMatch = content.match(/---([\s\S]*?)---/);
                    let fm = {};
                    if (frontmatterMatch && frontmatterMatch[1]) {
                        fm = yaml.load(frontmatterMatch[1]);
                    }
                    chapters.push({
                        id: fm.id || file.replace('.md', ''),
                        title: fm.title || file.replace('.md', ''),
                        status: fm.status || 'unknown',
                        filePath: chapterPath,
                    });
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

// --- 刪除章節的核心邏輯 (從 delete-chapter.mjs 移過來並調整) ---
async function handleDeleteChapterAction() {
    console.log('\n--- 刪除章節 ---');
    const novels = await listNovelsForSelection("从中删除章节");
    if (!novels) return;

    const { selectedNovelData } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedNovelData',
            message: '請選擇要從哪本小說中刪除章節:',
            choices: novels,
        },
    ]);

    if (!selectedNovelData || !selectedNovelData.id) {
        console.log('未選擇有效的小說。操作取消。');
        return;
    }

    const { id: novelId, title: novelTitle, folderPath: novelFolderPath, indexPath, originalContent, frontmatter } = selectedNovelData;

    const allChaptersInDir = await getAllNovelChapters(novelFolderPath);

    if (allChaptersInDir.length === 0) {
        console.log(`ℹ️ 小說 "${novelTitle}" 目前沒有任何章節檔案可以刪除。`);
        return;
    }

    const { chaptersToDelete } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'chaptersToDelete',
            message: '請選擇要刪除的章節 (可多選):',
            choices: allChaptersInDir.map(ch => ({
                name: `${ch.title} (ID: ${ch.id}, 狀態: ${ch.status})`,
                value: ch,
            })),
            validate: (answer) => answer.length > 0 ? true : '至少選擇一個章節進行刪除。'
        }
    ]);

    if (!chaptersToDelete || chaptersToDelete.length === 0) {
        console.log('沒有選擇任何章節。操作取消。');
        return;
    }

    const { confirmDelete } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmDelete',
            message: `您確定要永久刪除選中的 ${chaptersToDelete.length} 個章節嗎？此操作不可撤銷！\n` +
                chaptersToDelete.map(ch => `  - ${ch.title} (ID: ${ch.id})`).join('\n'),
            default: false,
        }
    ]);

    if (!confirmDelete) {
        console.log('刪除章節操作已取消。');
        return;
    }

    let deletedCount = 0;
    for (const chapter of chaptersToDelete) {
        try {
            await fs.remove(chapter.filePath);
            console.log(`🗑️  已成功刪除章節檔案: ${chapter.filePath}`);
            deletedCount++;
        } catch (error) {
            console.error(`❌ 刪除章節檔案 ${chapter.filePath} 時發生錯誤:`, error);
        }
    }

    if (deletedCount > 0 && indexPath && originalContent && frontmatter) {
        try {
            const currentFm = { ...frontmatter };
            const currentChaptersList = currentFm.chapters || [];
            const newFmChaptersList = currentChaptersList.filter(fmChapter => {
                const linkChapterId = fmChapter.link ? path.basename(fmChapter.link) : null;
                return !chaptersToDelete.some(deletedCh => deletedCh.id === linkChapterId);
            });

            let needsNovelIndexUpdate = false;
            if (JSON.stringify(currentChaptersList) !== JSON.stringify(newFmChaptersList)) {
                currentFm.chapters = newFmChaptersList;
                needsNovelIndexUpdate = true;
            }
            currentFm.lastUpdated = new Date().toISOString();
            needsNovelIndexUpdate = true; // 確保 lastUpdated 總是更新

            if (needsNovelIndexUpdate) {
                const newFileContent = originalContent.replace(
                    /---([\s\S]*?)---/,
                    `---
${yaml.dump(currentFm)}---`
                );
                await fs.writeFile(indexPath, newFileContent);
                console.log(`✏️  小說 "${novelTitle}" 的 index.md (lastUpdated 和 chapters 列表) 已更新。`);
            }
        } catch (error) {
            console.error(`❌ 更新小說 "${novelTitle}" 的 index.md 時發生錯誤:`, error);
            console.log('   請注意：章節檔案可能已被刪除，但小說索引頁更新失敗。建議執行 "同步所有小說元數據" 工具。');
        }
    } else if (deletedCount > 0) {
        console.warn(`⚠️ 章節檔案已刪除，但小說 "${novelTitle}" 的 index.md 資訊不完整或不存在，無法自動更新。建議執行 "同步所有小說元數據" 工具。`);
    }

    console.log(`\n🎉 刪除章節操作完成！成功刪除 ${deletedCount} 個章節。`);
}


// --- 刪除小說的核心邏輯 ---
async function handleDeleteNovelAction() {
    console.log('\n--- 刪除整本小說 ---');
    const novels = await listNovelsForSelection("删除");
    if (!novels) return;

    const { novelToDelete } = await inquirer.prompt([
        {
            type: 'list',
            name: 'novelToDelete',
            message: '請選擇要刪除的小說 (警告：這將刪除該小說的整個資料夾及其所有內容):',
            choices: novels,
        }
    ]);

    if (!novelToDelete || !novelToDelete.id) {
        console.log('未選擇有效的小說。操作取消。');
        return;
    }

    const { id: novelId, title: novelTitle, folderPath } = novelToDelete;

    const { confirmDeleteNovel } = await inquirer.prompt([
        {
            type: 'input', // 使用 input 要求使用者輸入小說 ID 來確認，增加安全性
            name: 'confirmDeleteNovel',
            message: `極度危險操作！您確定要永久刪除整本小說 "${novelTitle}" (ID: ${novelId}) 及其所有章節檔案嗎？\n此操作不可撤銷！\n如果確定，請輸入小說 ID "${novelId}" 進行確認:`,
        }
    ]);

    if (confirmDeleteNovel !== novelId) {
        console.log('輸入的 ID 不匹配。刪除小說操作已取消。');
        return;
    }

    try {
        await fs.remove(folderPath); // fs-extra 的 remove 可以刪除資料夾
        console.log(`🗑️  已成功永久刪除小說資料夾: ${folderPath}`);
        console.log(`   請記得：如果您的 VitePress config.js (或其他地方) 有硬編碼指向此小說的側邊欄或連結，您需要手動移除它們。`);
        console.log(`   首頁的小說列表會在下次 VitePress 重啟或資料重新載入時更新。`);
    } catch (error) {
        console.error(`❌ 刪除小說資料夾 ${folderPath} 時發生錯誤:`, error);
    }
    console.log(`\n🎉 刪除小說操作完成！`);
}


// 主執行函式
async function manageDeletion() {
    console.log('🗑️  歡迎使用內容刪除工具！');

    const { deletionType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'deletionType',
            message: '請問您想刪除什麼？',
            choices: [
                { name: '刪除特定章節', value: 'chapter' },
                { name: '刪除整本小說 (危險操作！)', value: 'novel' },
                new inquirer.Separator(),
                { name: '返回 (取消操作)', value: 'back' },
            ],
        },
    ]);

    switch (deletionType) {
        case 'chapter':
            await handleDeleteChapterAction();
            break;
        case 'novel':
            await handleDeleteNovelAction();
            break;
        case 'back':
            console.log('操作已取消。');
            break;
        default:
            console.log('無效的選擇。');
    }
}

// 判斷此腳本是否為被直接執行的主模組
const currentScriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentScriptPath) {
    manageDeletion();
}

export const run = manageDeletion;