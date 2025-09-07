import { UAParser } from 'ua-parser-js';

/**
 * 時間を hh:mm:ss 形式にフォーマットします。
 * @param {number} totalSeconds - 合計秒数
 * @returns {string} フォーマットされた時間文字列
 */
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * タイマーを管理するクラス
 */
export class Timer {
    /**
     * @param {HTMLElement} element - 時間を表示するDOM要素
     */
    constructor(element) {
        this.element = element;
        this.seconds = 0;
        this.intervalId = null;
        this.started = false;
    }

    start() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => {
            this.seconds++;
            this.element.textContent = formatTime(this.seconds);
        }, 1000);
        this.started = true;
    }

    stop() {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    reset() {
        this.stop();
        this.seconds = 0;
        this.element.textContent = formatTime(0);
        this.started = false;
    }
}

/**
 * デバイス情報を取得して表示します。
 */
export async function displayDeviceInfo() {
    const osEl = document.getElementById('os');
    const osVersionEl = document.getElementById('os-version');
    const browserEl = document.getElementById('browser');
    const browserVersionEl = document.getElementById('browser-version');

    // User-Agent Client Hints API を試す
    if (navigator.userAgentData) {
        try {
            const uaData = await navigator.userAgentData.getHighEntropyValues([
                "platform",
                "platformVersion",
                "browserName",
                "browserVersion",
                "fullVersionList"
            ]);
            osEl.textContent = uaData.platform || 'N/A';
            osVersionEl.textContent = uaData.platformVersion || 'N/A';

            const brand = uaData.fullVersionList.find(b => b.brand !== "Not=A?Brand" && b.brand !== "Chromium");
            browserEl.textContent = brand?.brand || uaData.brands[0]?.brand || 'N/A';
            browserVersionEl.textContent = brand?.version || uaData.brands[0]?.version || 'N/A';
            return;
        } catch (error) {
            console.warn('Could not get high entropy values from UserAgentData, falling back to userAgent string.', error);
        }
    }

    // User-Agent 文字列からパース
    const parser = new UAParser(navigator.userAgent);
    const result = parser.getResult();
    osEl.textContent = result.os.name || 'Unknown';
    osVersionEl.textContent = 'N/A'; // UA からは正確な情報が取得できないため
    browserEl.textContent = result.browser.name || 'Unknown';
    browserVersionEl.textContent = result.browser.version || 'N/A';
}

/**
 * WakeLock APIのサポート状況を表示します。
 */
export function displayWakeLockSupport() {
    const supportEl = document.getElementById('wakelock-support');
    if ('wakeLock' in navigator) {
        supportEl.textContent = 'サポートされています';
        supportEl.style.color = 'green';
    } else {
        supportEl.textContent = 'サポートされていません';
        supportEl.style.color = 'red';
    }
};

/**
 * エラーメッセージを表示します。
 * @param {Error | string} error - 表示するエラーオブジェクトまたはメッセージ
 */
export function displayError(error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : error;

    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';

    const messageEl = document.createElement('span');
    messageEl.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => errorContainer.remove();

    errorContainer.appendChild(messageEl);
    errorContainer.appendChild(closeButton);

    document.body.appendChild(errorContainer);
}

/**
 * ページの可視性変更を監視し、タイマーを制御します。
 * @param {Timer[]} timers - 制御対象のタイマーの配列
 * @param {() => void} onVisible - ページが表示状態になったときに実行するコールバック
 */
export function setupVisibilityHandler(timers, onVisible) {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            onVisible?.();
        } else {
            timers.forEach(timer => timer.stop());
        }
    });
}
