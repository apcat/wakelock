import { Timer, displayDeviceInfo, displayWakeLockSupport, displayError, setupVisibilityHandler } from '../common.js';

let wakeLock = null;
const statusEl = document.getElementById('wakelock-status');

const requestWakeLock = async () => {
    if (!('wakeLock' in navigator)) {
        displayError('WakeLock API is not supported on this browser.');
        statusEl.textContent = 'API非対応';
        statusEl.style.color = 'red';
        return;
    }
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        statusEl.textContent = '有効';
        statusEl.style.color = 'green';

        wakeLock.addEventListener('release', () => {
            // OSなどによって外部からリリースされた場合
            statusEl.textContent = '無効 (外部要因)';
            statusEl.style.color = 'orange';
            wakeLock = null;
        });
    } catch (err) {
        displayError(err);
        statusEl.textContent = `エラー: ${err.message}`;
        statusEl.style.color = 'red';
        wakeLock = null;
    }
};

const handleVisibilityChange = () => {
    if (wakeLock === null && document.visibilityState === 'visible') {
        requestWakeLock();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const pageStayTimerEl = document.getElementById('page-stay-timer');
    const pageStayTimer = new Timer(pageStayTimerEl);

    pageStayTimer.start();

    displayDeviceInfo();
    displayWakeLockSupport();

    // ページ表示時に即時実行
    requestWakeLock();

    setupVisibilityHandler([pageStayTimer], handleVisibilityChange);
});
