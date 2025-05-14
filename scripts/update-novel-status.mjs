// scripts/update-novel-status.mjs
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_PATH = path.join(__dirname, '..', 'docs');
const NOVELS_BASE_PATH = path.join(DOCS_PATH, 'novels');

// 定義小說狀態常量 (中文)
const STATUS_PLANNING = '尚在挖坑';
const STATUS_SERIALIZING = '連載中';
const STATUS_COMPLETED = '已完結';

const ALL_STATUSES = [STATUS_PLANNING, STATUS_SERIALIZING, STATUS_COMPLETED];

// 輔助函式：列出所有小說及其當前狀態 (與 manage-chapters.mjs 中的類似)
async function listNovelsWithStatus() {
    try {
        const novelDirs = await fs.readdir(NOVELS_BASE_PATH, { withFileTypes: true });
        const novels = [];
        for (const dirent of novelDirs) {
            if (dirent.isDirectory()) {
                const novelId = dirent.name;
                const indexPath = path.join(NOVELS_BASE_PATH, novelId, 'index.md');
                try {
                    if (await fs.pathExists(indexPath)) {
                        const content = await fs.readFile(indexPath, 'utf-8');
                        const frontmatterMatch = content.match(/---([\s\S]*?)---/);
                        if (frontmatterMatch && frontmatterMatch[1]) {
                            const fm = yaml.load(frontmatterMatch[1]);
                            novels.push({
                                name: `${fm.novelTitle || novelId} (目前狀態: ${fm.status || '未知'})`,
                                value: { // 將小說的關鍵資訊作為 value 傳遞
                                    id: novelId,
                                    title: fm.novelTitle || novelId,
                                    currentStatus: fm.status,
                                    indexPath: indexPath,
                                    originalContent: content, // 保存原始文件内容，方便写回
                                    frontmatter: fm, // 保存原始 frontmatter
                                }
                            });
                        } else {
                            novels.push({ name: `${novelId} (無法讀取 frontmatter)`, value: { id: novelId, title: novelId, currentStatus: '未知', indexPath } });
                        }
                    } else {
                        novels.push({ name: `${novelId} (index.md 不存在)`, value: { id: novelId, title: novelId, currentStatus: '未知', indexPath: null } });
                    }
                } catch (error) {
                    novels.push({ name: `${novelId} (讀取失敗)`, value: { id: novelId, title: novelId, currentStatus: '未知', indexPath } });
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

// 主執行函式
async function updateNovelStatus() {
    console.log('🔄 歡迎使用小說狀態更新工具！');

    const novels = await listNovelsWithStatus();
    if (!novels || novels.length === 0) return;

    const { selectedNovelData } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedNovelData',
            message: '請選擇要修改狀態的小說:',
            choices: novels, // 直接使用 novels 陣列，因為 name 和 value 已設定好
        },
    ]);

    if (!selectedNovelData.indexPath || !selectedNovelData.frontmatter) {
        console.error(`❌ 無法處理小說 "${selectedNovelData.title}"，因為缺少 index.md 檔案或 frontmatter 資訊。`);
        return;
    }

    console.log(`\nℹ️ 小說 "${selectedNovelData.title}" 目前狀態為: ${selectedNovelData.currentStatus || '未設定'}`);

    const { newStatus } = await inquirer.prompt([
        {
            type: 'list',
            name: 'newStatus',
            message: '請選擇新的狀態:',
            choices: ALL_STATUSES.map(status => ({
                name: status,
                value: status,
                disabled: status === selectedNovelData.currentStatus ? '(目前狀態)' : false // 禁用當前狀態的選項
            })),
            filter: (val) => val, // 直接返回值
        }
    ]);

    if (newStatus === selectedNovelData.currentStatus) {
        console.log('狀態未改變。操作取消。');
        return;
    }

    try {
        // 更新 frontmatter
        const updatedFrontmatter = {
            ...selectedNovelData.frontmatter,
            status: newStatus,
            lastUpdated: new Date().toISOString(), // 同時更新最後修改日期
        };

        const newFileContent = selectedNovelData.originalContent.replace(
            /---([\s\S]*?)---/,
            `---
${yaml.dump(updatedFrontmatter)}---`
        );

        await fs.writeFile(selectedNovelData.indexPath, newFileContent);
        console.log(`✅ 成功將小說 "${selectedNovelData.title}" 的狀態更新為: ${newStatus}`);
        console.log(`✏️ 小說的最後更新日期也已更新。`);

    } catch (error) {
        console.error(`❌ 更新小說 "${selectedNovelData.title}" 狀態時發生錯誤:`, error);
    }
}

// 判斷此腳本是否為被直接執行的主模組
const currentScriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentScriptPath) {
    updateNovelStatus();
}

export const run = updateNovelStatus;