// docs/novels.data.mjs
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_PATH = __dirname;
const NOVELS_BASE_PATH = path.join(DOCS_PATH, 'novels');

export default {
    load() { // 移除 async
        const novels = [];
        try {
            // 確保 NOVELS_BASE_PATH 是正確的
            if (!fs.pathExistsSync(NOVELS_BASE_PATH)) { // 使用同步方法
                console.warn(`⚠️ 小說目錄 ${NOVELS_BASE_PATH} 不存在。`);
                return [];
            }

            const novelDirs = fs.readdirSync(NOVELS_BASE_PATH, { withFileTypes: true }); // 使用同步方法
            for (const dirent of novelDirs) {
                if (dirent.isDirectory()) {
                    const novelId = dirent.name;
                    const indexPath = path.join(NOVELS_BASE_PATH, novelId, 'index.md');
                    try {
                        if (fs.pathExistsSync(indexPath)) { // 使用同步方法
                            const content = fs.readFileSync(indexPath, 'utf-8'); // 使用同步方法
                            const frontmatterMatch = content.match(/---([\s\S]*?)---/);
                            if (frontmatterMatch && frontmatterMatch[1]) {
                                const fm = yaml.load(frontmatterMatch[1]);
                                novels.push({
                                    id: novelId,
                                    title: fm.novelTitle || fm.title || novelTitle,
                                    description: fm.description || '',
                                    author: fm.author || '',
                                    status: fm.status || '未知狀態',
                                    coverImage: fm.coverImage || '',
                                    // ===== ↓↓↓ 新增這一行 ↓↓↓ =====
                                    lastUpdated: fm.lastUpdated || '', // 讀取最後更新時間
                                    // ============================
                                    link: `/novels/${novelId}/`
                                });
                            }
                        }
                    } catch (readError) {
                        console.warn(`⚠️ 無法讀取小說 ${novelId} 的 index.md:`, readError.message);
                    }
                }
            }
        } catch (dirError) {
            if (dirError.code === 'ENOENT') {
                console.warn(`⚠️ 小說基礎目錄 ${NOVELS_BASE_PATH} 讀取失敗，可能不存在。`);
            } else {
                console.error(`❌ 讀取小說目錄 ${NOVELS_BASE_PATH} 時發生錯誤:`, dirError);
            }
        }
        // 按最後更新日期排序，b - a 代表由新到舊
        novels.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        return novels;
    }
};