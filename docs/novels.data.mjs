// docs/novels.data.mjs
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_PATH = __dirname;
const NOVELS_BASE_PATH = path.join(DOCS_PATH, 'novels');

// 這個變數將在建構時被填充
let novels = [];

// 只有在 Node.js 環境中才執行檔案系統操作
if (process.env.NODE_ENV === 'production') {
    // 確保 NOVELS_BASE_PATH 是正確的
    if (!fs.pathExistsSync(NOVELS_BASE_PATH)) {
        console.warn(`⚠️ 小說目錄 ${NOVELS_BASE_PATH} 不存在。`);
        novels = [];
    } else {
        try {
            const novelDirs = fs.readdirSync(NOVELS_BASE_PATH, { withFileTypes: true });
            novels = novelDirs.filter(dirent => dirent.isDirectory()).map(dirent => {
                const novelId = dirent.name;
                const indexPath = path.join(NOVELS_BASE_PATH, novelId, 'index.md');
                if (fs.pathExistsSync(indexPath)) {
                    const content = fs.readFileSync(indexPath, 'utf-8');
                    const frontmatterMatch = content.match(/---([\s\S]*?)---/);
                    if (frontmatterMatch && frontmatterMatch[1]) {
                        const fm = yaml.load(frontmatterMatch[1]);
                        return {
                            id: novelId,
                            title: fm.novelTitle || fm.title || novelTitle,
                            description: fm.description || '',
                            author: fm.author || '',
                            status: fm.status || '未知狀態',
                            coverImage: fm.coverImage || '',
                            link: `/novels/${novelId}/`
                        };
                    }
                }
            }).filter(Boolean); // 移除 undefined
        } catch (dirError) {
            if (dirError.code === 'ENOENT') {
                console.warn(`⚠️ 小說基礎目錄 ${NOVELS_BASE_PATH} 讀取失敗，可能不存在。`);
            } else {
                console.error(`❌ 讀取小說目錄 ${NOVELS_BASE_PATH} 時發生錯誤:`, dirError);
            }
            novels = [];
        }
    }
    novels.sort((a, b) => a.title.localeCompare(b.title));
}

// 導出一個簡單的物件，包含 load 函數
export default {
    load() {
        return novels;
    }
};