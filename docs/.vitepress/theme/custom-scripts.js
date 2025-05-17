// docs/.vitepress/theme/custom-scripts.js
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        });
        document.addEventListener('copy', function (event) {
            const selection = document.getSelection();
            if (selection.toString().length > 50) { // 可以設定一個閾值，例如複製超過50字元才加版權
                const siteName = "Fiction.exe";
                const pageUrl = window.location.href;
                const copyrightText = `\n\n--------------------\n內容來源: ${siteName}\n原文連結: ${pageUrl}\n商業轉載請聯繫作者，非商業轉載請註明出處。`;

                // 檢查剪貼簿 API 是否可用
                if (event.clipboardData && event.clipboardData.setData) {
                    event.clipboardData.setData('text/plain', selection.toString() + copyrightText);
                    event.preventDefault(); // 阻止預設的複製行為，使用我們修改後的內容
                } else {
                    // 針對較舊瀏覽器或不支援 clipboardData 的情況 (備用方案，效果可能不佳)
                    const copytext = selection + copyrightText;
                    const newdiv = document.createElement('div');
                    newdiv.style.position = 'absolute';
                    newdiv.style.left = '-99999px';
                    document.body.appendChild(newdiv);
                    newdiv.innerHTML = copytext.replace(/\n/g, '<br>'); // 處理換行
                    selection.selectAllChildren(newdiv);
                    window.setTimeout(function () {
                        document.body.removeChild(newdiv);
                    }, 0);
                }
                console.log("複製的內容已附加版權資訊。");
            }
        });
    });
}