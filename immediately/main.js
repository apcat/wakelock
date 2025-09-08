import { Timer, displayDeviceInfo, displayWakeLockSupport, displayError, setupVisibilityHandler } from '../common.js';
import QRCode from 'qrcode';

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
        statusEl.textContent = `エラー: ${err.message}`;
        statusEl.style.color = 'red';
        wakeLock = null;
        throw err; // Re-throw the error to be caught by the caller
    }
};

const handleVisibilityChange = () => {
    if (wakeLock === null && document.visibilityState === 'visible') {
        requestWakeLock();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('qrcode');
    if (canvas) {
        QRCode.toCanvas(canvas, window.location.href, { width: 150, margin: 1 }, (error) => {
            if (error) console.error(error);
        });
    }

    const pageStayTimerEl = document.getElementById('page-stay-timer');
    const pageStayTimer = new Timer(pageStayTimerEl);

    pageStayTimer.start();

    displayDeviceInfo();
    displayWakeLockSupport();

    try {
        // Google Chrome はユーザーの操作なしでロックの獲得が可能
        await requestWakeLock();
    } catch (err) {
        // Safari ではユーザーの操作なしでロックを獲得できないため、定期的に User Activation API を用いてロックが取得できるタイミングを伺う
        console.log('Failed to acquire WakeLock, trying with User Activation API.');
        if ('userActivation' in navigator) {
            const intervalId = setInterval(async () => {
                if (navigator.userActivation.hasBeenActive) {
                    clearInterval(intervalId);
                    console.log('User has been active, requesting wake lock.');
                    try {
                        await requestWakeLock();
                    } catch (e) {
                        displayError(err);
                        console.error('Failed to acquire WakeLock even after user activation.');
                    }
                } else {
                    console.log('User has not been active yet.');
                }
            }, 1000);
        }
    }

    setupVisibilityHandler([pageStayTimer], handleVisibilityChange);
});
