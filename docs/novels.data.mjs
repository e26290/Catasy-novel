// docs/novels.data.mjs
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// VitePress 的 docs 資料夾路徑
const DOCS_PATH = __dirname;
const NOVELS_BASE_PATH = path.join(DOCS_PATH, 'novels');

export default {
    async load() {
        const novels = [];
        try {
            // 確保 NOVELS_BASE_PATH 是正確的
            if (!await fs.pathExists(NOVELS_BASE_PATH)) {
                console.warn(`⚠️ 小說目錄 ${NOVELS_BASE_PATH} 不存在。`);
                return []; // 如果小說主目錄不存在，返回空陣列
            }

            const novelDirs = await fs.readdir(NOVELS_BASE_PATH, { withFileTypes: true });
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
                                    id: novelId,
                                    title: fm.novelTitle || fm.title || novelId,
                                    description: fm.description || '',
                                    author: fm.author || '',
                                    status: fm.status || '未知狀態',
                                    coverImage: fm.coverImage || '',
                                    // 連結應該是相對於網站根目錄的絕對路徑，VitePress 的 withBase 會處理 base
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
            // 如果 NOVELS_BASE_PATH 不存在，readdir 會直接報錯
            if (dirError.code === 'ENOENT') {
                console.warn(`⚠️ 小說基礎目錄 ${NOVELS_BASE_PATH} 讀取失敗，可能不存在。`);
            } else {
                console.error(`❌ 讀取小說目錄 ${NOVELS_BASE_PATH} 時發生錯誤:`, dirError);
            }
        }
        novels.sort((a, b) => a.title.localeCompare(b.title));
        return novels;
    }
}