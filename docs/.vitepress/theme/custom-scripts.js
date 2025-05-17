// docs/.vitepress/theme/custom-scripts.js
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            // (可選) 你可以在這裡彈出一個提示訊息，但不建議，因為會很煩人
            // alert("為了保護內容，本站已禁用右鍵選單。");
        });
    });
}