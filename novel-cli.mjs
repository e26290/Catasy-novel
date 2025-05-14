#!/usr/bin/env node

import inquirer from 'inquirer';
import { Command } from 'commander';

// 引入腳本功能
import { run as createNovelRun } from './scripts/create-novel.mjs';
import { run as createChapterRun } from './scripts/create-chapter.mjs';
import { run as manageChaptersRun } from './scripts/publish-chapters.mjs';
import { run as updateNovelStatusRun } from './scripts/update-novel-status.mjs';
import { run as syncNovelsMetaRun } from './scripts/sync-novels-meta.mjs';
import { run as manageDeletionRun } from './scripts/manage-deletion.mjs';

const program = new Command();

program
    .name('novel-cli')
    .description('一個用於管理 Catasy 小說專案內容的 CLI 工具')
    .version('0.1.0');

async function showInteractiveMenu() {
    let keepRunning = true;
    while (keepRunning) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: '請問您想做什麼？',
                choices: [
                    { name: '1. 創建新小說', value: 'addNovel' },
                    { name: '2. 創建新章節', value: 'addChapter' },
                    { name: '3. 管理章節 (發布/撤回)', value: 'manageChapters' },
                    { name: '4. 修改小說狀態 (挖坑/連載/完結)', value: 'updateNovelStatus' },
                    { name: '5. 同步所有小說元數據 (批量維護)', value: 'syncNovelsMeta' },
                    { name: '6. 刪除小說', value: 'manageDeletion' },
                    new inquirer.Separator(),
                    { name: '退出 CLI', value: 'exit' },
                ],
                loop: false,
            },
        ]);

        try {
            switch (action) {
                case 'addNovel':
                    await createNovelRun();
                    break;
                case 'addChapter':
                    await createChapterRun();
                    break;
                case 'manageChapters':
                    await manageChaptersRun();
                    break;
                case 'updateNovelStatus':
                    await updateNovelStatusRun();
                    break;
                case 'syncNovelsMeta':
                    await syncNovelsMetaRun();
                    break;
                case 'manageDeletion':
                    await manageDeletionRun();
                    break;
                case 'exit':
                    console.log('👋 感謝使用，再見！');
                    keepRunning = false;
                    break;
                default:
                    console.log('無效的選擇。');
            }
        } catch (error) {
            console.error(`❌ 操作 "${action}" 過程中發生錯誤:`, error.message);
        }

        if (keepRunning && action !== 'exit') { // 只有在沒選退出且操作已完成時，才加分隔提示繼續
            console.log('\n-------------------------------\n');
        }
    }
}


program.action(async (options, command) => {
    await showInteractiveMenu();
});


program.parseAsync(process.argv).catch(err => {
    console.error("CLI 執行錯誤:", err.message);
    process.exit(1);
});