// --- デバッグ用ロガー ---
const debugLogger = {
    panel: null,
    content: null,
    clearBtn: null,
    init: function() {
        this.panel = document.getElementById('debug-log-panel');
        this.content = document.getElementById('debug-log-content');
        this.clearBtn = document.getElementById('debug-log-clear');
        if (this.panel && this.content && this.clearBtn) {
            this.panel.style.display = 'block';
            this.clearBtn.onclick = () => { this.content.textContent = ''; };
            console.log = this.log.bind(this, 'log');
            console.warn = this.log.bind(this, 'warn');
            console.error = this.log.bind(this, 'error');
            console.info = this.log.bind(this, 'info');
            console.debug = this.log.bind(this, 'debug');
            window.addEventListener('error', (e) => {
                this.log('error', `[Unhandled Exception] ${e.message} at ${e.filename}:${e.lineno}`);
            });
            console.log("[Debug Logger] Initialized.");
        }
    },
    log: function(type, ...args) {
        if (!this.content) return;
        const originalConsole = console; // 無限ループ防止
        originalConsole[type] ? originalConsole[type](...args) : originalConsole.log(...args);

        const timestamp = new Date().toLocaleTimeString();
        const message = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return '[Circular Object]';
                }
            }
            return String(arg);
        }).join(' ');
        
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${timestamp}] ${message}`;
        if (type === 'error') logEntry.style.color = '#f88';
        if (type === 'warn') logEntry.style.color = '#ff8';
        
        this.content.appendChild(logEntry);
        this.panel.scrollTop = this.panel.scrollHeight;
    }
};
// --- デバッグ用ロガーここまで ---

import("https://esm.run/@google/genai").then(module => {
    // 正しいクラス名 GoogleGenAI をグローバルスコープに設定
    window.GoogleGenAI = module.GoogleGenAI;
    console.log("Google GenAI SDK (@google/genai) の読み込みが完了しました。");
    // SDKの読み込みが完了してから、アプリの初期化を実行する
    appLogic.initializeApp();
}).catch(err => {
    console.error("Google Gen AI SDKの読み込みに失敗しました:", err);
    // エラーメッセージを画面に表示するなどのフォールバック処理
    document.body.innerHTML = `<p style="color: red; padding: 20px;">SDKの読み込みに失敗しました。アプリを起動できません。</p>`;
});

// --- 定数 ---
const DB_NAME = 'GeminiPWA_DB';
const DB_VERSION = 8; // スキーマ変更なしのため据え置き
const SETTINGS_STORE = 'settings';
const CHATS_STORE = 'chats';
const CHAT_UPDATEDAT_INDEX = 'updatedAtIndex';
const CHAT_CREATEDAT_INDEX = 'createdAtIndex';
const DEFAULT_MODEL = 'gemini-2.5-pro';
const DEFAULT_STREAMING_SPEED = 12;
const DEFAULT_TEMPERATURE = 0.5;
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_TOP_K = 40;
const DEFAULT_TOP_P = 0.95;
const DEFAULT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'; // デフォルトフォント
const CHAT_TITLE_LENGTH = 15;
const TEXTAREA_MAX_HEIGHT = 120;
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const DUPLICATE_SUFFIX = ' (コピー)';
const IMPORT_PREFIX = '(取込) ';
const LIGHT_THEME_COLOR = '#4a90e2';
const DARK_THEME_COLOR = '#007aff';
const APP_VERSION = "0.34";
const SWIPE_THRESHOLD = 50; // スワイプ判定の閾値 (px)
const ZOOM_THRESHOLD = 1.01; // ズーム状態と判定するスケールの閾値 (誤差考慮)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 最大ファイルサイズ (例: 10MB)
const MAX_TOTAL_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 1メッセージあたりの合計添付ファイルサイズ上限 (例: 50MB) - API制限も考慮
const INITIAL_RETRY_DELAY = 100; // 初期リトライ遅延時間 (ミリ秒)

// 添付を確定する処理
const extensionToMimeTypeMap = {
    // Text Data
    'pdf': 'application/pdf',
    'js': 'text/javascript',   // 一般的な方を選択
    'py': 'text/x-python',     // 一般的な方を選択
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',        // .htm も考慮
    'css': 'text/css',
    'md': 'text/md',
    'csv': 'text/csv',
    'xml': 'text/xml',
    'rtf': 'text/rtf',

    // Image Data
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'heif': 'image/heif',

    // Video Data
    'mp4': 'video/mp4',
    'mpeg': 'video/mpeg',
    'mov': 'video/mov',
    'avi': 'video/avi',
    'flv': 'video/x-flv',
    'mpg': 'video/mpg',
    'webm': 'video/webm',
    'wmv': 'video/wmv',
    '3gp': 'video/3gpp',
    '3gpp': 'video/3gpp',

    // Audio Data
    'wav': 'audio/wav',
    'mp3': 'audio/mp3',
    'aiff': 'audio/aiff',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',        // OGG Vorbis
    'flac': 'audio/flac',
};

// --- DOM要素 ---
const elements = {
    appContainer: document.querySelector('.app-container'),
    appHeader: document.querySelector('.app-header'),
    chatScreen: document.getElementById('chat-screen'),
    historyScreen: document.getElementById('history-screen'),
    settingsScreen: document.getElementById('settings-screen'),
    chatTitle: document.getElementById('chat-title'),
    messageContainer: document.getElementById('message-container'),
    userInput: document.getElementById('user-input'),
    sendButton: document.getElementById('send-button'),
    loadingIndicator: document.getElementById('loading-indicator'),
    historyList: document.getElementById('history-list'),
    historyTitle: document.getElementById('history-title'),
    noHistoryMessage: document.getElementById('no-history-message'),
    historyItemTemplate: document.querySelector('.js-history-item-template'),
    themeColorMeta: document.getElementById('theme-color-meta'),
    systemPromptArea: document.getElementById('system-prompt-area'),
    systemPromptDetails: document.getElementById('system-prompt-details'),
    systemPromptEditor: document.getElementById('system-prompt-editor'),
    saveSystemPromptBtn: document.getElementById('save-system-prompt-btn'),
    cancelSystemPromptBtn: document.getElementById('cancel-system-prompt-btn'),
    apiKeyInput: document.getElementById('api-key'),
    modelNameSelect: document.getElementById('model-name'),
    userDefinedModelsGroup: document.getElementById('user-defined-models-group'),
    streamingOutputCheckbox: document.getElementById('streaming-output'),
    streamingSpeedInput: document.getElementById('streaming-speed'),
    systemPromptDefaultTextarea: document.getElementById('system-prompt-default'),
    temperatureInput: document.getElementById('temperature'),
    maxTokensInput: document.getElementById('max-tokens'),
    topKInput: document.getElementById('top-k'),
    topPInput: document.getElementById('top-p'),
    presencePenaltyInput: document.getElementById('presence-penalty'),
    frequencyPenaltyInput: document.getElementById('frequency-penalty'),
    thinkingBudgetInput: document.getElementById('thinking-budget'),
    includeThoughtsToggle: document.getElementById('include-thoughts-toggle'),
    thoughtTranslationOptionsDiv: document.getElementById('thought-translation-options'),
    enableThoughtTranslationCheckbox: document.getElementById('enable-thought-translation'),
    thoughtTranslationModelSelect: document.getElementById('thought-translation-model'),
    dummyUserInput: document.getElementById('dummy-user'),
    applyDummyToProofreadCheckbox: document.getElementById('apply-dummy-to-proofread'),
    applyDummyToTranslateCheckbox: document.getElementById('apply-dummy-to-translate'),
    dummyModelInput: document.getElementById('dummy-model'),
    concatDummyModelCheckbox: document.getElementById('concat-dummy-model'),
    additionalModelsTextarea: document.getElementById('additional-models'),
    pseudoStreamingCheckbox: document.getElementById('pseudo-streaming'),
    enterToSendCheckbox: document.getElementById('enter-to-send'),
    historySortOrderSelect: document.getElementById('history-sort-order'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    fontFamilyInput: document.getElementById('font-family-input'),
    hideSystemPromptToggle: document.getElementById('hide-system-prompt-toggle'),
    geminiEnableGroundingToggle: document.getElementById('gemini-enable-grounding-toggle'),
    geminiEnableFunctionCallingToggle: document.getElementById('gemini-enable-function-calling-toggle'),
    appVersionSpan: document.getElementById('app-version'),
    backgroundImageInput: document.getElementById('background-image-input'),
    uploadBackgroundBtn: document.getElementById('upload-background-btn'),
    backgroundThumbnail: document.getElementById('background-thumbnail'),
    deleteBackgroundBtn: document.getElementById('delete-background-btn'),
    gotoHistoryBtn: document.getElementById('goto-history-btn'),
    gotoSettingsBtn: document.getElementById('goto-settings-btn'),
    backToChatFromHistoryBtn: document.getElementById('back-to-chat-from-history'),
    backToChatFromSettingsBtn: document.getElementById('back-to-chat-from-settings'),
    newChatBtn: document.getElementById('new-chat-btn'),
    saveSettingsBtns: document.querySelectorAll('.js-save-settings-btn'),
    updateAppBtn: document.getElementById('update-app-btn'),
    clearDataBtn: document.getElementById('clear-data-btn'),
    importHistoryBtn: document.getElementById('import-history-btn'),
    importHistoryInput: document.getElementById('import-history-input'),
    alertDialog: document.getElementById('alertDialog'),
    alertMessage: document.getElementById('alertDialog').querySelector('.dialog-message'),
    alertOkBtn: document.getElementById('alertDialog').querySelector('.dialog-ok-btn'),
    confirmDialog: document.getElementById('confirmDialog'),
    confirmMessage: document.getElementById('confirmDialog').querySelector('.dialog-message'),
    confirmOkBtn: document.getElementById('confirmDialog').querySelector('.dialog-ok-btn'),
    confirmCancelBtn: document.getElementById('confirmDialog').querySelector('.dialog-cancel-btn'),
    promptDialog: document.getElementById('promptDialog'),
    promptMessage: document.getElementById('promptDialog').querySelector('.dialog-message'),
    promptInput: document.getElementById('promptDialog').querySelector('.dialog-input'),
    promptOkBtn: document.getElementById('promptDialog').querySelector('.dialog-ok-btn'),
    promptCancelBtn: document.getElementById('promptDialog').querySelector('.dialog-cancel-btn'),
    swipeNavigationToggle: document.getElementById('swipe-navigation-toggle'),
    enableProofreadingCheckbox: document.getElementById('enable-proofreading'),
    proofreadingOptionsDiv: document.getElementById('proofreading-options'),
    proofreadingModelNameSelect: document.getElementById('proofreading-model-name'),
    proofreadingSystemInstructionTextarea: document.getElementById('proofreading-system-instruction'),
    attachFileBtn: document.getElementById('attach-file-btn'),
    fileUploadDialog: document.getElementById('fileUploadDialog'),
    fileInput: document.getElementById('file-input'),
    selectFilesBtn: document.getElementById('select-files-btn'),
    selectedFilesList: document.getElementById('selected-files-list'),
    confirmAttachBtn: document.getElementById('confirm-attach-btn'),
    cancelAttachBtn: document.getElementById('cancel-attach-btn'),
    enableAutoRetryCheckbox: document.getElementById('enable-auto-retry'),
    maxRetriesInput: document.getElementById('max-retries'),
    autoRetryOptionsDiv: document.getElementById('auto-retry-options'),
    useFixedRetryDelayCheckbox: document.getElementById('use-fixed-retry-delay'),
    fixedRetryDelayContainer: document.getElementById('fixed-retry-delay-container'),
    fixedRetryDelayInput: document.getElementById('fixed-retry-delay-seconds'),
    maxBackoffDelayContainer: document.getElementById('max-backoff-delay-container'),
    maxBackoffDelayInput: document.getElementById('max-backoff-delay-seconds'),
    googleSearchApiKeyInput: document.getElementById('google-search-api-key'),
    googleSearchEngineIdInput: document.getElementById('google-search-engine-id'),
    forceFunctionCallingToggle: document.getElementById('force-function-calling-toggle'),
    overlayOpacitySlider: document.getElementById('overlay-opacity-slider'),
    overlayOpacityValue: document.getElementById('overlay-opacity-value'),
    headerColorInput: document.getElementById('header-color-input'),
    resetHeaderColorBtn: document.getElementById('reset-header-color-btn'),
    messageOpacitySlider: document.getElementById('message-opacity-slider'),
    messageOpacityValue:  document.getElementById('message-opacity-value'),
    modelWarningMessage: document.getElementById('model-warning-message')
};

// --- アプリ状態 ---
const state = {
    db: null,
    currentChatId: null,
    currentMessages: [],
    currentSystemPrompt: '',
    currentPersistentMemory: {}, // 現在のチャットの永続メモリ
    settings: {
        apiKey: '',
        modelName: DEFAULT_MODEL,
        streamingOutput: false,
        streamingSpeed: DEFAULT_STREAMING_SPEED,
        systemPrompt: '',
        temperature: null,
        maxTokens: null,
        topK: null,
        topP: null,
        presencePenalty: null,
        frequencyPenalty: null,
        thinkingBudget: null,
        includeThoughts: false,
        enableThoughtTranslation: true, // 思考プロセスの翻訳を有効にするか
        thoughtTranslationModel: 'gemini-2.5-flash-lite',
        dummyUser: '',
        applyDummyToProofread: false,
        applyDummyToTranslate: false,
        dummyModel: '',
        concatDummyModel: false,
        additionalModels: '',
        pseudoStreaming: false,
        enterToSend: true,
        historySortOrder: 'updatedAt',
        darkMode: false,
        backgroundImageBlob: null,
        fontFamily: '',
        hideSystemPromptInChat: false,
        enableSwipeNavigation: true,
        enableAutoRetry: true,
        maxRetries: 30, 
        useFixedRetryDelay: false,
        fixedRetryDelaySeconds: 15,
        maxBackoffDelaySeconds: 60,
        enableProofreading: false,
        proofreadingModelName: 'gemini-2.5-flash',
        proofreadingSystemInstruction: 'あなたはプロの編集者です。受け取った文章の過剰な読点を抑制し、日本語として違和感のない読点の使用量に校正してください。承知しました等の応答は行わず、校正後の文章のみ出力して下さい。読点の抑制以外の編集は禁止です。読点以外の文章には絶対に手を付けないで下さい。',
        geminiEnableGrounding: false,
        geminiEnableFunctionCalling: false,
        googleSearchApiKey: '',
        googleSearchEngineId: '',
        messageOpacity: 1,
        overlayOpacity: 0.65,
        headerColor: '',
        allowPromptUiChanges: true,
        forceFunctionCalling: false,
    },
    backgroundImageUrl: null,
    isSending: false,
    abortController: null,
    partialStreamContent: '',
    partialThoughtStreamContent: '',
    editingMessageIndex: null,
    isEditingSystemPrompt: false,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,
    isSwiping: false,
    isZoomed: false,
    currentScreen: 'chat',
    selectedFilesForUpload: [],
    pendingAttachments: [],
    currentScene: null,
    currentStyleProfiles: {},
};

function updateMessageMaxWidthVar() {
    const container = elements.messageContainer; // messageContainer要素を取得
    if (!container) return;

    // コンテナ幅に基づいて最大幅を計算
    let maxWidthPx = container.clientWidth * 0.8;

    // 計算したピクセル値をCSS変数に設定
    document.documentElement.style.setProperty('--message-max-width', `${maxWidthPx}px`);
    // console.log(`CSS Variable --message-max-width updated to: ${maxWidthPx}px`); // ログ削減
}

let resizeTimer;
window.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded and parsed. Initializing app...");
    appLogic.initializeApp();
});

// --- ユーティリティ関数 ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

 /**
 * 中断可能なsleep関数
 * @param {number} ms - 待機する時間 (ミリ秒)
 * @param {AbortSignal} signal - 中断を監視するためのAbortSignal
 * @returns {Promise<void>} 待機が完了するとresolveし、中断されるとrejectするPromise
 */
 function interruptibleSleep(ms, signal) {
    return new Promise((resolve, reject) => {
        // 待機開始前にもし既に中断されていたら、即座にエラーを投げる
        if (signal.aborted) {
            const error = new Error("Sleep aborted");
            error.name = "AbortError";
            return reject(error);
        }   

        let timeoutId;

        // 中断信号を受け取った時の処理
        const onAbort = () => {
            clearTimeout(timeoutId); // タイマーをクリア
            const error = new Error("Sleep aborted");
            error.name = "AbortError";
            reject(error); // Promiseをエラーで終了させる
        };

        // 指定時間後にPromiseを成功させるタイマーを設定
        timeoutId = setTimeout(() => {
            signal.removeEventListener('abort', onAbort); // 成功したので中断リスナーは不要
            resolve();
        }, ms);

        // 中断イベントを監視開始
        signal.addEventListener('abort', onAbort, { once: true });
    });
}

// ファイルサイズを読みやすい形式にフォーマット
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// FileオブジェクトをBase64文字列に変換 (Promise)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // result は "data:mime/type;base64,..." の形式なので、ヘッダー部分を除去
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file); // Base64形式で読み込む
    });
}

// Base64文字列をBlobオブジェクトに変換 (Promise)
function base64ToBlob(base64, mimeType) {
    return fetch(`data:${mimeType};base64,${base64}`).then(res => res.blob());
}

// --- Service Worker関連 ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // リロード処理が重複しないように制御するフラグ
        let isReloading = false;

        const reloadPage = () => {
            if (isReloading) return;
            isReloading = true;
            uiUtils.showCustomAlert('アプリが更新されました。ページをリロードします。')
                .then(() => {
                    window.location.reload();
                });
        };

        // 1. Service Workerの自動更新を監視
        navigator.serviceWorker.addEventListener('controllerchange', reloadPage);

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker登録成功 スコープ: ', registration.scope);
                    
                    // 2. 手動更新完了のメッセージを監視
                    navigator.serviceWorker.addEventListener('message', event => {
                        // sw.jsからキャッシュクリア完了のメッセージを受け取ったらリロード
                        if (event.data && event.data.status === 'cacheCleared') {
                            console.log('Service Workerからキャッシュクリア完了のメッセージを受信。リロードを実行します。');
                            reloadPage();
                        }
                    });
                })
                .catch(err => {
                    console.error('ServiceWorker登録失敗: ', err);
                });
        });
    } else {
        console.warn('このブラウザはService Workerをサポートしていません。');
    }
}

// --- IndexedDBユーティリティ (dbUtils) ---
const dbUtils = {
    openDB() {
        return new Promise((resolve, reject) => {
            if (state.db) {
                resolve(state.db);
                return;
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDBエラー:", event.target.error);
                reject(`IndexedDBエラー: ${event.target.error}`);
            };

            request.onsuccess = (event) => {
                state.db = event.target.result;
                console.log("IndexedDBオープン成功");
                // DB全体のエラーハンドリング
                state.db.onerror = (event) => {
                    console.error(`データベースエラー: ${event.target.error}`);
                };
                resolve(state.db);
            };

            // DBバージョン更新時 (スキーマ変更)
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;
                console.log(`IndexedDBをバージョン ${event.oldVersion} から ${event.newVersion} へアップグレード中...`);

                // 設定ストア (変更なし)
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                    console.log(`オブジェクトストア ${SETTINGS_STORE} 作成`);
                }

                // チャットストア & インデックス (変更なし、新しいフラグは動的に追加される)
                let chatStore;
                if (!db.objectStoreNames.contains(CHATS_STORE)) {
                    chatStore = db.createObjectStore(CHATS_STORE, { keyPath: 'id', autoIncrement: true });
                    console.log(`オブジェクトストア ${CHATS_STORE} 作成`);
                } else {
                     if (transaction) {
                        try { chatStore = transaction.objectStore(CHATS_STORE); } catch (e) { console.error("チャットストアの取得中にエラー(アップグレード):", e); return; }
                    } else { console.warn("チャットストアのアップグレード用トランザクション取得失敗"); }
                }

                // インデックスが存在することを確認
                if (chatStore && !chatStore.indexNames.contains(CHAT_UPDATEDAT_INDEX)) {
                    chatStore.createIndex(CHAT_UPDATEDAT_INDEX, 'updatedAt', { unique: false });
                    console.log(`インデックス ${CHAT_UPDATEDAT_INDEX} を ${CHATS_STORE} に作成`);
                }
                if (chatStore && !chatStore.indexNames.contains(CHAT_CREATEDAT_INDEX)) {
                    chatStore.createIndex(CHAT_CREATEDAT_INDEX, 'createdAt', { unique: false });
                    console.log(`インデックス ${CHAT_CREATEDAT_INDEX} を ${CHATS_STORE} に作成`);
                }

                // V8以降: 新しいフラグ (isCascaded, isSelected, siblingGroupId) は
                // スキーマレスなIndexedDBの特性により、保存時に自動的に追加される。
                // 読み込み時に存在しない場合はデフォルト値として扱う。
                if (event.oldVersion < 8) { // 以前のバージョンからのアップグレードの場合
                    console.log("DBアップグレード: 新しいメッセージフラグは動的に処理されます。");
                }
            };
        });
    },

    // 指定されたストアを取得する内部関数
    _getStore(storeName, mode = 'readonly') {
        if (!state.db) throw new Error("データベースが開かれていません");
        const transaction = state.db.transaction([storeName], mode);
        return transaction.objectStore(storeName);
    },

    // 設定を保存
    async saveSetting(key, value) {
        await this.openDB();
        return new Promise((resolve, reject) => {
             try {
                const store = this._getStore(SETTINGS_STORE, 'readwrite');
                // IndexedDBはBlobを直接扱える
                const request = store.put({ key, value });
                request.onsuccess = () => {
                     // console.log(`設定 '${key}' 保存成功`); // ログは必要に応じて
                     resolve();
                };
                request.onerror = (event) => {
                     console.error(`設定 ${key} の保存エラー:`, event.target.error);
                     reject(`設定 ${key} の保存エラー: ${event.target.error}`);
                };
            } catch (error) {
                console.error(`設定 ${key} 保存のためのストアアクセスエラー:`, error);
                reject(`設定 ${key} 保存のためのストアアクセスエラー: ${error}`);
            }
        });
    },

    // 全設定を読み込み
    async loadSettings() {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(SETTINGS_STORE);
            const request = store.getAll();

            request.onsuccess = (event) => {
                const settingsArray = event.target.result;
                const loadedSettings = {};
                const ensureFloat = (v, fallback) => {
                    if (v === null || v === undefined) return fallback;
                    const n = (typeof v === 'string') ? parseFloat(v) : Number(v);
                    return Number.isFinite(n) ? n : fallback;
                };
                if (loadedSettings.chatOverlayOpacity != null && loadedSettings.overlayOpacity == null) {
                loadedSettings.overlayOpacity = ensureFloat(
                    loadedSettings.chatOverlayOpacity,
                    (state?.settings?.overlayOpacity ?? 0.65)
                );
                }
                if (loadedSettings.overlayOpacity != null) {
                    loadedSettings.overlayOpacity = ensureFloat(
                    loadedSettings.overlayOpacity,
                    (state?.settings?.overlayOpacity ?? 0.65)
                );
                }
                settingsArray.forEach(item => {
                    loadedSettings[item.key] = item.value;
                });

                const defaultSettings = { ...state.settings };
                state.settings = { ...defaultSettings };

                for (const key in loadedSettings) {
                        if (key in defaultSettings) {
                        const loadedValue = loadedSettings[key];
                        const defaultValue = defaultSettings[key];

                        if (key === 'backgroundImageBlob') {
                            if (loadedValue instanceof Blob) {
                                    state.settings[key] = loadedValue;
                            } else {
                                    if (loadedValue !== null) console.warn(`読み込んだ 'backgroundImageBlob' がBlobではありません。nullに設定します。型: ${typeof loadedValue}`);
                                    state.settings[key] = null;
                            }
                        } else if (
                            key === 'darkMode' || key === 'streamingOutput' || 
                            key === 'pseudoStreaming' || key === 'enterToSend' || 
                            key === 'concatDummyModel' || key === 'hideSystemPromptInChat' ||
                            key === 'enableSwipeNavigation' || key === 'includeThoughts' ||
                            key === 'geminiEnableGrounding' || key === 'geminiEnableFunctionCalling' ||
                            key === 'enableProofreading' || key === 'enableAutoRetry' ||
                            key === 'useFixedRetryDelay' ||
                            key === 'applyDummyToProofread' ||
                            key === 'applyDummyToTranslate' ||
                            key === 'enableThoughtTranslation' ||
                            key === 'allowPromptUiChanges'
                        ) {
                                state.settings[key] = loadedValue === true;
                        } else if (key === 'thinkingBudget') {
                            const num = parseInt(loadedValue, 10);
                            if (isNaN(num) || num < 0) {
                                state.settings[key] = null;
                            } else {
                                state.settings[key] = num;
                            }
                        } else if (typeof defaultValue === 'number' || defaultValue === null) {
                                let num;
                                if (key === 'temperature' || key === 'topP' || key === 'presencePenalty' || key === 'frequencyPenalty' || key === 'overlayOpacity' || key === 'messageOpacity') {
                                num = parseFloat(loadedValue);
                            } else {
                                num = parseInt(loadedValue, 10);
                            }

                                if (isNaN(num)) {
                                    if ((key === 'temperature' || key === 'maxTokens' || key === 'topK' || key === 'topP' || key === 'presencePenalty' || key === 'frequencyPenalty') && (loadedValue === null || loadedValue === '')) {
                                        state.settings[key] = null;
                                    } else {
                                        state.settings[key] = defaultValue;
                                    }
                                } else {
                                    if (key === 'temperature' && (num < 0 || num > 2)) num = defaultValue;
                                    if (key === 'maxTokens' && num < 1) num = defaultValue;
                                    if (key === 'topK' && num < 1) num = defaultValue;
                                    if (key === 'topP' && (num < 0 || num > 1)) num = defaultValue;
                                    if (key === 'streamingSpeed' && num < 0) num = defaultValue;
                                    if ((key === 'presencePenalty' || key === 'frequencyPenalty') && (num < -2.0 || num > 2.0)) num = defaultValue;
                                    if (key === 'overlayOpacity')   num = Math.min(1, Math.max(0,    num));
                                    if (key === 'messageOpacity')   num = Math.min(1, Math.max(0.10, num));
                                    state.settings[key] = num;
                                }
                        } else if (typeof defaultValue === 'string') {
                                state.settings[key] = typeof loadedValue === 'string' ? loadedValue : defaultValue;
                        } else {
                            // この警告は '予期しない設定タイプ' として残す
                            console.warn(`予期しない設定タイプ キー: ${key}`);
                            state.settings[key] = loadedValue;
                        }
                    } else {
                        // DBに存在するがstateのデフォルトにないキーは無視
                        // console.warn(`DBから読み込んだ未知の設定を無視: ${key}`);
                    }
                }

                if (state.settings.darkMode !== true && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        console.log("OSのダークモード設定を初期適用");
                        state.settings.darkMode = true;
                }

                console.log("設定読み込み完了:", { ...state.settings, backgroundImageBlob: state.settings.backgroundImageBlob ? '[Blob]' : null });
                {
                    uiUtils.applyOverlayOpacity();
                    const ov = Number(state.settings?.overlayOpacity ?? 0.65);
                    const ovPct = Math.round(ov * 100);
                    const ovSlider = document.getElementById('overlay-opacity-slider');
                    const ovValue  = document.getElementById('overlay-opacity-value');
                    if (ovSlider) {
                        const clamped = Math.max(0, Math.min(95, Math.round(ovPct / 5) * 5));
                        ovSlider.value = clamped;
                    }
                    if (ovValue) ovValue.textContent = `${ovPct}%`;
                    document.documentElement.style.setProperty('--overlay-opacity', String(ov));
                    
                    const mv = Number(state.settings?.messageOpacity ?? 1);
                    const mvPct = Math.round(mv * 100);
                    const msgSlider = document.getElementById('message-opacity-slider');
                    const msgValue  = document.getElementById('message-opacity-value');
                    if (msgSlider) {
                        const clamped = Math.max(10, Math.min(100, Math.round(mvPct / 5) * 5));
                        msgSlider.value = clamped;
                    }
                    if (msgValue) msgValue.textContent = `${mvPct}%`;
                    document.documentElement.style.setProperty('--message-bubble-opacity', String(mv));
                    }
                resolve(state.settings);
            };
            request.onerror = (event) => reject(`設定読み込みエラー: ${event.target.error}`);
        });
    },

    async saveChat(optionalTitle = null, chatObjectToSave = null) { // 第2引数を追加
        await this.openDB();
        
        // 引数でチャットオブジェクトが渡されなかった場合、現在のstateから生成する（従来の動作）
        if (!chatObjectToSave) {
            if ((!state.currentMessages || state.currentMessages.length === 0) && !state.currentSystemPrompt) {
                if(state.currentChatId) console.log(`saveChat: 既存チャット ${state.currentChatId} にメッセージもシステムプロンプトもないため保存せず`);
                else console.log("saveChat: 新規チャットに保存するメッセージもシステムプロンプトもなし");
                return Promise.resolve(state.currentChatId);
            }
            
            const messagesToSave = state.currentMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                thoughtSummary: msg.thoughtSummary || null,
                tool_calls: msg.tool_calls || null,
                ...(msg.finishReason && { finishReason: msg.finishReason }),
                ...(msg.safetyRatings && { safetyRatings: msg.safetyRatings }),
                ...(msg.error && { error: msg.error }),
                ...(msg.isCascaded !== undefined && { isCascaded: msg.isCascaded }),
                ...(msg.isSelected !== undefined && { isSelected: msg.isSelected }),
                ...(msg.siblingGroupId !== undefined && { siblingGroupId: msg.siblingGroupId }),
                ...(msg.groundingMetadata && { groundingMetadata: msg.groundingMetadata }),
                ...(msg.attachments && msg.attachments.length > 0 && { attachments: msg.attachments }),
                ...(msg.usageMetadata && { usageMetadata: msg.usageMetadata }),
                ...(msg.executedFunctions && { executedFunctions: msg.executedFunctions }),
                ...(msg.generated_images && msg.generated_images.length > 0 && { generated_images: msg.generated_images }),
                // ▼▼▼ ここから変更 ▼▼▼
                ...(msg.generated_videos && msg.generated_videos.length > 0 && { 
                    generated_videos: msg.generated_videos.map(video => ({
                        base64Data: video.base64Data, // Base64データのみ保存
                        prompt: video.prompt
                    }))
                }),
                // ▲▲▲ ここまで変更 ▲▲▲
                ...(msg.isHidden === true && { isHidden: true }),
                ...(msg.isAutoTrigger === true && { isAutoTrigger: true })
            }));
    
            chatObjectToSave = {
                messages: messagesToSave,
                systemPrompt: state.currentSystemPrompt,
                persistentMemory: state.currentPersistentMemory || {},
            };
        }
    
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE, 'readwrite');
            const now = Date.now();
    
            const determineTitleAndSave = (existingChatData = null) => {
                let title;
                if (optionalTitle !== null) {
                    title = optionalTitle;
                } else if (existingChatData && existingChatData.title) {
                    title = existingChatData.title;
                } else {
                    const firstUserMessage = (chatObjectToSave.messages || []).find(m => m.role === 'user' && !m.isHidden);
                    title = firstUserMessage ? firstUserMessage.content.substring(0, 50) : "無題のチャット";
                }
    
                const chatIdForOperation = existingChatData ? existingChatData.id : state.currentChatId;
                const chatData = {
                    ...chatObjectToSave, // 引数またはstateから生成されたオブジェクトを展開
                    updatedAt: now,
                    createdAt: existingChatData ? existingChatData.createdAt : now,
                    title: title,
                };
                if (chatIdForOperation) {
                    chatData.id = chatIdForOperation;
                }
    
                const request = store.put(chatData);
                request.onsuccess = (event) => {
                    const savedId = event.target.result;
                    if (!state.currentChatId && savedId) {
                        state.currentChatId = savedId;
                    }
                    console.log(`チャット ${state.currentChatId ? '更新' : '保存'} 完了 ID:`, state.currentChatId || savedId);
                    if ((state.currentChatId || savedId) === (chatIdForOperation || savedId)) {
                        uiUtils.updateChatTitle(chatData.title);
                    }
                    resolve(state.currentChatId || savedId);
                };
                request.onerror = (event) => reject(`チャット保存エラー: ${event.target.error}`);
            };
    
            if (state.currentChatId) {
                const getRequest = store.get(state.currentChatId);
                getRequest.onsuccess = (event) => {
                    const existingChat = event.target.result;
                     if (!existingChat) {
                         console.warn(`ID ${state.currentChatId} のチャットが見つかりません(保存時)。新規として保存します。`);
                         state.currentChatId = null;
                         determineTitleAndSave(null);
                    } else {
                        determineTitleAndSave(existingChat);
                    }
                };
                getRequest.onerror = (event) => {
                    console.error("既存チャットの取得エラー(更新用):", event.target.error);
                    console.warn("既存チャット取得エラーのため、新規として保存を試みます。");
                    state.currentChatId = null;
                    determineTitleAndSave(null);
                };
            } else {
                determineTitleAndSave(null);
            }
    
            store.transaction.onerror = (event) => {
                console.error("チャット保存トランザクション失敗:", event.target.error);
                reject(`チャット保存トランザクション失敗: ${event.target.error}`);
            };
        });
    },

    // チャットタイトルをDBで更新
    async updateChatTitleDb(id, newTitle) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE, 'readwrite');
            const getRequest = store.get(id);
            getRequest.onsuccess = (event) => {
                const chatData = event.target.result;
                if (chatData) {
                    chatData.title = newTitle;
                    chatData.updatedAt = Date.now(); // 更新日時も更新
                    const putRequest = store.put(chatData);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = (event) => reject(`タイトル更新エラー: ${event.target.error}`);
                } else {
                    reject(`チャットが見つかりません: ${id}`);
                }
            };
            getRequest.onerror = (event) => reject(`タイトル更新用チャット取得エラー: ${event.target.error}`);
            store.transaction.onerror = (event) => reject(`タイトル更新トランザクション失敗: ${event.target.error}`);
        });
    },

    // 指定IDのチャットを取得
    async getChat(id) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE);
            const request = store.get(id);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`チャット ${id} 取得エラー: ${event.target.error}`);
        });
    },

    // 全チャットを取得 (ソート順指定可)
    async getAllChats(sortBy = 'updatedAt') {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE);
            const indexName = sortBy === 'createdAt' ? CHAT_CREATEDAT_INDEX : CHAT_UPDATEDAT_INDEX;
            // インデックスが存在するか確認
            if (!store.indexNames.contains(indexName)) {
                 console.error(`インデックス "${indexName}" が見つかりません。主キー順でフォールバックします。`);
                 // フォールバック: 主キー順で取得して逆順にする
                 const getAllRequest = store.getAll();
                 getAllRequest.onsuccess = (event) => resolve(event.target.result.reverse()); // 新しいものが上に来るように
                 getAllRequest.onerror = (event) => reject(`全チャット取得エラー(フォールバック): ${event.target.error}`);
                 return;
            }
            // インデックスを使ってカーソルを開く (降順)
            const index = store.index(indexName);
            const request = index.openCursor(null, 'prev'); // 'prev'で降順
            const chats = [];
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    chats.push(cursor.value);
                    cursor.continue();
                } else {
                    // カーソル終了
                    resolve(chats);
                }
            };
            request.onerror = (event) => reject(`全チャット取得エラー (${sortBy}順): ${event.target.error}`);
        });
    },

    // 指定IDのチャットを削除
    async deleteChat(id) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => { console.log("チャット削除:", id); resolve(); };
            request.onerror = (event) => reject(`チャット ${id} 削除エラー: ${event.target.error}`);
        });
    },

    // 全データ (設定とチャット) をクリア
    async clearAllData() {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = state.db.transaction([SETTINGS_STORE, CHATS_STORE], 'readwrite');
            let storesCleared = 0;
            const totalStores = 2;

            const onComplete = () => {
                if (++storesCleared === totalStores) {
                    console.log("IndexedDBの全データ削除完了");
                    resolve();
                }
            };
            const onError = (storeName, event) => reject(`${storeName} クリアエラー: ${event.target.error}`);

            const settingsStore = transaction.objectStore(SETTINGS_STORE);
            const chatsStore = transaction.objectStore(CHATS_STORE);

            const clearSettingsReq = settingsStore.clear();
            const clearChatsReq = chatsStore.clear();

            clearSettingsReq.onsuccess = onComplete;
            clearSettingsReq.onerror = (e) => onError(SETTINGS_STORE, e);
            clearChatsReq.onsuccess = onComplete;
            clearChatsReq.onerror = (e) => onError(CHATS_STORE, e);

            transaction.onerror = (event) => reject(`データクリアトランザクション失敗: ${event.target.error}`);
        });
    }
};

// --- UIユーティリティ (uiUtils) ---
const uiUtils = {
    setLoadingIndicatorText(text) {
        elements.loadingIndicator.textContent = text;
    },
    // オーバーレイの透明度を適用
    applyOverlayOpacity() {
        const opacityValue = state.settings.overlayOpacity ?? 0.75; // デフォルト値を0.75に
        document.documentElement.style.setProperty('--overlay-opacity-value', opacityValue);
        console.log(`オーバーレイ透明度適用: ${opacityValue}`);
    },
    // チャットメッセージをレンダリング
    // app.js の uiUtils.renderChatMessages を以下に置換
    renderChatMessages() {
        if (state.editingMessageIndex !== null) {
            const messageElement = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            if (messageElement) appLogic.cancelEditMessage(state.editingMessageIndex, messageElement);
            else state.editingMessageIndex = null;
        }
        elements.messageContainer.innerHTML = '';

        // --- ▼▼▼ 再構築されたロジック ▼▼▼ ---

        // 1. 描画すべきメッセージのインデックスリストを作成
        const visibleMessageIndices = [];
        const processedGroupIds = new Set();

        state.currentMessages.forEach((msg, index) => {
            if (msg.isHidden) return;

            if (msg.isCascaded && msg.siblingGroupId) {
                if (!processedGroupIds.has(msg.siblingGroupId)) {
                    // グループ未処理の場合、選択されている兄弟を探して追加
                    const selectedSibling = state.currentMessages.find(
                        m => m.siblingGroupId === msg.siblingGroupId && m.isSelected && !m.isHidden
                    );
                    if (selectedSibling) {
                        visibleMessageIndices.push(state.currentMessages.indexOf(selectedSibling));
                    }
                    processedGroupIds.add(msg.siblingGroupId);
                }
            } else {
                // カスケードでないメッセージは常に追加
                visibleMessageIndices.push(index);
            }
        });

        // 2. 描画リストに基づいてメッセージを生成
        visibleMessageIndices.forEach(index => {
            const msg = state.currentMessages[index];
            if (!msg) return;

            // ツール応答はUIに直接表示しない
            if (msg.role === 'tool') return;

            let cascadeInfo = null;
            if (msg.isCascaded && msg.siblingGroupId) {
                const siblings = state.currentMessages.filter(
                    m => m.siblingGroupId === msg.siblingGroupId && !m.isHidden
                );
                const currentIndexInGroup = siblings.findIndex(m => m === msg);
                cascadeInfo = {
                    currentIndex: currentIndexInGroup + 1,
                    total: siblings.length,
                    siblingGroupId: msg.siblingGroupId
                };
            }
            this.appendMessage(msg.role, msg.content, index, false, cascadeInfo, msg.attachments);
        });
        
        // --- ▲▲▲ ロジックここまで ▲▲▲ ---

        if (window.Prism) {
            Prism.highlightAll();
        }
    },


    appendMessage(role, content, index, isStreamingPlaceholder = false, cascadeInfo = null, attachments = null) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', role);
        messageDiv.dataset.index = index;

        const messageData = state.currentMessages[index];
        
        if (role === 'model' && messageData && messageData.thoughtSummary) {
            const thoughtDetails = document.createElement('details');
            thoughtDetails.classList.add('thought-summary-details');

            const thoughtSummaryElem = document.createElement('summary');
            thoughtSummaryElem.textContent = '思考プロセス';
            thoughtDetails.appendChild(thoughtSummaryElem);

            const thoughtContentDiv = document.createElement('div');
            thoughtContentDiv.classList.add('thought-summary-content');
            if (isStreamingPlaceholder) {
                thoughtContentDiv.id = `streaming-thought-summary-${index}`;
                thoughtContentDiv.innerHTML = '';
            } else {
                try {
                    thoughtContentDiv.innerHTML = marked.parse(messageData.thoughtSummary || '');
                } catch (e) {
                    console.error("Thought Summary Markdownパースエラー:", e);
                    thoughtContentDiv.textContent = messageData.thoughtSummary || '';
                }
            }
            thoughtDetails.appendChild(thoughtContentDiv);
            messageDiv.appendChild(thoughtDetails);
        }

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        if (isStreamingPlaceholder) {
            contentDiv.id = `streaming-content-${index}`;
        }

        if (role === 'user' && attachments && attachments.length > 0) {
            const details = document.createElement('details');
            details.classList.add('attachment-details');
            const summary = document.createElement('summary');
            summary.textContent = `添付ファイル (${attachments.length}件)`;
            details.appendChild(summary);
            const list = document.createElement('ul');
            list.classList.add('attachment-list');
            attachments.forEach(att => {
                const listItem = document.createElement('li');
                listItem.textContent = att.name;
                listItem.title = `${att.name} (${att.mimeType})`;
                list.appendChild(listItem);
            });
            details.appendChild(list);
            contentDiv.appendChild(details);
            if (content && content.trim() !== '') {
                const pre = document.createElement('pre');
                pre.textContent = content;
                pre.style.marginTop = '8px';
                contentDiv.appendChild(pre);
            }
        } else {
            try {
                if (content && (role === 'model' || role === 'user')) {
                     if (role === 'model' && !isStreamingPlaceholder && typeof marked !== 'undefined') {
                        contentDiv.innerHTML = marked.parse(content || '');
                    } else {
                        const pre = document.createElement('pre'); pre.textContent = content; contentDiv.appendChild(pre);
                    }
                } else if (role === 'error') {
                     const p = document.createElement('p'); p.textContent = content; contentDiv.appendChild(p);
                }
            } catch (e) {
                 console.error("Markdownパースエラー:", e);
                 const pre = document.createElement('pre'); pre.textContent = content; contentDiv.innerHTML = ''; contentDiv.appendChild(pre);
            }
        }
        messageDiv.appendChild(contentDiv);
        
        if (role === 'model' && messageData && messageData.groundingMetadata &&
            ( (messageData.groundingMetadata.groundingChunks && messageData.groundingMetadata.groundingChunks.length > 0) ||
              (messageData.groundingMetadata.webSearchQueries && messageData.groundingMetadata.webSearchQueries.length > 0) )
           )
        {
            try {
                const details = document.createElement('details');
                details.classList.add('citation-details');
                const summary = document.createElement('summary');
                summary.textContent = '引用元/検索クエリ';
                details.appendChild(summary);
                let detailsHasContent = false;
                if (messageData.groundingMetadata.groundingChunks && messageData.groundingMetadata.groundingChunks.length > 0) {
                    const citationList = document.createElement('ul');
                    citationList.classList.add('citation-list');
                    const citationMap = new Map();
                    let displayIndexCounter = 1;
                    if (messageData.groundingMetadata.groundingSupports) {
                        messageData.groundingMetadata.groundingSupports.forEach(support => {
                            if (support.groundingChunkIndices) {
                                support.groundingChunkIndices.forEach(chunkIndex => {
                                    if (!citationMap.has(chunkIndex) && chunkIndex >= 0 && chunkIndex < messageData.groundingMetadata.groundingChunks.length) {
                                        const chunk = messageData.groundingMetadata.groundingChunks[chunkIndex];
                                        if (chunk?.web?.uri) {
                                            citationMap.set(chunkIndex, {
                                                uri: chunk.web.uri,
                                                title: chunk.web.title || 'タイトル不明',
                                                displayIndex: displayIndexCounter++
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                    const sortedCitations = Array.from(citationMap.entries())
                                                .sort(([, a], [, b]) => a.displayIndex - b.displayIndex);
                    sortedCitations.forEach(([chunkIndex, citationInfo]) => {
                        const listItem = document.createElement('li');
                        const link = document.createElement('a');
                        link.href = citationInfo.uri;
                        link.textContent = `[${citationInfo.displayIndex}] ${citationInfo.title}`;
                        link.title = citationInfo.title;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        listItem.appendChild(link);
                        citationList.appendChild(listItem);
                    });
                    if (sortedCitations.length === 0) {
                         messageData.groundingMetadata.groundingChunks.forEach((chunk, idx) => {
                             if (chunk?.web?.uri) {
                                 const listItem = document.createElement('li');
                                 const link = document.createElement('a');
                                 link.href = chunk.web.uri;
                                 link.textContent = chunk.web.title || `ソース ${idx + 1}`;
                                 link.title = chunk.web.title || 'タイトル不明';
                                 link.target = '_blank';
                                 link.rel = 'noopener noreferrer';
                                 listItem.appendChild(link);
                                 citationList.appendChild(listItem);
                             }
                         });
                    }
                    if (citationList.hasChildNodes()) {
                        details.appendChild(citationList);
                        detailsHasContent = true;
                    }
                }
                if (messageData.groundingMetadata.webSearchQueries && messageData.groundingMetadata.webSearchQueries.length > 0) {
                    if (detailsHasContent) {
                        const separator = document.createElement('hr');
                        separator.style.marginTop = '10px';
                        separator.style.marginBottom = '8px';
                        separator.style.border = 'none';
                        separator.style.borderTop = '1px dashed var(--border-tertiary)'; 
                        details.appendChild(separator);
                    }
                    const queryHeader = document.createElement('div');
                    queryHeader.textContent = '検索に使用されたクエリ:';
                    queryHeader.style.fontWeight = '500';
                    queryHeader.style.marginTop = detailsHasContent ? '0' : '8px';
                    queryHeader.style.marginBottom = '4px';
                    queryHeader.style.fontSize = '11px';
                    queryHeader.style.color = 'var(--text-secondary)';
                    details.appendChild(queryHeader);
                    const queryList = document.createElement('ul');
                    queryList.classList.add('search-query-list');
                    queryList.style.listStyle = 'none';
                    queryList.style.paddingLeft = '0';
                    queryList.style.margin = '0';
                    queryList.style.fontSize = '11px';
                    queryList.style.color = 'var(--text-secondary)';
                    messageData.groundingMetadata.webSearchQueries.forEach(query => {
                        const queryItem = document.createElement('li');
                        queryItem.textContent = `• ${query}`;
                        queryItem.style.marginBottom = '3px';
                        queryList.appendChild(queryItem);
                    });
                    details.appendChild(queryList);
                    detailsHasContent = true;
                }
                if (detailsHasContent) {
                    contentDiv.appendChild(details);
                }
            } catch (e) {
                console.error(`引用元/検索クエリ表示の生成中にエラーが発生しました (index: ${index}):`, e);
            }
        }
        
        if (role === 'model' && messageData && messageData.executedFunctions && messageData.executedFunctions.length > 0) {
            const details = document.createElement('details');
            details.classList.add('function-call-details');
            const uniqueFunctions = [...new Set(messageData.executedFunctions)];
            const summary = document.createElement('summary');
            summary.innerHTML = `⚙️ ツール使用 (${uniqueFunctions.length}件)`;
            details.appendChild(summary);
            const list = document.createElement('ul');
            list.classList.add('function-call-list');
            uniqueFunctions.forEach(funcName => {
                const listItem = document.createElement('li');
                listItem.textContent = funcName;
                list.appendChild(listItem);
            });
            details.appendChild(list);
            if (contentDiv.innerHTML.trim() !== '') {
                contentDiv.appendChild(details);
            } else {
                messageDiv.appendChild(details);
            }
        }

        if (role === 'model' && messageData && messageData.search_web_results && messageData.search_web_results.length > 0) {
            const details = document.createElement('details');
            details.classList.add('function-call-details');
            const summary = document.createElement('summary');
            summary.innerHTML = `🌐 Web検索結果 (${messageData.search_web_results.length}件)`;
            details.appendChild(summary);
            const list = document.createElement('ul');
            list.classList.add('function-call-list');
            messageData.search_web_results.forEach(result => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = result.link;
                link.textContent = result.title;
                link.title = result.snippet;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                listItem.appendChild(link);
                list.appendChild(listItem);
            });
            details.appendChild(list);
            if (contentDiv.innerHTML.trim() !== '') {
                contentDiv.appendChild(details);
            } else {
                messageDiv.appendChild(details);
            }
        }

        // --- ★★★ ここからが修正箇所 ★★★ ---
        // [IMAGE_HERE] を実際の画像に置換する処理
        const imagePlaceholderRegex = /\[IMAGE_HERE\]/g;
        if (role === 'model' && messageData && messageData.generated_images && messageData.generated_images.length > 0) {
            console.log(`[Debug] appendMessage: ${messageData.generated_images.length}枚の生成画像をレンダリングします。`); // ★ デバッグログ
            
            let imageIndex = 0;
            const replacedHtml = contentDiv.innerHTML.replace(imagePlaceholderRegex, () => {
                if (imageIndex < messageData.generated_images.length) {
                    const imageData = messageData.generated_images[imageIndex];
                    imageIndex++;
                    const img = document.createElement('img');
                    img.alt = '生成された画像';
                    img.style.maxWidth = '100%';
                    img.style.borderRadius = 'var(--border-radius-md)';
                    img.style.marginTop = '8px';
                    img.src = `data:${imageData.mimeType};base64,${imageData.data}`;
                    return img.outerHTML;
                }
                return ''; // プレースホルダーが画像の数より多い場合は空文字に置換
            });
            contentDiv.innerHTML = replacedHtml;

            // プレースホルダーがなかった場合、画像のコンテナを末尾に追加
            if (imageIndex < messageData.generated_images.length) {
                for (let i = imageIndex; i < messageData.generated_images.length; i++) {
                    const imageData = messageData.generated_images[i];
                    const img = document.createElement('img');
                    img.alt = '生成された画像';
                    img.style.maxWidth = '100%';
                    img.style.borderRadius = 'var(--border-radius-md)';
                    img.style.marginTop = '8px';
                    img.src = `data:${imageData.mimeType};base64,${imageData.data}`;
                    contentDiv.appendChild(img);
                }
            }
        }
        // --- ★★★ 修正箇所ここまで ★★★ ---

        if (role === 'model' && messageData && messageData.generated_videos && messageData.generated_videos.length > 0) {
            const videoData = messageData.generated_videos[0];
            if (videoData && (videoData.url || videoData.base64Data)) {
                const video = document.createElement('video');
                video.controls = true; 
                video.playsInline = true; 
                video.muted = true; 
                video.loop = true; 
                video.style.maxWidth = '100%';
                video.style.borderRadius = 'var(--border-radius-md)';
                video.style.display = 'block';

                if (videoData.url) {
                    video.src = videoData.url;
                } else if (videoData.base64Data) {
                    base64ToBlob(videoData.base64Data, 'video/mp4')
                        .then(blob => {
                            const objectURL = URL.createObjectURL(blob);
                            video.src = objectURL;
                        })
                        .catch(err => {
                            console.error("Base64からの動画Blob生成に失敗:", err);
                            video.remove();
                        });
                }

                const placeholderRegex = /\[VIDEO_HERE\]/g;
                if (placeholderRegex.test(contentDiv.innerHTML)) {
                    let replaced = false;
                    contentDiv.innerHTML = contentDiv.innerHTML.replace(placeholderRegex, (match) => {
                        if (!replaced) {
                            replaced = true;
                            return video.outerHTML;
                        }
                        return '';
                    });
                }
            }
        }

        const editArea = document.createElement('div');
        editArea.classList.add('message-edit-area', 'hidden');
        messageDiv.appendChild(editArea);

        if (role === 'model' && cascadeInfo && cascadeInfo.total > 1) {
            const cascadeControlsDiv = document.createElement('div');
            cascadeControlsDiv.classList.add('message-cascade-controls');
            const prevButton = document.createElement('button');
            prevButton.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
            prevButton.title = '前の応答';
            prevButton.classList.add('cascade-prev-btn');
            prevButton.disabled = cascadeInfo.currentIndex <= 1;
            prevButton.onclick = () => appLogic.navigateCascade(index, 'prev');
            cascadeControlsDiv.appendChild(prevButton);
            const indicatorSpan = document.createElement('span');
            indicatorSpan.classList.add('cascade-indicator');
            indicatorSpan.textContent = `${cascadeInfo.currentIndex}/${cascadeInfo.total}`;
            cascadeControlsDiv.appendChild(indicatorSpan);
            const nextButton = document.createElement('button');
            nextButton.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
            nextButton.title = '次の応答';
            nextButton.classList.add('cascade-next-btn');
            nextButton.disabled = cascadeInfo.currentIndex >= cascadeInfo.total;
            nextButton.onclick = () => appLogic.navigateCascade(index, 'next');
            cascadeControlsDiv.appendChild(nextButton);
            const deleteCascadeButton = document.createElement('button');
            deleteCascadeButton.innerHTML = '<span class="material-symbols-outlined">delete</span>';
            deleteCascadeButton.title = 'この応答を削除';
            deleteCascadeButton.classList.add('cascade-delete-btn');
            deleteCascadeButton.onclick = () => appLogic.confirmDeleteCascadeResponse(index);
            cascadeControlsDiv.appendChild(deleteCascadeButton);
            messageDiv.appendChild(cascadeControlsDiv);
        }

        if (role !== 'error') {
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('message-actions');
            const editButton = document.createElement('button');
            editButton.innerHTML = '<span class="material-symbols-outlined">edit</span> 編集'; 
            editButton.title = 'メッセージを編集'; 
            editButton.classList.add('js-edit-btn');
            editButton.onclick = () => appLogic.startEditMessage(index, messageDiv);
            actionsDiv.appendChild(editButton);
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<span class="material-symbols-outlined">delete</span> 削除'; 
            deleteButton.title = 'この会話ターンを削除'; 
            deleteButton.classList.add('js-delete-btn');
            deleteButton.onclick = () => appLogic.deleteMessage(index);
            actionsDiv.appendChild(deleteButton);
            if (role === 'user') {
                const retryButton = document.createElement('button');
                retryButton.innerHTML = '<span class="material-symbols-outlined">replay</span> 再生成'; 
                retryButton.title = 'このメッセージから再生成'; 
                retryButton.classList.add('js-retry-btn');
                retryButton.onclick = () => appLogic.retryFromMessage(index);
                actionsDiv.appendChild(retryButton);
            }
            if (role === 'model' && messageData?.usageMetadata &&
                typeof messageData.usageMetadata.candidatesTokenCount === 'number' &&
                typeof messageData.usageMetadata.totalTokenCount === 'number')
            {
                const usage = messageData.usageMetadata;
                const tokenSpan = document.createElement('span');
                tokenSpan.classList.add('token-count-display');
                let finalTotalTokenCount = usage.totalTokenCount;
                if (typeof messageData.usageMetadata.thoughtsTokenCount === 'number') {
                    finalTotalTokenCount -= messageData.usageMetadata.thoughtsTokenCount;
                }
                const formattedCandidates = usage.candidatesTokenCount.toLocaleString('en-US');
                const formattedTotal = finalTotalTokenCount.toLocaleString('en-US');
                tokenSpan.textContent = `${formattedCandidates} / ${formattedTotal}`;
                tokenSpan.title = `Candidate Tokens / Total Tokens`;
                actionsDiv.appendChild(tokenSpan);
            }
            if (role === 'model' && typeof messageData?.retryCount === 'number' && messageData.retryCount > 0) {
                const retrySpan = document.createElement('span');
                retrySpan.classList.add('token-count-display');
                retrySpan.textContent = `(リトライ: ${messageData.retryCount}回)`;
                retrySpan.title = `APIリクエストを${messageData.retryCount}回再試行した結果です`;
                if (actionsDiv.querySelector('.token-count-display')) {
                    retrySpan.style.marginLeft = '8px';
                }
                actionsDiv.appendChild(retrySpan);
            }
            messageDiv.appendChild(actionsDiv);
        }

        if (isStreamingPlaceholder) {
            messageDiv.id = `streaming-message-${index}`;
        }
        elements.messageContainer.appendChild(messageDiv);
    },

    // ストリーミング中のメッセージを更新
    updateStreamingMessage(index, newChar, isThoughtSummary = false) { // newChar は実際には使わなくなる
        const messageDiv = document.getElementById(`streaming-message-${index}`);
        if (messageDiv && typeof marked !== 'undefined') {
            let targetContentDiv;
            let streamContent;

            if (isThoughtSummary) {
                targetContentDiv = messageDiv.querySelector(`#streaming-thought-summary-${index}`);
                streamContent = state.partialThoughtStreamContent; // stateから直接取得
            } else {
                targetContentDiv = messageDiv.querySelector('.message-content');
                streamContent = state.partialStreamContent; // stateから直接取得
            }

            if (targetContentDiv) {
                try {
                    targetContentDiv.innerHTML = marked.parse(streamContent || '');
                } catch (e) {
                    console.error(`ストリーミング更新中のMarkdownパースエラー (${isThoughtSummary ? 'Thought' : 'Content'}):`, e);
                    targetContentDiv.textContent = streamContent;
                }
            }
            if (!isThoughtSummary) {
                this.scrollToBottom();
            }
        }
    },

    // ストリーミングメッセージの完了処理
    finalizeStreamingMessage(index) {
        const messageDiv = document.getElementById(`streaming-message-${index}`);
        if (messageDiv) {
            const finalMessageData = state.currentMessages[index];
            if (!finalMessageData) return;

            // Thought Summary の最終処理
            if (finalMessageData.thoughtSummary) {
                const thoughtContentDiv = messageDiv.querySelector(`#streaming-thought-summary-${index}`);
                if (thoughtContentDiv && typeof marked !== 'undefined') {
                    try {
                        thoughtContentDiv.innerHTML = marked.parse(finalMessageData.thoughtSummary || '');
                    } catch (e) {
                        console.error("Thought Summary ストリーミング完了時のMarkdownパースエラー:", e);
                        thoughtContentDiv.textContent = finalMessageData.thoughtSummary || '';
                    }
                    thoughtContentDiv.removeAttribute('id'); // IDを削除
                } else if (thoughtContentDiv) {
                    thoughtContentDiv.textContent = finalMessageData.thoughtSummary || '';
                    thoughtContentDiv.removeAttribute('id');
                }
            }

            // 通常コンテンツの最終処理
            const contentDiv = messageDiv.querySelector('.message-content');
            // stateから最終的なコンテンツを取得
            const finalRawContent = finalMessageData.content || '';
            if (contentDiv && typeof marked !== 'undefined') {
                 try {
                     // 最終コンテンツをMarkdownとしてパース
                     contentDiv.innerHTML = marked.parse(finalRawContent);
                 } catch (e) {
                     console.error("ストリーミング完了時のMarkdownパースエラー:", e);
                     contentDiv.textContent = finalRawContent; // エラー時はテキスト表示
                 }
            } else if (contentDiv) {
                contentDiv.textContent = finalRawContent; // markedがない場合のフォールバック
            }
            messageDiv.removeAttribute('id'); // IDを削除

            // Prism.jsでシンタックスハイライトを適用
            if (window.Prism) {
                messageDiv.querySelectorAll('pre code').forEach((block) => {
                    Prism.highlightElement(block);
                });
            }

            // ストリーミング完了後、カスケードコントロールが必要かチェックして再描画
            // (リトライ直後など、応答候補が増えた場合に必要)
            const msgData = state.currentMessages[index];
            if (msgData && msgData.role === 'model' && msgData.isCascaded) {
                const siblings = appLogic.getCascadedSiblings(index);
                if (siblings.length > 1) {
                    // コントロールを再生成または更新
                    // 一旦、renderChatMessagesを呼び出すのが簡単かもしれない
                    this.renderChatMessages(); // UI全体を再描画
                }
            }
        }
        this.scrollToBottom(); // 最後にスクロール
    },

    // エラーメッセージを表示
    displayError(message, isApiError = false) {
        console.error("エラー表示:", message);
        const errorIndex = state.currentMessages.length; // 現在のメッセージリストの末尾に追加
        this.appendMessage('error', `エラー: ${message}`, errorIndex);
        elements.loadingIndicator.classList.add('hidden'); // ローディング非表示
        this.setSendingState(false); // 送信状態解除
    },

    // チャットコンテナの最下部へスクロール
    scrollToBottom() {
        requestAnimationFrame(() => { // 次の描画タイミングで実行
            const mainContent = elements.chatScreen.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = mainContent.scrollHeight;
            }
        });
    },

    // チャットタイトルを更新
    updateChatTitle(definitiveTitle = null) {
        let titleText = '新規チャット';
        let baseTitle = '';
        let isNewChat = !state.currentChatId;

        if (state.currentChatId) { // 既存チャットの場合
            isNewChat = false;
            if (definitiveTitle !== null) { // 引数でタイトルが指定されていればそれを使う
                baseTitle = definitiveTitle;
            } else { // 指定がなければメッセージから推測 (ユーザーメッセージ優先)
                const firstUserMessage = state.currentMessages.find(m => m.role === 'user' && !m.isHidden);
                if (firstUserMessage) {
                    baseTitle = firstUserMessage.content;
                } else if (state.currentMessages.length > 0) { // ユーザーメッセージ以外でもメッセージがあれば
                    baseTitle = "チャット履歴";
                }
            }
            // タイトルを切り詰める
            if(baseTitle) {
                // インポート接頭辞を除いて切り詰める
                const displayBase = baseTitle.startsWith(IMPORT_PREFIX) ? baseTitle.substring(IMPORT_PREFIX.length) : baseTitle;
                const truncated = displayBase.substring(0, CHAT_TITLE_LENGTH);
                titleText = truncated + (displayBase.length > CHAT_TITLE_LENGTH ? '...' : '');
                // インポート接頭辞を再度付与
                if (baseTitle.startsWith(IMPORT_PREFIX)) {
                    titleText = IMPORT_PREFIX + titleText;
                }
            } else if(state.currentMessages.length > 0) { // メッセージがあれば (SPは考慮しない)
                titleText = 'チャット履歴';
            }
            // メッセージがあるのにタイトルが「新規チャット」のままなら変更
            if (titleText === '新規チャット' && state.currentMessages.length > 0) { // メッセージがあれば (SPは考慮しない)
                titleText = 'チャット履歴';
            }
        }
        // 表示用タイトル (既存チャットならプレフィックス追加)
        const displayTitle = isNewChat ? titleText : `: ${titleText}`;
        elements.chatTitle.textContent = displayTitle;
        document.title = `Gemini PWA Mk-II - ${titleText}`; // ブラウザタブのタイトルも更新
    },

    // タイムスタンプをフォーマット
    formatDate(timestamp) {
        if (!timestamp) return '';
        try {
            // 日本語形式でフォーマット
            return new Intl.DateTimeFormat('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp));
        } catch (e) {
            // Intlが使えない場合のフォールバック
            console.warn("Intl.DateTimeFormatエラー:", e);
            const d = new Date(timestamp);
            return `${String(d.getFullYear()).slice(-2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    },

    // 履歴リストをレンダリング
    async renderHistoryList() {
        try {
            const chats = await dbUtils.getAllChats(state.settings.historySortOrder);
            // 既存のアイテムを削除 (テンプレートを除く)
            elements.historyList.querySelectorAll('.history-item:not(.js-history-item-template)').forEach(item => item.remove());

            if (chats && chats.length > 0) {
                elements.noHistoryMessage.classList.add('hidden'); // 「履歴なし」メッセージを隠す
                // ヘッダータイトルにソート順を表示
                const sortOrderText = state.settings.historySortOrder === 'createdAt' ? '作成順' : '更新順';
                elements.historyTitle.textContent = `履歴一覧 (${sortOrderText})`;

                chats.forEach(chat => {
                    const li = elements.historyItemTemplate.cloneNode(true); // テンプレートを複製
                    li.classList.remove('js-history-item-template'); // テンプレートクラスを削除
                    li.dataset.chatId = chat.id; // チャットIDをデータ属性に設定

                    const titleText = chat.title || `履歴 ${chat.id}`;
                    const titleEl = li.querySelector('.history-item-title');
                    titleEl.textContent = titleText;
                    titleEl.title = titleText; // ホバーで全文表示

                    li.querySelector('.created-date').textContent = `作成: ${this.formatDate(chat.createdAt)}`;
                    li.querySelector('.updated-date').textContent = `更新: ${this.formatDate(chat.updatedAt)}`;

                    // クリックイベント (アクションボタン以外)
                    li.onclick = (event) => {
                        // アクションボタンがクリックされた場合は何もしない
                        if (!event.target.closest('.history-item-actions button')) {
                            appLogic.loadChat(chat.id);
                            this.showScreen('chat'); // チャット画面へ遷移
                        }
                    };

                    // 各アクションボタンのイベントリスナー
                    li.querySelector('.js-edit-title-btn').onclick = (e) => { e.stopPropagation(); appLogic.editHistoryTitle(chat.id, titleEl); };
                    li.querySelector('.js-export-btn').onclick = (e) => { e.stopPropagation(); appLogic.exportChat(chat.id, titleText); };
                    li.querySelector('.js-duplicate-btn').onclick = (e) => { e.stopPropagation(); appLogic.duplicateChat(chat.id); };
                    li.querySelector('.js-delete-btn').onclick = (e) => { e.stopPropagation(); appLogic.confirmDeleteChat(chat.id, titleText); };

                    elements.historyList.appendChild(li); // リストに追加
                });
            } else {
                elements.noHistoryMessage.classList.remove('hidden'); // 「履歴なし」メッセージを表示
                elements.historyTitle.textContent = '履歴一覧'; // ソート順なしのタイトル
            }
        } catch (error) {
            console.error("履歴リストのレンダリングエラー:", error);
            elements.noHistoryMessage.textContent = "履歴の読み込み中にエラーが発生しました。";
            elements.noHistoryMessage.classList.remove('hidden');
            elements.historyTitle.textContent = '履歴一覧';
        }
    },

    // --- 背景画像UIヘルパー ---
    // 既存のオブジェクトURLを破棄
    revokeExistingObjectUrl() {
        if (state.backgroundImageUrl) {
            try {
                URL.revokeObjectURL(state.backgroundImageUrl);
                console.log("以前の背景URLを破棄:", state.backgroundImageUrl);
            } catch (e) {
                console.error("オブジェクトURLの破棄エラー:", e);
            }
            state.backgroundImageUrl = null;
        }
    },
    // 背景画像設定UIを更新
    updateBackgroundSettingsUI() {
        if (!elements.backgroundThumbnail || !elements.deleteBackgroundBtn) return;
        if (state.backgroundImageUrl) {
            elements.backgroundThumbnail.src = state.backgroundImageUrl;
            elements.backgroundThumbnail.classList.remove('hidden');
            elements.deleteBackgroundBtn.classList.remove('hidden');
        } else {
            elements.backgroundThumbnail.src = '';
            elements.backgroundThumbnail.classList.add('hidden');
            elements.deleteBackgroundBtn.classList.add('hidden');
        }
    },

    applyHeaderColor() {
        const customColor = state.settings.headerColor;
        if (customColor) {
            // カスタム色が設定されていれば、--header-color-custom 変数を設定
            document.documentElement.style.setProperty('--header-color-custom', customColor);
        } else {
            // 設定がなければ、--header-color-custom 変数を削除してデフォルトに戻す
            document.documentElement.style.removeProperty('--header-color-custom');
        }
        // ヘッダーの色が確定した後に、ブラウザのテーマカラーを更新
        // getComputedStyleで実際に適用されている色を取得
        const finalHeaderColor = getComputedStyle(elements.appHeader).backgroundColor;
        elements.themeColorMeta.content = finalHeaderColor;
        console.log(`ヘッダーカラー適用。テーマカラー: ${finalHeaderColor}`);
    },
    // ------------------------------------

    // 設定をUIに適用
    applySettingsToUI() {
        elements.apiKeyInput.value = state.settings.apiKey || '';
        elements.modelNameSelect.value = state.settings.modelName || DEFAULT_MODEL;
        elements.streamingOutputCheckbox.checked = state.settings.streamingOutput;
        elements.streamingSpeedInput.value = state.settings.streamingSpeed ?? DEFAULT_STREAMING_SPEED;
        elements.systemPromptDefaultTextarea.value = state.settings.systemPrompt || '';
        elements.temperatureInput.value = state.settings.temperature === null ? '' : state.settings.temperature;
        elements.maxTokensInput.value = state.settings.maxTokens === null ? '' : state.settings.maxTokens;
        elements.topKInput.value = state.settings.topK === null ? '' : state.settings.topK;
        elements.topPInput.value = state.settings.topP === null ? '' : state.settings.topP;
        elements.presencePenaltyInput.value = state.settings.presencePenalty === null ? '' : state.settings.presencePenalty;
        elements.frequencyPenaltyInput.value = state.settings.frequencyPenalty === null ? '' : state.settings.frequencyPenalty;
        elements.thinkingBudgetInput.value = state.settings.thinkingBudget === null ? '' : state.settings.thinkingBudget;
        elements.includeThoughtsToggle.checked = state.settings.includeThoughts;
        elements.enableThoughtTranslationCheckbox.checked = state.settings.enableThoughtTranslation;
        elements.thoughtTranslationModelSelect.value = state.settings.thoughtTranslationModel || 'gemini-2.5-flash-lite';
        // 「Include Thoughts」が有効な場合のみ翻訳オプションを表示
        elements.thoughtTranslationOptionsDiv.classList.toggle('hidden', !state.settings.includeThoughts);
        elements.dummyUserInput.value = state.settings.dummyUser || '';
        elements.applyDummyToProofreadCheckbox.checked = state.settings.applyDummyToProofread;
        elements.applyDummyToTranslateCheckbox.checked = state.settings.applyDummyToTranslate;
        elements.dummyModelInput.value = state.settings.dummyModel || '';
        elements.concatDummyModelCheckbox.checked = state.settings.concatDummyModel;
        elements.additionalModelsTextarea.value = state.settings.additionalModels || '';
        elements.pseudoStreamingCheckbox.checked = state.settings.pseudoStreaming;
        elements.enterToSendCheckbox.checked = state.settings.enterToSend;
        elements.historySortOrderSelect.value = state.settings.historySortOrder || 'updatedAt';
        elements.darkModeToggle.checked = state.settings.darkMode;
        elements.fontFamilyInput.value = state.settings.fontFamily || '';
        elements.hideSystemPromptToggle.checked = state.settings.hideSystemPromptInChat;
        elements.geminiEnableGroundingToggle.checked = state.settings.geminiEnableGrounding;
        elements.geminiEnableFunctionCallingToggle.checked = state.settings.geminiEnableFunctionCalling;
        elements.swipeNavigationToggle.checked = state.settings.enableSwipeNavigation;
        elements.enableProofreadingCheckbox.checked = state.settings.enableProofreading;
        elements.proofreadingModelNameSelect.value = state.settings.proofreadingModelName || 'gemini-2.5-flash';
        elements.proofreadingSystemInstructionTextarea.value = state.settings.proofreadingSystemInstruction || '';
        elements.proofreadingOptionsDiv.classList.toggle('hidden', !state.settings.enableProofreading);
        elements.enableAutoRetryCheckbox.checked = state.settings.enableAutoRetry;
        elements.maxRetriesInput.value = state.settings.maxRetries;
        elements.autoRetryOptionsDiv.classList.toggle('hidden', !state.settings.enableAutoRetry);
        elements.useFixedRetryDelayCheckbox.checked = state.settings.useFixedRetryDelay;
        elements.fixedRetryDelayInput.value = state.settings.fixedRetryDelaySeconds;
        elements.maxBackoffDelayInput.value = state.settings.maxBackoffDelaySeconds;
        // チェック状態に応じて表示を切り替える
        elements.fixedRetryDelayContainer.classList.toggle('hidden', !state.settings.useFixedRetryDelay);
        elements.maxBackoffDelayContainer.classList.toggle('hidden', state.settings.useFixedRetryDelay);
        elements.googleSearchApiKeyInput.value = state.settings.googleSearchApiKey || '';
        elements.googleSearchEngineIdInput.value = state.settings.googleSearchEngineId || '';
        const opacityPercent = Math.round((state.settings.overlayOpacity ?? 0.65) * 100);
        if (elements.overlayOpacitySlider) elements.overlayOpacitySlider.value = opacityPercent;
        if (elements.overlayOpacityValue)  elements.overlayOpacityValue.textContent = `${opacityPercent}%`;
        // メッセージバブルの濃さ（UI と CSS へ）
        const msgPercent = Math.round((state.settings.messageOpacity ?? 1) * 100);
        if (elements.messageOpacitySlider) elements.messageOpacitySlider.value = msgPercent;
        if (elements.messageOpacityValue)  elements.messageOpacityValue.textContent = `${msgPercent}%`;
        document.documentElement.style.setProperty('--message-bubble-opacity', String(state.settings.messageOpacity ?? 1));
        document.getElementById('allow-prompt-ui-changes').checked = state.settings.allowPromptUiChanges;
        elements.forceFunctionCallingToggle.checked = state.settings.forceFunctionCalling;

        const defaultHeaderColor = state.settings.darkMode ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
        elements.headerColorInput.value = state.settings.headerColor || defaultHeaderColor;

        this.updateUserModelOptions();
        this.updateBackgroundSettingsUI();
        this.applyDarkMode();
        this.applyFontFamily();
        this.toggleSystemPromptVisibility();
        this.applyOverlayOpacity();
        this.applyHeaderColor();
        this.updateModelWarningMessage();
    },

    // ユーザー指定モデルをコンボボックスに反映
    updateUserModelOptions() {
        const group = elements.userDefinedModelsGroup;
        group.innerHTML = ''; // 一旦クリア
        const models = (state.settings.additionalModels || '')
            .split(',')
            .map(m => m.trim())
            .filter(m => m !== ''); // カンマ区切りで分割し、空要素を除去

        if (models.length > 0) {
            group.disabled = false; // optgroupを有効化
            models.forEach(modelId => {
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = modelId;
                group.appendChild(option);
            });
            // 現在選択中のモデルがユーザー指定モデルに含まれていれば、それを選択状態にする
            if (models.includes(state.settings.modelName)) {
                elements.modelNameSelect.value = state.settings.modelName;
            }
        } else {
            group.disabled = true; // モデルがなければoptgroupを無効化
        }
    },

    // ダークモードを適用
    applyDarkMode() {
        const isDark = state.settings.darkMode;
        document.body.classList.toggle('dark-mode', isDark);
        // OS設定の上書き用クラス (ダークモードでない場合)
        document.body.classList.toggle('light-mode-forced', !isDark);
        elements.themeColorMeta.content = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
        console.log(`ダークモード ${isDark ? '有効' : '無効'}. テーマカラー: ${elements.themeColorMeta.content}`);
        this.applyOverlayOpacity();
        this.applyHeaderColor();
    },

    // フォント設定を適用
    applyFontFamily() {
        const customFont = state.settings.fontFamily?.trim();
        const fontFamilyToApply = customFont ? customFont : DEFAULT_FONT_FAMILY;
        document.documentElement.style.setProperty('--font-family', fontFamilyToApply);
        console.log(`フォント適用: ${fontFamilyToApply}`);
    },

    // --- システムプロンプトUI更新 ---
    updateSystemPromptUI() {
        elements.systemPromptEditor.value = state.currentSystemPrompt;
        // 編集中でない場合、detailsタグを閉じる
        if (!state.isEditingSystemPrompt) {
            elements.systemPromptDetails.removeAttribute('open');
        }
        // テキストエリアの高さを調整
        this.adjustTextareaHeight(elements.systemPromptEditor, 200);
        // 表示/非表示を制御
        this.toggleSystemPromptVisibility();
    },
    // システムプロンプトエリアの表示/非表示を切り替え
    toggleSystemPromptVisibility() {
        const shouldHide = state.settings.hideSystemPromptInChat;
        elements.systemPromptArea.classList.toggle('hidden', shouldHide);
        console.log(`システムプロンプト表示エリア ${shouldHide ? '非表示' : '表示'}`);
    },
    // --------------------------------

    // 画面を表示 (スワイプアニメーション + inert対応 + 戻るボタン対応)
    showScreen(screenName, fromPopState = false) {
        // 編集中ならキャンセル
        if (state.editingMessageIndex !== null) {
             const messageElement = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
             if (messageElement) { // 要素が存在する場合のみキャンセル処理
                appLogic.cancelEditMessage(state.editingMessageIndex, messageElement);
             } else {
                state.editingMessageIndex = null; // 要素が見つからない場合はインデックスのみリセット
             }
        }
        // システムプロンプト編集中ならキャンセル
        if (state.isEditingSystemPrompt) {
            appLogic.cancelEditSystemPrompt();
        }

        // 現在の画面と同じなら何もしない
        if (screenName === state.currentScreen) {
            // console.log(`showScreen: Already on screen ${screenName}.`); // ログ削減
            return;
        }

        const allScreens = [elements.chatScreen, elements.historyScreen, elements.settingsScreen];
        let activeScreen = null;

        // fromPopStateがfalseの場合のみ履歴操作を行う (UI操作時)
        if (!fromPopState) {
            if (screenName === 'history' || screenName === 'settings') {
                // 履歴/設定画面への遷移時は履歴を追加
                history.pushState({ screen: screenName }, '', `#${screenName}`);
                console.log(`Pushed state: ${screenName}`);
            } else if (screenName === 'chat') {
                // チャット画面へ戻る遷移 (通常はUIの戻るボタンやpopstateで処理される想定だが、
                // 直接 showScreen('chat') が呼ばれた場合も考慮)
                // ここではURLハッシュのみ更新し、履歴スタックは変更しない
                history.replaceState({ screen: 'chat' }, '', '#chat');
                console.log(`Replaced state: ${screenName}`);
            }
        } else {
            // popstateイベント経由の場合は履歴操作は行わない
            console.log(`showScreen called from popstate for ${screenName}`);
        }

        // まず全ての画面を非アクティブ＆inert状態にする
        allScreens.forEach(screen => {
            screen.classList.remove('active');
            screen.inert = true; // 非アクティブ画面は操作不可に
        });

        // ターゲット画面に応じてtransformとアクティブ設定
        if (screenName === 'chat') {
            activeScreen = elements.chatScreen;
            elements.chatScreen.style.transform = 'translateX(0)';
            elements.historyScreen.style.transform = 'translateX(-100%)';
            elements.settingsScreen.style.transform = 'translateX(100%)';
            requestAnimationFrame(() => {
                this.updateSystemPromptUI();
                this.adjustTextareaHeight();
                this.scrollToBottom();
            });
        } else if (screenName === 'history') {
            activeScreen = elements.historyScreen;
            elements.chatScreen.style.transform = 'translateX(100%)';
            elements.historyScreen.style.transform = 'translateX(0)';
            elements.settingsScreen.style.transform = 'translateX(200%)';
            this.renderHistoryList();
        } else if (screenName === 'settings') {
            activeScreen = elements.settingsScreen;
            elements.chatScreen.style.transform = 'translateX(-100%)';
            elements.historyScreen.style.transform = 'translateX(-200%)';
            elements.settingsScreen.style.transform = 'translateX(0)';
            this.applySettingsToUI();
        }

        // アニメーション適用とアクティブ化
        requestAnimationFrame(() => {
            allScreens.forEach(screen => {
                screen.style.transition = 'transform 0.3s ease-in-out';
            });
            if (activeScreen) {
                activeScreen.inert = false; // アクティブ画面は操作可能に
                activeScreen.classList.add('active');
            }
        });

        // 現在の画面名をstateに保存
        state.currentScreen = screenName;
        console.log(`Navigated to screen: ${screenName}`);
    },

    // 送信状態を設定
    setSendingState(sending) {
        state.isSending = sending;
        if (sending) {
            elements.sendButton.innerHTML = '<span class="material-symbols-outlined">stop</span>'; // アイコン変更
            elements.sendButton.classList.add('sending'); // スタイル変更用クラス
            elements.sendButton.title = "停止";
            elements.sendButton.disabled = false; // 停止ボタンは常に有効
            elements.userInput.disabled = true; // 入力欄無効化
            elements.attachFileBtn.disabled = true; // 添付ボタンも無効化
            elements.loadingIndicator.classList.remove('hidden'); // ローディング表示
            elements.loadingIndicator.setAttribute('aria-live', 'polite'); // スクリーンリーダー用
            // システムプロンプト編集も不可にする
            elements.systemPromptDetails.style.pointerEvents = 'none';
            elements.systemPromptDetails.style.opacity = '0.7';
        } else {
            elements.sendButton.innerHTML = '<span class="material-symbols-outlined">send</span>'; // アイコン変更
            elements.sendButton.classList.remove('sending');
            elements.sendButton.title = "送信";
            // 入力が空なら送信ボタン無効化
            elements.sendButton.disabled = elements.userInput.value.trim() === '';
            elements.userInput.disabled = false; // 入力欄有効化
            elements.attachFileBtn.disabled = false; // 添付ボタン有効化
            elements.loadingIndicator.classList.add('hidden'); // ローディング非表示
            elements.loadingIndicator.removeAttribute('aria-live');
            // システムプロンプト編集を可能にする
            elements.systemPromptDetails.style.pointerEvents = '';
            elements.systemPromptDetails.style.opacity = '';
        }
    },

    // テキストエリアの高さを自動調整
    adjustTextareaHeight(textarea = elements.userInput, maxHeight = TEXTAREA_MAX_HEIGHT) {
        textarea.style.height = 'auto'; // 一旦高さをリセット
        const scrollHeight = textarea.scrollHeight;
        // 最大高さを超えないように設定
        textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        // メイン入力欄の場合、送信ボタンの有効/無効を更新
        if (textarea === elements.userInput && !state.isSending) {
            elements.sendButton.disabled = textarea.value.trim() === '';
        }
    },

    // --- カスタムダイアログ関数 ---
    // ダイアログを表示し、閉じられるまで待機
    showCustomDialog(dialogElement, focusElement) {
        return new Promise((resolve) => {
            const closeListener = () => {
                dialogElement.removeEventListener('close', closeListener);
                resolve(dialogElement.returnValue); // 閉じたときの値を返す
            };
            dialogElement.addEventListener('close', closeListener);
            dialogElement.showModal(); // モーダルダイアログとして表示
            // 指定された要素にフォーカス
            if (focusElement) {
                requestAnimationFrame(() => { focusElement.focus(); });
            }
        });
    },
    // アラートダイアログ表示
    async showCustomAlert(message) {
        elements.alertMessage.textContent = message;
         // ボタンのイベントリスナーが重複しないように複製して置き換え
         const newOkBtn = elements.alertOkBtn.cloneNode(true);
         elements.alertOkBtn.parentNode.replaceChild(newOkBtn, elements.alertOkBtn);
         elements.alertOkBtn = newOkBtn;
        elements.alertOkBtn.onclick = () => elements.alertDialog.close('ok');
        await this.showCustomDialog(elements.alertDialog, elements.alertOkBtn);
    },
    // 確認ダイアログ表示
    async showCustomConfirm(message) {
        elements.confirmMessage.textContent = message;
         // ボタンのイベントリスナーが重複しないように複製して置き換え
         const newOkBtn = elements.confirmOkBtn.cloneNode(true);
         elements.confirmOkBtn.parentNode.replaceChild(newOkBtn, elements.confirmOkBtn);
         elements.confirmOkBtn = newOkBtn;
         const newCancelBtn = elements.confirmCancelBtn.cloneNode(true);
         elements.confirmCancelBtn.parentNode.replaceChild(newCancelBtn, elements.confirmCancelBtn);
         elements.confirmCancelBtn = newCancelBtn;

        elements.confirmOkBtn.onclick = () => elements.confirmDialog.close('ok');
        elements.confirmCancelBtn.onclick = () => elements.confirmDialog.close('cancel');
        const result = await this.showCustomDialog(elements.confirmDialog, elements.confirmOkBtn);
        return result === 'ok'; // OKが押されたか
    },
    // プロンプトダイアログ表示
    async showCustomPrompt(message, defaultValue = '') {
        elements.promptMessage.textContent = message;
        elements.promptInput.value = defaultValue;
         // ボタンと入力欄のイベントリスナーが重複しないように複製して置き換え
         const newOkBtn = elements.promptOkBtn.cloneNode(true);
         elements.promptOkBtn.parentNode.replaceChild(newOkBtn, elements.promptOkBtn);
         elements.promptOkBtn = newOkBtn;
         const newCancelBtn = elements.promptCancelBtn.cloneNode(true);
         elements.promptCancelBtn.parentNode.replaceChild(newCancelBtn, elements.promptCancelBtn);
         elements.promptCancelBtn = newCancelBtn;
         const newPromptInput = elements.promptInput.cloneNode(true);
         elements.promptInput.parentNode.replaceChild(newPromptInput, elements.promptInput);
         elements.promptInput = newPromptInput;

        // EnterキーでOKボタンをクリックする処理
        const enterHandler = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                elements.promptOkBtn.click();
            }
        };
        elements.promptInput.addEventListener('keypress', enterHandler);

        elements.promptOkBtn.onclick = () => elements.promptDialog.close(elements.promptInput.value); // OK時は入力値を返す
        elements.promptCancelBtn.onclick = () => elements.promptDialog.close(''); // キャンセル時は空文字列 ('') を渡す

        // ダイアログが閉じたらEnterキーリスナーを削除
        const closeHandler = () => {
            elements.promptInput.removeEventListener('keypress', enterHandler);
            elements.promptDialog.removeEventListener('close', closeHandler);
        };
         elements.promptDialog.addEventListener('close', closeHandler);

        const result = await this.showCustomDialog(elements.promptDialog, elements.promptInput);
        return result; // 入力値またはnullを返す
    },

    // 添付ファイルバッジの表示/非表示を更新する関数
    updateAttachmentBadgeVisibility() {
        const hasAttachments = state.pendingAttachments.length > 0;
        elements.attachFileBtn.classList.toggle('has-attachments', hasAttachments);
    },

    // ファイルアップロードダイアログ表示
    showFileUploadDialog() {
        // 既にファイルが選択されている場合（D&Dなど）は何もしない。
        // ファイルが選択されておらず、かつ送信待ちの添付ファイルがある場合のみ復元する。
        if (state.selectedFilesForUpload.length === 0 && state.pendingAttachments.length > 0) {
            state.selectedFilesForUpload = state.pendingAttachments.map(att => ({ file: att.file }));
            console.log("送信待ちの添付ファイルをダイアログに復元:", state.selectedFilesForUpload.map(item => item.file.name));
        } else if (state.selectedFilesForUpload.length === 0) {
            // ファイルが選択されておらず、送信待ちもない場合はクリアを確実にする
            state.selectedFilesForUpload = [];
        }

        this.updateSelectedFilesUI();
        elements.fileUploadDialog.showModal();
        this.updateAttachmentBadgeVisibility();
    },

    // 選択されたファイルリストのUIを更新 (変更なし、呼び出しタイミングが重要)
    updateSelectedFilesUI() {
        elements.selectedFilesList.innerHTML = ''; // リストをクリア
        let totalSize = 0;
        // selectedFilesForUpload には { file: File } が入っている
        state.selectedFilesForUpload.forEach((item, index) => {
            const li = document.createElement('li');
            li.classList.add('selected-file-item');
            li.dataset.fileIndex = index;

            const infoDiv = document.createElement('div');
            infoDiv.classList.add('selected-file-info');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('selected-file-name');
            nameSpan.textContent = item.file.name;
            nameSpan.title = item.file.name;

            const sizeSpan = document.createElement('span');
            sizeSpan.classList.add('selected-file-size');
            sizeSpan.textContent = formatFileSize(item.file.size); // File オブジェクトからサイズ取得

            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(sizeSpan);

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-file-btn');
            removeBtn.title = '削除';
            removeBtn.textContent = '×';
            removeBtn.onclick = () => appLogic.removeSelectedFile(index);

            li.appendChild(infoDiv);
            li.appendChild(removeBtn);
            elements.selectedFilesList.appendChild(li);

            totalSize += item.file.size;
        });

        // 合計サイズチェック
        if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
            elements.confirmAttachBtn.disabled = true;
            // アラートはファイル追加時に行う方が親切かもしれない
            // uiUtils.showCustomAlert(`合計ファイルサイズが大きすぎます (${formatFileSize(MAX_TOTAL_ATTACHMENT_SIZE)}以下にしてください)。`);
        } else {
            // サイズが問題なければ常に有効化
            elements.confirmAttachBtn.disabled = false;
        }
    },
    buildLayeredImage(imageData) {
        return new Promise((resolve) => {
            const container = document.createElement('div');
            container.className = 'layered-image-container';
            container.title = 'クリックして画像を拡大';

            const charImg = new Image();
            charImg.onload = () => {
                container.style.aspectRatio = charImg.naturalWidth / charImg.naturalHeight;

                const bgImg = document.createElement('div');
                bgImg.className = 'layered-background-image';
                let bgUrl = imageData.background_url;
                if (bgUrl && bgUrl !== 'none') {
                    bgImg.style.backgroundImage = `url("${bgUrl}")`;
                }

                const charImgElement = document.createElement('img');
                charImgElement.className = 'layered-character-image';
                charImgElement.src = imageData.character_url;

                if (imageData.size) {
                    const styles = imageData.size.split(';').filter(s => s);
                    styles.forEach(style => {
                        const [key, value] = style.split(':');
                        if (key && value) charImgElement.style[key.trim()] = value.trim();
                    });
                }
                
                container.appendChild(bgImg);
                container.appendChild(charImgElement);
                
                // クリック拡大イベントリスナーを追加
                container.addEventListener('click', () => {
                    const modalOverlay = document.getElementById('image-modal-overlay');
                    const modalImg = document.getElementById('image-modal-img');
                    if (modalOverlay && modalImg) {
                        modalImg.src = imageData.character_url;
                        modalOverlay.classList.remove('hidden');
                    }
                });

                resolve(container);
            };
            charImg.onerror = () => {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'layered-image-error';
                errorDiv.textContent = `[キャラクター画像の読み込みに失敗: ${imageData.character_url}]`;
                resolve(errorDiv);
            };
            charImg.src = imageData.character_url;
        });
    },
    // モデル選択に応じた警告メッセージの表示/非表示を切り替え
    updateModelWarningMessage() {
        const selectedModel = elements.modelNameSelect.value;
        const isNanoBanana = selectedModel === 'gemini-2.5-flash-image-preview';
        elements.modelWarningMessage.classList.toggle('hidden', !isNanoBanana);
    },
};

// --- APIユーティリティ (apiUtils) ---
const apiUtils = {
    // Gemini APIを呼び出す
    async callGeminiApi(messagesForApi, generationConfig, systemInstruction, tools = null, forceCalling = false) {
        console.log(`[Debug] callGeminiApi: 現在の設定値を確認します。`, {
            forceFunctionCalling: state.settings.forceFunctionCalling,
            geminiEnableFunctionCalling: state.settings.geminiEnableFunctionCalling,
            isForcedNow: forceCalling // ★ 実際に強制が適用されるかを表示
        });

        if (!state.settings.apiKey) {
            throw new Error("APIキーが設定されていません。");
        }
        state.abortController = new AbortController();
        const { signal } = state.abortController;

        const useStreaming = state.settings.streamingOutput;
        const usePseudo = state.settings.pseudoStreaming;
        const model = state.settings.modelName || DEFAULT_MODEL;
        const apiKey = state.settings.apiKey;

        const isImageGenModel = model === 'gemini-2.5-flash-image-preview';

        let endpointMethod;
        if (isImageGenModel) {
            endpointMethod = 'streamGenerateContent?alt=sse&';
            console.log("使用モード: 画像生成ストリーミング (nano-banana)");
        } else {
            endpointMethod = useStreaming
                ? (usePseudo ? 'generateContent?alt=sse&' : 'streamGenerateContent?alt=sse&')
                : 'generateContent?';
            console.log(`使用モード: ${useStreaming ? (usePseudo ? '疑似ストリーミング' : 'リアルタイムストリーミング') : '非ストリーミング'}`);
        }

        const endpoint = `${GEMINI_API_BASE_URL}${model}:${endpointMethod}key=${apiKey}`;
        
        const finalGenerationConfig = { ...generationConfig };
        if (state.settings.presencePenalty !== null) finalGenerationConfig.presencePenalty = state.settings.presencePenalty;
        if (state.settings.frequencyPenalty !== null) finalGenerationConfig.frequencyPenalty = state.settings.frequencyPenalty;
        
        if (isImageGenModel) {
            finalGenerationConfig.responseModalities = ['IMAGE', 'TEXT'];
            delete finalGenerationConfig.thinkingConfig;

            delete finalGenerationConfig.maxOutputTokens;
            delete finalGenerationConfig.topK;
            delete finalGenerationConfig.topP;
            delete finalGenerationConfig.temperature;
            delete finalGenerationConfig.presencePenalty;
            delete finalGenerationConfig.frequencyPenalty;

        } else {
            if (state.settings.thinkingBudget !== null || state.settings.includeThoughts) {
                generationConfig.thinkingConfig = {};
                if(state.settings.thinkingBudget !== null) generationConfig.thinkingConfig.thinkingBudget = state.settings.thinkingBudget;
                if(state.settings.includeThoughts) generationConfig.thinkingConfig.includeThoughts = true;
            }
        }

        const requestBody = {
            contents: messagesForApi,
            ...(Object.keys(finalGenerationConfig).length > 0 && { generationConfig: finalGenerationConfig }),
            safetySettings : [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        };

        if (isImageGenModel) {
            requestBody.safetySettings = [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ];
        } else {
            if (systemInstruction && systemInstruction.parts && systemInstruction.parts.length > 0 && systemInstruction.parts[0].text) {
                requestBody.systemInstruction = systemInstruction;
            }

            let finalTools = [];
            if (state.settings.geminiEnableFunctionCalling) {
                finalTools = window.functionDeclarations || [];
                console.log("Function Calling を有効にしてAPIを呼び出します。");
            } 
            else if (state.settings.geminiEnableGrounding) {
                finalTools.push({ "google_search": {} });
                console.log("グラウンディング (Google Search) を有効にしてAPIを呼び出します。");
            }
            
            if (finalTools.length > 0) {
                requestBody.tools = finalTools;
            }

            // ★ 引数 forceCalling を使用するように修正
            if (forceCalling && state.settings.geminiEnableFunctionCalling) {
                requestBody.toolConfig = {
                    functionCallingConfig: {
                        mode: 'ANY'
                    }
                };
                console.log("Function Calling を強制モード (ANY) で実行します。");
            }
        }

        console.log("Geminiへの送信データ:", JSON.stringify(requestBody, (key, value) => {
            if (key === 'data' && typeof value === 'string' && value.length > 100) {
                return value.substring(0, 50) + '...[省略]...' + value.substring(value.length - 20);
            }
            return value;
        }, 2));
        console.log("ターゲットエンドポイント:", endpoint);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal
            });

            if (!response.ok) {
                let errorMsg = `APIエラー (${response.status}): ${response.statusText}`;
                let errorData = null;
                try {
                    errorData = await response.json();
                    console.error("APIエラーレスポンスボディ:", errorData);
                    if (errorData.error && errorData.error.message) {
                        errorMsg = `APIエラー (${response.status}): ${errorData.error.message}`;
                    }
                } catch (e) {
                    console.error("APIエラーレスポンスボディのパース失敗:", e);
                }
                const error = new Error(errorMsg);
                error.status = response.status;
                error.data = errorData;
                throw error;
            }
            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error("リクエストがキャンセルされました。");
            } else {
                throw error;
            }
        }
    },

    // ストリーミングレスポンスを処理
    async *handleStreamingResponse(response) {
        if (!response.body) {
            throw new Error("レスポンスボディがありません。");
        }
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        let lastCandidateInfo = null;
        let isCancelled = false;
        let groundingMetadata = null;
        let finalUsageMetadata = null;
        let toolCallsBuffer = []; 

        // この内部関数は前回修正したものをそのまま使います
        function parseSseDataForYield(jsonString) {
            try {
                const chunkJson = JSON.parse(jsonString);
                if (chunkJson.error) {
                    console.error("ストリーム内のエラーメッセージ:", chunkJson.error);
                    const errorMsg = `モデルエラー: ${chunkJson.error.message || JSON.stringify(chunkJson.error)}`;
                    lastCandidateInfo = { error: chunkJson.error, finishReason: 'ERROR' };
                    return { type: 'error', error: chunkJson.error, message: errorMsg };
                }

                let contentText = null;
                let thoughtText = null;
                let imageData = null;
                let currentGroundingMetadata = null;
                let currentUsageMetadata = null;
                let currentToolCalls = null;

                if (chunkJson.candidates && chunkJson.candidates.length > 0) {
                    lastCandidateInfo = chunkJson.candidates[0];
                    if (lastCandidateInfo?.content?.parts) {
                        lastCandidateInfo.content.parts.forEach(part => {
                            if (part.text) {
                                if (part.thought === true) {
                                    thoughtText = (thoughtText || '') + part.text;
                                } else {
                                    contentText = (contentText || '') + part.text;
                                }
                            } else if (part.functionCall) {
                                if (!currentToolCalls) currentToolCalls = [];
                                currentToolCalls.push({ functionCall: part.functionCall });
                            } else if (part.inlineData) {
                                imageData = part.inlineData;
                                console.log("ストリームから画像データチャンクを検出:", { mimeType: imageData.mimeType, dataLength: imageData.data?.length });
                            }
                        });
                    }
                    if (lastCandidateInfo.groundingMetadata) {
                        currentGroundingMetadata = lastCandidateInfo.groundingMetadata;
                    }
                } else if (chunkJson.promptFeedback) {
                    console.warn("ストリーム内のプロンプトフィードバック:", chunkJson.promptFeedback);
                    const blockReason = chunkJson.promptFeedback.blockReason || 'SAFETY';
                    lastCandidateInfo = { finishReason: blockReason, safetyRatings: chunkJson.promptFeedback.safetyRatings };
                    return { type: 'metadata', finishReason: blockReason, safetyRatings: chunkJson.promptFeedback.safetyRatings };
                }

                if (chunkJson.usageMetadata) {
                    currentUsageMetadata = chunkJson.usageMetadata;
                }

                if (contentText !== null || thoughtText !== null || imageData !== null || currentGroundingMetadata || currentUsageMetadata || currentToolCalls) {
                    return {
                        type: 'chunk',
                        contentText,
                        thoughtText,
                        imageData, 
                        groundingMetadata: currentGroundingMetadata,
                        usageMetadata: currentUsageMetadata,
                        toolCalls: currentToolCalls
                    };
                }
                return null;
            } catch (parseError) {
                console.warn("ストリーム内の不正なJSONをスキップ:", jsonString, parseError);
                return null;
            }
        }

        try {
            while (true) {
                if (state.abortController?.signal.aborted && !isCancelled) {
                    isCancelled = true;
                    console.log("ストリーミング中に中断シグナルを検出");
                    await reader.cancel("User aborted");
                    throw new Error("リクエストがキャンセルされました。");
                }

                let readResult;
                try {
                    readResult = await reader.read();
                } catch (readError) {
                    if (readError.name === 'AbortError' || readError.message === "User aborted" || readError.message.includes("aborted")) {
                        if (!isCancelled) { isCancelled = true; throw new Error("リクエストがキャンセルされました。"); }
                        break;
                    }
                    throw readError;
                }
                const { value, done } = readResult;
                if (done) break;

                buffer += value;

                // --- ▼▼▼ ここからが新しい解析ロジックです ▼▼▼ ---
                while (true) {
                    const dataPrefixIndex = buffer.indexOf('data: ');
                    if (dataPrefixIndex === -1) break;

                    const jsonStartIndex = buffer.indexOf('{', dataPrefixIndex);
                    if (jsonStartIndex === -1) break;

                    let braceCount = 0;
                    let jsonEndIndex = -1;
                    for (let i = jsonStartIndex; i < buffer.length; i++) {
                        if (buffer[i] === '{') braceCount++;
                        else if (buffer[i] === '}') braceCount--;
                        if (braceCount === 0) {
                            jsonEndIndex = i;
                            break;
                        }
                    }

                    if (jsonEndIndex !== -1) {
                        const jsonString = buffer.substring(jsonStartIndex, jsonEndIndex + 1);
                        const chunkData = parseSseDataForYield(jsonString);
                        if (chunkData) {
                            if (chunkData.groundingMetadata) groundingMetadata = chunkData.groundingMetadata;
                            if (chunkData.usageMetadata) finalUsageMetadata = chunkData.usageMetadata;
                            if (chunkData.toolCalls) toolCallsBuffer.push(...chunkData.toolCalls);
                            yield chunkData;
                        }
                        buffer = buffer.substring(jsonEndIndex + 1);
                    } else {
                        break; 
                    }
                }
                 // --- ▲▲▲ 新しい解析ロジックここまで ▲▲▲ ---
            }

            const finishReason = lastCandidateInfo?.finishReason;
            const safetyRatings = lastCandidateInfo?.safetyRatings;

            yield {
                type: 'metadata',
                finishReason: isCancelled ? 'ABORTED' : finishReason,
                safetyRatings,
                groundingMetadata: groundingMetadata,
                usageMetadata: finalUsageMetadata,
                toolCalls: toolCallsBuffer.length > 0 ? toolCallsBuffer : null
            };

        } catch (error) {
            console.error("ストリームの読み取り/処理エラー:", error);
            throw new Error(`ストリーミング処理エラー: ${error.message || error}`, { cause: { originalError: error } });
        } finally {
            if (!reader.closed && !isCancelled) {
                try { await reader.cancel("Cleanup cancellation"); } catch(e) { console.error("クリーンアップキャンセル中のエラー:", e); }
            }
        }
    },

    /**
     * テキストを日本語に翻訳する関数
     * @param {string} textToTranslate - 翻訳対象の英語テキスト
     * @param {string} translationModelName - 翻訳に使用するモデル名
     * @returns {Promise<string>} 翻訳された日本語テキスト。失敗した場合は元の英語テキストを返す。
     */
     async translateText(textToTranslate, translationModelName) {
        if (!textToTranslate || textToTranslate.trim() === '') {
            return textToTranslate;
        }

        const japaneseChars = textToTranslate.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g) || [];
        const japaneseRatio = japaneseChars.length / textToTranslate.length;

        if (japaneseRatio > 0.5) {
            console.log(`翻訳スキップ: 日本語の文字が${Math.round(japaneseRatio * 100)}%含まれているため、翻訳済みと判断しました。`);
            return textToTranslate;
        }

        console.log("--- 思考プロセスの翻訳処理開始 ---");
        
        const modelToUse = translationModelName || 'gemini-2.5-flash-lite';
        const apiKey = state.settings.apiKey;
        if (!apiKey) {
            console.warn("翻訳スキップ: APIキーが設定されていません。");
            return textToTranslate;
        }

        const endpoint = `${GEMINI_API_BASE_URL}${modelToUse}:generateContent?key=${apiKey}`;
        
        const systemInstruction = {
            parts: [{ text: "You are a professional translator. Translate the given English text into natural Japanese. Do not add any extra comments or explanations. Just output the translated Japanese text." }]
        };

        const requestBody = {
            contents: [{
                role: 'user',
                parts: [{ text: textToTranslate }]
            }],
            systemInstruction,
            generationConfig: {
                temperature: 0.1,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        };

        if (state.settings.applyDummyToTranslate && state.settings.dummyUser) {
            requestBody.contents.push({
                role: 'user',
                parts: [{ text: state.settings.dummyUser }]
            });
            console.log("翻訳リクエストにダミーUserプロンプトを適用しました。");
        }

        let lastError = null;
        const maxTranslationRetries = state.settings.enableAutoRetry ? state.settings.maxRetries : 0;

        for (let attempt = 0; attempt <= maxTranslationRetries; attempt++) {
            try {
                if (state.abortController?.signal.aborted) {
                    throw new Error("リクエストがキャンセルされました。");
                }

                if (attempt > 0) {
                    let delay;
                    if (state.settings.useFixedRetryDelay) {
                        delay = state.settings.fixedRetryDelaySeconds * 1000;
                    } else {
                        const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                        const maxDelay = state.settings.maxBackoffDelaySeconds * 1000;
                        delay = Math.min(exponentialDelay, maxDelay);
                    }
                    uiUtils.setLoadingIndicatorText(`翻訳エラー 再試行(${attempt}回目)... ${Math.round(delay/1000)}秒待機`);
                    console.log(`翻訳APIリトライ ${attempt}: ${delay}ms待機...`);
                    await interruptibleSleep(delay, state.abortController.signal);
                }

                if (attempt > 0) {
                    uiUtils.setLoadingIndicatorText('思考プロセスの翻訳を再試行中...');
                } else {
                    uiUtils.setLoadingIndicatorText('思考プロセスを翻訳中...');
                }

                const timeoutController = new AbortController();
                const timeoutId = setTimeout(() => timeoutController.abort(), 15000);

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: timeoutController.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    let errorBody = await response.text();
                    try { errorBody = JSON.parse(errorBody); } catch(e) { /* ignore */ }
                    console.error(`翻訳APIエラー (${response.status})`, errorBody);
                    const error = new Error(`翻訳APIエラー (${response.status})`);
                    error.status = response.status;
                    throw error;
                }

                const responseData = await response.json();
                if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const translatedText = responseData.candidates[0].content.parts[0].text;
                    console.log("--- 翻訳処理成功 ---");
                    return translatedText;
                } else {
                    console.warn("翻訳APIの応答形式が不正、またはコンテンツが空です。", responseData);
                    if(responseData.promptFeedback) {
                        console.warn("翻訳がブロックされた可能性があります:", responseData.promptFeedback);
                    }
                    throw new Error("翻訳APIの応答形式が不正です。");
                }
            } catch (error) {
                lastError = error;
                if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                    if (state.abortController?.signal.aborted) {
                        break;
                    }
                }
                if (error.status && error.status >= 400 && error.status < 500) {
                    console.error(`リトライ不可の翻訳エラー (ステータス: ${error.status})。`);
                    break;
                }
                console.warn(`翻訳API呼び出し試行 ${attempt + 1} が失敗。`, error);
            }
        }

        console.error("思考プロセスの翻訳中にエラーが発生しました。原文を返します。", lastError);
        return textToTranslate;
    }
};

function updateCurrentSystemPrompt() {
    const provider = state.settings.apiProvider;
    const commonPrompt = state.settings.systemPrompt || '';
    const specificPrompt = state.settings.systemPrompt || commonPrompt;

    // 新規チャット(メッセージがまだない状態)の場合のみ、
    // 設定のデフォルト値を state.currentSystemPrompt に反映する。
    // 既存チャットや、新規でもユーザーが編集したチャットは上書きしない。
    if (!state.currentChatId && state.currentMessages.length === 0) {
        state.currentSystemPrompt = specificPrompt;
        console.log(`新規チャットのため、デフォルトのシステムプロンプトを適用しました。`);
    } else {
        console.log(`既存チャットのため、デフォルトのシステムプロンプトによる上書きをスキップしました。`);
    }

    // ログ出力は関数の最後に移動
    console.log(`システムプロンプトを更新しました。Provider: ${provider}, Current Prompt: "${state.currentSystemPrompt.substring(0, 30)}..."`);
}

// --- アプリケーションロジック (appLogic) ---
const appLogic = {
    timerManager: {
        timers: {}, // { timer_name: { timerId: 123, endTime: 167... } }
        
        start(name, minutes) {
            if (this.timers[name]) {
                clearTimeout(this.timers[name].timerId);
                console.log(`タイマー「${name}」は上書きされました。`);
            }
            
            const durationMs = minutes * 60 * 1000;
            const endTime = Date.now() + durationMs;

            const timerId = setTimeout(() => {
                console.log(`タイマー「${name}」が時間切れになりました。自動応答をトリガーします。`);
                // 実行中のタイマーリストから削除
                delete this.timers[name];
                // 自動応答をトリガー
                appLogic.triggerTimerExpiredResponse(name);
            }, durationMs);

            this.timers[name] = { timerId, endTime };
            
            const message = `タイマー「${name}」を${minutes}分で開始しました。`;
            console.log(`[Timer] ${message}`);
            return { success: true, message: message };
        },

        check(name) {
            if (!this.timers[name]) {
                return { success: false, message: `タイマー「${name}」はセットされていません。` };
            }
            const remainingMs = this.timers[name].endTime - Date.now();
            if (remainingMs <= 0) {
                return { success: true, status: "expired", message: `タイマー「${name}」は既に時間切れです。` };
            }
            const remainingMinutes = Math.floor(remainingMs / 60000);
            const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
            const message = `タイマー「${name}」の残り時間は約${remainingMinutes}分${remainingSeconds}秒です。`;
            console.log(`[Timer] ${message}`);
            return { success: true, status: "running", remaining_time: message };
        },

        stop(name) {
            if (!this.timers[name]) {
                return { success: false, message: `タイマー「${name}」はセットされていません。` };
            }
            clearTimeout(this.timers[name].timerId);
            delete this.timers[name];
            const message = `タイマー「${name}」を停止しました。`;
            console.log(`[Timer] ${message}`);
            return { success: true, message: message };
        },
    },

        /**
     * タイマー時間切れ時にAIに応答を促す関数
     * @param {string} timerName - 時間切れになったタイマーの名前
     */
        async triggerTimerExpiredResponse(timerName) {
            // 現在送信中の場合は何もしない
            if (state.isSending) {
                console.warn("タイマーが切れましたが、現在送信中のため自動応答をスキップします。");
                return;
            }
            console.log(`タイマー「${timerName}」の時間切れ応答を生成します。`);
    
            // ユーザーには見えない内部的な指示メッセージを作成
            const systemInstructionForTimer = `[システムメモ]
    タイマー「${timerName}」が時間切れになりました。
    この事実を踏まえて、現在の会話の文脈に沿った自然な応答を生成してください。
    例えば、「そういえば、約束の時間だね」「時間切れだ！イベントが発生する」のように、会話を続けてください。
    このシステムメモ自体は応答に含めないでください。`;
    
            const userMessage = { 
                role: 'user', 
                content: systemInstructionForTimer, 
                timestamp: Date.now(),
                attachments: [],
                isHidden: true,
                isAutoTrigger: true
            };
    
            // 履歴にこの内部メッセージを追加
            state.currentMessages.push(userMessage);
            
            // UIにもメッセージ要素を追加するが、即座に非表示にする
            const messageIndex = state.currentMessages.length - 1;
            uiUtils.appendMessage(userMessage.role, userMessage.content, messageIndex);
            const messageElement = elements.messageContainer.querySelector(`.message[data-index="${messageIndex}"]`);
            if (messageElement) {
                messageElement.style.display = 'none';
            }
    
            // 裏でhandleSendを呼び出す (第3引数 isAutoTrigger を true に設定)
            await this.handleSend(false, -1, true);
        },
    // アプリ初期化
    async initializeApp() {
        debugLogger.init();//デバッグ用

        if (typeof marked !== 'undefined') {
            const renderer = new marked.Renderer();
            const originalLinkRenderer = renderer.link;
            renderer.link = (href, title, text) => {
                const html = originalLinkRenderer.call(renderer, href, title, text);
                return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
            };

            marked.setOptions({
                renderer: renderer,
                breaks: true,
                gfm: true,
                sanitize: true,
                smartypants: false
            });
            console.log("Marked.js設定完了 (リンクは新しいタブで開きます)");
        } else {
            console.error("Marked.jsライブラリが読み込まれていません！");
        }
        elements.appVersionSpan.textContent = APP_VERSION;
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            console.log('beforeinstallpromptイベントを抑制しました。');
        });

        window.debug = {
            getState: () => console.log(state),
            getMemory: () => console.log(state.currentPersistentMemory),
            getChat: async (id) => console.log(await dbUtils.getChat(id || state.currentChatId))
        };
        console.log("デバッグ用ヘルパーを登録しました。コンソールで `debug.getMemory()` を実行できます。");

        uiUtils.showScreen('chat');

        registerServiceWorker();

        try {
            await dbUtils.openDB();
            await dbUtils.loadSettings();

            updateCurrentSystemPrompt();

            uiUtils.applyDarkMode();
            uiUtils.applyFontFamily();

            if (state.settings.backgroundImageBlob instanceof Blob) {
                uiUtils.revokeExistingObjectUrl();
                try {
                     state.backgroundImageUrl = URL.createObjectURL(state.settings.backgroundImageBlob);
                     document.documentElement.style.setProperty('--chat-background-image-main', `url("${state.backgroundImageUrl}")`);
                     console.log("読み込んだBlobから背景画像を適用しました。");
                } catch (e) {
                     console.error("背景画像のオブジェクトURL作成エラー:", e);
                     document.documentElement.style.setProperty('--chat-background-image-main', 'none');
                }
            } else {
                document.documentElement.style.setProperty('--chat-background-image-main', 'none');
            }

            uiUtils.applyOverlayOpacity();
            uiUtils.applySettingsToUI();

            const chats = await dbUtils.getAllChats(state.settings.historySortOrder);
            if (chats && chats.length > 0) {
                await this.loadChat(chats[0].id);
            } else {
                this.startNewChat();
            }

            history.replaceState({ screen: 'chat' }, '', '#chat');
            state.currentScreen = 'chat';
            console.log("Initial history state set to #chat");

        } catch (error) {
            console.error("初期化失敗:", error);
            await uiUtils.showCustomAlert(`アプリの初期化に失敗しました: ${error}`);
            elements.appContainer.innerHTML = `<p style="padding: 20px; text-align: center; color: red;">アプリの起動に失敗しました。</p>`;
        } finally {
            updateMessageMaxWidthVar();
            this.setupEventListeners();
            this.updateZoomState();
            uiUtils.adjustTextareaHeight();
            uiUtils.setSendingState(false);
            uiUtils.scrollToBottom();
        }
    },

    // イベントリスナーを設定
    setupEventListeners() {
        elements.gotoHistoryBtn.addEventListener('click', () => uiUtils.showScreen('history'));
        elements.gotoSettingsBtn.addEventListener('click', () => uiUtils.showScreen('settings'));
        elements.backToChatFromHistoryBtn.addEventListener('click', () => uiUtils.showScreen('chat'));
        elements.backToChatFromSettingsBtn.addEventListener('click', () => uiUtils.showScreen('chat'));

        elements.newChatBtn.addEventListener('click', async () => {
            const confirmed = await uiUtils.showCustomConfirm("現在のチャットを保存して新規チャットを開始しますか？");
            if (confirmed) this.confirmStartNewChat();
        });

        let lastSendButtonClickTime = 0;
        const sendButtonDebounceTime = 500;

        elements.sendButton.addEventListener('click', () => {
            const now = Date.now();
            if (now - lastSendButtonClickTime < sendButtonDebounceTime) {
                console.log("短時間での連続クリックを検出、処理を無視します。");
                return;
            }
            lastSendButtonClickTime = now;

            if (state.isSending) {
                this.abortRequest();
            } else {
                this.handleSend();
            }
        });
        
        elements.userInput.addEventListener('input', () => uiUtils.adjustTextareaHeight());
        elements.userInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (!elements.sendButton.disabled) {
                    this.handleSend();
                }
                return;
            }

            if (state.settings.enterToSend && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                if (!elements.sendButton.disabled) {
                    this.handleSend();
                }
            }
        });

        elements.systemPromptDetails.addEventListener('toggle', (event) => {
            if (event.target.open) {
                this.startEditSystemPrompt();
            } else if (state.isEditingSystemPrompt) {
                this.cancelEditSystemPrompt();
            }
        });
        elements.saveSystemPromptBtn.addEventListener('click', () => this.saveCurrentSystemPrompt());
        elements.cancelSystemPromptBtn.addEventListener('click', () => this.cancelEditSystemPrompt());
        elements.systemPromptEditor.addEventListener('input', () => {
            uiUtils.adjustTextareaHeight(elements.systemPromptEditor, 200);
        });

        elements.importHistoryBtn.addEventListener('click', () => elements.importHistoryInput.click());
        elements.importHistoryInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) this.handleHistoryImport(file);
            event.target.value = null;
        });

        elements.includeThoughtsToggle.addEventListener('change', () => {
            const isEnabled = elements.includeThoughtsToggle.checked;
            elements.thoughtTranslationOptionsDiv.classList.toggle('hidden', !isEnabled);
        });

        elements.saveSettingsBtns.forEach(button => {
            button.addEventListener('click', () => this.saveSettings());
        });
        if (elements.overlayOpacitySlider) {
            elements.overlayOpacitySlider.addEventListener('input', (e) => {
                const raw = Number(e.target.value) || 0;
                const clamped = Math.max(0, Math.min(95, raw));
                const v = clamped / 100;
                
                if (elements.overlayOpacityValue) {
                    elements.overlayOpacityValue.textContent = `${clamped}%`;
                }
                document.documentElement.style.setProperty('--overlay-opacity-value', v);
                if (state?.settings) state.settings.overlayOpacity = v;
            });
        }
        if (elements.messageOpacitySlider) {
            elements.messageOpacitySlider.addEventListener('input', (e) => {
              const raw = Number(e.target.value) || 100;
              const clamped = Math.max(10, Math.min(100, raw));
              const v = clamped / 100;
              if (elements.messageOpacityValue) {
                elements.messageOpacityValue.textContent = `${clamped}%`;
              }
              document.documentElement.style.setProperty('--message-bubble-opacity', String(v));
              if (state?.settings) state.settings.messageOpacity = v;
            });
          }
        
        elements.updateAppBtn.addEventListener('click', () => this.updateApp());
        elements.clearDataBtn.addEventListener('click', () => this.confirmClearAllData());

        elements.enableProofreadingCheckbox.addEventListener('change', () => {
            const isEnabled = elements.enableProofreadingCheckbox.checked;
            elements.proofreadingOptionsDiv.classList.toggle('hidden', !isEnabled);
        });

        elements.darkModeToggle.addEventListener('change', () => {
            state.settings.darkMode = elements.darkModeToggle.checked;
            uiUtils.applyDarkMode();
        });

        elements.uploadBackgroundBtn.addEventListener('click', () => elements.backgroundImageInput.click());
        elements.backgroundImageInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) this.handleBackgroundImageUpload(file);
            event.target.value = null;
        });
        elements.deleteBackgroundBtn.addEventListener('click', () => this.confirmDeleteBackgroundImage());
        
        elements.headerColorInput.addEventListener('input', () => {
            const newColor = elements.headerColorInput.value;
            state.settings.headerColor = newColor;
            uiUtils.applyHeaderColor();
        });

        elements.resetHeaderColorBtn.addEventListener('click', () => {
            state.settings.headerColor = '';
            elements.headerColorInput.value = state.settings.darkMode ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
            uiUtils.applyHeaderColor();
        });

        elements.hideSystemPromptToggle.addEventListener('change', () => {
            state.settings.hideSystemPromptInChat = elements.hideSystemPromptToggle.checked;
            uiUtils.toggleSystemPromptVisibility();
        });
        
        elements.messageContainer.addEventListener('click', (event) => {
            if (event.target.tagName === 'IMG' && event.target.closest('.message-content')) {
                const modalOverlay = document.getElementById('image-modal-overlay');
                const modalImg = document.getElementById('image-modal-img');
                
                if (modalOverlay && modalImg) {
                    modalImg.src = event.target.src;
                    modalOverlay.classList.remove('hidden');
                }
            }
        });

        document.body.addEventListener('click', (event) => {
            if (!elements.messageContainer.contains(event.target)) {
                const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                if (currentlyShown) {
                    currentlyShown.classList.remove('show-actions');
                }
            }
        }, true); 

        elements.chatScreen.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        elements.chatScreen.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        elements.chatScreen.addEventListener('touchend', this.handleTouchEnd.bind(this));

        if ('visualViewport' in window) {
            window.visualViewport.addEventListener('resize', this.updateZoomState.bind(this));
            window.visualViewport.addEventListener('scroll', this.updateZoomState.bind(this));
        } else {
            console.warn("VisualViewport API is not supported in this browser.");
        }

        window.addEventListener('popstate', this.handlePopState.bind(this));
        console.log("popstate listener added.");
        
        elements.attachFileBtn.addEventListener('click', () => uiUtils.showFileUploadDialog());
        elements.selectFilesBtn.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput.addEventListener('change', (event) => {
            this.handleFileSelection(event.target.files);
            event.target.value = null;
        });
        elements.confirmAttachBtn.addEventListener('click', () => this.confirmAttachment());
        elements.cancelAttachBtn.addEventListener('click', () => this.cancelAttachment());
        elements.fileUploadDialog.addEventListener('close', () => {
            if (elements.fileUploadDialog.returnValue !== 'ok') {
                this.cancelAttachment();
            }
        });
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && !button.disabled) {
                this.createRipple(e, button);
            }
        });
        let menuHideTimer = null;
        const MENU_HIDE_DELAY = 300;

        const showMenu = (messageElement) => {
            clearTimeout(menuHideTimer);
            const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
            if (currentlyShown && currentlyShown !== messageElement) {
                currentlyShown.classList.remove('show-actions');
            }
            if (!messageElement.classList.contains('editing')) {
                messageElement.classList.add('show-actions');
            }
        };

        const hideMenu = (messageElement) => {
            menuHideTimer = setTimeout(() => {
                if (messageElement) {
                    messageElement.classList.remove('show-actions');
                }
            }, MENU_HIDE_DELAY);
        };

        elements.messageContainer.addEventListener('mouseover', (event) => {
            const messageElement = event.target.closest('.message');
            if (messageElement) {
                showMenu(messageElement);
            }
        });

        elements.messageContainer.addEventListener('mouseout', (event) => {
            const messageElement = event.target.closest('.message');
            if (messageElement) {
                const relatedTarget = event.relatedTarget;
                if (!relatedTarget || (!messageElement.contains(relatedTarget) && !relatedTarget.closest('.message-actions') && !relatedTarget.closest('.message-cascade-controls'))) {
                    hideMenu(messageElement);
                }
            }
        });

        elements.messageContainer.addEventListener('mouseover', (event) => {
            const menuElement = event.target.closest('.message-actions, .message-cascade-controls');
            if (menuElement) {
                const messageElement = menuElement.closest('.message');
                if (messageElement) {
                    showMenu(messageElement);
                }
            }
        });

        elements.messageContainer.addEventListener('mouseout', (event) => {
            const menuElement = event.target.closest('.message-actions, .message-cascade-controls');
            if (menuElement) {
                const messageElement = menuElement.closest('.message');
                const relatedTarget = event.relatedTarget;
                if (messageElement && (!relatedTarget || !messageElement.contains(relatedTarget))) {
                    hideMenu(messageElement);
                }
            }
        });

        const chatScreen = elements.chatScreen;

        chatScreen.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!state.isSending) {
                chatScreen.classList.add('drag-over');
            }
        });

        chatScreen.addEventListener('dragleave', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.relatedTarget === null || !chatScreen.contains(event.relatedTarget)) {
                chatScreen.classList.remove('drag-over');
            }
        });

        chatScreen.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            chatScreen.classList.remove('drag-over');

            if (state.isSending) return;

            const files = event.dataTransfer.files;
            if (files && files.length > 0) {
                console.log(`${files.length}個のファイルがドロップされました。`);
                this.handleFileSelection(files);
                uiUtils.showFileUploadDialog();
            }
        });

        // --- ▼▼▼ ここから追加 ▼▼▼ ---
        elements.messageContainer.addEventListener('click', (event) => {
            if (event.target.tagName === 'IMG' && event.target.closest('.message-content')) {
                const modalOverlay = document.getElementById('image-modal-overlay');
                const modalImg = document.getElementById('image-modal-img');
                
                if (modalOverlay && modalImg) {
                    modalImg.src = event.target.src;
                    modalOverlay.classList.remove('hidden');
                }
            }
        });

        const modalOverlay = document.getElementById('image-modal-overlay');
        const modalCloseBtn = document.getElementById('image-modal-close');
        
        if (modalOverlay && modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => {
                modalOverlay.classList.add('hidden');
            });
            
            modalOverlay.addEventListener('click', (event) => {
                if (event.target === modalOverlay) {
                    modalOverlay.classList.add('hidden');
                }
            });
        }
        elements.enableAutoRetryCheckbox.addEventListener('change', () => {
            elements.autoRetryOptionsDiv.classList.toggle('hidden', !elements.enableAutoRetryCheckbox.checked);
        });
        elements.useFixedRetryDelayCheckbox.addEventListener('change', () => {
            const useFixed = elements.useFixedRetryDelayCheckbox.checked;
            elements.fixedRetryDelayContainer.classList.toggle('hidden', !useFixed);
            elements.maxBackoffDelayContainer.classList.toggle('hidden', useFixed);
        });

        // --- モデル選択時の警告表示リスナー ---
        elements.modelNameSelect.addEventListener('change', () => {
            uiUtils.updateModelWarningMessage();
        });
    },

    // popstateイベントハンドラ (戻るボタン/ジェスチャー)
    handlePopState(event) {
        // 履歴スタックから遷移先の画面名を取得、なければチャット画面
        const targetScreen = event.state?.screen || 'chat';
        console.log(`popstate event fired: Navigating to screen '${targetScreen}' from history state.`);
        // showScreenを呼び出す (fromPopState = true を渡して履歴操作を抑制)
        uiUtils.showScreen(targetScreen, true);
    },

    // ズーム状態を更新
    updateZoomState() {
        if ('visualViewport' in window) {
            // スケールが閾値より大きい場合をズームとみなす
            const newZoomState = window.visualViewport.scale > ZOOM_THRESHOLD;
            if (state.isZoomed !== newZoomState) {
                state.isZoomed = newZoomState;
                console.log(`Zoom state updated: ${state.isZoomed}`);
                // ズーム状態に応じてbodyにクラスを追加/削除
                document.body.classList.toggle('zoomed', state.isZoomed);
            }
        }
    },


    // --- スワイプ処理 (ズーム対応) ---
    handleTouchStart(event) {
        if (!state.settings.enableSwipeNavigation) return;
        
        // マルチタッチ(ピンチ操作など)やズーム中はスワイプ開始点を記録しない
        if (event.touches.length > 1 || state.isZoomed) {
            state.touchStartX = 0; // 開始点をリセットしてスワイプ判定を無効化
            state.touchStartY = 0;
            state.isSwiping = false;
            return;
        }
        state.touchStartX = event.touches[0].clientX;
        state.touchStartY = event.touches[0].clientY;
        state.isSwiping = false; // スワイプ開始時はフラグをリセット
        state.touchEndX = state.touchStartX; // touchendで使えるように初期化
        state.touchEndY = state.touchStartY;
    },

    handleTouchMove(event) {
        if (!state.settings.enableSwipeNavigation) return;
        
        // 開始点がない、マルチタッチ、ズーム中は処理しない
        if (!state.touchStartX || event.touches.length > 1 || state.isZoomed) {
            return;
        }

        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const diffX = state.touchStartX - currentX;
        const diffY = state.touchStartY - currentY;

        // 横方向の移動が縦方向より大きい場合にスワイプと判定
        // isSwipingフラグを立てるのは閾値を超えたときではなく、横移動が優位な場合
        if (Math.abs(diffX) > Math.abs(diffY)) {
            state.isSwiping = true;
            // 横スワイプ(画面遷移の可能性)中はデフォルトの縦スクロールを抑制
            // これにより、意図しない縦スクロールと画面遷移の競合を防ぐ
            event.preventDefault();
        } else {
            // 縦方向の移動が大きい場合はスワイプフラグを解除
            state.isSwiping = false;
        }
        // 現在位置を記録 (touchendで使うため)
        state.touchEndX = currentX;
        state.touchEndY = currentY;
    },

    handleTouchEnd(event) {
         if (!state.settings.enableSwipeNavigation) {
             this.resetSwipeState(); // 状態はリセットしておく
             return;
         }

         // ズーム状態を最終確認 (touchendまでに変わる可能性もあるため)
         this.updateZoomState();
         if (state.isZoomed) {
             console.log("Zoomed state detected on touchend, skipping swipe navigation.");
             this.resetSwipeState();
             return;
         }

         // スワイプ中でない、または開始点がない場合はリセットして終了
         if (!state.isSwiping || !state.touchStartX) {
             this.resetSwipeState();
             return;
         }

        const diffX = state.touchStartX - state.touchEndX;
        const diffY = state.touchStartY - state.touchEndY; // 縦移動量も一応計算

        // スワイプ距離が閾値を超えているか、かつ横移動が縦移動より大きいか
        if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) { // 左スワイプ (右から左へ) -> 設定画面へ
                console.log("左スワイプ検出 -> 設定画面へ");
                uiUtils.showScreen('settings'); // showScreenが履歴操作を行う
            } else { // 右スワイプ (左から右へ) -> 履歴画面へ
                console.log("右スワイプ検出 -> 履歴画面へ");
                uiUtils.showScreen('history'); // showScreenが履歴操作を行う
            }
        } else {
            // 閾値未満または縦移動が大きい場合は何もしない
            console.log("スワイプ距離不足 or 縦移動大");
        }

        this.resetSwipeState(); // スワイプ状態をリセット
    },

    resetSwipeState() {
        state.touchStartX = 0;
        state.touchStartY = 0;
        state.touchEndX = 0;
        state.touchEndY = 0;
        state.isSwiping = false;
    },
    // --- スワイプ処理ここまで ---


    // 新規チャット開始の確認と実行
    async confirmStartNewChat() {
        // 送信中なら中断確認
        if (state.isSending) {
            const confirmed = await uiUtils.showCustomConfirm("送信中です。中断して新規チャットを開始しますか？");
            if (!confirmed) return;
            this.abortRequest(); // 送信中断
        }
        // 編集中なら破棄確認
        if (state.editingMessageIndex !== null) {
            const confirmed = await uiUtils.showCustomConfirm("編集中です。変更を破棄して新規チャットを開始しますか？");
            if (!confirmed) return;
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl); // 編集キャンセル
        }
        // システムプロンプト編集中なら破棄確認
        if (state.isEditingSystemPrompt) {
            const confirmed = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄して新規チャットを開始しますか？");
            if (!confirmed) return;
            this.cancelEditSystemPrompt();
        }
        
        // 保留中の添付ファイルがあれば破棄確認
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して新規チャットを開始しますか？");
            if (!confirmedAttach) return;
            state.pendingAttachments = []; // 破棄
            uiUtils.updateAttachmentBadgeVisibility(); // バッジ状態更新
        }
        
        // 現在のチャットにメッセージまたはシステムプロンプトがあり、IDもあれば保存を試みる
        if ((state.currentMessages.length > 0 || state.currentSystemPrompt) && state.currentChatId) {
            try {
                await dbUtils.saveChat();
            } catch (error) {
                console.error("新規チャット開始前のチャット保存失敗:", error);
                const conf = await uiUtils.showCustomConfirm("現在のチャットの保存に失敗しました。新規チャットを開始しますか？");
                if (!conf) return; // 保存失敗時にキャンセルされたら中断
            }
        }
        // 新規チャットを開始
        this.startNewChat();
        uiUtils.showScreen('chat'); // チャット画面を表示 (URLハッシュも更新)
    },

    // 新規チャットを開始する (状態リセット)
    startNewChat() {
        state.currentChatId = null; // IDリセット
        state.currentMessages = []; // メッセージクリア
        state.currentSystemPrompt = state.settings.systemPrompt; // デフォルトのシステムプロンプトを適用
        state.pendingAttachments = []; // 保留中の添付ファイルをクリア
        state.currentPersistentMemory = {}; // 永続メモリをリセット
        state.currentScene = { scene_id: "initial", location: "不明な場所" }; // シーン情報を初期化
        uiUtils.updateSystemPromptUI(); // システムプロンプトUI更新
        uiUtils.renderChatMessages(); // 表示クリア
        uiUtils.updateChatTitle(); // タイトルを「新規チャット」に
        elements.userInput.value = ''; // 入力欄クリア
        uiUtils.adjustTextareaHeight(); // 高さ調整
        uiUtils.setSendingState(false); // 送信状態リセット
        state.currentStyleProfiles = {};
    },

    // 指定IDのチャットを読み込む
    async loadChat(id) {
        // 送信中なら中断確認
        if (state.isSending) {
            const confirmed = await uiUtils.showCustomConfirm("送信中です。中断して別のチャットを読み込みますか？");
            if (!confirmed) return;
            this.abortRequest();
        }
        // 編集中なら破棄確認
        if (state.editingMessageIndex !== null) {
            const confirmed = await uiUtils.showCustomConfirm("編集中です。変更を破棄して別のチャットを読み込みますか？");
            if (!confirmed) return;
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl);
        }
        // システムプロンプト編集中なら破棄確認
        if (state.isEditingSystemPrompt) {
            const confirmed = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄して別のチャットを読み込みますか？");
            if (!confirmed) return;
            this.cancelEditSystemPrompt();
        }
        // 保留中の添付ファイルがあれば破棄確認
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して別のチャットを読み込みますか？");
            if (!confirmedAttach) return;
            state.pendingAttachments = []; // 破棄
            uiUtils.updateAttachmentBadgeVisibility(); // バッジ状態更新
        }

        try {
            const chat = await dbUtils.getChat(id); // DBからチャット取得
            if (chat) {
                state.currentChatId = chat.id;
                // attachments も含めて読み込む (DBに保存されていれば)
                state.currentMessages = chat.messages?.map(msg => ({
                    ...msg,
                    attachments: msg.attachments || [] // attachmentsがなければ空配列
                })) || [];

                // 永続メモリを読み込む (存在しなければ空オブジェクト)
                state.currentPersistentMemory = chat.persistentMemory || {};

                let needsSave = false;
                const groupIds = new Set(state.currentMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                groupIds.forEach(gid => {
                    const siblings = state.currentMessages.filter(m => m.siblingGroupId === gid);
                    const selected = siblings.filter(m => m.isSelected);
                    if (selected.length === 0 && siblings.length > 0) {
                        // 選択されているものがない -> 最後のものを選択状態にする
                        siblings[siblings.length - 1].isSelected = true;
                        needsSave = true;
                    } else if (selected.length > 1) {
                        // 複数選択されている -> 最後のもの以外を解除
                        selected.slice(0, -1).forEach(m => m.isSelected = false);
                        needsSave = true;
                    }
                });
                
                state.currentSystemPrompt = chat.systemPrompt !== undefined ? chat.systemPrompt : state.settings.systemPrompt;
                state.pendingAttachments = [];
                uiUtils.updateSystemPromptUI();
                uiUtils.renderChatMessages();
                uiUtils.updateChatTitle(chat.title);
                elements.userInput.value = '';
                uiUtils.adjustTextareaHeight();
                uiUtils.setSendingState(false);

                if (needsSave) {
                    console.log("読み込み時に isSelected を正規化しました。DBに保存します。");
                    await dbUtils.saveChat();
                }

                history.replaceState({ screen: 'chat' }, '', '#chat');
                state.currentScreen = 'chat';
                console.log("チャット読み込み完了:", id, "履歴状態を #chat に設定");
            } else {
                await uiUtils.showCustomAlert("チャット履歴が見つかりませんでした。");
                this.startNewChat();
                uiUtils.showScreen('chat');
            }
        } catch (error) {
            await uiUtils.showCustomAlert(`チャットの読み込みエラー: ${error}`);
            this.startNewChat();
            uiUtils.showScreen('chat');
        }
    },

    // チャットを複製
    async duplicateChat(id) {
        // 送信中・編集中・他チャット保存の確認 (loadChatと同様)
        if (state.isSending) { const conf = await uiUtils.showCustomConfirm("送信中です。中断してチャットを複製しますか？"); if (!conf) return; this.abortRequest(); }
        if (state.editingMessageIndex !== null) { const conf = await uiUtils.showCustomConfirm("編集中です。変更を破棄してチャットを複製しますか？"); if (!conf) return; const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`); this.cancelEditMessage(state.editingMessageIndex, msgEl); }
        if (state.isEditingSystemPrompt) { const conf = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄してチャットを複製しますか？"); if (!conf) return; this.cancelEditSystemPrompt(); }
        if ((state.currentMessages.length > 0 || state.currentSystemPrompt) && state.currentChatId && state.currentChatId !== id) { try { await dbUtils.saveChat(); } catch (error) { console.error("複製前の現チャット保存失敗:", error); const conf = await uiUtils.showCustomConfirm("現在のチャット保存に失敗しました。複製を続行しますか？"); if (!conf) return; } }
        // 保留中の添付ファイルがあれば破棄確認
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄してチャットを複製しますか？");
            if (!confirmedAttach) return;
            state.pendingAttachments = []; // 破棄
        }

        try {
            const chat = await dbUtils.getChat(id); // 複製元を取得
            if (chat) {
                // 新しいタイトルを作成 (末尾のコピーサフィックスを除去して再度付与)
                const originalTitle = chat.title || "無題のチャット";
                const newTitle = originalTitle.replace(new RegExp(DUPLICATE_SUFFIX.replace(/([().])/g, '\\$1') + '$'), '').trim() + DUPLICATE_SUFFIX;

                // メッセージをディープコピーし、新しい siblingGroupId を生成
                const duplicatedMessages = [];
                const groupIdMap = new Map(); // 古いGroupId -> 新しいGroupId
                (chat.messages || []).forEach(msg => {
                    const newMsg = JSON.parse(JSON.stringify(msg)); // ディープコピー
                    // attachments もコピー (Base64データも含まれる)
                    newMsg.attachments = msg.attachments ? JSON.parse(JSON.stringify(msg.attachments)) : [];
                    // 新しいフラグもコピー (isSelected は後で調整)
                    newMsg.isCascaded = msg.isCascaded ?? false;
                    newMsg.isSelected = msg.isSelected ?? false;
                    if (msg.siblingGroupId) {
                        if (!groupIdMap.has(msg.siblingGroupId)) {
                            groupIdMap.set(msg.siblingGroupId, `dup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
                        }
                        newMsg.siblingGroupId = groupIdMap.get(msg.siblingGroupId);
                    } else {
                        delete newMsg.siblingGroupId; // 元々なければ削除
                    }
                    duplicatedMessages.push(newMsg);
                });

                // 複製後の isSelected を正規化 (各グループの最後のものを選択)
                const newGroupIds = new Set(duplicatedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                newGroupIds.forEach(gid => {
                    const siblings = duplicatedMessages.filter(m => m.siblingGroupId === gid);
                    siblings.forEach((m, idx) => {
                        m.isSelected = (idx === siblings.length - 1); // 最後のものだけ true
                    });
                });

                // 新しいチャットデータを作成
                const newChatData = {
                    messages: duplicatedMessages,
                    systemPrompt: chat.systemPrompt || '', // システムプロンプトもコピー
                    // 永続メモリもディープコピーで複製
                    persistentMemory: JSON.parse(JSON.stringify(chat.persistentMemory || {})),
                    updatedAt: Date.now(), // 更新/作成日時は現在
                    createdAt: Date.now(),
                    title: newTitle
                };
                // 新しいチャットとしてDBに追加
                const newChatId = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                    const request = store.add(newChatData); // addで新規追加
                    request.onsuccess = (event) => resolve(event.target.result); // 新しいIDを返す
                    request.onerror = (event) => reject(event.target.error);
                });
                console.log("チャット複製完了:", id, "->", newChatId);
                // 履歴画面が表示されていればリストを更新、そうでなければアラート表示
                if (state.currentScreen === 'history') { // stateで判定
                    uiUtils.renderHistoryList();
                } else {
                    await uiUtils.showCustomAlert(`チャット「${newTitle}」を複製しました。`);
                }
            } else {
                await uiUtils.showCustomAlert("複製元のチャットが見つかりません。");
            }
        } catch (error) {
            await uiUtils.showCustomAlert(`チャット複製エラー: ${error}`);
        }
    },

    // チャットをテキストファイルとしてエクスポート
    async exportChat(chatId, chatTitle) {
        const confirmed = await uiUtils.showCustomConfirm(`チャット「${chatTitle || 'この履歴'}」をテキスト出力しますか？`);
        if (!confirmed) return;
    
        try {
            let chatToExport;

            // 現在表示中のチャットをエクスポートする場合、DBからではなく最新のstateからデータを取得する
            if (state.currentChatId === chatId) {
                console.log("エクスポート: 現在のチャットをstateから直接エクスポートします。");
                chatToExport = {
                    id: state.currentChatId,
                    title: chatTitle, // UIから渡された最新のタイトルを使用
                    messages: state.currentMessages,
                    systemPrompt: state.currentSystemPrompt,
                    persistentMemory: state.currentPersistentMemory, // 最新のメモリを使用
                    createdAt: null, // createdAtはDBから読み込まないと不明だが、エクスポートには必須ではない
                    updatedAt: Date.now(),
                };
            } else {
                console.log(`エクスポート: チャットID ${chatId} をDBから読み込みます。`);
                chatToExport = await dbUtils.getChat(chatId);
            }
    
            if (!chatToExport || ((!chatToExport.messages || chatToExport.messages.length === 0) && !chatToExport.systemPrompt)) {
                await uiUtils.showCustomAlert("チャットデータが空です。");
                return;
            }
    
            let exportText = '';
    
            // persistentMemory をメタデータとして出力
            if (chatToExport.persistentMemory && Object.keys(chatToExport.persistentMemory).length > 0) {
                try {
                    const metadataJson = JSON.stringify(chatToExport.persistentMemory, null, 2);
                    exportText += `<|#|metadata|#|>\n${metadataJson}\n<|#|/metadata|#|>\n\n`;
                } catch (e) {
                    console.error("persistentMemoryのJSON化に失敗しました:", e);
                }
            }
    
            // システムプロンプトを出力
            if (chatToExport.systemPrompt) {
                exportText += `<|#|system|#|>\n${chatToExport.systemPrompt}\n<|#|/system|#|>\n\n`;
            }
    
            // メッセージを出力
            if (chatToExport.messages) {
                chatToExport.messages.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'model') {
                        let attributes = '';
                        if (msg.role === 'model') {
                            if (msg.isCascaded) attributes += ' isCascaded';
                            if (msg.isSelected) attributes += ' isSelected';
                        }
                        if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                            const fileNames = msg.attachments.map(a => a.name).join(';');
                            attributes += ` attachments="${fileNames.replace(/"/g, '&quot;')}"`;
                        }
                        exportText += `<|#|${msg.role}|#|${attributes}>\n${msg.content}\n<|#|/${msg.role}|#|>\n\n`;
                    }
                });
            }
    
            const blob = new Blob([exportText.trim()], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safeTitle = (chatToExport.title || `chat_${chatId}_export`).replace(/[<>:"/\\|?*\s]/g, '_');
            a.href = url;
            a.download = `${safeTitle}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("チャットエクスポート完了:", chatId);
        } catch (error) {
            await uiUtils.showCustomAlert(`エクスポートエラー: ${error}`);
        }
    },


    // チャット削除の確認と実行 (メッセージペア全体)
    async confirmDeleteChat(id, title) {
         const confirmed = await uiUtils.showCustomConfirm(`「${title || 'この履歴'}」を削除しますか？`);
         if (confirmed) {
            const isDeletingCurrent = state.currentChatId === id;
            const currentScreenBeforeDelete = state.currentScreen;

            try {
                // 1. DBから削除
                await dbUtils.deleteChat(id);
                console.log("チャット削除:", id);

                // 2. 表示中チャット削除なら内部状態リセット
                if (isDeletingCurrent) {
                    console.log("表示中のチャットが削除されたため、内部状態を新規チャットにリセット。");
                    this.startNewChat(); // pendingAttachments もクリアされる
                }

                // 3. 履歴画面での操作ならリストUI更新 & 状態リセット判定
                if (currentScreenBeforeDelete === 'history') {
                    console.log("履歴画面での操作のため、リストUIを更新します。");
                    await uiUtils.renderHistoryList(); // リストUIを更新
                    const listIsEmpty = elements.historyList.querySelectorAll('.history-item:not(.js-history-item-template)').length === 0;

                    // リストが空になった場合、内部状態をリセットする（念のため）
                    if (listIsEmpty) {
                        console.log("履歴リストが空になりました。");
                        if (!isDeletingCurrent) {
                            this.startNewChat();
                        }
                    }
                }

            } catch (error) {
                await uiUtils.showCustomAlert(`チャット削除エラー: ${error}`);
                uiUtils.setSendingState(false); // エラー時も送信状態解除
            }
        }
    },

    // 履歴アイテムのタイトルを編集
    async editHistoryTitle(chatId, titleElement) {
        const currentTitle = titleElement.textContent;
        const newTitle = await uiUtils.showCustomPrompt("新しいタイトル:", currentTitle); // newTitle は OK なら文字列、キャンセルなら ''

        // キャンセル時('')でなく、入力があり(trim後空でなく)、変更があった場合
        const trimmedTitle = (newTitle !== null) ? newTitle.trim() : '';

        if (newTitle !== '' && trimmedTitle !== '' && trimmedTitle !== currentTitle) {
            const finalTitle = trimmedTitle.substring(0, 100); // 100文字に制限
            try {
                await dbUtils.updateChatTitleDb(chatId, finalTitle); // DB更新
                // UI更新
                titleElement.textContent = finalTitle;
                titleElement.title = finalTitle; // ホバータイトルも更新
                // 更新日時も更新表示
                const dateElement = titleElement.closest('.history-item')?.querySelector('.updated-date');
                if(dateElement) dateElement.textContent = `更新: ${uiUtils.formatDate(Date.now())}`;
                // 現在表示中のチャットのタイトルが変更されたら、ヘッダーも更新
                if (state.currentChatId === chatId) {
                    uiUtils.updateChatTitle(finalTitle);
                }
            } catch (error) {
                await uiUtils.showCustomAlert(`タイトル更新エラー: ${error}`);
            }
        } else {
            // キャンセルまたは変更なし
            console.log("タイトル編集キャンセルまたは変更なし");
        }
    },

    async proofreadText(textToProofread) {
        console.log("--- 校正処理開始 ---");
        const { 
            proofreadingModelName, 
            proofreadingSystemInstruction, 
            apiKey, 
            temperature, 
            maxTokens, 
            topK, 
            topP,
            enableAutoRetry,
            maxRetries
        } = state.settings;

        if (!proofreadingModelName) {
            throw new Error("校正用モデルが設定されていません。");
        }

        const endpoint = `${GEMINI_API_BASE_URL}${proofreadingModelName}:generateContent?key=${apiKey}`;
        const systemInstruction = proofreadingSystemInstruction?.trim() ? { parts: [{ text: proofreadingSystemInstruction.trim() }] } : null;
        const generationConfig = {};
        if (temperature !== null) generationConfig.temperature = temperature;
        if (maxTokens !== null) generationConfig.maxOutputTokens = maxTokens;
        if (topK !== null) generationConfig.topK = topK;
        if (topP !== null) generationConfig.topP = topP;

        const requestBody = {
            contents: [{ role: 'user', parts: [{ text: textToProofread }] }],
            ...(Object.keys(generationConfig).length > 0 && { generationConfig }),
            ...(systemInstruction && { systemInstruction }),
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        };

        if (state.settings.applyDummyToProofread && state.settings.dummyUser) {
            requestBody.contents.push({
                role: 'user',
                parts: [{ text: state.settings.dummyUser }]
            });
            console.log("校正リクエストにダミーUserプロンプトを適用しました。");
        }

        console.log("校正APIへの送信データ:", JSON.stringify(requestBody, null, 2));

        let lastError = null;
        const maxProofreadRetries = enableAutoRetry ? maxRetries : 0;

        for (let attempt = 0; attempt <= maxProofreadRetries; attempt++) {
            try {
                if (state.abortController?.signal.aborted) {
                    throw new Error("リクエストがキャンセルされました。");
                }

                if (attempt > 0) {
                    let delay;
                    if (state.settings.useFixedRetryDelay) {
                        delay = state.settings.fixedRetryDelaySeconds * 1000;
                    } else {
                        const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                        const maxDelay = state.settings.maxBackoffDelaySeconds * 1000;
                        delay = Math.min(exponentialDelay, maxDelay);
                    }
                    
                    uiUtils.setLoadingIndicatorText(`校正エラー 再試行(${attempt}回目)... ${Math.round(delay/1000)}秒待機`);
                    console.log(`校正APIリトライ ${attempt}: ${delay}ms待機...`);
                    await interruptibleSleep(delay, state.abortController.signal);
                }

                if (attempt === 0) {
                    uiUtils.setLoadingIndicatorText('校正中...');
                } else if (attempt === 1) {
                    uiUtils.setLoadingIndicatorText('校正処理を再試行中...');
                } else {
                    uiUtils.setLoadingIndicatorText(`校正処理${attempt}回目の再試行中...`);
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: state.abortController?.signal
                });

                if (!response.ok) {
                    let errorMsg = `校正APIエラー (${response.status}): ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.error?.message) {
                            errorMsg = `校正APIエラー (${response.status}): ${errorData.error.message}`;
                        }
                    } catch (e) { /* JSONパース失敗は無視 */ }
                    const error = new Error(errorMsg);
                    error.status = response.status;
                    throw error;
                }

                const responseData = await response.json();
                if (responseData.candidates?.[0]?.content?.parts) {
                    const proofreadContent = responseData.candidates[0].content.parts.map(p => p.text).join('');
                    console.log("--- 校正処理成功 ---");
                    return proofreadContent;
                } else if (responseData.promptFeedback) {
                    const blockReason = responseData.promptFeedback.blockReason || 'SAFETY';
                    throw new Error(`校正モデルに応答がブロックされました (理由: ${blockReason})`);
                } else {
                    throw new Error("校正APIの応答に有効なコンテンツが含まれていません。");
                }

            } catch (error) {
                lastError = error;
                if (error.name === 'AbortError') {
                    throw error;
                }
                if (error.status && error.status >= 400 && error.status < 500) {
                    console.error(`リトライ不可の校正エラー (ステータス: ${error.status})。`, error);
                    throw error;
                }
                console.warn(`校正API呼び出し試行 ${attempt + 1} が失敗。`, error);
            }
        }

        console.error("校正APIの最大リトライ回数に達しました。");
        throw lastError;
    },

    
    /**
         * @private API通信と応答解析、ループ処理に責務を特化した内部関数。
         * stateの変更やUIの更新は一切行わない。
         * @param {Array} messagesForApi - APIに送信するメッセージ履歴。
         * @param {object} generationConfig - 生成設定。
         * @param {object} systemInstruction - システムプロンプト。
         * @returns {Promise<Array>} 生成された新しいメッセージオブジェクトの配列。
         */
    async _internalHandleSend(messagesForApi, generationConfig, systemInstruction, streamingIndex) {
        let loopCount = 0;
        const MAX_LOOPS = 10;
        const turnResults = [];
        let currentTurnHistory = [...messagesForApi];
        let aggregatedSearchResults = [];
        let aggregatedUiActions = [];

        uiUtils.setLoadingIndicatorText('応答生成中...');

        const convertToApiFormat = (msg) => {
            const parts = [];
            if (msg.content && msg.content.trim() !== '') parts.push({ text: msg.content });
            if (msg.role === 'model' && msg.tool_calls) {
                msg.tool_calls.forEach(toolCall => parts.push({ functionCall: toolCall.functionCall }));
            }
            if (msg.role === 'tool') {
                if (msg.name && msg.response) {
                    parts.push({ functionResponse: { name: msg.name, response: msg.response } });
                }
            }
            return { role: msg.role === 'tool' ? 'tool' : 'model', parts };
        };

        while (loopCount < MAX_LOOPS) {
            const isFirstCallInLoop = loopCount === 0; // ★ ループの初回かどうかを判定
            loopCount++;

            const result = await this.callApiWithRetry({
                messagesForApi: currentTurnHistory,
                generationConfig,
                systemInstruction,
                tools: window.functionDeclarations,
                streamingIndex,
                isFirstCall: isFirstCallInLoop // ★ 初回フラグを渡す
            });

            const modelMessage = {
                role: 'model',
                content: result.content || '',
                thoughtSummary: result.thoughtSummary,
                tool_calls: result.toolCalls,
                generated_images: result.images || [], 
                timestamp: Date.now(),
                finishReason: result.finishReason,
                safetyRatings: result.safetyRatings,
                groundingMetadata: result.groundingMetadata,
                usageMetadata: result.usageMetadata,
                retryCount: result.retryCount,
                executedFunctions: []
            };
            turnResults.push(modelMessage);

            if (!result.toolCalls || result.toolCalls.length === 0) {
                break; 
            }
            
            uiUtils.setLoadingIndicatorText('関数実行中...');
            const { toolResults, containsTerminalAction, search_results, internalUiActions } = await this.executeToolCalls(result.toolCalls);
            
            if (search_results && search_results.length > 0) {
                aggregatedSearchResults.push(...search_results);
            }
            if (internalUiActions && internalUiActions.length > 0) {
                console.log(`[Debug] _internalHandleSend: executeToolCallsから ${internalUiActions.length} 件のUIアクションを受信`);
                aggregatedUiActions.push(...internalUiActions);
            }
            
            turnResults.push(...toolResults);
            
            const executedFunctionNames = toolResults.map(tr => tr.name);
            const lastModelMsg = turnResults.filter(m => m.role === 'model').pop();
            if(lastModelMsg) {
                lastModelMsg.executedFunctions.push(...executedFunctionNames);
            }

            const modelMessageForApi = convertToApiFormat(modelMessage);
            const toolResultsForApi = toolResults.map(convertToApiFormat);
            currentTurnHistory.push(modelMessageForApi, ...toolResultsForApi);

            if (containsTerminalAction) {
                console.log("終端アクションが検出されたため、Function Callingループを終了します。");
                break;
            }
            uiUtils.setLoadingIndicatorText('応答生成中...');
        }

        if (loopCount >= MAX_LOOPS) {
            throw new Error("AIが同じ操作を繰り返しているようです。処理を中断しました。");
        }

        const finalModelMessages = turnResults.filter(m => m.role === 'model');
        if (finalModelMessages.length > 0) {
            if (aggregatedSearchResults.length > 0) {
                const lastMessage = finalModelMessages[finalModelMessages.length - 1];
                lastMessage.search_web_results = aggregatedSearchResults;
            }
            if (aggregatedUiActions.length > 0) {
                const lastMessage = finalModelMessages[finalModelMessages.length - 1];
                if (!lastMessage._internal_ui_actions) {
                    lastMessage._internal_ui_actions = [];
                }
                lastMessage._internal_ui_actions.push(...aggregatedUiActions);
                console.log(`[Debug] _internalHandleSend: 最終メッセージにUIアクションを紐付けました`, lastMessage._internal_ui_actions);
            }

            if (state.settings.enableProofreading) {
                const lastTextResponse = finalModelMessages.filter(m => m.content && !m.tool_calls).pop();
                if (lastTextResponse) {
                    try {
                        uiUtils.setLoadingIndicatorText('校正中...');
                        lastTextResponse.content = await this.proofreadText(lastTextResponse.content);
                    } catch (proofreadError) {
                        console.error("校正処理中にエラーが発生しました。校正前のテキストを使用します。", proofreadError);
                    }
                }
            }

            if (state.settings.enableThoughtTranslation) {
                for (const msg of finalModelMessages) {
                    if (msg.thoughtSummary) {
                        try {
                            uiUtils.setLoadingIndicatorText('思考プロセスを翻訳中...');
                            msg.thoughtSummary = await apiUtils.translateText(msg.thoughtSummary, state.settings.thoughtTranslationModel);
                        } catch (translateError) {
                            console.error("思考プロセスの翻訳中にエラーが発生しました。原文を使用します。", translateError);
                        }
                    }
                }
            }
        }
        
        return turnResults;
    },

    /**
     * @private _internalHandleSendから返されたメッセージ配列を単一のオブジェクトに集約する。
     */
    _aggregateMessages(messages) {
        const finalAggregatedMessage = {
            role: 'model',
            content: '',
            thoughtSummary: '',
            executedFunctions: [],
            generated_images: [], 
            generated_videos: [], 
            timestamp: Date.now(),
        };

        messages.forEach(msg => {
            if (msg.role === 'model') {
                if (msg.content) finalAggregatedMessage.content += msg.content;
                if (msg.thoughtSummary) finalAggregatedMessage.thoughtSummary += msg.thoughtSummary;
                if (msg.executedFunctions) finalAggregatedMessage.executedFunctions.push(...msg.executedFunctions);
                
                if (msg.search_web_results) {
                    if (!finalAggregatedMessage.search_web_results) {
                        finalAggregatedMessage.search_web_results = [];
                    }
                    finalAggregatedMessage.search_web_results.push(...msg.search_web_results);
                }

                // ★ _internal_ui_actionsから画像データを集約するロジックを追加
                if (msg._internal_ui_actions) {
                    console.log(`[Debug] _aggregateMessages: _internal_ui_actionsを検出`, msg._internal_ui_actions); // ★ デバッグログ
                    msg._internal_ui_actions.forEach(action => {
                        if (action.type === 'display_generated_images' && action.images) {
                            finalAggregatedMessage.generated_images.push(...action.images);
                        }
                    });
                }

                Object.assign(finalAggregatedMessage, {
                    finishReason: msg.finishReason,
                    safetyRatings: msg.safetyRatings,
                    groundingMetadata: msg.groundingMetadata,
                    usageMetadata: msg.usageMetadata,
                    retryCount: msg.retryCount,
                });
            }
            else if (msg.role === 'tool' && msg.response && msg.response.video_url) {
                finalAggregatedMessage.generated_videos.push({
                    url: msg.response.video_url,
                    base64Data: msg.response.video_base64,
                    prompt: msg.response.prompt || ''
                });
            }
        });
        
        console.log("[Debug] 集約後の最終メッセージオブジェクト:", JSON.stringify(finalAggregatedMessage, (key, value) => {
            if (key === 'data' && typeof value === 'string' && value.length > 50) return value.substring(0, 50) + '...';
            return value;
        }, 2)); // ★ デバッグログ (Base64は省略)

        return finalAggregatedMessage;
    },

    
    async handleSend() {
        console.log("--- handleSend (Orchestrator): 処理開始 ---");

        if (state.isSending) { console.warn("handleSend: 既に送信中のため処理を中断"); return; }
        if (state.editingMessageIndex !== null) { await uiUtils.showCustomAlert("他のメッセージを編集中です。"); return; }
        if (state.isEditingSystemPrompt) { await uiUtils.showCustomAlert("システムプロンプトを編集中です。"); return; }

        const text = elements.userInput.value.trim();
        const attachmentsToSend = [...state.pendingAttachments];
        if (!text && attachmentsToSend.length === 0) return;

        uiUtils.setSendingState(true);
        
        const userMessage = { role: 'user', content: text, timestamp: Date.now(), attachments: attachmentsToSend };
        state.currentMessages.push(userMessage);
        state.pendingAttachments = [];
        uiUtils.updateAttachmentBadgeVisibility();
        elements.userInput.value = '';
        uiUtils.adjustTextareaHeight();
        uiUtils.renderChatMessages(); 
        uiUtils.scrollToBottom();
        await dbUtils.saveChat();

        try {
            let historyForApiRaw = state.currentMessages.filter(msg => !msg.isCascaded || msg.isSelected);
            if (state.settings.dummyUser) {
                historyForApiRaw.push({ role: 'user', content: state.settings.dummyUser, attachments: [] });
            }
            
            const historyForApi = historyForApiRaw.map(msg => {
                const parts = [];
                // 常にテキストパートを先に追加
                if (msg.content && msg.content.trim() !== '') {
                    parts.push({ text: msg.content });
                }
                // ユーザーメッセージの添付ファイルを追加
                if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                    msg.attachments.forEach(att => parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64Data } }));
                }
                
                if (msg.role === 'model' && msg.tool_calls) {
                    msg.tool_calls.forEach(toolCall => parts.push({ functionCall: toolCall.functionCall }));
                }
                if (msg.role === 'tool') {
                    if (msg.name && msg.response) {
                        parts.push({ functionResponse: { name: msg.name, response: msg.response } });
                    }
                }
                return { role: msg.role === 'tool' ? 'tool' : (msg.role === 'model' ? 'model' : 'user'), parts };
            }).filter(c => c.parts.length > 0);

            const generationConfig = {};
            if (state.settings.temperature !== null) generationConfig.temperature = state.settings.temperature;
            if (state.settings.maxTokens !== null) generationConfig.maxOutputTokens = state.settings.maxTokens;
            if (state.settings.topK !== null) generationConfig.topK = state.settings.topK;
            if (state.settings.topP !== null) generationConfig.topP = state.settings.topP;
            if (state.settings.thinkingBudget !== null || state.settings.includeThoughts) {
                generationConfig.thinkingConfig = {};
                if(state.settings.thinkingBudget !== null) generationConfig.thinkingConfig.thinkingBudget = state.settings.thinkingBudget;
                if(state.settings.includeThoughts) generationConfig.thinkingConfig.includeThoughts = true;
            }
            const systemInstruction = state.currentSystemPrompt?.trim() ? { role: "system", parts: [{ text: state.currentSystemPrompt.trim() }] } : null;

            const newMessages = await this._internalHandleSend(historyForApi, generationConfig, systemInstruction);
            const finalAggregatedMessage = this._aggregateMessages(newMessages);

            state.currentMessages.push(finalAggregatedMessage);

            uiUtils.renderChatMessages();
            await dbUtils.saveChat();

        } catch(error) {
            console.error("--- handleSend: 最終catchブロックでエラー捕捉 ---", error);
            const errorMessage = (error.name !== 'AbortError') ? (error.message || "不明なエラーが発生しました。") : "リクエストがキャンセルされました。";
            
            state.currentMessages.push({ role: 'error', content: errorMessage, timestamp: Date.now() });
            uiUtils.renderChatMessages();
            await dbUtils.saveChat();
        } finally {
            uiUtils.setSendingState(false);
            state.abortController = null;
            uiUtils.scrollToBottom();
        }
    },
    
    // APIリクエストを中断
    abortRequest() {
        if (state.abortController) {
            console.log("中断リクエスト送信");
            state.abortController.abort(); // AbortControllerで中断
        } else {
            console.log("中断するアクティブなリクエストがありません。");
        }
    },

    // --- 履歴インポートハンドラ ---
    async handleHistoryImport(file) {
        if (!file || !file.type.startsWith('text/plain')) {
            await uiUtils.showCustomAlert("テキストファイル (.txt) を選択してください。");
            return;
        }
        console.log("履歴インポート開始:", file.name);
        const reader = new FileReader();

        reader.onload = async (event) => {
            const textContent = event.target.result;
            if (!textContent) {
                await uiUtils.showCustomAlert("ファイルの内容が空です。");
                return;
            }
            try {
                const { messages: importedMessages, systemPrompt: importedSystemPrompt, persistentMemory: importedMemory } = this.parseImportedHistory(textContent);
                if (importedMessages.length === 0 && !importedSystemPrompt && (!importedMemory || Object.keys(importedMemory).length === 0)) {
                    await uiUtils.showCustomAlert("ファイルから有効なメッセージ、システムプロンプト、またはメタデータを読み込めませんでした。形式を確認してください。");
                    return;
                }


                // --- インポート後の siblingGroupId 割り当て ---
                let currentGroupId = null;
                let lastUserIndex = -1;
                for (let i = 0; i < importedMessages.length; i++) {
                    const msg = importedMessages[i];
                    if (msg.role === 'user') {
                        lastUserIndex = i;
                        currentGroupId = null; // ユーザーメッセージでグループリセット
                    } else if (msg.role === 'model' && msg.isCascaded) {
                        if (currentGroupId === null && lastUserIndex !== -1) {
                            // 新しいグループIDを生成
                            currentGroupId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                        }
                        if (currentGroupId) {
                            msg.siblingGroupId = currentGroupId;
                        }
                    } else {
                        currentGroupId = null; // 非カスケードモデルでグループリセット
                    }
                }
                // --- isSelected の正規化 (各グループの最後のものを選択) ---
                const groupIds = new Set(importedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                groupIds.forEach(gid => {
                    const siblings = importedMessages.filter(m => m.siblingGroupId === gid);
                    const selected = siblings.filter(m => m.isSelected);
                    if (selected.length === 0 && siblings.length > 0) {
                        siblings[siblings.length - 1].isSelected = true;
                    } else if (selected.length > 1) {
                        selected.slice(0, -1).forEach(m => m.isSelected = false);
                        // 最後の isSelected は true のまま
                    }
                });
                // -----------------------------------------

                // ファイル名から拡張子を除去してタイトル生成
                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                const newTitle = IMPORT_PREFIX + (fileNameWithoutExt || `Imported_${Date.now()}`);

                const newChatData = {
                    messages: importedMessages,
                    systemPrompt: importedSystemPrompt || '', // インポートされたシステムプロンプト
                    persistentMemory: importedMemory || {}, // インポートされた永続メモリ
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
                    title: newTitle.substring(0, 100) // 100文字制限
                };

                // 新しいチャットとしてDBに追加
                const newChatId = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                    const request = store.add(newChatData);
                    request.onsuccess = (event) => resolve(event.target.result);
                    request.onerror = (event) => reject(event.target.error);
                });

                console.log("履歴インポート成功:", newChatId);
                await uiUtils.showCustomAlert(`履歴「${newChatData.title}」をインポートしました。`);
                // 履歴リストを再描画
                uiUtils.renderHistoryList();

            } catch (error) {
                console.error("履歴インポート処理エラー:", error);
                await uiUtils.showCustomAlert(`履歴のインポート中にエラーが発生しました: ${error.message}`);
            }
        };

        reader.onerror = async (event) => {
            console.error("ファイル読み込みエラー:", event.target.error);
            await uiUtils.showCustomAlert("ファイルの読み込みに失敗しました。");
        };

        reader.readAsText(file); // ファイルをテキストとして読み込む
    },

    // インポートされたテキストをパースする
    parseImportedHistory(text) {
        const messages = [];
        let systemPrompt = '';
        let persistentMemory = {}; // persistentMemoryを初期化
    
        // メタデータブロックを先に抽出して、元のテキストから削除する
        const metadataRegex = /<\|#\|metadata\|#\|>([\s\S]*?)<\|#\|\/metadata\|#\|>\s*/;
        const metadataMatch = text.match(metadataRegex);
        let remainingText = text;
    
        if (metadataMatch) {
            const metadataJson = metadataMatch[1].trim();
            try {
                persistentMemory = JSON.parse(metadataJson);
                console.log("インポートファイルからpersistentMemoryをパースしました:", persistentMemory);
            } catch (e) {
                console.error("インポートされたmetadataのJSONパースに失敗しました。空のオブジェクトとして扱います。", e);
                persistentMemory = {}; // パース失敗時は空に
            }
            // メタデータブロックをテキストから削除して、残りのパースに影響しないようにする
            remainingText = text.replace(metadataRegex, '');
        }
    
        // 正規表現を修正: <|#|role|#| [attributes]>\ncontent\n<|#|/role|#|>
        const blockRegex = /<\|#\|(system|user|model)\|#\|([^>]*)>([\s\S]*?)<\|#\|\/\1\|#\|>/g;
        let match;
    
        // メタデータ削除後のテキストに対してループ処理
        while ((match = blockRegex.exec(remainingText)) !== null) {
            const role = match[1];
            const attributesString = match[2].trim(); // 属性文字列 (例: "isCascaded isSelected")
            const content = match[3].trim(); // コンテンツ
    
            if (role === 'system' && content) {
                systemPrompt = content; // システムプロンプトを抽出
            } else if ((role === 'user' || role === 'model') && (content || attributesString.includes('attachments'))) { // コンテンツが空でも attachments があれば処理
                const messageData = {
                    role: role,
                    content: content,
                    timestamp: Date.now(),
                    attachments: [] // 初期化
                };
                // 属性をパース
                const attributes = {};
                attributesString.split(/\s+/).forEach(attr => {
                    const eqIndex = attr.indexOf('=');
                    if (eqIndex > 0) {
                        const key = attr.substring(0, eqIndex);
                        let value = attr.substring(eqIndex + 1);
                        // クォートを除去
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length - 1);
                        }
                        attributes[key] = value.replace(/&quot;/g, '"'); // デコード
                    } else if (attr) {
                        attributes[attr] = true; // isCascaded, isSelected
                    }
                });
    
                if (role === 'model') {
                    messageData.isCascaded = attributes['isCascaded'] === true;
                    messageData.isSelected = attributes['isSelected'] === true;
                }
                // attachments 属性をパース
                if (role === 'user' && attributes['attachments']) {
                    const fileNames = attributes['attachments'].split(';');
                    messageData.attachments = fileNames.map(name => ({
                        name: name,
                        mimeType: 'unknown/unknown', // インポート時は不明
                        base64Data: '' // Base64データはインポートしない
                    }));
                }
                
                messages.push(messageData);
            }
        }
        console.log(`インポートテキストから ${messages.length} 件のメッセージとシステムプロンプト(${systemPrompt ? 'あり' : 'なし'})をパースしました。`);
        // 戻り値に persistentMemory を追加
        return { messages, systemPrompt, persistentMemory };
    },
    // -------------------------------

    // --- 背景画像ハンドラ ---
     // 背景画像アップロード処理
     async handleBackgroundImageUpload(file) {
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            await uiUtils.showCustomAlert(`画像サイズが大きすぎます (${(maxSize / 1024 / 1024).toFixed(1)}MB以下にしてください)`);
            return;
        }
        if (!file.type.startsWith('image/')) {
            await uiUtils.showCustomAlert("画像ファイルを選択してください (JPEG, PNG, GIF, WebPなど)");
            return;
        }
        try {
            state.backgroundImageUrl = null;
            uiUtils.revokeExistingObjectUrl();
            const blob = file;
            await dbUtils.saveSetting('backgroundImageBlob', blob);
            state.settings.backgroundImageBlob = blob;
            state.backgroundImageUrl = URL.createObjectURL(blob);

            document.documentElement.style.setProperty('--chat-background-image-main', `url("${state.backgroundImageUrl}")`);
            
            uiUtils.updateBackgroundSettingsUI();
        } catch (error) {
            uiUtils.revokeExistingObjectUrl();
            document.documentElement.style.setProperty('--chat-background-image-main', 'none');
            state.settings.backgroundImageBlob = null;
            uiUtils.updateBackgroundSettingsUI();
        }
    },
     // 背景画像削除の確認
     async confirmDeleteBackgroundImage() {
         const confirmed = await uiUtils.showCustomConfirm("背景画像を削除しますか？");
         if (confirmed) {
             await this.handleBackgroundImageDelete();
         }
     },
     // 背景画像削除処理
    async handleBackgroundImageDelete() {
        try {
            uiUtils.revokeExistingObjectUrl();
            await dbUtils.saveSetting('backgroundImageBlob', null);
            state.settings.backgroundImageBlob = null;
            document.documentElement.style.setProperty('--chat-background-image-main', 'none');
            uiUtils.updateBackgroundSettingsUI();
        } catch (error) {
           console.error("背景画像削除エラー:", error);
           await uiUtils.showCustomAlert(`背景画像の削除中にエラーが発生しました: ${error}`);
        }
    },
     // -------------------------------

    // 設定を保存
    async saveSettings() {
        const defaultHeaderColor = elements.darkModeToggle.checked ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
        const currentHeaderColor = elements.headerColorInput.value;
        const newSettings = {
            apiKey: elements.apiKeyInput.value.trim(),
            modelName: elements.modelNameSelect.value,
            streamingOutput: elements.streamingOutputCheckbox.checked,
            streamingSpeed: elements.streamingSpeedInput.value === '' ? DEFAULT_STREAMING_SPEED : parseInt(elements.streamingSpeedInput.value),
            systemPrompt: elements.systemPromptDefaultTextarea.value.trim(),
            temperature: elements.temperatureInput.value === '' ? null : parseFloat(elements.temperatureInput.value),
            maxTokens: elements.maxTokensInput.value === '' ? null : parseInt(elements.maxTokensInput.value),
            topK: elements.topKInput.value === '' ? null : parseInt(elements.topKInput.value),
            topP: elements.topPInput.value === '' ? null : parseFloat(elements.topPInput.value),
            presencePenalty: elements.presencePenaltyInput.value === '' ? null : parseFloat(elements.presencePenaltyInput.value),
            frequencyPenalty: elements.frequencyPenaltyInput.value === '' ? null : parseFloat(elements.frequencyPenaltyInput.value),
            thinkingBudget: elements.thinkingBudgetInput.value === '' ? null : parseInt(elements.thinkingBudgetInput.value, 10),
            includeThoughts: elements.includeThoughtsToggle.checked,
            enableThoughtTranslation: elements.enableThoughtTranslationCheckbox.checked,
            thoughtTranslationModel: elements.thoughtTranslationModelSelect.value,

            dummyUser: elements.dummyUserInput.value.trim(),
            applyDummyToProofread: elements.applyDummyToProofreadCheckbox.checked,
            applyDummyToTranslate: elements.applyDummyToTranslateCheckbox.checked,
            dummyModel: elements.dummyModelInput.value.trim(),
            concatDummyModel: elements.concatDummyModelCheckbox.checked,
            additionalModels: elements.additionalModelsTextarea.value.trim(),
            pseudoStreaming: elements.pseudoStreamingCheckbox.checked,
            enterToSend: elements.enterToSendCheckbox.checked,
            historySortOrder: elements.historySortOrderSelect.value,
            darkMode: elements.darkModeToggle.checked,
            fontFamily: elements.fontFamilyInput.value.trim(),
            hideSystemPromptInChat: elements.hideSystemPromptToggle.checked,
            geminiEnableGrounding: elements.geminiEnableGroundingToggle.checked,
            geminiEnableFunctionCalling: elements.geminiEnableFunctionCallingToggle.checked,
            enableSwipeNavigation: elements.swipeNavigationToggle.checked,
            enableAutoRetry: elements.enableAutoRetryCheckbox.checked,
            maxRetries: parseInt(elements.maxRetriesInput.value, 10) || 0,
            useFixedRetryDelay: elements.useFixedRetryDelayCheckbox.checked,
            fixedRetryDelaySeconds: parseInt(elements.fixedRetryDelayInput.value, 10) || 15,
            maxBackoffDelaySeconds: parseInt(elements.maxBackoffDelayInput.value, 10) || 60,
            enableProofreading: elements.enableProofreadingCheckbox.checked,
            proofreadingModelName: elements.proofreadingModelNameSelect.value,
            proofreadingSystemInstruction: elements.proofreadingSystemInstructionTextarea.value.trim(),
            googleSearchApiKey: elements.googleSearchApiKeyInput.value.trim(),
            googleSearchEngineId: elements.googleSearchEngineIdInput.value.trim(),
            overlayOpacity: parseFloat(elements.overlayOpacitySlider.value) / 100,
            messageOpacity: (parseFloat(elements.messageOpacitySlider?.value) || 100) / 100,
            headerColor: elements.headerColorInput.value,
            allowPromptUiChanges: document.getElementById('allow-prompt-ui-changes').checked,
            forceFunctionCalling: elements.forceFunctionCallingToggle.checked,
        };

        if (isNaN(newSettings.streamingSpeed) || newSettings.streamingSpeed < 0) {
            newSettings.streamingSpeed = DEFAULT_STREAMING_SPEED;
        }
        if (newSettings.temperature !== null && (isNaN(newSettings.temperature) || newSettings.temperature < 0 || newSettings.temperature > 2)) {
            newSettings.temperature = null;
        }
        if (newSettings.maxTokens !== null && (isNaN(newSettings.maxTokens) || newSettings.maxTokens < 1)) {
            newSettings.maxTokens = null;
        }
        if (newSettings.topK !== null && (isNaN(newSettings.topK) || newSettings.topK < 1)) {
            newSettings.topK = null;
        }
        if (newSettings.topP !== null && (isNaN(newSettings.topP) || newSettings.topP < 0 || newSettings.topP > 1)) {
            newSettings.topP = null;
        }
        if (newSettings.presencePenalty !== null && (isNaN(newSettings.presencePenalty) || newSettings.presencePenalty < -2.0 || newSettings.presencePenalty >= 2.0)) {
            newSettings.presencePenalty = null;
        }
        if (newSettings.frequencyPenalty !== null && (isNaN(newSettings.frequencyPenalty) || newSettings.frequencyPenalty < -2.0 || newSettings.frequencyPenalty >= 2.0)) {
            newSettings.frequencyPenalty = null;
        }
        if (newSettings.thinkingBudget !== null && (isNaN(newSettings.thinkingBudget) || newSettings.thinkingBudget < 0 || !Number.isInteger(newSettings.thinkingBudget))) {
            newSettings.thinkingBudget = null;
        }
        if (isNaN(newSettings.maxRetries) || newSettings.maxRetries < 0) {
            newSettings.maxRetries = 0;
        }
        if (isNaN(newSettings.fixedRetryDelaySeconds) || newSettings.fixedRetryDelaySeconds < 0) {
            newSettings.fixedRetryDelaySeconds = 15;
        }
        if (isNaN(newSettings.maxBackoffDelaySeconds) || newSettings.maxBackoffDelaySeconds < 0) {
            newSettings.maxBackoffDelaySeconds = 60;
        }

        try {
            const oldSortOrder = state.settings.historySortOrder;
            const { backgroundImageBlob, ...settingsToSave } = newSettings;

            const promises = Object.entries(settingsToSave).map(([key, value]) =>
                dbUtils.saveSetting(key, value)
            );
            await Promise.all(promises);

            const currentBgBlob = state.settings.backgroundImageBlob;
            state.settings = { ...state.settings, ...settingsToSave };
            state.settings.backgroundImageBlob = currentBgBlob;
            updateCurrentSystemPrompt();
            uiUtils.applySettingsToUI();
            uiUtils.renderChatMessages(true);

            console.log("設定保存成功:", { ...state.settings, backgroundImageBlob: state.settings.backgroundImageBlob ? '[Blob]' : null });
            await uiUtils.showCustomAlert("設定を保存しました。");

            if (newSettings.historySortOrder !== oldSortOrder && state.currentScreen === 'history') {
                uiUtils.renderHistoryList();
            }
        } catch (error) {
            await uiUtils.showCustomAlert(`設定の保存中にエラーが発生しました: ${error}`);
        }
    },

    // アプリを更新 (キャッシュクリア)
    async updateApp() {
        if (!('serviceWorker' in navigator)) {
            await uiUtils.showCustomAlert("お使いのブラウザはService Workerをサポートしていません。");
            return;
        }
        
        const confirmed = await uiUtils.showCustomConfirm("アプリのキャッシュをクリアして最新版を再取得しますか？ (ページがリロードされます)");
        if (!confirmed) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            
            if (registration && registration.active) {
                // Service Workerにキャッシュクリアを指示します。
                // リロード処理は、sw.jsからの完了メッセージを 'message' リスナーが受け取って実行します。
                registration.active.postMessage({ action: 'clearCache' });
                
                // registration.update() はここでは不要です。
                // 目的はキャッシュの強制クリアとリロードのため、
                // Service Worker自体の更新チェックはブラウザの標準的なライフサイクルに任せます。

            } else {
                await uiUtils.showCustomAlert("アクティブなService Workerが見つかりませんでした。ページを強制的に再読み込みします。");
                window.location.reload(true);
            }
        } catch (error) {
            console.error("Service Workerの処理中にエラー:", error);
            await uiUtils.showCustomAlert(`Service Workerの処理中にエラーが発生しました。ページを強制的に再読み込みします。\nエラー: ${error.message}`);
            window.location.reload(true);
        }
    },

    // 全データ削除の確認と実行
    async confirmClearAllData() {
        const confirmed = await uiUtils.showCustomConfirm("本当にすべてのデータ（チャット履歴と設定）を削除しますか？この操作は元に戻せません。");
        if (confirmed) {
            try {
                uiUtils.revokeExistingObjectUrl(); // 背景画像のURLを破棄
                await dbUtils.clearAllData(); // DBの全データをクリア
                await uiUtils.showCustomAlert("すべてのデータが削除されました。アプリをリセットします。");

                // stateを完全に初期デフォルト状態にリセット
                state.currentChatId = null;
                state.currentMessages = [];
                state.currentSystemPrompt = ''; // システムプロンプトもリセット
                state.pendingAttachments = [];
                state.settings = { // 初期デフォルト値に戻す
                    apiKey: '',
                    modelName: DEFAULT_MODEL,
                    streamingOutput: true,
                    streamingSpeed: DEFAULT_STREAMING_SPEED,
                    systemPrompt: '', // デフォルトSPもリセット
                    temperature: null,
                    maxTokens: null,
                    topK: null,
                    topP: null,
                    presencePenalty: null,
                    frequencyPenalty: null,
                    thinkingBudget: null,
                    dummyUser: '',
                    dummyModel: '',
                    concatDummyModel: false,
                    additionalModels: '',
                    pseudoStreaming: false,
                    enterToSend: true,
                    historySortOrder: 'updatedAt',
                    // ダークモードはOS設定にフォールバック
                    darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
                    backgroundImageBlob: null,
                    fontFamily: '', // フォントもリセット
                    hideSystemPromptInChat: false, // SP非表示もリセット
                    enableSwipeNavigation: true, // スワイプナビゲーションのデフォルト値
                };
                state.backgroundImageUrl = null;

                // リセットされた状態をUIに適用
                document.documentElement.style.setProperty('--chat-background-image', 'none'); // 背景スタイルリセット
                uiUtils.applySettingsToUI(); // 設定UIをリセット (ダークモード、背景UI、フォント、SP表示含む)
                uiUtils.updateAttachmentBadgeVisibility(); // バッジ状態更新
                this.startNewChat(); // 新規チャット状態にする (履歴状態もリセットされる)
                uiUtils.showScreen('chat', true); // popstate経由ではないが履歴操作はstartNewChatに任せる
            } catch (error) {
                await uiUtils.showCustomAlert(`データ削除中にエラーが発生しました: ${error}`);
            }
        }
    },

    async executeToolCalls(toolCalls) {
        const chat = {
            id: state.currentChatId,
            messages: state.currentMessages,
            systemPrompt: state.currentSystemPrompt,
            persistentMemory: state.currentPersistentMemory
        };
    
        const toolResults = [];
        let containsTerminalAction = false;
        let aggregatedSearchResults = [];
        let internalUiActions = []; // ★ 追加：UIアクションを一時的に保持する配列
    
        for (const toolCall of toolCalls) {
            const functionName = toolCall.functionCall.name;
            const functionArgs = toolCall.functionCall.args;
            
            console.log(`[Function Calling] 実行: ${functionName}`, functionArgs);
    
            let result;
            if (window.functionCallingTools && typeof window.functionCallingTools[functionName] === 'function') {
                try {
                    result = await window.functionCallingTools[functionName](functionArgs, chat);
                } catch (e) {
                    console.error(`[Function Calling] 関数 '${functionName}' の実行中にエラーが発生しました:`, e);
                    result = { error: `関数実行中の内部エラー: ${e.message}` };
                }
            } else {
                console.error(`[Function Calling] 関数 '${functionName}' が見つかりません。`);
                result = { error: `関数 '${functionName}' が見つかりません。` };
            }

            const responseForAI = { ...result };

            if (result.search_results) {
                aggregatedSearchResults.push(...result.search_results);
                delete responseForAI.search_results;
            }

            if (result._internal_ui_action) {
                console.log(`[Debug] executeToolCalls: _internal_ui_actionを検出`, result._internal_ui_action); // ★ デバッグログ
                internalUiActions.push(result._internal_ui_action); // ★ UIアクションを配列に追加

                if (result._internal_ui_action.type === 'display_layered_image') {
                    containsTerminalAction = true;
                }
                
                delete responseForAI._internal_ui_action;
            }

            toolResults.push({ 
                role: 'tool', 
                name: functionName, 
                response: responseForAI, 
                timestamp: Date.now() 
            });
        }
    
        if (chat.persistentMemory) {
            state.currentPersistentMemory = chat.persistentMemory;
        }
        await dbUtils.saveChat();
    
        state.currentScene = state.currentPersistentMemory?.scene_stack?.slice(-1)[0] || null;
        state.currentStyleProfiles = state.currentPersistentMemory?.style_profiles || {};
    
        // ★ 戻り値にUIアクションと検索結果を追加
        return { toolResults, containsTerminalAction, search_results: aggregatedSearchResults, internalUiActions };
    },


    // --- システムプロンプト編集 ---
    startEditSystemPrompt() {
        if (state.isSending) return; // 送信中は編集不可
        state.isEditingSystemPrompt = true;
        elements.systemPromptEditor.value = state.currentSystemPrompt; // 現在の値で初期化
        uiUtils.adjustTextareaHeight(elements.systemPromptEditor, 200);
        elements.systemPromptEditor.focus();
        console.log("システムプロンプト編集開始");
    },
    async saveCurrentSystemPrompt() {
        const newPrompt = elements.systemPromptEditor.value.trim();
        if (newPrompt !== state.currentSystemPrompt) {
            state.currentSystemPrompt = newPrompt;
            try {
                await dbUtils.saveChat(); // 現在のチャットを保存 (SP含む)
                await sleep(100);
                console.log("システムプロンプト保存完了");
            } catch (error) {
                await uiUtils.showCustomAlert("システムプロンプトの保存に失敗しました。");
            }
        }
        state.isEditingSystemPrompt = false;
        elements.systemPromptDetails.removeAttribute('open'); // detailsを閉じる
    },
    cancelEditSystemPrompt() {
        state.isEditingSystemPrompt = false;
        elements.systemPromptEditor.value = state.currentSystemPrompt; // 元の値に戻す
        elements.systemPromptDetails.removeAttribute('open'); // detailsを閉じる
        uiUtils.adjustTextareaHeight(elements.systemPromptEditor, 200);
        console.log("システムプロンプト編集キャンセル");
    },
    // -----------------------------

    // --- メッセージアクション ---
    // メッセージ編集開始
    async startEditMessage(index, messageElement) {
         if (state.isSending) {
             await uiUtils.showCustomAlert("送信中は編集できません。");
             return;
         }
         if (state.editingMessageIndex !== null && state.editingMessageIndex !== index) {
             await uiUtils.showCustomAlert("他のメッセージを編集中です。");
             return;
         }
         if (state.isEditingSystemPrompt) {
             await uiUtils.showCustomAlert("システムプロンプトを編集中です。");
             return;
         }
         if (state.editingMessageIndex === index) {
             messageElement.querySelector('.edit-textarea')?.focus();
             return;
         }

         const message = state.currentMessages[index];
         if (!message) return;

         const rawContent = message.content;
         state.editingMessageIndex = index;

         const contentDiv = messageElement.querySelector('.message-content');
         const editArea = messageElement.querySelector('.message-edit-area');
         const cascadeControls = messageElement.querySelector('.message-cascade-controls');
         editArea.innerHTML = '';

         let horizontalPadding = 0;
         try {
             const computedStyle = window.getComputedStyle(messageElement);
             const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
             const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
             horizontalPadding = paddingLeft + paddingRight;
         } catch (e) {
             console.error("幅の動的計算中にエラー:", e);
         }
         messageElement.style.width = `calc(var(--message-max-width) + ${horizontalPadding}px + 17px)`;

         const textarea = document.createElement('textarea');
         textarea.value = rawContent;
         textarea.classList.add('edit-textarea');
         textarea.rows = 3;
         textarea.oninput = () => uiUtils.adjustTextareaHeight(textarea, 400);

         const actionsDiv = document.createElement('div');
         actionsDiv.classList.add('message-edit-actions');

         const saveButton = document.createElement('button');
         saveButton.textContent = '保存';
         saveButton.classList.add('save-edit-btn');
         saveButton.onclick = () => this.saveEditMessage(index, messageElement);

         const cancelButton = document.createElement('button');
         cancelButton.textContent = 'キャンセル';
         cancelButton.classList.add('cancel-edit-btn');
         cancelButton.onclick = () => this.cancelEditMessage(index, messageElement);

         actionsDiv.appendChild(saveButton);
         actionsDiv.appendChild(cancelButton);
         editArea.appendChild(textarea);
         editArea.appendChild(actionsDiv);

         messageElement.classList.add('editing');
         if(contentDiv) contentDiv.classList.add('hidden');
         if(cascadeControls) cascadeControls.classList.add('hidden');
         editArea.classList.remove('hidden');

         uiUtils.adjustTextareaHeight(textarea, 400);
         textarea.focus();
         textarea.select();
    },

    // メッセージ編集を保存
    async saveEditMessage(index, messageElement) {
        const textarea = messageElement.querySelector('.edit-textarea');
        if (!textarea) {
            this.cancelEditMessage(index, messageElement);
            return;
        }
        const newRawContent = textarea.value.trim();
        const originalMessage = state.currentMessages[index];

        if (newRawContent === originalMessage.content) {
            this.cancelEditMessage(index, messageElement);
            return;
        }

        originalMessage.content = newRawContent;
        originalMessage.timestamp = Date.now();
        delete originalMessage.error;

        const contentDiv = messageElement.querySelector('.message-content');
        if(contentDiv && typeof marked !== 'undefined' && originalMessage.role === 'model') {
            try {
                contentDiv.innerHTML = marked.parse(newRawContent || '');
            } catch (e) {
                console.error("編集保存時のMarkdownパースエラー:", e);
                contentDiv.textContent = newRawContent;
            }
        } else if (contentDiv) {
            const pre = contentDiv.querySelector('pre') || document.createElement('pre');
            pre.textContent = newRawContent;
            if(!contentDiv.querySelector('pre')) {
                contentDiv.innerHTML = '';
                contentDiv.appendChild(pre);
            }
        }

        this.finishEditing(messageElement);

        // Prism.jsでシンタックスハイライトを再適用
        if (window.Prism) {
            messageElement.querySelectorAll('pre code').forEach((block) => {
                Prism.highlightElement(block);
            });
        }

        let requiresTitleUpdate = (index === state.currentMessages.findIndex(m => m.role === 'user'));
        try {
            let newTitleForSave = null;
            if (requiresTitleUpdate) {
                newTitleForSave = newRawContent.substring(0, 50) || "無題のチャット";
            }
            await dbUtils.saveChat(newTitleForSave);
            if (requiresTitleUpdate) {
                uiUtils.updateChatTitle(newTitleForSave);
            }
            console.log("メッセージ編集後にチャット保存:", index);
        } catch (error) {
            await uiUtils.showCustomAlert("メッセージ編集後のチャット保存に失敗しました。");
        }
    },
    // メッセージ編集をキャンセル
    cancelEditMessage(index, messageElement = null) {
          if (!messageElement) {
              messageElement = elements.messageContainer.querySelector(`.message[data-index="${index}"]`);
          }
          if (messageElement) {
              this.finishEditing(messageElement);
          } else if (state.editingMessageIndex === index) {
              state.editingMessageIndex = null;
              console.log("編集キャンセル: 要素が見つかりませんでしたがインデックスをリセット:", index);
          }
    },
    // 編集UIを終了する共通処理
    finishEditing(messageElement) {
        if (!messageElement) return;
        const editArea = messageElement.querySelector('.message-edit-area');
        const contentDiv = messageElement.querySelector('.message-content');
        const cascadeControls = messageElement.querySelector('.message-cascade-controls');

        messageElement.style.removeProperty('width');

        messageElement.classList.remove('editing');
        if(contentDiv) contentDiv.classList.remove('hidden');
        if(cascadeControls) cascadeControls.classList.remove('hidden');
        if(editArea) {
            editArea.classList.add('hidden');
            editArea.innerHTML = '';
        }

        const index = parseInt(messageElement.dataset.index, 10);
        if (state.editingMessageIndex === index) {
            state.editingMessageIndex = null;
            console.log("編集終了:", index);
        }
    },

    // メッセージを削除 (会話ターン全体)
    async deleteMessage(index) {
        if (state.editingMessageIndex === index) {
            this.cancelEditMessage(index);
        }
        if (state.isSending) {
            await uiUtils.showCustomAlert("送信中は削除できません。");
            return;
        }
        if (state.isEditingSystemPrompt) {
            await uiUtils.showCustomAlert("システムプロンプト編集中は削除できません。");
            return;
        }
        if (index < 0 || index >= state.currentMessages.length) {
             console.error("削除対象のインデックスが無効:", index);
             return;
        }

        const messageToDelete = state.currentMessages[index];
        const messageContentPreview = messageToDelete.content.substring(0, 30) + "...";
        let confirmMessage = "";
        let deleteTargetDescription = "";
        let indicesToDelete = [];

        if (messageToDelete.role === 'model' && messageToDelete.isCascaded && messageToDelete.siblingGroupId) {
            const groupId = messageToDelete.siblingGroupId;
            const siblings = state.currentMessages.filter(msg => msg.role === 'model' && msg.isCascaded && msg.siblingGroupId === groupId);
            indicesToDelete = state.currentMessages
                .map((msg, i) => (msg.role === 'model' && msg.isCascaded && msg.siblingGroupId === groupId) ? i : -1)
                .filter(i => i !== -1);

            confirmMessage = `「${messageContentPreview}」を含む応答グループ全体 (${siblings.length}件) を削除しますか？`;
            deleteTargetDescription = `カスケードグループ (gid: ${groupId}, ${indicesToDelete.length}件)`;
        } else {
            indicesToDelete.push(index);
            confirmMessage = `メッセージ「${messageContentPreview}」(${messageToDelete.role}) を削除しますか？`;
            deleteTargetDescription = `単一メッセージ (index: ${index}, role: ${messageToDelete.role})`;
        }

        const confirmed = await uiUtils.showCustomConfirm(confirmMessage);
        if (confirmed) {
            console.log(`削除実行: ${deleteTargetDescription}`);
            const originalFirstUserMsgIndex = state.currentMessages.findIndex(m => m.role === 'user');

            indicesToDelete.sort((a, b) => b - a).forEach(idx => {
                state.currentMessages.splice(idx, 1);
            });
            console.log(`メッセージ削除完了 (state)。削除件数: ${indicesToDelete.length}`);

            uiUtils.renderChatMessages();
            uiUtils.scrollToBottom();

            const newFirstUserMsgIndex = state.currentMessages.findIndex(m => m.role === 'user');
            let requiresTitleUpdate = indicesToDelete.includes(originalFirstUserMsgIndex);

            try {
                let newTitleForSave = null;
                const currentChatData = state.currentChatId ? await dbUtils.getChat(state.currentChatId) : null;

                if (requiresTitleUpdate) {
                    const newFirstUserMessage = newFirstUserMsgIndex !== -1 ? state.currentMessages[newFirstUserMsgIndex] : null;
                    newTitleForSave = newFirstUserMessage ? newFirstUserMessage.content.substring(0, 50) : "無題のチャット";
                } else if (currentChatData) {
                    newTitleForSave = currentChatData.title;
                }

                await dbUtils.saveChat(newTitleForSave);

                if (requiresTitleUpdate) {
                    uiUtils.updateChatTitle(newTitleForSave);
                }

                if (state.currentMessages.length === 0 && !state.currentSystemPrompt && state.currentChatId) {
                    console.log("チャットが空になったためリセットします。");
                    this.startNewChat();
                }
            } catch (error) {
                console.error("メッセージ削除後のチャット保存/取得エラー:", error);
                await uiUtils.showCustomAlert("メッセージ削除後のチャット保存に失敗しました。");
            }
        } else {
             console.log("削除キャンセル");
        }
    },

    
    
    
    async retryFromMessage(index) {
        if (state.isSending) { await uiUtils.showCustomAlert("送信中です。"); return; }
        
        const userMessage = state.currentMessages[index];
        if (!userMessage || userMessage.role !== 'user') return;

        const messageContentPreview = userMessage.content.substring(0, 30) + "...";
        const confirmed = await uiUtils.showCustomConfirm(`「${messageContentPreview}」から再生成しますか？\n(これより未来の会話履歴は削除され、既存の応答は別候補として保持されます)`);

        if (confirmed) {
            uiUtils.setSendingState(true);

            const futureMessages = state.currentMessages.slice(index + 1);
            let originalResponses = [];
            
            const firstModelResponse = futureMessages.find(msg => msg.role === 'model');
            if (firstModelResponse && firstModelResponse.isCascaded && firstModelResponse.siblingGroupId) {
                const groupId = firstModelResponse.siblingGroupId;
                originalResponses = state.currentMessages.filter(
                    msg => msg.siblingGroupId === groupId
                );
            } else if (firstModelResponse) {
                originalResponses.push(firstModelResponse);
            }
            
            state.currentMessages.splice(index + 1);

            uiUtils.renderChatMessages();
            uiUtils.scrollToBottom();

            try {
                let historyForApiRaw = state.currentMessages.filter(msg => {
                    return !msg.isCascaded || msg.isSelected;
                });

                if (state.settings.dummyUser) {
                    historyForApiRaw.push({ role: 'user', content: state.settings.dummyUser, attachments: [] });
                }
                const historyForApi = historyForApiRaw.map(msg => {
                    const parts = [];
                    if (msg.content && msg.content.trim() !== '') {
                        parts.push({ text: msg.content });
                    }
                    if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                        msg.attachments.forEach(att => parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64Data } }));
                    }
                    if (msg.role === 'model' && msg.generated_images && msg.generated_images.length > 0) {
                        msg.generated_images.forEach(img => {
                            parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
                        });
                    }
                    if (msg.role === 'model' && msg.tool_calls) {
                        msg.tool_calls.forEach(toolCall => parts.push({ functionCall: toolCall.functionCall }));
                    }
                    if (msg.role === 'tool') {
                         if (msg.name && msg.response) {
                            parts.push({ functionResponse: { name: msg.name, response: msg.response } });
                        }
                    }
                    return { role: msg.role === 'tool' ? 'tool' : (msg.role === 'model' ? 'model' : 'user'), parts };
                }).filter(c => c.parts.length > 0);

                const generationConfig = {};
                if (state.settings.temperature !== null) generationConfig.temperature = state.settings.temperature;
                if (state.settings.maxTokens !== null) generationConfig.maxOutputTokens = state.settings.maxTokens;
                if (state.settings.topK !== null) generationConfig.topK = state.settings.topK;
                if (state.settings.topP !== null) generationConfig.topP = state.settings.topP;
                 if (state.settings.thinkingBudget !== null || state.settings.includeThoughts) {
                    generationConfig.thinkingConfig = {};
                    if(state.settings.thinkingBudget !== null) generationConfig.thinkingConfig.thinkingBudget = state.settings.thinkingBudget;

                    if(state.settings.includeThoughts) generationConfig.thinkingConfig.includeThoughts = true;
                }
                const systemInstruction = state.currentSystemPrompt?.trim() ? { role: "system", parts: [{ text: state.currentSystemPrompt.trim() }] } : null;

                const newMessages = await this._internalHandleSend(historyForApi, generationConfig, systemInstruction);
                const newAggregatedMessage = this._aggregateMessages(newMessages);

                const siblingGroupId = (originalResponses.length > 0 && originalResponses[0].siblingGroupId)
                    ? originalResponses[0].siblingGroupId
                    : `gid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                originalResponses.forEach(msg => {
                    msg.isCascaded = true;
                    msg.isSelected = false;
                    msg.siblingGroupId = siblingGroupId;
                });

                newAggregatedMessage.isCascaded = true;
                newAggregatedMessage.isSelected = true;
                newAggregatedMessage.siblingGroupId = siblingGroupId;

                state.currentMessages.push(...originalResponses, newAggregatedMessage);
                uiUtils.renderChatMessages();
                await dbUtils.saveChat();

            } catch(error) {
                console.error("--- retryFromMessage: 最終catchブロックでエラー捕捉 ---", error);
                const errorMessage = (error.name !== 'AbortError') ? (error.message || "不明なエラーが発生しました。") : "リクエストがキャンセルされました。";
                state.currentMessages.push({ role: 'error', content: errorMessage, timestamp: Date.now() });
                uiUtils.renderChatMessages();
                await dbUtils.saveChat();
            } finally {
                uiUtils.setSendingState(false);
                state.abortController = null; 
                uiUtils.scrollToBottom();
            }
        }
    },

    // --- カスケード応答操作 ---
    getCascadedSiblings(index, includeSelf = false) {
        const targetMsg = state.currentMessages[index];
        if (!targetMsg || !targetMsg.isCascaded || !targetMsg.siblingGroupId) {
            return [];
        }
        const groupId = targetMsg.siblingGroupId;
        const siblings = state.currentMessages.filter((msg, i) =>
            msg.role === 'model' &&
            !msg.tool_calls &&
            msg.isCascaded &&
            msg.siblingGroupId === groupId &&
            (includeSelf || i !== index)
        );
        return siblings;
    },

    async navigateCascade(currentIndex, direction) {
        const currentMsg = state.currentMessages[currentIndex];
        if (!currentMsg || !currentMsg.isCascaded || !currentMsg.siblingGroupId) return;

        const groupId = currentMsg.siblingGroupId;
        
        const siblingsWithIndices = state.currentMessages
            .map((msg, i) => ({ msg, originalIndex: i }))
            .filter(item => item.msg.siblingGroupId === groupId);

        if (siblingsWithIndices.length <= 1) return;

        const currentPosition = siblingsWithIndices.findIndex(item => item.originalIndex === currentIndex);
        if (currentPosition === -1) return;

        let targetPosition = -1;
        if (direction === 'prev' && currentPosition > 0) {
            targetPosition = currentPosition - 1;
        } else if (direction === 'next' && currentPosition < siblingsWithIndices.length - 1) {
            targetPosition = currentPosition + 1;
        }

        if (targetPosition !== -1) {
            siblingsWithIndices.forEach(item => {
                item.msg.isSelected = false;
            });

            const targetItem = siblingsWithIndices[targetPosition];
            targetItem.msg.isSelected = true;
            const newSelectedIndex = targetItem.originalIndex;

            // UIを再描画し、その後で操作UIを強制的に再表示する
            uiUtils.renderChatMessages();
            
            // requestAnimationFrameを使用して、DOMの更新が完了した後に実行
            requestAnimationFrame(() => {
                const elementToShowActions = elements.messageContainer.querySelector(`.message[data-index="${newSelectedIndex}"]`);
                if (elementToShowActions && !elementToShowActions.classList.contains('editing')) {
                    // 他に表示されているメニューがあれば閉じる
                    const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                    if (currentlyShown && currentlyShown !== elementToShowActions) {
                        currentlyShown.classList.remove('show-actions');
                    }
                    // ターゲットのメニューを表示
                    elementToShowActions.classList.add('show-actions');
                }
            });

            await dbUtils.saveChat();
        }
    },

    async confirmDeleteCascadeResponse(indexToDelete) {
        const msgToDelete = state.currentMessages[indexToDelete];
        if (!msgToDelete || msgToDelete.role !== 'model' || !msgToDelete.isCascaded || !msgToDelete.siblingGroupId) {
            return;
        }
        if (state.editingMessageIndex !== null) { await uiUtils.showCustomAlert("編集中は削除できません。"); return; }
        if (state.isSending) { await uiUtils.showCustomAlert("送信中は削除できません。"); return; }
        if (state.isEditingSystemPrompt) { await uiUtils.showCustomAlert("システムプロンプト編集中は削除できません。"); return; }

        const siblings = this.getCascadedSiblings(indexToDelete, true);
        const currentIndexInGroup = siblings.findIndex(m => m === msgToDelete) + 1;
        const totalSiblings = siblings.length;
        const contentPreview = msgToDelete.content.substring(0, 30) + "...";
        const confirmMsg = `この応答 (${currentIndexInGroup}/${totalSiblings})「${contentPreview}」を削除しますか？\n(この応答のみが削除されます)`;

        const confirmed = await uiUtils.showCustomConfirm(confirmMsg);
        if (confirmed) {
            const wasSelected = msgToDelete.isSelected;
            const groupId = msgToDelete.siblingGroupId;

            state.currentMessages.splice(indexToDelete, 1);

            let newlySelectedIndex = -1;
            const remainingSiblingsWithIndices = state.currentMessages
                .map((msg, i) => ({ msg, originalIndex: i }))
                .filter(item => item.msg.role === 'model' && item.msg.isCascaded && item.msg.siblingGroupId === groupId);

            if (remainingSiblingsWithIndices.length > 0) {
                remainingSiblingsWithIndices.forEach(item => { item.msg.isSelected = false; });

                if (wasSelected) {
                    const lastSiblingItem = remainingSiblingsWithIndices[remainingSiblingsWithIndices.length - 1];
                    lastSiblingItem.msg.isSelected = true;
                    newlySelectedIndex = lastSiblingItem.originalIndex;
                } else {
                    const stillSelectedItem = remainingSiblingsWithIndices.find(item => item.msg.isSelected);
                    if (stillSelectedItem) {
                        newlySelectedIndex = stillSelectedItem.originalIndex;
                    } else {
                        const lastSiblingItem = remainingSiblingsWithIndices[remainingSiblingsWithIndices.length - 1];
                        lastSiblingItem.msg.isSelected = true;
                        newlySelectedIndex = lastSiblingItem.originalIndex;
                    }
                }
            }

            uiUtils.renderChatMessages();
            requestAnimationFrame(() => {
                if (newlySelectedIndex !== -1) {
                    const elementToShowActions = elements.messageContainer.querySelector(`.message[data-index="${newlySelectedIndex}"]`);
                    if (elementToShowActions && !elementToShowActions.classList.contains('editing')) {
                        const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                        if (currentlyShown && currentlyShown !== elementToShowActions) {
                            currentlyShown.classList.remove('show-actions');
                        }
                        elementToShowActions.classList.add('show-actions');
                    }
                }
            });

            try {
                await dbUtils.saveChat();
            } catch (error) {
                await uiUtils.showCustomAlert("応答削除後のチャット状態の保存に失敗しました。");
            }
        }
    },
    
    // --- ファイルアップロード関連ロジック ---
    async handleFileSelection(fileList) {
        if (!fileList || fileList.length === 0) return;

        const newFiles = Array.from(fileList);
        let currentTotalSize = state.selectedFilesForUpload.reduce((sum, item) => sum + item.file.size, 0);
        let addedCount = 0;
        let skippedCount = 0;
        let sizeError = false;

        elements.selectFilesBtn.disabled = true;
        elements.selectFilesBtn.textContent = '処理中...';

        for (const file of newFiles) {
            if (file.size > MAX_FILE_SIZE) {
                await uiUtils.showCustomAlert(`ファイル "${file.name}" はサイズが大きすぎます (${formatFileSize(MAX_FILE_SIZE)}以下)。`);
                skippedCount++;
                continue;
            }
            if (currentTotalSize + file.size > MAX_TOTAL_ATTACHMENT_SIZE) {
                sizeError = true;
                skippedCount++;
                continue;
            }

            if (state.selectedFilesForUpload.some(item => item.file.name === file.name)) {
                console.log(`ファイル "${file.name}" は既に追加されています。スキップします。`);
                skippedCount++;
                continue;
            }

            state.selectedFilesForUpload.push({ file: file });
            currentTotalSize += file.size;
            addedCount++;
        }

        elements.selectFilesBtn.disabled = false;
        elements.selectFilesBtn.textContent = 'ファイルを選択';

        if (sizeError) {
            await uiUtils.showCustomAlert(`合計ファイルサイズの上限 (${formatFileSize(MAX_TOTAL_ATTACHMENT_SIZE)}) を超えるため、一部のファイルは追加されませんでした。`);
        }
        if (skippedCount > 0) {
            console.log(`${skippedCount}個のファイルがスキップされました（サイズ超過または重複）。`);
        }

        uiUtils.updateSelectedFilesUI();
        console.log(`${addedCount}個のファイルが選択リストに追加されました。`);
    },

    removeSelectedFile(indexToRemove) {
        if (indexToRemove >= 0 && indexToRemove < state.selectedFilesForUpload.length) {
            const removedFile = state.selectedFilesForUpload.splice(indexToRemove, 1)[0];
            console.log(`ファイル "${removedFile.file.name}" をリストから削除しました。`);
            uiUtils.updateSelectedFilesUI();
        }
    },

    async confirmAttachment() {
        if (state.selectedFilesForUpload.length === 0) {
            state.pendingAttachments = [];
            console.log("添付ファイルリストが空の状態で確定されました。送信待ちリストをクリアします。");
            elements.fileUploadDialog.close('ok');
            uiUtils.adjustTextareaHeight();
            uiUtils.updateAttachmentBadgeVisibility();
            return;
        }

        elements.confirmAttachBtn.disabled = true;
        elements.confirmAttachBtn.textContent = '処理中...';

        const attachmentsToAdd = [];
        let encodingError = false;

        for (const item of state.selectedFilesForUpload) {
            try {
                const base64Data = await fileToBase64(item.file);

                let browserMimeType = item.file.type || '';
                const fileName = item.file.name;
                const fileExtension = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();

                let guessedMimeType = null;
                if (fileExtension && extensionToMimeTypeMap[fileExtension]) {
                    guessedMimeType = extensionToMimeTypeMap[fileExtension];
                }

                let finalMimeType;
                if (guessedMimeType) {
                    finalMimeType = guessedMimeType;
                    if (finalMimeType !== browserMimeType) {
                        console.log(`ファイル "${fileName}": 拡張子(.${fileExtension})からMIMEタイプを "${finalMimeType}" に設定 (ブラウザ提供: ${browserMimeType || '空'})`);
                    }
                } else if (browserMimeType) {
                    finalMimeType = browserMimeType;
                    console.log(`ファイル "${fileName}": ブラウザ提供のMIMEタイプ "${finalMimeType}" を使用します。(拡張子からの推測なし)`);
                } else {
                    finalMimeType = 'application/octet-stream';
                    console.warn(`ファイル "${fileName}": MIMEタイプ不明。拡張子(.${fileExtension})にもマッピングなし。'application/octet-stream' を使用します。`);
                }

                attachmentsToAdd.push({
                    file: item.file,
                    name: fileName,
                    mimeType: finalMimeType,
                    base64Data: base64Data
                });
            } catch (error) {
                console.error(`ファイル "${item.file.name}" のBase64エンコード中にエラー:`, error);
                encodingError = true;
                await uiUtils.showCustomAlert(`ファイル "${item.file.name}" の処理中にエラーが発生しました。`);
                break;
            }
        }

        elements.confirmAttachBtn.disabled = false;
        elements.confirmAttachBtn.textContent = '添付して閉じる';

        if (!encodingError) {
            state.pendingAttachments = attachmentsToAdd;
            console.log(`${state.pendingAttachments.length}件のファイルを添付準備完了:`, state.pendingAttachments.map(a => `${a.name} (${a.mimeType})`));
            elements.fileUploadDialog.close('ok');
            uiUtils.adjustTextareaHeight();
            uiUtils.updateAttachmentBadgeVisibility();
        }
    },

    cancelAttachment() {
        state.selectedFilesForUpload = [];
        console.log("ファイル添付をキャンセルしました。");
        elements.fileUploadDialog.close('cancel');
        uiUtils.updateAttachmentBadgeVisibility();
    },

    async callApiWithRetry(apiParams) {
        // ★ 引数に isFirstCall を追加
        const { messagesForApi, generationConfig, systemInstruction, tools, isFirstCall } = apiParams;
        let lastError = null;
        const maxRetries = state.settings.enableAutoRetry ? state.settings.maxRetries : 0;
        const useStreaming = state.settings.streamingOutput || state.settings.modelName === 'gemini-2.5-flash-image-preview';
        
        // ★ isFirstCall を使って強制モードを制御
        const forceCalling = state.settings.forceFunctionCalling && isFirstCall;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (state.abortController?.signal.aborted) {
                    throw new DOMException("リクエストがキャンセルされました。", "AbortError");
                }

                if (attempt > 0) {
                    let delay;
                    if (state.settings.useFixedRetryDelay) {
                        delay = state.settings.fixedRetryDelaySeconds * 1000;
                    } else {
                        const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                        const maxDelay = state.settings.maxBackoffDelaySeconds * 1000;
                        delay = Math.min(exponentialDelay, maxDelay);
                    }

                    uiUtils.setLoadingIndicatorText(`APIエラー 再試行(${attempt}回目)... ${Math.round(delay/1000)}秒待機`);
                    console.log(`API呼び出し失敗。${delay}ms後にリトライします... (試行 ${attempt + 1}/${maxRetries + 1})`);
                    await interruptibleSleep(delay, state.abortController.signal);
                }

                if (attempt === 1) {
                    uiUtils.setLoadingIndicatorText('再試行中...');
                } else if (attempt > 1) {
                    uiUtils.setLoadingIndicatorText(`${attempt}回目の再試行中...`);
                }

                // ★ callGeminiApi に forceCalling フラグを渡す
                const response = await apiUtils.callGeminiApi(messagesForApi, generationConfig, systemInstruction, tools, forceCalling);

                const getFinishReasonError = (candidate) => {
                    const reason = candidate?.finishReason;
                    if (reason && reason !== 'STOP' && reason !== 'MAX_TOKENS') {
                        return new Error(`モデルが応答をブロックしました (理由: ${reason})`);
                    }
                    return null;
                };

                const checkForSafetyRejection = (candidate, content, toolCalls, images) => {
                    if (content || (toolCalls && toolCalls.length > 0) || (images && images.length > 0)) {
                        return null;
                    }
                    const isNormalFinish = candidate?.finishReason === 'STOP' || candidate?.finishReason === 'MAX_TOKENS';
                    const safetyRatings = candidate?.safetyRatings;
                    const hasHighRiskRating = safetyRatings && safetyRatings.some(r => r.probability === 'HIGH' || r.probability === 'MEDIUM');

                    if (isNormalFinish && hasHighRiskRating) {
                        const highRiskCategories = safetyRatings
                            .filter(r => r.probability === 'HIGH' || r.probability === 'MEDIUM')
                            .map(r => r.category.replace('HARM_CATEGORY_', ''))
                            .join(', ');
                        return new Error(`モデルがコンテンツの生成を拒否しました (理由: ${highRiskCategories})。プロンプトを調整して再試行してください。`);
                    }
                    return null;
                };

                if (useStreaming) {
                    let fullContent = '';
                    let fullThoughtSummary = '';
                    let toolCalls = null;
                    let images = [];
                    let finalMetadata = {};

                    for await (const chunk of apiUtils.handleStreamingResponse(response)) {
                        if (chunk.type === 'error') {
                            throw new Error(chunk.message || 'ストリーム内でエラーが発生しました');
                        }
                        if (chunk.type === 'chunk') {
                            if (chunk.contentText) fullContent += chunk.contentText;
                            if (chunk.thoughtText) fullThoughtSummary += chunk.thoughtText;
                            if (chunk.toolCalls) toolCalls = (toolCalls || []).concat(chunk.toolCalls);
                            if (chunk.imageData) images.push(chunk.imageData);
                        } else if (chunk.type === 'metadata') {
                            finalMetadata = chunk;
                        }
                    }
                    
                    const finishReasonError = getFinishReasonError(finalMetadata);
                    if (finishReasonError) throw finishReasonError;

                    const safetyError = checkForSafetyRejection(finalMetadata, fullContent, toolCalls, images);
                    if (safetyError) throw safetyError;

                    if (!fullContent && !toolCalls && images.length === 0) {
                        throw new Error("APIから空の応答が返されました。");
                    }

                    console.log("callApiWithRetryが返す直前のデータ:", JSON.stringify({ content: fullContent, images: images.map(img => ({...img, data: img.data.substring(0, 50) + '...'})) }, null, 2));

                    return { 
                        content: fullContent, 
                        thoughtSummary: fullThoughtSummary,
                        toolCalls,
                        images,
                        ...finalMetadata,
                        retryCount: attempt 
                    };

                } else {
                    const responseData = await response.json();
                    
                    if (responseData.promptFeedback) {
                        const blockReason = responseData.promptFeedback.blockReason || 'SAFETY';
                        throw new Error(`APIが応答をブロックしました (理由: ${blockReason})`);
                    }
                    if (!responseData.candidates || responseData.candidates.length === 0) {
                        throw new Error("API応答に有効な候補(candidates)が含まれていません。プロンプトがブロックされた可能性があります。");
                    }
                    
                    const candidate = responseData.candidates[0];
                    const finishReasonError = getFinishReasonError(candidate);
                    if (finishReasonError) throw finishReasonError;

                    const parts = candidate.content?.parts || [];
                    let finalContent = '';
                    let finalThoughtSummary = '';
                    let finalToolCalls = [];

                    parts.forEach(part => {
                        if (part.text) {
                            if (part.thought === true) {
                                finalThoughtSummary += part.text;
                            } else {
                                finalContent += part.text;
                            }
                        } else if (part.functionCall) {
                            finalToolCalls.push({ functionCall: part.functionCall });
                        }
                    });

                    if (candidate.thoughts?.parts) {
                        candidate.thoughts.parts.forEach(part => {
                            if (part.text) {
                                finalThoughtSummary += part.text;
                            }
                        });
                    }
                    
                    const safetyError = checkForSafetyRejection(candidate, finalContent, finalToolCalls, []);
                    if (safetyError) throw safetyError;

                    if (!finalContent && finalToolCalls.length === 0) {
                        throw new Error("APIから空の応答が返されました。");
                    }

                    return {
                        content: finalContent,
                        thoughtSummary: finalThoughtSummary.trim() || null,
                        toolCalls: finalToolCalls.length > 0 ? finalToolCalls : null,
                        finishReason: candidate.finishReason,
                        safetyRatings: candidate.safetyRatings,
                        usageMetadata: responseData.usageMetadata,
                        retryCount: attempt
                    };
                }

            } catch (error) {
                lastError = error;
                if (error.name === 'AbortError') {
                    console.error("待機中または通信中に中断されました。リトライを中止します。", error);
                    throw error;
                }
                if (error.status && error.status >= 400 && error.status < 500) {
                    console.error(`リトライ不可のエラー (ステータス: ${error.status})。リトライを中止します。`, error);
                    throw error;
                }
                console.warn(`API呼び出し/処理試行 ${attempt + 1} が失敗しました。`, error);
            }
        }

        console.error("最大リトライ回数に達しました。最終的なエラーをスローします。");
        throw lastError;
    },

    createRipple(event, button) {
        // 既存のrippleを削除
        const existingRipple = button.querySelector(".ripple");
        if(existingRipple) {
            existingRipple.remove();
        }

        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        
        const rect = button.getBoundingClientRect();
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple");

        button.appendChild(circle);

        // アニメーション終了後に要素を削除
        setTimeout(() => {
            if (circle.parentElement) {
                circle.remove();
            }
        }, 600); // animation-durationと合わせる
    },

    // --- Function Calling用ヘルパー ---
    async updateOpacitySettings(opacitySettings) {
        let settingsChanged = false;
        const changedItems = [];

        if (typeof opacitySettings.overlay === 'number' && opacitySettings.overlay >= 0 && opacitySettings.overlay <= 1) {
            state.settings.overlayOpacity = opacitySettings.overlay;
            await dbUtils.saveSetting('overlayOpacity', state.settings.overlayOpacity);
            document.documentElement.style.setProperty('--overlay-opacity-value', state.settings.overlayOpacity);
            changedItems.push(`オーバーレイの濃さを${Math.round(opacitySettings.overlay * 100)}%に`);
            settingsChanged = true;
        }
        if (typeof opacitySettings.message_bubble === 'number' && opacitySettings.message_bubble >= 0.1 && opacitySettings.message_bubble <= 1) {
            state.settings.messageOpacity = opacitySettings.message_bubble;
            await dbUtils.saveSetting('messageOpacity', state.settings.messageOpacity);
            changedItems.push(`メッセージバブルの濃さを${Math.round(opacitySettings.message_bubble * 100)}%に`);
            settingsChanged = true;
        }

        if (settingsChanged) {
            uiUtils.applySettingsToUI();
            const message = `${changedItems.join('、')}変更しました。`;
            return { success: true, message: message };
        } else {
            return { success: false, message: "有効な値が指定されなかったため、UIは変更されませんでした。" };
        }
    },

    /**
     * Function Callingから受け取ったURLを一時的な背景画像として適用する
     * @param {string} url - 画像のURL
     * @returns {Promise<object>} 処理結果
     */
    async applyBackgroundImageFromUrl(url) {
        if (!url || typeof url !== 'string') {
            return { error: "画像URLが無効です。" };
        }
        console.log(`一時的な背景画像をURLから適用: ${url}`);
        
        // 永続化されている背景設定をメモリ上でのみクリア
        if (state.settings.backgroundImageBlob) {
            uiUtils.revokeExistingObjectUrl(); 
            state.settings.backgroundImageBlob = null;
            // DBは変更しない
        }

        // 新しいURLをCSS変数に設定
        document.documentElement.style.setProperty('--chat-background-image-main', `url("${url}")`);
        
        // サムネイルは非表示にする
        elements.backgroundThumbnail.classList.add('hidden');
        elements.deleteBackgroundBtn.classList.add('hidden');
        
        const message = `背景画像を一時的に変更しました。この変更はリロードすると元に戻ります。`;
        return { success: true, message: message };
    },

    async handleBackgroundImageUrl(url) {
        if (!url || typeof url !== 'string') {
            return { error: "画像URLが無効です。" };
        }

        console.log(`背景画像をURLから取得開始: ${url}`);
        uiUtils.setLoadingIndicatorText('背景画像を取得中...');
        elements.loadingIndicator.classList.remove('hidden');

        try {
            // CORSの問題を回避するため、no-corsモードは使わない。
            // サーバーが許可しない場合はエラーとして扱うのが適切。
            const response = await fetch(url, { referrerPolicy: "no-referrer" });
            if (!response.ok) {
                throw new Error(`画像の取得に失敗しました (HTTPステータス: ${response.status})`);
            }
            const blob = await response.blob();
            
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (blob.size > maxSize) {
                return { error: `画像サイズが大きすぎます (${(maxSize / 1024 / 1024).toFixed(1)}MB以下にしてください)` };
            }

            uiUtils.revokeExistingObjectUrl();
            await dbUtils.saveSetting('backgroundImageBlob', blob);
            state.settings.backgroundImageBlob = blob;
            state.backgroundImageUrl = URL.createObjectURL(blob);
            document.documentElement.style.setProperty('--chat-background-image', `url(${state.backgroundImageUrl})`);
            uiUtils.updateBackgroundSettingsUI();
            
            console.log("背景画像をURLから正常に更新しました。");
            return { success: true, message: "背景画像を更新しました。" };

        } catch (error) {
            console.error("背景画像のURLからの取得エラー:", error);
            // CORSエラーはコンソールに表示されることが多いが、プログラムからは詳細を取得できない場合がある
            if (error instanceof TypeError) { // ネットワークエラーはCORSの可能性が高い
                 return { error: `画像の取得に失敗しました。指定されたURLのサーバーが外部からのアクセスを許可していない(CORSポリシー)可能性があります。` };
            }
            return { error: `画像の取得中にエラーが発生しました: ${error.message}` };
        } finally {
            elements.loadingIndicator.classList.add('hidden');
        }
    },
}; // appLogic終了

window.appLogic = appLogic;
window.state = state;
