import { Timer, displayDeviceInfo, displayWakeLockSupport, displayError, setupVisibilityHandler } from '../common.js';

let wakeLock = null;
const toggle = document.getElementById('wakelock-toggle');
const statusEl = document.getElementById('wakelock-status');
const wakelockTimerEl = document.getElementById('wakelock-timer');
const wakelockTimer = new Timer(wakelockTimerEl);

const requestWakeLock = async () => {
    if (!('wakeLock' in navigator)) {
        displayError('WakeLock API is not supported on this browser.');
        statusEl.textContent = 'API非対応';
        statusEl.style.color = 'red';
        toggle.disabled = true;
        return;
    }
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        statusEl.textContent = '有効';
        statusEl.style.color = 'green';
        if (!wakelockTimer.started) wakelockTimer.start();

        wakeLock.addEventListener('release', () => {
            // OSなどによって外部からリリースされた場合
            // トグルがONのままでもロックは解除されている
            statusEl.textContent = '無効 (外部要因)';
            statusEl.style.color = 'orange';
            wakelockTimer.stop();
            // ユーザー操作ではないので、トグルの状態は変更しない
            wakeLock = null;
        });
    } catch (err) {
        displayError(err);
        statusEl.textContent = `エラー: ${err.message}`;
        statusEl.style.color = 'red';
        toggle.checked = false; // 取得に失敗したらトグルをOFFに戻す
        wakeLock = null;
    }
};

const releaseWakeLock = async () => {
    if (!wakeLock) return;
    try {
        await wakeLock.release();
        wakeLock = null;
        statusEl.textContent = '無効';
        statusEl.style.color = '';
        wakelockTimer.reset();
    } catch (err) {
        displayError(err);
        statusEl.textContent = `解放エラー: ${err.message}`;
        statusEl.style.color = 'red';
    }
};

const handleVisibilityChange = () => {
    // トグルがONの状態で、ページが表示状態になり、かつwakeLockが(外部要因などで)解放されている場合、再取得する
    if (toggle.checked && wakeLock === null && document.visibilityState === 'visible') {
        requestWakeLock();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const pageStayTimerEl = document.getElementById('page-stay-timer');
    const pageStayTimer = new Timer(pageStayTimerEl);

    pageStayTimer.start();

    displayDeviceInfo();
    displayWakeLockSupport();

    toggle.addEventListener('change', (event) => {
        if (event.target.checked) {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }
    });

    setupVisibilityHandler([pageStayTimer, wakelockTimer], handleVisibilityChange);
});
