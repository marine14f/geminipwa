import("https://esm.run/@google/genai").then(module => {
    // 正しいクラス名 GoogleGenAI をグローバルスコープに設定
    window.GoogleGenAI = module.GoogleGenAI;
    console.log("Google GenAI SDK (@google/genai) の読み込みが完了しました。");
}).catch(err => {
    console.error("Google Gen AI SDKの読み込みに失敗しました:", err);
    // エラーメッセージを画面に表示するなどのフォールバック処理
    document.body.innerHTML = `<p style="color: red; padding: 20px;">SDKの読み込みに失敗しました。アプリを起動できません。</p>`;
});

// --- 定数 ---
const DB_NAME = 'GeminiPWA_DB';
const DB_VERSION = 11; 
const SETTINGS_STORE = 'settings';
const PROFILES_STORE = 'profiles';
const CHATS_STORE = 'chats';
const IMAGE_STORE = 'image_store';
const CHAT_UPDATEDAT_INDEX = 'updatedAtIndex';
const CHAT_CREATEDAT_INDEX = 'createdAtIndex';
const DEFAULT_MODEL = 'gemini-2.5-pro';
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
const APP_VERSION = "0.41";
const SWIPE_THRESHOLD = 50; // スワイプ判定の閾値 (px)
const ZOOM_THRESHOLD = 1.01; // ズーム状態と判定するスケールの閾値 (誤差考慮)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 最大ファイルサイズ (例: 10MB)
const MAX_TOTAL_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 1メッセージあたりの合計添付ファイルサイズ上限 (例: 50MB) - API制限も考慮
const INITIAL_RETRY_DELAY = 100; // 初期リトライ遅延時間 (ミリ秒)
const MAX_PROFILES = 5; // プロファイル作成の上限数

// 添付を確定する処理
const extensionToMimeTypeMap = {
    // Text Data
    'pdf': 'application/pdf',
    'js': 'text/javascript',
    'py': 'text/x-python',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'json': 'text/json',
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
    'ogg': 'audio/ogg',
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
    enterToSendCheckbox: document.getElementById('enter-to-send'),
    historySortOrderSelect: document.getElementById('history-sort-order'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    fontFamilyInput: document.getElementById('font-family-input'),
    hideSystemPromptToggle: document.getElementById('hide-system-prompt-toggle'),
    geminiEnableGroundingToggle: document.getElementById('gemini-enable-grounding-toggle'),
    geminiEnableFunctionCallingToggle: document.getElementById('gemini-enable-function-calling-toggle'),
    forceFunctionCallingToggle: document.getElementById('force-function-calling-toggle'),
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
    overlayOpacitySlider: document.getElementById('overlay-opacity-slider'),
    overlayOpacityValue: document.getElementById('overlay-opacity-value'),
    headerColorInput: document.getElementById('header-color-input'),
    resetHeaderColorBtn: document.getElementById('reset-header-color-btn'),
    messageOpacitySlider: document.getElementById('message-opacity-slider'),
    messageOpacityValue:  document.getElementById('message-opacity-value'),
    modelWarningMessage: document.getElementById('model-warning-message'),
    profileCardHeaderWrapper: document.getElementById('profile-card-header-wrapper'),
    profileCardHeader: document.getElementById('profile-card-header'),
    profileCardIconContainer: document.getElementById('profile-card-icon-container'),
    profileCardName: document.getElementById('profile-card-name'),
    headerProfileMenu: document.getElementById('header-profile-menu'),
    profileCardHeaderWrapperSettings: document.getElementById('profile-card-header-wrapper-settings'),
    profileCardHeaderSettings: document.getElementById('profile-card-header-settings'),
    profileCardIconContainerSettings: document.getElementById('profile-card-icon-container-settings'),
    profileCardNameSettings: document.getElementById('profile-card-name-settings'),
    headerProfileMenuSettings: document.getElementById('header-profile-menu-settings'),
    profileManagementGroup: document.getElementById('profile-management-group'),
    profileDisplayCard: document.getElementById('profile-display-card'),
    profileDisplayIcon: document.getElementById('profile-display-icon'),
    profileDisplayNameMain: document.getElementById('profile-display-name-main'),
    profileDisplayNameSub: document.getElementById('profile-display-name-sub'),
    profileDisplayStatus: document.getElementById('profile-display-status'),
    profileEditNameBtn: document.getElementById('profile-edit-name-btn'),
    profileIconInput: document.getElementById('profile-icon-input'),
    profileResetIconBtn: document.getElementById('profile-reset-icon-btn'),
    profileSaveNewBtn: document.getElementById('profile-save-new-btn'),
    profileUpdateBtn: document.getElementById('profile-update-btn'),
    profileDeleteBtn: document.getElementById('profile-delete-btn'),
    profileExportBtn: document.getElementById('profile-export-btn'),
    profileImportBtn: document.getElementById('profile-import-btn'),
    profileImportInput: document.getElementById('profile-import-input'),
    autoScrollToggle: document.getElementById('auto-scroll-toggle')
};

// --- アプリ状態 ---
const state = {
    db: null,
    currentChatId: null,
    currentMessages: [],
    currentSystemPrompt: '',
    currentPersistentMemory: {}, // 現在のチャットの永続メモリ
    profiles: [], // 全プロファイルのリスト
    activeProfileId: null, // 現在アクティブなプロファイルのID
    activeProfile: null, // 現在アクティブなプロファイルの完全なデータ
    profileIconUrls: new Map(),
    videoUrlCache: new Map(),
    imageUrlCache: new Map(),
    settings: {
        apiKey: '',
        modelName: DEFAULT_MODEL,
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
        autoScroll: true,
    },
    backgroundImageUrl: null,
    isSending: false,
    abortController: null,
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
    isTemporaryBackgroundActive: false,
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



// Base64文字列をBlobオブジェクトに変換 (Promise)
function base64ToBlob(base64, mimeType) {
    return fetch(`data:${mimeType};base64,${base64}`).then(res => res.blob());
}

// --- Service Worker関連 ---
function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('このブラウザはService Workerをサポートしていません。');
        return;
    }

    // --- 自動更新用の通知UI表示 ---
    const showUpdateNotification = (worker) => {
        const notification = document.getElementById('update-notification');
        const reloadButton = document.getElementById('reload-for-update-btn');
        if (!notification || !reloadButton) return;

        reloadButton.onclick = () => {
            worker.postMessage({ action: 'skipWaiting' });
        };
        notification.classList.remove('hidden');
    };

    let isReloading = false;

    // --- 新しいWorkerが有効化されたら、ページをリロード（自動/手動共通）---
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isReloading) return;
        isReloading = true;
        window.location.reload();
    });

    // ---  手動更新ボタンからのメッセージを監視 ---
    navigator.serviceWorker.addEventListener('message', event => {
        // sw.jsからキャッシュクリア完了のメッセージを受け取ったらリロード
        if (event.data && event.data.status === 'cacheCleared') {
            console.log('Service Workerから手動キャッシュクリア完了のメッセージを受信。リロードを実行します。');
            if (isReloading) return;
            isReloading = true;
            uiUtils.showCustomAlert('アプリが更新されました。ページをリロードします。')
                .then(() => {
                    window.location.reload();
                });
        }
    });

    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker登録成功 スコープ: ', registration.scope);

            // 定期的に更新をチェックする (例: 1時間ごと)
            setInterval(() => {
                registration.update();
                console.log('Service Workerの更新をチェックしました。');
            }, 60 * 60 * 1000);

            // --- 自動更新の検知ロジック ---
            if (registration.waiting) {
                console.log('待機中の新しいService Workerが見つかりました。');
                showUpdateNotification(registration.waiting);
                return;
            }

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    console.log('新しいService Workerのインストールを検知しました。');
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('新しいService Workerがインストールされ、待機状態に入りました。');
                            showUpdateNotification(newWorker);
                        }
                    });
                }
            });

        } catch (error) {
            console.error('ServiceWorker処理中にエラー: ', error);
        }
    });
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
                state.db.onerror = (event) => {
                    console.error(`データベースエラー: ${event.target.error}`);
                };
                resolve(state.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;
                console.log(`[DB Migration] IndexedDBをバージョン ${event.oldVersion} から ${event.newVersion} へアップグレード中...`);

                // --- 既存ストアの確認と作成 ---
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains(CHATS_STORE)) {
                    const chatStore = db.createObjectStore(CHATS_STORE, { keyPath: 'id', autoIncrement: true });
                    chatStore.createIndex(CHAT_UPDATEDAT_INDEX, 'updatedAt', { unique: false });
                    chatStore.createIndex(CHAT_CREATEDAT_INDEX, 'createdAt', { unique: false });
                }
                if (!db.objectStoreNames.contains(PROFILES_STORE)) {
                    db.createObjectStore(PROFILES_STORE, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('image_assets')) {
                    db.createObjectStore('image_assets', { keyPath: 'name' });
                }

                // v10への移行処理 (プロファイル機能導入)
                if (event.oldVersion < 10) {
                    console.log("[DB Migration] v10へのデータ移行処理を実行します。");
                    const settingsStore = transaction.objectStore(SETTINGS_STORE);
                    const profilesStore = transaction.objectStore(PROFILES_STORE);
                    
                    const getAllSettingsReq = settingsStore.getAll();
                    
                    getAllSettingsReq.onsuccess = () => {
                        const oldSettingsArray = getAllSettingsReq.result;
                        
                        if (oldSettingsArray.length > 0) {
                            console.log("[DB Migration] 既存の設定を検出しました。新しいプロファイル構造に移行します...");
                            
                            const oldSettingsObject = {};
                            oldSettingsArray.forEach(item => {
                                oldSettingsObject[item.key] = item.value;
                            });

                            const profileSettingKeys = [
                                'apiKey', 'modelName', 'systemPrompt', 'temperature', 'maxTokens', 'topK', 'topP',
                                'presencePenalty', 'frequencyPenalty', 'thinkingBudget', 'includeThoughts',
                                'enableThoughtTranslation', 'thoughtTranslationModel', 'dummyUser',
                                'applyDummyToProofread', 'applyDummyToTranslate', 'dummyModel', 'concatDummyModel',
                                'additionalModels', 'enterToSend', 'historySortOrder', 'darkMode', 'fontFamily',
                                'hideSystemPromptInChat', 'enableSwipeNavigation', 'enableAutoRetry', 'maxRetries',
                                'useFixedRetryDelay', 'fixedRetryDelaySeconds', 'maxBackoffDelaySeconds',
                                'enableProofreading', 'proofreadingModelName', 'proofreadingSystemInstruction',
                                'geminiEnableGrounding', 'geminiEnableFunctionCalling', 'googleSearchApiKey',
                                'googleSearchEngineId', 'messageOpacity', 'overlayOpacity', 'headerColor',
                                'allowPromptUiChanges', 'forceFunctionCalling'
                            ];

                            const newProfileSettings = {};
                            profileSettingKeys.forEach(key => {
                                newProfileSettings[key] = oldSettingsObject[key] !== undefined ? oldSettingsObject[key] : state.settings[key];
                            });

                            const defaultProfile = {
                                name: "デフォルトプロファイル",
                                icon: null,
                                createdAt: Date.now(),
                                settings: newProfileSettings
                            };
                            
                            const addProfileReq = profilesStore.add(defaultProfile);
                            
                            addProfileReq.onsuccess = (addEvent) => {
                                const newProfileId = addEvent.target.result;
                                console.log(`[DB Migration] デフォルトプロファイルを生成しました (ID: ${newProfileId})`);

                                profileSettingKeys.forEach(key => {
                                    settingsStore.delete(key);
                                });

                                settingsStore.put({ key: 'activeProfileId', value: newProfileId });
                                console.log(`[DB Migration] SETTINGS_STOREを整理し、activeProfileIdを設定しました。`);
                            };
                        }
                    };
                }

                // v11へのアップグレード処理 (画像ストア追加)
                if (event.oldVersion < 11) {
                    console.log("[DB Migration] v11へのアップグレード: image_storeを作成します。");
                    if (!db.objectStoreNames.contains(IMAGE_STORE)) {
                        db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
                    }
                    transaction.oncomplete = () => {
                        console.log("[DB Migration] スキーマ更新完了。データ移行処理を開始します。");
                        appLogic.migrateImageData(); 
                    };
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
                ...(msg.imageIds && { imageIds: msg.imageIds }),
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
                ...(msg.generated_videos && msg.generated_videos.length > 0 && { 
                    generated_videos: msg.generated_videos.map(video => ({
                        base64Data: video.base64Data, // Base64データのみ保存
                        prompt: video.prompt
                    }))
                }),
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
    },

    async getSetting(key) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(SETTINGS_STORE);
            const request = store.get(key);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`設定 '${key}' の取得エラー: ${event.target.error}`);
        });
    },

    async addProfile(profile) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE, 'readwrite');
            const request = store.add(profile);
            request.onsuccess = (event) => {
                console.log(`[DB] プロファイルを新規追加しました (ID: ${event.target.result})`);
                resolve(event.target.result);
            };
            request.onerror = (event) => reject(`プロファイル追加エラー: ${event.target.error}`);
        });
    },

    async getProfile(id) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE);
            const request = store.get(id);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`プロファイル(ID: ${id})取得エラー: ${event.target.error}`);
        });
    },

    async getAllProfiles() {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE);
            const request = store.getAll();
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`全プロファイル取得エラー: ${event.target.error}`);
        });
    },

    async updateProfile(profile) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE, 'readwrite');
            const request = store.put(profile);
            request.onsuccess = () => {
                console.log(`[DB] プロファイルを更新しました (ID: ${profile.id})`);
                resolve();
            };
            request.onerror = (event) => reject(`プロファイル(ID: ${profile.id})更新エラー: ${event.target.error}`);
        });
    },

    async deleteProfile(id) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => {
                console.log(`[DB] プロファイルを削除しました (ID: ${id})`);
                resolve();
            };
            request.onerror = (event) => reject(`プロファイル(ID: ${id})削除エラー: ${event.target.error}`);
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

        // 新しいメッセージ要素をコンテナの末尾に追加する（ちらつき防止用）
    appendMessage(role, content, index, isStreamingPlaceholder = false, cascadeInfo = null, attachments = null) {
        const messageElement = this.createMessageElement(role, content, index, isStreamingPlaceholder, cascadeInfo, attachments);
        if (messageElement) {
            elements.messageContainer.appendChild(messageElement);
            if (window.Prism) {
                // 追加した要素内のコードブロックのみをハイライトする
                messageElement.querySelectorAll('pre code').forEach((block) => {
                    Prism.highlightElement(block);
                });
            }
        }
    },

    // 新しいメッセージ要素をコンテナの末尾に追加する（ちらつき防止用）
    appendMessage(role, content, index, isStreamingPlaceholder = false, cascadeInfo = null, attachments = null) {
        const messageElement = this.createMessageElement(role, content, index, isStreamingPlaceholder, cascadeInfo, attachments);
        if (messageElement) {
            elements.messageContainer.appendChild(messageElement);
            if (window.Prism) {
                // 追加した要素内のコードブロックのみをハイライトする
                messageElement.querySelectorAll('pre code').forEach((block) => {
                    Prism.highlightElement(block);
                });
            }
        }
    },

    renderChatMessages() {
        const startTime = performance.now();
        console.log(`%c[PERF_DEBUG] renderChatMessages 開始`, 'color: red; font-weight: bold;', { startTime });

        const container = elements.messageContainer;
        
        // ちらつき防止策は維持
        container.style.minHeight = `${container.scrollHeight}px`;

        // キャッシュクリアと編集中状態のキャンセル
        if (state.imageUrlCache.size > 0) {
            for (const url of state.imageUrlCache.values()) {
                URL.revokeObjectURL(url);
            }
            state.imageUrlCache.clear();
        }
        if (state.editingMessageIndex !== null) {
            const messageElement = container.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            if (messageElement) appLogic.cancelEditMessage(state.editingMessageIndex, messageElement);
            else state.editingMessageIndex = null;
        }

        // DOMの再構築
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const visibleMessages = [];
        const processedGroupIds = new Set();

        state.currentMessages.forEach((msg) => {
            if (msg.isHidden) return;
            if (msg.isCascaded && msg.siblingGroupId) {
                if (!processedGroupIds.has(msg.siblingGroupId)) {
                    const siblings = state.currentMessages.filter(m => m.siblingGroupId === msg.siblingGroupId && !m.isHidden);
                    const selectedSibling = siblings.find(m => m.isSelected) || siblings[siblings.length - 1];
                    if (selectedSibling) {
                        visibleMessages.push(selectedSibling);
                    }
                    processedGroupIds.add(msg.siblingGroupId);
                }
            } else {
                visibleMessages.push(msg);
            }
        });

        visibleMessages.forEach(msg => {
            const index = state.currentMessages.indexOf(msg);
            if (index === -1 || msg.role === 'tool') return;
            
            let cascadeInfo = null;
            if (msg.isCascaded && msg.siblingGroupId) {
                const siblings = state.currentMessages.filter(m => m.siblingGroupId === msg.siblingGroupId && !m.isHidden);
                const currentIndexInGroup = siblings.findIndex(m => m === msg);
                cascadeInfo = {
                    currentIndex: currentIndexInGroup + 1,
                    total: siblings.length,
                    siblingGroupId: msg.siblingGroupId
                };
            }
            
            const messageElement = this.createMessageElement(msg.role, msg.content, index, false, cascadeInfo, msg.attachments);
            if (messageElement) {
                fragment.appendChild(messageElement);
            }
        });
        
        container.appendChild(fragment);
        
        // Prism.jsのハイライト
        if (window.Prism) {
            Prism.highlightAll();
        }
        
        // ちらつき防止策の解除
        requestAnimationFrame(() => {
            container.style.minHeight = '';
        });
        const endTime = performance.now();
        console.log(`%c[PERF_DEBUG] renderChatMessages 完了`, 'color: red; font-weight: bold;', { endTime, duration: endTime - startTime });
    },



    createMessageElement(role, content, index, isStreamingPlaceholder = false, cascadeInfo = null, attachments = null) {
        const messageData = state.currentMessages[index];
        if (!messageData) return null;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', role);
        messageDiv.dataset.index = index;
        
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
        
        // [IMAGE_HERE] を遅延読み込み画像に置換する新しいロジック
        const imagePlaceholderRegex = /<p>\[IMAGE_HERE\]<\/p>|\[IMAGE_HERE\]/g;
        if (role === 'model' && messageData && messageData.imageIds && messageData.imageIds.length > 0) {
            let imageIndex = 0;
            const replacedHtml = contentDiv.innerHTML.replace(imagePlaceholderRegex, () => {
                if (imageIndex < messageData.imageIds.length) {
                    const imageId = messageData.imageIds[imageIndex++];
                    // プレースホルダーのimgタグを生成
                    return `<img class="lazy-load-image" alt="生成画像（読み込み中...）" data-image-id="${imageId}">`;
                }
                return '';
            });
            contentDiv.innerHTML = replacedHtml;

            // プレースホルダーが足りなかった画像を末尾に追加
            if (imageIndex < messageData.imageIds.length) {
                const fragment = document.createDocumentFragment();
                for (let i = imageIndex; i < messageData.imageIds.length; i++) {
                    const imageId = messageData.imageIds[i];
                    const img = document.createElement('img');
                    img.className = 'lazy-load-image';
                    img.alt = '生成画像（読み込み中...）';
                    img.dataset.imageId = imageId;
                    fragment.appendChild(img);
                }
                contentDiv.appendChild(fragment);
            }
            // 遅延読み込みオブザーバーに新しい画像を追加
            requestAnimationFrame(() => {
                const newImages = contentDiv.querySelectorAll('.lazy-load-image');
                newImages.forEach(img => appLogic.imageObserver.observe(img));
            });
        }
        
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
        return messageDiv;
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
        const mainContent = elements.chatScreen.querySelector('.main-content');
        if (!mainContent) return;

        // アンカー要素を取得
        const anchor = document.getElementById('chat-anchor');
        if (anchor) {
            // scrollIntoViewを使用してアンカー要素を画面内に表示
            anchor.scrollIntoView({ behavior: 'auto', block: 'end' });
            console.log(`[Debug Scroll] scrollToBottom: アンカーへスクロールしました。`);
        } else {
            // フォールバックとして従来の処理を残す
            console.warn(`[Debug Scroll] scrollToBottom: アンカーが見つかりません。scrollHeightでスクロールします。`);
            mainContent.scrollTop = mainContent.scrollHeight;
        }
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
                    li.onclick = async (event) => {
                        if (!event.target.closest('.history-item-actions button')) {

                            // ステップ1: まず画面遷移を開始し、UIを即座に反応させる
                            // この時点ではチャットの中身は空か、前の状態のまま
                            const screenTransitionPromise = uiUtils.showScreen('chat');

                            // ステップ2: 画面遷移と並行して、重いチャット読み込み処理を行う
                            const loadChatPromise = appLogic.loadChat(chat.id);

                            // ステップ3: 両方の処理が完了するのを待つ
                            // これにより、アニメーション中にDOMが書き換わることを防ぎ、
                            // 読み込み完了後に確実に画面が表示されることを保証する。
                            await Promise.all([screenTransitionPromise, loadChatPromise]);
                            
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

    applyBackgroundImage() {
        // 一時的な背景が適用中の場合は、永続設定で上書きしない
        if (state.isTemporaryBackgroundActive) {
            console.log("一時的な背景が適用中のため、永続的な背景の適用をスキップしました。");
            return;
        }
        this.revokeExistingObjectUrl(); // 既存のURLがあれば破棄
        const blob = state.settings.backgroundImageBlob;
        if (blob instanceof Blob) {
            try {
                state.backgroundImageUrl = URL.createObjectURL(blob);
                const newUrl = `url("${state.backgroundImageUrl}")`;
                
                const chatScreen = elements.chatScreen;
                const isAlreadyVisible = chatScreen.classList.contains('background-visible');
    
                const switchImageAndFadeIn = () => {
                    document.documentElement.style.setProperty('--chat-background-image', newUrl);
                    chatScreen.classList.add('background-visible');
                };
    
                if (isAlreadyVisible) {
                    chatScreen.addEventListener('transitionend', switchImageAndFadeIn, { once: true });
                    chatScreen.classList.remove('background-visible');
                } else {
                    switchImageAndFadeIn();
                }
    
                console.log("背景画像をBlobから適用しました。");
            } catch (e) {
    
                console.error("背景画像のオブジェクトURL生成に失敗:", e);
                elements.chatScreen.classList.remove('background-visible');
                document.documentElement.style.removeProperty('--chat-background-image');
            }
        } else {
            elements.chatScreen.classList.remove('background-visible');
            document.documentElement.style.removeProperty('--chat-background-image');
        }
        this.updateBackgroundSettingsUI(); // 設定画面のUIも更新
    
    
    },

    // ------------------------------------

    // 設定をUIに適用
    applySettingsToUI() {
        elements.apiKeyInput.value = state.settings.apiKey || '';
        elements.modelNameSelect.value = state.settings.modelName || DEFAULT_MODEL;
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
        elements.autoScrollToggle.checked = state.settings.autoScroll;

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
        this.applyBackgroundImage();
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
        return new Promise((resolve) => {
          const startTime = performance.now();
          console.log(`%c[PERF_DEBUG] showScreen('${screenName}') 開始`, 'color: orange; font-weight: bold;', { startTime });
      
          // --- 同一画面への重複遷移は無視 ---
          if (screenName === state.currentScreen) {
            console.log('[NAV] skip same screen:', screenName);
            resolve();
            return;
          }
      
          const chat = elements.chatScreen;
          const historyEl = elements.historyScreen;
          const settings = elements.settingsScreen;
          const allScreens = [chat, historyEl, settings];
      
          const pos = {
            chat: {
              chat: 'translate3d(0,0,0)',
              history: 'translate3d(-100%,0,0)',
              settings: 'translate3d(100%,0,0)',
            },
            history: {
              chat: 'translate3d(100%,0,0)',
              history: 'translate3d(0,0,0)',
              settings: 'translate3d(200%,0,0)',
            },
            settings: {
              chat: 'translate3d(-100%,0,0)',
              history: 'translate3d(-200%,0,0)',
              settings: 'translate3d(0,0,0)',
            },
          };
      
          if (screenName === 'chat') {
            chat.style.transform = pos.chat.chat;
            historyEl.style.transform = pos.chat.history;
            settings.style.transform = pos.chat.settings;
          } else if (screenName === 'history') {
            chat.style.transform = pos.history.chat;
            historyEl.style.transform = pos.history.history;
            settings.style.transform = pos.history.settings;
            this.renderHistoryList();
          } else if (screenName === 'settings') {

            chat.style.transform = pos.settings.chat;
            historyEl.style.transform = pos.settings.history;
            settings.style.transform = pos.settings.settings;
          }
      
          void elements.appContainer.offsetHeight;
      
          let activeScreen = null;
          if (screenName === 'chat') activeScreen = chat;
          else if (screenName === 'history') activeScreen = historyEl;
          else if (screenName === 'settings') activeScreen = settings;
      
          if (activeScreen) {
            activeScreen.classList.add('active');
            activeScreen.inert = false;
          }
          allScreens.forEach((s) => {
            if (s !== activeScreen) {
              s.classList.remove('active');
              s.inert = true;
            }
          });
      
          if (!fromPopState) {
            const entry = { screen: screenName };
            if (screenName === 'chat' && state.__navSource === 'history-item') {
              history.replaceState(entry, '', '#chat');
            } else {
              history.pushState(entry, '', `#${screenName}`);
            }
          }
      
          let finished = false;
          const finish = () => {
            if (finished) return;
            finished = true;
            state.currentScreen = screenName;
            const endTime = performance.now();
            console.log(`%cNavigated to screen: ${screenName}`, 'color: orange; font-weight: bold;');
            console.log(`%c[PERF_DEBUG] showScreen('${screenName}') アニメーション完了/タイムアウト`, 'color: orange; font-weight: bold;', {
              endTime,
              duration: endTime - startTime,
            });
            resolve();
          };
          requestAnimationFrame(() => requestAnimationFrame(finish));
          setTimeout(finish, 600);
        });
    },

    // 送信状態を設定
    setSendingState(sending) {
        state.isSending = sending;
        if (sending) {
            elements.sendButton.innerHTML = '<span class="material-symbols-outlined">stop</span>';
            elements.sendButton.classList.add('sending');
            elements.sendButton.title = "停止";
            elements.sendButton.disabled = false;
            elements.userInput.disabled = true;
            elements.attachFileBtn.disabled = true;
            elements.loadingIndicator.classList.remove('hidden');
            elements.loadingIndicator.setAttribute('aria-live', 'polite');
            elements.systemPromptDetails.style.pointerEvents = 'none';
            elements.systemPromptDetails.style.opacity = '0.7';
        } else {
            elements.sendButton.innerHTML = '<span class="material-symbols-outlined">send</span>';
            elements.sendButton.classList.remove('sending');
            elements.sendButton.title = "送信";
            elements.sendButton.disabled = elements.userInput.value.trim() === '' && state.pendingAttachments.length === 0;
            elements.userInput.disabled = false;
            elements.attachFileBtn.disabled = false;
            elements.loadingIndicator.classList.add('hidden');
            elements.loadingIndicator.removeAttribute('aria-live');
            elements.systemPromptDetails.style.pointerEvents = '';
            elements.systemPromptDetails.style.opacity = '';
        }
    },

    // テキストエリアの高さを自動調整
    adjustTextareaHeight(textarea = elements.userInput, maxHeight = TEXTAREA_MAX_HEIGHT) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        
        if (textarea === elements.userInput && !state.isSending) {
            elements.sendButton.disabled = textarea.value.trim() === '' && state.pendingAttachments.length === 0;
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
    updateProfileSwitcher() {
        const switcher = elements.profileSwitcher;
        switcher.innerHTML = '';
        state.profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.id;
            option.textContent = profile.name;
            if (profile.id === state.activeProfileId) {
                option.selected = true;
            }
            switcher.appendChild(option);
        });
        console.log("[UI] プロファイルスイッチャーを更新しました。");
    },

    updateProfileSwitcherUI() {
        const menus = [elements.headerProfileMenu, elements.headerProfileMenuSettings];

        menus.forEach(menu => {
            if (!menu) return;
            menu.innerHTML = '';
            menu.addEventListener('click', e => e.stopPropagation());
        });

        state.profiles.forEach(profile => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('profile-menu-item');
            if (profile.id === state.activeProfileId) {
                menuItem.classList.add('active');
            }
            menuItem.dataset.profileId = profile.id;

            const iconContainer = document.createElement('div');
            iconContainer.classList.add('profile-icon-container');
            
            if (profile.icon) {
                let url = state.profileIconUrls.get(profile.id);
                if (!url) {
                    url = URL.createObjectURL(profile.icon);
                    state.profileIconUrls.set(profile.id, url);
                }
                iconContainer.innerHTML = `<img src="${url}" alt="${profile.name}">`;
            } else {
                iconContainer.innerHTML = `<span class="material-symbols-outlined">account_circle</span>`;
            }

            const textContainer = document.createElement('div');
            textContainer.classList.add('profile-menu-text-container');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('profile-menu-name');
            nameSpan.textContent = profile.name;

            const modelSpan = document.createElement('span');
            modelSpan.classList.add('profile-menu-model');
            // profile.settingsが存在し、modelNameが設定されていれば表示
            modelSpan.textContent = profile.settings?.modelName || 'モデル未設定';

            textContainer.appendChild(nameSpan);
            textContainer.appendChild(modelSpan);

            menuItem.appendChild(iconContainer);
            menuItem.appendChild(textContainer); // textContainerを追加

            const switchHandler = (event) => {
                event.stopPropagation();
                appLogic.switchProfile(profile.id);
                menus.forEach(m => m?.classList.add('hidden'));
            };
            
            menus.forEach(menu => {
                if (menu) {
                    const clonedItem = menuItem.cloneNode(true);
                    clonedItem.onclick = switchHandler;
                    menu.appendChild(clonedItem);
                }
            });
        });
        
        console.log("[UI] プロファイルメニューを更新しました。");
    },

    updateProfileCardUI() {
        if (!state.activeProfile) return;
        const profile = state.activeProfile;
        
        // --- ヘッダーカード (チャット & 設定) ---
        const cards = [
            { name: elements.profileCardName, container: elements.profileCardIconContainer },
            { name: elements.profileCardNameSettings, container: elements.profileCardIconContainerSettings }
        ];
        
        cards.forEach(card => {
            // アイコンコンテナが存在すれば、アイコンの更新は必ず実行する
            if (card.container) {
                if (profile.icon) {
                    let url = state.profileIconUrls.get(profile.id);
                    if (!url) {
                        url = URL.createObjectURL(profile.icon);
                        state.profileIconUrls.set(profile.id, url);
                    }
                    card.container.innerHTML = `<img src="${url}" alt="プロファイルアイコン">`;
                } else {
                    card.container.innerHTML = `<span class="material-symbols-outlined">account_circle</span>`;
                }
            }
            // 名前の要素が存在する場合のみ、名前を更新する
            if (card.name) {
                card.name.textContent = profile.name;
            }
        });

        // --- 設定画面のプロファイル編集エリア ---
        const iconImg = elements.profileDisplayIcon;
        const iconPlaceholder = iconImg.nextElementSibling;
        if (profile.icon) {
            let url = state.profileIconUrls.get(profile.id);
            if (!url) {
                url = URL.createObjectURL(profile.icon);
                state.profileIconUrls.set(profile.id, url);
            }
            iconImg.src = url;
            iconImg.style.display = 'block';
            iconPlaceholder.style.display = 'none';
            elements.profileResetIconBtn.style.display = 'flex';
        } else {
            iconImg.style.display = 'none';
            iconPlaceholder.style.display = 'flex';
            elements.profileResetIconBtn.style.display = 'none';
        }
        elements.profileDisplayNameMain.textContent = profile.name;
        
        const subText = `${profile.settings.modelName || '...'} / T: ${profile.settings.temperature ?? '...'}`;
        elements.profileDisplayNameSub.textContent = subText;
        
        elements.profileDisplayStatus.classList.toggle('active', profile.id === state.activeProfileId);

        console.log("[UI] プロファイルカードUIを更新しました。");
    },
    

    toggleProfileMenu(type) {
        console.log(`[Debug Toggle] toggleProfileMenuが呼び出されました。type: ${type}`);
        const menu = type === 'header' ? elements.headerProfileMenu : elements.headerProfileMenuSettings;
        console.log('[Debug Toggle] 対象メニュー要素:', menu);
        if (menu) {
            menu.classList.toggle('hidden');
            console.log(`[Debug Toggle] hiddenクラスをトグルしました。現在のクラス: ${menu.className}`);
        } else {
            console.error('[Debug Toggle] エラー: 対象となるメニュー要素が見つかりません。');
        }
    },

    debug_moveChatScreen() {
        console.log('[DEBUG_TRANSITION] デバッグ用遷移関数を開始します。');
        const chatScreen = elements.chatScreen;
    
        // transitionendイベントリスナーを設定
        const onTransitionEnd = (event) => {
            // イベントが本当にchatScreenのtransformプロパティで発生したか確認
            if (event.target === chatScreen && event.propertyName === 'transform') {
                console.log('%c[DEBUG_TRANSITION] transitionend イベントが発火しました！', 'color: lime; font-weight: bold;');
                // 念のためリスナーを削除
                chatScreen.removeEventListener('transitionend', onTransitionEnd);
            }
        };
        chatScreen.addEventListener('transitionend', onTransitionEnd);
    
        // 遷移を開始
        console.log('[DEBUG_TRANSITION] これから transform を translateX(0) に設定します。');
        requestAnimationFrame(() => {
            chatScreen.style.transition = 'transform 0.3s ease-in-out';
            chatScreen.style.transform = 'translateX(0)';
            console.log('[DEBUG_TRANSITION] transform を設定しました。イベント発火を待ちます...');
        });
    }
};

// --- APIユーティリティ (apiUtils) ---
const apiUtils = {
    // Gemini APIを呼び出す
    async callGeminiApi(messagesForApi, generationConfig, systemInstruction, tools = null, forceCalling = false) {
        console.log(`[Debug] callGeminiApi: 現在の設定値を確認します。`, {
            forceFunctionCalling: state.settings.forceFunctionCalling,
            geminiEnableFunctionCalling: state.settings.geminiEnableFunctionCalling,
            isForcedNow: forceCalling
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

        const endpointMethod = 'generateContent?';
        console.log(`使用モード: 非ストリーミング`);

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
    _setupEventListenersCallCount: 0,

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

    async loadGlobalSettings() {
        try {
            console.log("[GlobalSettings] 共通設定の読み込みを開始します。");
            const storedBlob = await dbUtils.getSetting('backgroundImageBlob');
            if (storedBlob && storedBlob.value instanceof Blob) {
                state.settings.backgroundImageBlob = storedBlob.value;
                console.log("[GlobalSettings] 背景画像BlobをDBから読み込みました。");
            }
        } catch (error) {
            console.error("[GlobalSettings] 共通設定の読み込み中にエラーが発生しました:", error);
            // エラーが発生しても起動処理は続行する
        }
    },

    async loadProfiles() {
        try {
            console.log("[Profile] プロファイルの読み込みを開始します。");
            state.profiles = await dbUtils.getAllProfiles();
            const activeIdSetting = await dbUtils.getSetting('activeProfileId');
            state.activeProfileId = activeIdSetting ? activeIdSetting.value : null;

            if (state.profiles.length === 0) {
                console.warn("[Profile] プロファイルが見つかりません。最初のプロファイルを作成します。");
                const newProfile = {
                    name: "デフォルトプロファイル",
                    icon: null,
                    createdAt: Date.now(),
                    settings: { ...state.settings }
                };
                const newId = await dbUtils.addProfile(newProfile);
                await dbUtils.saveSetting('activeProfileId', newId);
                state.profiles = [await dbUtils.getProfile(newId)];
                state.activeProfileId = newId;
            }

            if (!state.activeProfileId || !state.profiles.some(p => p.id === state.activeProfileId)) {
                state.activeProfileId = state.profiles[0].id;
                await dbUtils.saveSetting('activeProfileId', state.activeProfileId);
                console.log(`[Profile] アクティブなプロファイルが無効でした。最初のプロファイル (ID: ${state.activeProfileId}) をアクティブに設定しました。`);
            }
            
            console.log(`[Profile] ${state.profiles.length}件のプロファイルを読み込みました。アクティブID: ${state.activeProfileId}`);
            this.applyActiveProfile();
            uiUtils.updateProfileSwitcherUI();

        } catch (error) {
            console.error("[Profile] プロファイルの読み込み中に致命的なエラーが発生しました:", error);
            await uiUtils.showCustomAlert(`プロファイルの読み込みに失敗しました: ${error}`);
        }
    },

    applyActiveProfile() {
        state.activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
        if (state.activeProfile) {
            console.log(`[Profile] プロファイル「${state.activeProfile.name}」(ID: ${state.activeProfile.id}) を適用します。`);
            const { settings } = state.activeProfile;
            // プロファイルの設定を state.settings にのみ反映させる
            Object.assign(state.settings, settings);
            // UIへの適用は、呼び出し元が責務を持つ
            uiUtils.applySettingsToUI(); 
            uiUtils.updateProfileCardUI();
        } else {
            console.error(`[Profile] 適用すべきアクティブなプロファイル (ID: ${state.activeProfileId}) が見つかりません。`);
        }
    },

    async switchProfile(newProfileId) {
        newProfileId = Number(newProfileId);
        if (newProfileId === state.activeProfileId) return;
        
        console.log(`[Profile] プロファイルを ID: ${newProfileId} に切り替えます。`);
        await dbUtils.saveSetting('activeProfileId', newProfileId);
        state.activeProfileId = newProfileId;
        
        // プロファイル設定の適用とUI更新のみを行う
        this.applyActiveProfile();
        uiUtils.updateProfileSwitcherUI();
    },

    async saveNewProfile() {
        if (state.profiles.length >= MAX_PROFILES) {
            return uiUtils.showCustomAlert(`プロファイルの上限数（${MAX_PROFILES}個）に達しているため、新しいプロファイルを作成できません。`);
        }
        const profileName = await uiUtils.showCustomPrompt("新しいプロファイル名を入力してください:", "新規プロファイル");
        if (!profileName || !profileName.trim()) {
            console.log("[Profile] 新規保存をキャンセルしました。");
            return;
        }

        const currentSettings = this.getCurrentUiSettings();
        const newProfile = {
            name: profileName.trim(),
            icon: state.activeProfile?.icon || null,
            createdAt: Date.now(),
            settings: currentSettings
        };

        try {
            const newId = await dbUtils.addProfile(newProfile);
            const newlyAddedProfile = await dbUtils.getProfile(newId);
            state.profiles.push(newlyAddedProfile); // stateを更新
            
            await dbUtils.saveSetting('activeProfileId', newId); // activeProfileIdを更新
            state.activeProfileId = newId;
            
            this.applyActiveProfile();
            uiUtils.updateProfileSwitcherUI();
            await uiUtils.showCustomAlert(`プロファイル「${newProfile.name}」を保存しました。`);
        } catch (error) {
            console.error("[Profile] 新規プロファイルの保存に失敗しました:", error);
            await uiUtils.showCustomAlert(`プロファイルの保存に失敗しました: ${error}`);
        }
    },

    async updateCurrentProfile() {
        if (!state.activeProfile) {
            await uiUtils.showCustomAlert("更新対象のプロファイルが選択されていません。");
            return;
        }
        
        const updatedProfile = { ...state.activeProfile };
        updatedProfile.settings = this.getCurrentUiSettings();

        try {
            await dbUtils.updateProfile(updatedProfile);
            // state内のプロファイルリストも更新
            const index = state.profiles.findIndex(p => p.id === updatedProfile.id);
            if (index !== -1) {
                state.profiles[index] = updatedProfile;
            }
            state.activeProfile = updatedProfile; // アクティブなプロファイルも更新
            
            console.log(`[Profile] プロファイル「${updatedProfile.name}」を更新しました。`);
            this.applyActiveProfile(); // UIに再適用
            uiUtils.updateProfileSwitcherUI();
        } catch (error) {
            console.error("[Profile] プロファイルの更新に失敗しました:", error);
            await uiUtils.showCustomAlert(`プロファイルの更新に失敗しました: ${error}`);
        }
    },
    
    async deleteCurrentProfile() {
        if (!state.activeProfile) return;
        if (state.profiles.length <= 1) {
            await uiUtils.showCustomAlert("最後のプロファイルは削除できません。");
            return;
        }

        const confirmed = await uiUtils.showCustomConfirm(`本当にプロファイル「${state.activeProfile.name}」を削除しますか？`);
        if (!confirmed) return;

        try {
            const idToDelete = state.activeProfileId;
            await dbUtils.deleteProfile(idToDelete);
            
            // stateからも削除
            state.profiles = state.profiles.filter(p => p.id !== idToDelete);
            // アイコンURLキャッシュも削除
            if (state.profileIconUrls.has(idToDelete)) {
                URL.revokeObjectURL(state.profileIconUrls.get(idToDelete));
                state.profileIconUrls.delete(idToDelete);
            }

            // 削除後は残っているリストの最初のプロファイルに切り替える
            const newActiveId = state.profiles[0].id;
            await dbUtils.saveSetting('activeProfileId', newActiveId);
            state.activeProfileId = newActiveId;
            
            this.applyActiveProfile();
            uiUtils.updateProfileSwitcherUI();
            await uiUtils.showCustomAlert("プロファイルを削除しました。");
        } catch (error) {
            console.error("[Profile] プロファイルの削除に失敗しました:", error);
            await uiUtils.showCustomAlert(`プロファイルの削除に失敗しました: ${error}`);
        }
    },

    async editCurrentProfileName() {
        if (!state.activeProfile) return;
        const newName = await uiUtils.showCustomPrompt("新しいプロファイル名:", state.activeProfile.name);
        if (newName && newName.trim() && newName.trim() !== state.activeProfile.name) {
            state.activeProfile.name = newName.trim();
            await this.updateCurrentProfile(); // 更新処理を共通化
        }
    },

    handleProfileIconChange(file) {
        if (!file || !file.type.startsWith('image/')) return;

        // 1. 既存のアイコンURLキャッシュがあれば破棄する
        if (state.activeProfile && state.profileIconUrls.has(state.activeProfile.id)) {
            const oldUrl = state.profileIconUrls.get(state.activeProfile.id);
            URL.revokeObjectURL(oldUrl);
            state.profileIconUrls.delete(state.activeProfile.id);
            console.log(`[Profile] 古いアイコンキャッシュを破棄しました (ID: ${state.activeProfile.id})`);
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const blob = new Blob([e.target.result], { type: file.type });
            if (state.activeProfile) {
                state.activeProfile.icon = blob;
                await this.updateCurrentProfile(); // 更新処理を共通化
            }
        };
        reader.readAsArrayBuffer(file);
    },

    async resetProfileIcon() {
        if (!state.activeProfile) return;
        const confirmed = await uiUtils.showCustomConfirm("アイコンをデフォルトに戻しますか？");
        if (confirmed) {
            state.activeProfile.icon = null;
            if (state.profileIconUrls.has(state.activeProfile.id)) {
                URL.revokeObjectURL(state.profileIconUrls.get(state.activeProfile.id));
                state.profileIconUrls.delete(state.activeProfile.id);
            }
            await this.updateCurrentProfile();
        }
    },

    getCurrentUiSettings() {
        const settings = {};
        const stringKeys = ['apiKey', 'modelName', 'systemPrompt', 'dummyUser', 'dummyModel', 'additionalModels', 'historySortOrder', 'fontFamily', 'proofreadingModelName', 'proofreadingSystemInstruction', 'googleSearchApiKey', 'googleSearchEngineId', 'headerColor', 'thoughtTranslationModel'];
        const numberKeys = ['temperature', 'maxTokens', 'topK', 'topP', 'presencePenalty', 'frequencyPenalty', 'thinkingBudget', 'maxRetries', 'fixedRetryDelaySeconds', 'maxBackoffDelaySeconds', 'overlayOpacity', 'messageOpacity'];
        const booleanKeys = ['enterToSend', 'darkMode', 'hideSystemPromptInChat', 'geminiEnableGrounding', 'geminiEnableFunctionCalling', 'enableSwipeNavigation', 'enableProofreading', 'enableAutoRetry', 'useFixedRetryDelay', 'concatDummyModel', 'includeThoughts', 'enableThoughtTranslation', 'applyDummyToProofread', 'applyDummyToTranslate', 'allowPromptUiChanges', 'forceFunctionCalling'];
        
        stringKeys.forEach(key => {
            const element = elements[key + 'Input'] || elements[key + 'Select'] || elements[key + 'Textarea'];
            if (element) settings[key] = element.value.trim();
        });
        
        numberKeys.forEach(key => {
            let element;
            if (key === 'overlayOpacity' || key === 'messageOpacity') {
                element = elements[key + 'Slider'];
            } else {
                element = elements[key + 'Input'];
            }
            
            if (element) {
                const value = (key === 'overlayOpacity' || key === 'messageOpacity') ? parseFloat(element.value) / 100 : parseFloat(element.value);
                settings[key] = isNaN(value) ? null : value;
            }
        });

        booleanKeys.forEach(key => {
            const element = elements[key + 'Checkbox'] || elements[key + 'Toggle'];
            if (element) settings[key] = element.checked;
        });

        console.log("[Profile] 現在のUIから設定を取得しました:", settings);
        return settings;
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    },

    base64ToBlob(base64, mimeType) {
        return fetch(`data:${mimeType};base64,${base64}`).then(res => res.blob());
    },

    _prepareApiHistory(baseMessages) {
        let history = [...baseMessages];
        if (state.settings.dummyUser) {
            history.push({ role: 'user', content: state.settings.dummyUser, attachments: [] });
        }
        if (state.settings.dummyModel) {
            history.push({ role: 'model', content: state.settings.dummyModel, attachments: [] });
        }
        
        return history.map(msg => {
            const parts = [];
            if (msg.content && msg.content.trim() !== '') {
                parts.push({ text: msg.content });
            }
            if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                msg.attachments.forEach(att => parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64Data } }));
            }
            if (msg.generated_images && msg.generated_images.length > 0) {
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
    },

    /**
     * 画像Blobを受け取り、WebPに変換してimage_storeに保存し、新しいIDを返す
     * @param {Blob} blob - 保存対象の画像Blob
     * @returns {Promise<string>} 保存された画像のユニークID
     */
    async saveImageBlob(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    // オリジナルと同じサイズで描画
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    // WebPに変換 (品質0.9)
                    canvas.toBlob(async (webpBlob) => {
                        if (!webpBlob) {
                            // WebP変換に失敗した場合(Safariの古いバージョンなど)は元のBlobを保存
                            console.warn("WebPへの変換に失敗しました。元の形式で保存します。");
                            webpBlob = blob;
                        }
                        
                        const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        const imageData = {
                            id: imageId,
                            blob: webpBlob,
                            createdAt: new Date()
                        };

                        try {
                            await dbUtils.openDB();
                            const store = dbUtils._getStore(IMAGE_STORE, 'readwrite');
                            const request = store.put(imageData);
                            request.onsuccess = () => resolve(imageId);
                            request.onerror = (event) => reject(event.target.error);
                        } catch (dbError) {
                            reject(dbError);
                        }
                    }, 'image/webp', 0.9);
                };
                img.onerror = () => reject(new Error("画像データの読み込みに失敗しました。"));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error("FileReaderでBlobの読み込みに失敗しました。"));
            reader.readAsDataURL(blob);
        });
    },

    imageObserver: null, // 画像遅延読み込み用のIntersectionObserver

    /**
     * IDを指定してimage_storeから画像Blobを取得する
     * @param {string} id - 取得する画像のID
     * @returns {Promise<Blob|null>} 画像のBlobオブジェクト、またはnull
     */
    async getImageBlobById(id) {
        try {
            await dbUtils.openDB();
            const store = dbUtils._getStore(IMAGE_STORE, 'readonly');
            return new Promise((resolve, reject) => {
                const request = store.get(id);
                request.onsuccess = (event) => {
                    resolve(event.target.result ? event.target.result.blob : null);
                };
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error(`ID(${id})の画像Blob取得エラー:`, error);
            return null;
        }
    },


    /**
     * 古い形式の画像データ（チャット履歴埋め込み）を新しいimage_storeに移行する
     * @param {IDBTransaction} transaction - onupgradeneededから渡されるトランザクション
     */
    async migrateImageData() {
        console.log("[DB Migration] v11データ移行処理のチェックを開始します...");
        try {
            const migrationFlag = await dbUtils.getSetting('v11_migration_complete');
            if (migrationFlag && migrationFlag.value) {
                console.log("[DB Migration] v11データ移行は既に完了しています。");
                return;
            }

            console.log("[DB Migration] v11データ移行を開始します...");
            const allChats = await dbUtils.getAllChats();
            let migratedImageCount = 0;

            for (const chat of allChats) {
                let chatModified = false;
                if (!chat.messages) continue;

                for (const message of chat.messages) {
                    if (message.generated_images && message.generated_images.length > 0) {
                        message.imageIds = message.imageIds || [];
                        for (const imgData of message.generated_images) {
                            try {
                                const imageBlob = await this.base64ToBlob(imgData.data, imgData.mimeType);
                                const newImageId = await this.saveImageBlob(imageBlob);
                                message.imageIds.push(newImageId);
                                migratedImageCount++;
                            } catch (error) {
                                console.error(`[DB Migration] チャット(id:${chat.id})の画像移行中にエラー:`, error);
                            }
                        }
                        // 移行が完了したら古いキーは削除
                        delete message.generated_images;
                        chatModified = true;
                    }
                }

                if (chatModified) {
                    console.log(`[DB Migration] チャット(id:${chat.id})を更新します。`);
                    await dbUtils.saveChat(chat.title, chat);
                }
            }

            console.log(`[DB Migration] v11データ移行が完了しました。合計 ${migratedImageCount} 枚の画像を移行しました。`);
            await dbUtils.saveSetting('v11_migration_complete', true);

        } catch (error) {
            console.error("[DB Migration] v11データ移行処理中に致命的なエラーが発生しました:", error);
        }
    },



    // アプリ初期化
    async initializeApp() {
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
    
        registerServiceWorker();
    
        // IntersectionObserverの初期化 (画像遅延読み込み用)
        this.imageObserver = new IntersectionObserver(async (entries, observer) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const imageId = img.dataset.imageId;
                    observer.unobserve(img); // 一度だけ処理

                    const blob = await this.getImageBlobById(imageId);
                    if (blob) {
                        const objectURL = URL.createObjectURL(blob);

                        img.src = objectURL;
                        img.alt = '生成された画像';

                    } else {
                        img.alt = '画像の読み込みに失敗しました';
                        img.classList.add('load-error');
                    }
                }
            }
        }, { rootMargin: '200px' });

        // MutationObserverの初期化 (オブジェクトURLのメモリ解放用)
        const mutationObserver = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach(node => {
                        // ノード自体が画像か、子孫に画像が含まれているかチェック
                        const imagesToRevoke = [];
                        if (node.tagName === 'IMG' && node.src.startsWith('blob:')) {
                            imagesToRevoke.push(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('img[src^="blob:"]').forEach(img => imagesToRevoke.push(img));
                        }
                        
                        imagesToRevoke.forEach(img => {
                            console.log(`[Memory] DOMから削除された画像のURLを解放します: ${img.src}`);
                            URL.revokeObjectURL(img.src);
                        });
                    });
                }
            }
        });
        mutationObserver.observe(elements.messageContainer, { childList: true, subtree: true });

        try {
            await dbUtils.openDB();
    
            await this.loadGlobalSettings();
            await this.loadProfiles();
    
            let profiles = await dbUtils.getAllProfiles();
            if (profiles.length === 0) {
                console.log("[Migration] プロファイルが存在しないため、旧設定からのデータ移行処理を実行します。");
                const oldSettingsArray = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(SETTINGS_STORE);
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                
                if (oldSettingsArray.length > 0) {
                    const oldSettingsObject = {};
                    oldSettingsArray.forEach(item => {
                        oldSettingsObject[item.key] = item.value;
                    });
    
                    const initialProfileSettings = { ...state.settings, ...oldSettingsObject };
                    delete initialProfileSettings.backgroundImageBlob;
    
                    const defaultProfile = {
                        name: "デフォルトプロファイル",
                        icon: null,
                        createdAt: Date.now(),
                        settings: initialProfileSettings
                    };
    
                    const newId = await dbUtils.addProfile(defaultProfile);
                    
                    await new Promise((resolve, reject) => {
                        const store = dbUtils._getStore(SETTINGS_STORE, 'readwrite');
                        store.clear().onsuccess = () => resolve();
                        store.transaction.onerror = () => reject(store.transaction.error);
                    });
                    await dbUtils.saveSetting('activeProfileId', newId);
                    
                    console.log("[Migration] データ移行が完了しました。");
                } else {
                    console.log("[Migration] 移行すべき古い設定データが見つかりませんでした。新規プロファイルを作成します。");
                }
            }
    
            await this.loadProfiles();
    
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
            elements.chatScreen.style.transform = 'translateX(0)';
            elements.historyScreen.style.transform = 'translateX(-100%)';
            elements.settingsScreen.style.transform = 'translateX(100%)';
            
            uiUtils.showScreen('chat', true);
    
            updateMessageMaxWidthVar();
            this.setupEventListeners();
            this.updateZoomState();
            uiUtils.adjustTextareaHeight();
            uiUtils.setSendingState(false);
            uiUtils.scrollToBottom();
        }
    },


    // イベントリスナーを設定
    // イベントリスナーを設定
    setupEventListeners() {
        if (!this._popstateBound) {
            window.addEventListener('popstate', this.handlePopState.bind(this));
            this._popstateBound = true; // 一度だけ登録するためのフラグ
            console.log("popstate listener added (once).");
        }
    
        this._setupEventListenersCallCount++; // カウンターを増やす
        console.log(`[Debug Event] setupEventListeners が呼び出されました。(${this._setupEventListenersCallCount}回目)`);
        if (this._setupEventListenersCallCount > 1) {
            console.error('%c[CRITICAL_BUG] setupEventListenersが複数回呼び出されています！これがバグの根本原因である可能性が非常に高いです。', 'color: red; font-size: 1.2em; font-weight: bold;');
        }
    
        // --- 画面遷移 ---
        elements.gotoHistoryBtn.addEventListener('click', () => uiUtils.showScreen('history'));
        elements.gotoSettingsBtn.addEventListener('click', () => uiUtils.showScreen('settings'));
        elements.backToChatFromHistoryBtn.addEventListener('click', () => uiUtils.showScreen('chat'));
        elements.backToChatFromSettingsBtn.addEventListener('click', () => uiUtils.showScreen('chat'));
    
        // --- チャット関連 ---
        elements.newChatBtn.addEventListener('click', () => this.confirmStartNewChat());
        elements.sendButton.addEventListener('click', () => {
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
                if (!elements.sendButton.disabled) this.handleSend();
                return;
            }
            if (state.settings.enterToSend && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                if (!elements.sendButton.disabled) this.handleSend();
            }
        });
    
        // --- システムプロンプト ---
        elements.systemPromptDetails.addEventListener('toggle', (event) => {
            if (event.target.open) {
                this.startEditSystemPrompt();
            } else if (state.isEditingSystemPrompt) {
                this.cancelEditSystemPrompt();
            }
        });
        elements.saveSystemPromptBtn.addEventListener('click', () => this.saveCurrentSystemPrompt());
        elements.cancelSystemPromptBtn.addEventListener('click', () => this.cancelEditSystemPrompt());
    
        // --- プロファイルメニューの表示/非表示 ---
        elements.profileCardHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            uiUtils.toggleProfileMenu('header');
        });
        elements.profileCardHeaderSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            uiUtils.toggleProfileMenu('settings');
        });
    
        document.addEventListener('click', (e) => {
            const target = e.target;
            const isHeaderCardClicked = elements.profileCardHeader.contains(target);
            const isSettingsCardClicked = elements.profileCardHeaderSettings.contains(target);
            const isHeaderMenuClicked = elements.headerProfileMenu.contains(target);
            const isSettingsMenuClicked = elements.headerProfileMenuSettings.contains(target);
    
            if (!isHeaderCardClicked && !isSettingsCardClicked && !isHeaderMenuClicked && !isSettingsMenuClicked) {
                elements.headerProfileMenu.classList.add('hidden');
                elements.headerProfileMenuSettings.classList.add('hidden');
            }
        });
    
        // --- プロファイル編集 ---
        elements.profileEditNameBtn.addEventListener('click', () => this.editCurrentProfileName());
        elements.profileIconInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleProfileIconChange(file);
            }
            e.target.value = null;
        });
        elements.profileResetIconBtn.addEventListener('click', () => this.resetProfileIcon());
        elements.profileSaveNewBtn.addEventListener('click', () => this.saveNewProfile());
        elements.profileDeleteBtn.addEventListener('click', () => this.deleteCurrentProfile());
        elements.profileExportBtn.addEventListener('click', () => this.exportProfile());
        elements.profileImportBtn.addEventListener('click', () => elements.profileImportInput.click());
        elements.profileImportInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.importProfile(file);
            e.target.value = null;
        });
    
        // --- 設定項目（即時保存） ---
        const setupInstantSave = (element, key, eventType = 'change') => {
            if (element) {
                element.addEventListener(eventType, async () => {
                    if (!state.activeProfile) return;
                    let value;
                    switch (element.type) {
                        case 'checkbox':
                            value = element.checked;
                            break;
                        case 'range':
                            value = parseFloat(element.value) / 100;
                            break;
                        case 'number':
                            value = parseFloat(element.value);
                            if (isNaN(value)) value = null;
                            break;
                        default:
                            value = element.value;
                            break;
                    }
                    
                    state.settings[key] = value;
                    state.activeProfile.settings[key] = value;
                    
                    await dbUtils.updateProfile(state.activeProfile);
                    
                    if (key === 'darkMode') uiUtils.applyDarkMode();
                    if (key === 'fontFamily') uiUtils.applyFontFamily();
                    if (key === 'hideSystemPromptInChat') uiUtils.toggleSystemPromptVisibility();
                    if (key === 'overlayOpacity') uiUtils.applyOverlayOpacity();
                    if (key === 'headerColor') uiUtils.applyHeaderColor();
                    if (key === 'messageOpacity') document.documentElement.style.setProperty('--message-bubble-opacity', String(value));
                    if (key === 'modelName') uiUtils.updateModelWarningMessage();
    
                });
            } else {
                console.warn(`❌ [Debug Settings] '${key}' に対応するDOM要素が見つかりません。`);
            }
        };
        
        const settingsMap = {
            apiKey: { element: elements.apiKeyInput, event: 'input' },
            modelName: { element: elements.modelNameSelect, event: 'change' },
            systemPrompt: { element: elements.systemPromptDefaultTextarea, event: 'input' },
            temperature: { element: elements.temperatureInput, event: 'input' },
            maxTokens: { element: elements.maxTokensInput, event: 'input' },
            topK: { element: elements.topKInput, event: 'input' },
            topP: { element: elements.topPInput, event: 'input' },
            presencePenalty: { element: elements.presencePenaltyInput, event: 'input' },
            frequencyPenalty: { element: elements.frequencyPenaltyInput, event: 'input' },
            thinkingBudget: { element: elements.thinkingBudgetInput, event: 'input' },
            includeThoughts: { element: elements.includeThoughtsToggle, event: 'change' },
            enableThoughtTranslation: { element: elements.enableThoughtTranslationCheckbox, event: 'change' },
            thoughtTranslationModel: { element: elements.thoughtTranslationModelSelect, event: 'change' },
            dummyUser: { element: elements.dummyUserInput, event: 'input' },
            applyDummyToProofread: { element: elements.applyDummyToProofreadCheckbox, event: 'change' },
            applyDummyToTranslate: { element: elements.applyDummyToTranslateCheckbox, event: 'change' },
            dummyModel: { element: elements.dummyModelInput, event: 'input' },
            concatDummyModel: { element: elements.concatDummyModelCheckbox, event: 'change' },
            additionalModels: { element: elements.additionalModelsTextarea, event: 'input' },
            enterToSend: { element: elements.enterToSendCheckbox, event: 'change' },
            historySortOrder: { element: elements.historySortOrderSelect, event: 'change' },
            darkMode: { element: elements.darkModeToggle, event: 'change' },
            fontFamily: { element: elements.fontFamilyInput, event: 'input' },
            hideSystemPromptInChat: { element: elements.hideSystemPromptToggle, event: 'change' },
            geminiEnableGrounding: { element: elements.geminiEnableGroundingToggle, event: 'change' },
            geminiEnableFunctionCalling: { element: elements.geminiEnableFunctionCallingToggle, event: 'change' },
            enableSwipeNavigation: { element: elements.swipeNavigationToggle, event: 'change' },
            enableProofreading: { element: elements.enableProofreadingCheckbox, event: 'change' },
            proofreadingModelName: { element: elements.proofreadingModelNameSelect, event: 'change' },
            proofreadingSystemInstruction: { element: elements.proofreadingSystemInstructionTextarea, event: 'input' },
            enableAutoRetry: { element: elements.enableAutoRetryCheckbox, event: 'change' },
            maxRetries: { element: elements.maxRetriesInput, event: 'input' },
            useFixedRetryDelay: { element: elements.useFixedRetryDelayCheckbox, event: 'change' },
            fixedRetryDelaySeconds: { element: elements.fixedRetryDelayInput, event: 'input' },
            maxBackoffDelaySeconds: { element: elements.maxBackoffDelayInput, event: 'input' },
            googleSearchApiKey: { element: elements.googleSearchApiKeyInput, event: 'input' },
            googleSearchEngineId: { element: elements.googleSearchEngineIdInput, event: 'input' },
            overlayOpacity: { element: elements.overlayOpacitySlider, event: 'input' },
            messageOpacity: { element: elements.messageOpacitySlider, event: 'input' },
            headerColor: { element: elements.headerColorInput, event: 'input' },
            allowPromptUiChanges: { element: document.getElementById('allow-prompt-ui-changes'), event: 'change' },
            forceFunctionCalling: { element: elements.forceFunctionCallingToggle, event: 'change' },
            autoScroll: { element: elements.autoScrollToggle, event: 'change' }
        };
    
        for (const key in settingsMap) {
            const { element, event } = settingsMap[key];
            setupInstantSave(element, key, event);
        }
    
        // --- その他 ---
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
        
        elements.updateAppBtn.addEventListener('click', () => this.updateApp());
        elements.clearDataBtn.addEventListener('click', () => this.confirmClearAllData());
    
        elements.enableProofreadingCheckbox.addEventListener('change', () => {
            const isEnabled = elements.enableProofreadingCheckbox.checked;
            elements.proofreadingOptionsDiv.classList.toggle('hidden', !isEnabled);
        });
    
        elements.uploadBackgroundBtn.addEventListener('click', () => elements.backgroundImageInput.click());
        elements.backgroundImageInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) this.handleBackgroundImageUpload(file);
            event.target.value = null;
        });
        elements.deleteBackgroundBtn.addEventListener('click', () => this.confirmDeleteBackgroundImage());
        
        elements.resetHeaderColorBtn.addEventListener('click', () => {
            state.settings.headerColor = '';
            elements.headerColorInput.value = state.settings.darkMode ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
            // headerColorの'change'イベントリスナーが自動で保存と適用を行うため、ここでは値をリセットするだけ
            const event = new Event('input', { bubbles: true });
            elements.headerColorInput.dispatchEvent(event);
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
    
        if ('visualViewport' in window) {
            window.visualViewport.addEventListener('resize', this.updateZoomState.bind(this));
            window.visualViewport.addEventListener('scroll', this.updateZoomState.bind(this));
        } else {
            console.warn("VisualViewport API is not supported in this browser.");
        }
        
        elements.attachFileBtn.addEventListener('click', () => uiUtils.showFileUploadDialog());
    
        // モバイルでのファイルキャッシュ問題を回避するため、毎回input要素を動的に生成する
        elements.selectFilesBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.style.display = 'none';

            fileInput.addEventListener('change', (event) => {
                this.handleFileSelection(event.target.files);
                document.body.removeChild(fileInput); // 使い終わったら要素を削除
            });

            document.body.appendChild(fileInput);
            fileInput.click();
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
    
        const fileUploadDialog = elements.fileUploadDialog;
    
        fileUploadDialog.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    
        fileUploadDialog.addEventListener('dragleave', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    
        fileUploadDialog.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
    
            if (state.isSending) return;
    
            const files = event.dataTransfer.files;
            if (files && files.length > 0) {
                console.log(`${files.length}個のファイルがダイアログにドロップされました。`);
                this.handleFileSelection(files);
                uiUtils.updateSelectedFilesUI();
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
        window.addEventListener('beforeunload', () => {
            const revokeUrls = (cache, name) => {
                if (cache.size > 0) {
                    console.log(`[Memory] ページ離脱のため、${cache.size}個の${name}URLを解放します。`);
                    for (const url of cache.values()) {
                        if (url.startsWith('blob:')) {
                            URL.revokeObjectURL(url);
                        }
                    }
                    cache.clear();
                }
            };
            
            revokeUrls(state.profileIconUrls, 'アイコン');
            revokeUrls(state.videoUrlCache, '動画');
            revokeUrls(state.imageUrlCache, 'チャット画像');
        });
    },
    

    // popstateイベントハンドラ (戻るボタン/ジェスチャー)
    handlePopState(event) {
    const targetScreen = event.state?.screen || 'chat';
    if (targetScreen === state.currentScreen) {
      console.log(`[popstate] same screen -> ignore: ${targetScreen}`);
      return;
    }
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
        const confirmed = await uiUtils.showCustomConfirm("現在のチャットを保存して新規チャットを開始しますか？");
        if (!confirmed) {
            console.log("新規チャットの開始をキャンセルしました。");
            return;
        }

        // 送信中なら中断
        if (state.isSending) {
            this.abortRequest();
        }
        // 編集中なら破棄
        if (state.editingMessageIndex !== null) {
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl);
        }
        // システムプロンプト編集中なら破棄
        if (state.isEditingSystemPrompt) {
            this.cancelEditSystemPrompt();
        }
        // 保留中の添付ファイルがあれば破棄
        if (state.pendingAttachments.length > 0) {
            state.pendingAttachments = [];
            uiUtils.updateAttachmentBadgeVisibility();
        }
        
        try {
            // 現在のチャットに保存すべき内容があれば保存する
            if ((state.currentMessages.length > 0 || state.currentSystemPrompt) && state.currentChatId) {
                await dbUtils.saveChat();
            }
        } catch (error) {
            console.error("新規チャット開始前のチャット保存失敗:", error);
            // 保存に失敗しても、ユーザーは新規チャットを望んでいるので処理は続行
            await uiUtils.showCustomAlert("現在のチャットの保存に失敗しました。");
        }

        // 新規チャットを開始
        this.startNewChat();
        uiUtils.showScreen('chat');
    },

    // 新規チャットを開始する (状態リセット)
    startNewChat() {
        state.currentChatId = null;
        state.currentMessages = [];
        state.currentSystemPrompt = state.settings.systemPrompt || ''; 
        state.pendingAttachments = [];
        state.currentPersistentMemory = {};
        state.currentScene = { scene_id: "initial", location: "不明な場所" };
        uiUtils.updateSystemPromptUI();
        uiUtils.renderChatMessages();
        uiUtils.updateChatTitle();
        elements.userInput.value = '';
        uiUtils.adjustTextareaHeight();
        uiUtils.setSendingState(false);
        state.currentStyleProfiles = {};
    },

    // app.js の appLogic オブジェクト内

    async loadChat(id) {
        const loadChatStartTime = performance.now();
        console.log(`%c[PERF_DEBUG] loadChat: START - チャットID ${id} の読み込み処理を開始...`, 'color: red; font-weight: bold;');

        console.log(`%c[Debug LoadChat] START: チャットID ${id} の読み込みを開始...`, 'color: blue; font-weight: bold;');
        console.log(`[Debug LoadChat] 1. 読み込み前の state.currentMessages.length: ${state.currentMessages.length}`);

        state.currentMessages = [];
        console.log(`[Debug LoadChat] 2. state.currentMessages をクリアしました。 length: ${state.currentMessages.length}`);

        if (state.isSending) {
            const confirmed = await uiUtils.showCustomConfirm("送信中です。中断して別のチャットを読み込みますか？");
            if (!confirmed) return;
            this.abortRequest();
        }
        if (state.editingMessageIndex !== null) {
            const confirmed = await uiUtils.showCustomConfirm("編集中です。変更を破棄して別のチャットを読み込みますか？");
            if (!confirmed) return;
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl);
        }
        if (state.isEditingSystemPrompt) {
            const confirmed = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄して別のチャットを読み込みますか？");
            if (!confirmed) return;
            this.cancelEditSystemPrompt();
        }
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して別のチャットを読み込みますか？");
            if (!confirmedAttach) return;
            state.pendingAttachments = [];
            uiUtils.updateAttachmentBadgeVisibility();
        }

        try {
            const dbGetStartTime = performance.now();
            const chat = await dbUtils.getChat(id);
            const dbGetEndTime = performance.now();
            console.log(`%c[PERF_DEBUG] loadChat: DBからのデータ取得完了 (所要時間: ${dbGetEndTime - dbGetStartTime}ms)`, 'color: red; font-weight: bold;');
            
            if (chat) {
                state.currentChatId = chat.id;
                state.currentMessages = chat.messages?.map(msg => ({
                    ...msg,
                    attachments: msg.attachments || []
                })) || [];
                console.log(`[Debug LoadChat] 3. DBから新しいチャットを読み込みました。 new length: ${state.currentMessages.length}`);
                
                state.currentPersistentMemory = chat.persistentMemory || {};

                let needsSave = false;
                const groupIds = new Set(state.currentMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                groupIds.forEach(gid => {
                    const siblings = state.currentMessages.filter(m => m.siblingGroupId === gid);
                    const selected = siblings.filter(m => m.isSelected);
                    if (selected.length === 0 && siblings.length > 0) {
                        siblings[siblings.length - 1].isSelected = true;
                        needsSave = true;
                    } else if (selected.length > 1) {
                        selected.slice(0, -1).forEach(m => m.isSelected = false);
                        needsSave = true;
                    }
                });
                
                state.currentSystemPrompt = chat.systemPrompt !== undefined ? chat.systemPrompt : state.settings.systemPrompt;
                state.pendingAttachments = [];
                
                uiUtils.updateChatTitle(chat.title);
                uiUtils.updateSystemPromptUI();
                
                console.log(`[Debug LoadChat] 4. renderChatMessages を呼び出します...`);

                const renderStartTime = performance.now();
                uiUtils.renderChatMessages();
                const renderEndTime = performance.now();
                console.log(`%c[PERF_DEBUG] loadChat: renderChatMessages DOM再構築完了 (所要時間: ${renderEndTime - renderStartTime}ms)`, 'color: red; font-weight: bold;');
                
                uiUtils.scrollToBottom();

                elements.userInput.value = '';
                uiUtils.adjustTextareaHeight();
                uiUtils.setSendingState(false);

                if (needsSave) {
                    console.log("読み込み時に isSelected を正規化しました。DBに保存します。");
                    await dbUtils.saveChat();
                }

                console.log(`%c[Debug LoadChat] END: チャット読み込み完了: ${id}`, 'color: blue; font-weight: bold;');
            } else {
                await uiUtils.showCustomAlert("チャット履歴が見つかりませんでした。");
                this.startNewChat();
                uiUtils.showScreen('chat');
            }
        } catch (error) {
            await uiUtils.showCustomAlert(`チャットの読み込みエラー: ${error}`);
            this.startNewChat();

        }
        const loadChatEndTime = performance.now();
        console.log(`%c[PERF_DEBUG] loadChat: END - 全処理完了 (合計所要時間: ${loadChatEndTime - loadChatStartTime}ms)`, 'color: red; font-weight: bold;');
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

    async exportProfile() {
        if (!state.activeProfile) {
            return uiUtils.showCustomAlert("エクスポートするプロファイルが選択されていません。");
        }
        
        // stateのデータを汚染しないようにディープコピーする
        const profileToExport = JSON.parse(JSON.stringify(state.activeProfile));
        
        // アイコンBlobがあればBase64に変換して埋め込む
        if (state.activeProfile.icon instanceof Blob) {
            try {
                const base64Icon = await this.fileToBase64(state.activeProfile.icon);
                profileToExport.icon = {
                    mimeType: state.activeProfile.icon.type,
                    data: base64Icon
                };
            } catch (error) {
                console.error("アイコンのBase64変換に失敗:", error);
                return uiUtils.showCustomAlert("アイコンのエクスポート処理に失敗しました。");
            }
        }

        delete profileToExport.id; // DBのIDは不要なので削除

        const jsonString = JSON.stringify(profileToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = profileToExport.name.replace(/[\\/:*?"<>|]/g, '_');
        a.href = url;
        a.download = `${safeName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    async importProfile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (state.profiles.length >= MAX_PROFILES) {
                    return uiUtils.showCustomAlert(`プロファイルの上限数（${MAX_PROFILES}個）に達しているため、プロファイルをインポートできません。`);
                }
                const importedData = JSON.parse(event.target.result);

                if (!importedData.name || !importedData.settings) {
                    throw new Error("無効なファイルです。'name'と'settings'プロパティが必要です。");
                }

                let newProfile = { ...importedData };
                
                if (newProfile.icon && newProfile.icon.data) {
                    try {
                        newProfile.icon = await this.base64ToBlob(newProfile.icon.data, newProfile.icon.mimeType);
                    } catch (error) {
                        console.error("インポート時のアイコン復元に失敗:", error);
                        newProfile.icon = null;
                    }
                }

                let finalName = newProfile.name;
                const existingNames = state.profiles.map(p => p.name);
                while (existingNames.includes(finalName)) {
                    finalName = `${IMPORT_PREFIX}${finalName}`;
                }
                newProfile.name = finalName;

                const newId = await dbUtils.addProfile(newProfile);
                const newlyAddedProfile = await dbUtils.getProfile(newId);
                state.profiles.push(newlyAddedProfile);
                
                uiUtils.updateProfileSwitcherUI();
                await uiUtils.showCustomAlert(`プロファイル「${finalName}」をインポートしました。`);

            } catch (error) {
                console.error("プロファイルのインポートに失敗:", error);
                await uiUtils.showCustomAlert(`プロファイルのインポートに失敗しました: ${error.message}`);
            }
        };
        reader.readAsText(file);
    },



    // チャットをテキストファイルとしてエクスポート
    async exportChat(chatId, chatTitle) {
        const confirmed = await uiUtils.showCustomConfirm(`チャット「${chatTitle || 'この履歴'}」をテキスト出力しますか？`);
        if (!confirmed) return;
    
        try {
            let chatToExport;
            if (state.currentChatId === chatId) {
                chatToExport = {
                    id: state.currentChatId,
                    title: chatTitle,
                    messages: state.currentMessages,
                    systemPrompt: state.currentSystemPrompt,
                    persistentMemory: state.currentPersistentMemory,
                    createdAt: null,
                    updatedAt: Date.now(),
                };
            } else {
                chatToExport = await dbUtils.getChat(chatId);
            }
    
            if (!chatToExport || ((!chatToExport.messages || chatToExport.messages.length === 0) && !chatToExport.systemPrompt)) {
                await uiUtils.showCustomAlert("チャットデータが空です。");
                return;
            }
    
            let exportText = '';
            const imageDataBlock = {};
            const allImageIds = new Set();

            // 1. 全メッセージから必要な画像IDを収集
            if (chatToExport.messages) {
                chatToExport.messages.forEach(msg => {
                    if (msg.imageIds && msg.imageIds.length > 0) {
                        msg.imageIds.forEach(id => allImageIds.add(id));
                    }
                });
            }

            // 2. 画像IDを元にDBから画像データを取得し、Base64に変換
            if (allImageIds.size > 0) {
                uiUtils.setLoadingIndicatorText('画像データを収集中...');
                elements.loadingIndicator.classList.remove('hidden');
                for (const imageId of allImageIds) {
                    try {
                        const blob = await this.getImageBlobById(imageId);
                        if (blob) {
                            const base64Data = await this.fileToBase64(blob);
                            imageDataBlock[imageId] = {
                                mimeType: blob.type,
                                data: base64Data
                            };
                        }
                    } catch (e) {
                        console.error(`エクスポート中に画像(ID: ${imageId})の処理に失敗しました:`, e);
                    }
                }
                elements.loadingIndicator.classList.add('hidden');
            }
    
            // 3. テキストコンテンツを生成
            if (chatToExport.persistentMemory && Object.keys(chatToExport.persistentMemory).length > 0) {
                try {
                    const metadataJson = JSON.stringify(chatToExport.persistentMemory, null, 2);
                    exportText += `<|#|metadata|#|>\n${metadataJson}\n<|#|/metadata|#|>\n\n`;
                } catch (e) {
                    console.error("persistentMemoryのJSON化に失敗しました:", e);
                }
            }
    
            if (chatToExport.systemPrompt) {
                exportText += `<|#|system|#|>\n${chatToExport.systemPrompt}\n<|#|/system|#|>\n\n`;
            }
    
            if (chatToExport.messages) {
                chatToExport.messages.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'model') {
                        let attributes = '';
                        if (msg.role === 'model') {
                            if (msg.isCascaded) attributes += ' isCascaded';
                            if (msg.isSelected) attributes += ' isSelected';
                            if (msg.imageIds && msg.imageIds.length > 0) {
                                attributes += ` imageIds="${msg.imageIds.join(',')}"`;
                            }
                        }
                        if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                            const fileNames = msg.attachments.map(a => a.name).join(';');
                            attributes += ` attachments="${fileNames.replace(/"/g, '&quot;')}"`;
                        }
                        exportText += `<|#|${msg.role}|#|${attributes.trim()}>\n${msg.content}\n<|#|/${msg.role}|#|>\n\n`;
                    }
                });
            }

            // 4. 画像データブロックを追記
            if (Object.keys(imageDataBlock).length > 0) {
                exportText += `<|#|imagedata|#|>\n${JSON.stringify(imageDataBlock, null, 2)}\n<|#|/imagedata|#|>\n`;
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
        } finally {
            elements.loadingIndicator.classList.add('hidden');
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
            const isFirstCallInLoop = loopCount === 0;
            loopCount++;

            const result = await this.callApiWithRetry({
                messagesForApi: currentTurnHistory,
                generationConfig,
                systemInstruction,
                tools: window.functionDeclarations,
                isFirstCall: isFirstCallInLoop
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

            const historyForFunctions = state.currentMessages.slice(0, -1);
            const { toolResults, containsTerminalAction, search_results, internalUiActions } = await this.executeToolCalls(result.toolCalls, historyForFunctions);
            
            if (search_results && search_results.length > 0) {
                aggregatedSearchResults.push(...search_results);
            }
            
            if (internalUiActions && internalUiActions.length > 0) {
                console.log(`[Debug] _internalHandleSend: executeToolCallsから ${internalUiActions.length} 件のUIアクションを受信`);
                if (toolResults.length > 0) {
                    const lastToolResult = toolResults[toolResults.length - 1];
                    if (!lastToolResult._internal_ui_action) {
                        lastToolResult._internal_ui_action = [];
                    }
                    lastToolResult._internal_ui_action.push(...internalUiActions);
                    console.log(`[Debug] _internalHandleSend: ツール結果にUIアクションを紐付けました`, lastToolResult._internal_ui_action);
                }
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
            imageIds: [], // generated_images の代わりに imageIds を使用
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

                Object.assign(finalAggregatedMessage, {
                    finishReason: msg.finishReason,
                    safetyRatings: msg.safetyRatings,
                    groundingMetadata: msg.groundingMetadata,
                    usageMetadata: msg.usageMetadata,
                    retryCount: msg.retryCount,
                });
            }

            if (msg._internal_ui_action) {
                const actions = Array.isArray(msg._internal_ui_action) ? msg._internal_ui_action : [msg._internal_ui_action];
                actions.forEach(action => {
                    if (action.type === 'display_generated_images' && action.imageIds) {
                        finalAggregatedMessage.imageIds.push(...action.imageIds);
                    }
                    if (action.type === 'display_generated_videos' && action.videos) {
                        finalAggregatedMessage.generated_videos.push(...action.videos);
                    }
                });
            }
        });
        
        console.log("[Debug] 集約後の最終メッセージオブジェクト:", JSON.stringify(finalAggregatedMessage, null, 2));

        return finalAggregatedMessage;
    },
    
    async handleSend() {
        if (state.isSending) { return; }
        if (state.editingMessageIndex !== null) { await uiUtils.showCustomAlert("他のメッセージを編集中です。"); return; }
        if (state.isEditingSystemPrompt) { await uiUtils.showCustomAlert("システムプロンプトを編集中です。"); return; }

        const text = elements.userInput.value.trim();
        const attachmentsToSend = [...state.pendingAttachments];
        if (!text && attachmentsToSend.length === 0) return;

        uiUtils.setSendingState(true);
        uiUtils.setLoadingIndicatorText('応答生成中...');
        
        const userMessage = { role: 'user', content: text, timestamp: Date.now(), attachments: attachmentsToSend };
        state.currentMessages.push(userMessage);
        uiUtils.appendMessage(userMessage.role, userMessage.content, state.currentMessages.length - 1, false, null, userMessage.attachments);
        
        const baseHistory = state.currentMessages.filter(msg => !msg.isCascaded || msg.isSelected);
        const historyForApi = this._prepareApiHistory(baseHistory);

        const modelMessage = { role: 'model', content: '', timestamp: Date.now() };
        state.currentMessages.push(modelMessage);
        const modelMessageIndex = state.currentMessages.length - 1;
        uiUtils.appendMessage(modelMessage.role, modelMessage.content, modelMessageIndex, true);

        state.pendingAttachments = [];
        state.selectedFilesForUpload = [];
        uiUtils.updateAttachmentBadgeVisibility();
        elements.userInput.value = '';
        uiUtils.adjustTextareaHeight();
        if (state.settings.autoScroll) {
            uiUtils.scrollToBottom();
        }
        
        await dbUtils.saveChat();
        
        try {
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
            state.currentMessages[modelMessageIndex] = finalAggregatedMessage;

            // API応答後、全再描画で最終結果を反映
            uiUtils.renderChatMessages(() => uiUtils.scrollToBottom());

            await dbUtils.saveChat();

        } catch(error) {
            console.error("--- handleSend: 最終catchブロックでエラー捕捉 ---", error);
            const errorMessage = (error.name !== 'AbortError') ? (error.message || "不明なエラーが発生しました。") : "リクエストがキャンセルされました。";
            
            state.currentMessages[modelMessageIndex] = { role: 'error', content: errorMessage, timestamp: Date.now() };
            uiUtils.renderChatMessages(() => uiUtils.scrollToBottom());
            await dbUtils.saveChat();
        } finally {
            uiUtils.setSendingState(false);
            state.abortController = null;
            if (state.settings.autoScroll) {
                requestAnimationFrame(() => {
                    uiUtils.scrollToBottom();
                });
            }
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
                const { messages: importedMessages, systemPrompt: importedSystemPrompt, persistentMemory: importedMemory, imageData: importedImageData } = this.parseImportedHistory(textContent);
                
                if (importedMessages.length === 0 && !importedSystemPrompt && (!importedMemory || Object.keys(importedMemory).length === 0)) {
                    await uiUtils.showCustomAlert("ファイルから有効なメッセージ、システムプロンプト、またはメタデータを読み込めませんでした。形式を確認してください。");
                    return;
                }

                // 画像データをDBに保存し、IDの対応表を作成
                const imageIdMap = new Map();
                if (importedImageData && Object.keys(importedImageData).length > 0) {
                    uiUtils.setLoadingIndicatorText('画像データを復元中...');
                    elements.loadingIndicator.classList.remove('hidden');
                    for (const oldId in importedImageData) {
                        try {
                            const { mimeType, data } = importedImageData[oldId];
                            const blob = await this.base64ToBlob(data, mimeType);
                            const newId = await this.saveImageBlob(blob);
                            imageIdMap.set(oldId, newId);
                        } catch (e) {
                            console.error(`インポート中に画像(旧ID: ${oldId})の復元に失敗:`, e);
                        }
                    }
                    elements.loadingIndicator.classList.add('hidden');
                }

                // メッセージ内の古い画像IDを新しいIDに置換
                importedMessages.forEach(msg => {
                    if (msg.imageIds && msg.imageIds.length > 0) {
                        msg.imageIds = msg.imageIds.map(oldId => imageIdMap.get(oldId) || oldId).filter(Boolean);
                    }
                });

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
            } finally {
                elements.loadingIndicator.classList.add('hidden');
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
        let persistentMemory = {};
        const imageData = {}; // 画像データブロックを格納するオブジェクト

        // メタデータブロック
        const metadataRegex = /<\|#\|metadata\|#\|>([\s\S]*?)<\|#\|\/metadata\|#\|>\s*/;
        const metadataMatch = text.match(metadataRegex);
        let remainingText = text;
        if (metadataMatch) {
            try {
                persistentMemory = JSON.parse(metadataMatch[1].trim());
            } catch (e) {
                console.error("インポートされたmetadataのJSONパースに失敗:", e);
                persistentMemory = {};
            }
            remainingText = remainingText.replace(metadataRegex, '');
        }

        // 画像データブロックを先に抽出・削除
        const imageDataRegex = /<\|#\|imagedata\|#\|>([\s\S]*?)<\|#\|\/imagedata\|#\|>\s*/;
        const imageDataMatch = remainingText.match(imageDataRegex);
        if (imageDataMatch) {
            try {
                const imageDataJson = imageDataMatch[1].trim();
                Object.assign(imageData, JSON.parse(imageDataJson));
            } catch (e) {
                console.error("インポートされたimagedataのJSONパースに失敗:", e);
            }
            remainingText = remainingText.replace(imageDataRegex, '');
        }
    
        const blockRegex = /<\|#\|(system|user|model)\|#\|([^>]*)>([\s\S]*?)<\|#\|\/\1\|#\|>/g;
        let match;
    
        while ((match = blockRegex.exec(remainingText)) !== null) {
            const role = match[1];
            const attributesString = match[2].trim();
            const content = match[3].trim();
    
            if (role === 'system' && content) {
                systemPrompt = content;
            } else if ((role === 'user' || role === 'model')) {
                const messageData = {
                    role: role,
                    content: content,
                    timestamp: Date.now(),
                    attachments: []
                };

                const attributeRegex = /(\w+)="([^"]*)"|(\w+)/g;
                let attrMatch;
                while ((attrMatch = attributeRegex.exec(attributesString)) !== null) {
                    if (attrMatch[1]) { // key="value" 形式
                        const key = attrMatch[1];
                        const value = attrMatch[2].replace(/&quot;/g, '"');
                        if (key === 'attachments') {
                            messageData.attachments = value.split(';').map(name => ({
                                name: name, mimeType: 'unknown/unknown', base64Data: ''
                            }));
                        } else if (key === 'imageIds') {
                            messageData.imageIds = value.split(',');
                        }
                    } else if (attrMatch[3]) { // boolean 形式
                        messageData[attrMatch[3]] = true;
                    }
                }
                messages.push(messageData);
            }
        }
        console.log(`インポートテキストから ${messages.length} 件のメッセージとシステムプロンプト(${systemPrompt ? 'あり' : 'なし'})をパースしました。`);
        
        // 戻り値にimageDataを追加
        return { messages, systemPrompt, persistentMemory, imageData };
    },

    // -------------------------------

    // --- 背景画像ハンドラ ---
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
            const blob = file;
            // stateとDBを更新し、新しい関数を呼び出してUIに適用する
            state.settings.backgroundImageBlob = blob;
            await dbUtils.saveSetting('backgroundImageBlob', blob);
            uiUtils.applyBackgroundImage();
        } catch (error) {
            console.error("背景画像の保存・適用エラー:", error);
            // エラー時にはstateとDBをnullに戻し、背景を非表示にする
            state.settings.backgroundImageBlob = null;
            await dbUtils.saveSetting('backgroundImageBlob', null);
            uiUtils.applyBackgroundImage();
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

            state.isTemporaryBackgroundActive = false;
            elements.chatScreen.classList.remove('background-visible');
            document.documentElement.style.removeProperty('--chat-background-image');
            uiUtils.updateBackgroundSettingsUI();
        } catch (error) {
    
    
           console.error("背景画像削除エラー:", error);
           await uiUtils.showCustomAlert(`背景画像の削除中にエラーが発生しました: ${error}`);
        }
    },
     // -------------------------------

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

    async executeToolCalls(toolCalls, historyForFunctions) {
        const messagesForFunction = (historyForFunctions || []).map(c => c.originalMessage || c);
        
        // ダミープロンプトの数を計算
        const dummyUserCount = state.settings.dummyUser ? 1 : 0;
        const dummyModelCount = state.settings.dummyModel ? 1 : 0;
        const dummyPromptCount = dummyUserCount + dummyModelCount;

        const chat = {
            id: state.currentChatId,
            messages: messagesForFunction.filter(m => m.role !== 'tool'),
            systemPrompt: state.currentSystemPrompt,
            persistentMemory: state.currentPersistentMemory,
            dummy_prompt_count: dummyPromptCount // 計算したダミーの数を追加
        };

    
        const toolResults = [];
        let containsTerminalAction = false;
        let aggregatedSearchResults = [];
        let internalUiActions = [];
    
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
                console.log(`[Debug] executeToolCalls: _internal_ui_actionを検出`, result._internal_ui_action);
                internalUiActions.push(result._internal_ui_action);

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

        // 1. stateを更新
        const updatedMessage = {
            ...originalMessage,
            content: newRawContent,
            timestamp: Date.now()
        };
        delete updatedMessage.error;
        state.currentMessages[index] = updatedMessage;

        // 2. 既存のメタ情報表示を一旦削除
        messageElement.querySelectorAll('.function-call-details, .citation-details').forEach(el => el.remove());

        // 3. テキスト部分をDOMに反映
        const contentDiv = messageElement.querySelector('.message-content');
        if (contentDiv) {
            if (updatedMessage.role === 'model' && typeof marked !== 'undefined') {
                contentDiv.innerHTML = marked.parse(newRawContent || '');
            } else {
                const pre = contentDiv.querySelector('pre') || document.createElement('pre');
                pre.textContent = newRawContent;
                if (!contentDiv.querySelector('pre')) {
                    contentDiv.innerHTML = '';
                    contentDiv.appendChild(pre);
                }
            }
        }

        // 4. 画像が存在する場合、画像を再注入
        if (updatedMessage.role === 'model' && updatedMessage.generated_images && updatedMessage.generated_images.length > 0) {
            // (この部分は前回の修正と同じなので省略)
            const imagePlaceholderRegex = /<p>\[IMAGE_HERE\]<\/p>|\[IMAGE_HERE\]/g;
            const processImages = async () => {
                const imageElements = [];
                const imageCacheKeyPrefix = `image-${index}`;
                for (let i = 0; i < updatedMessage.generated_images.length; i++) {
                    const imageData = updatedMessage.generated_images[i];
                    const key = `${imageCacheKeyPrefix}-${i}`;
                    const img = document.createElement('img');
                    img.alt = '生成された画像';
                    img.style.maxWidth = '100%';
                    img.style.borderRadius = 'var(--border-radius-md)';
                    img.style.marginTop = '8px';
                    if (state.imageUrlCache.has(key)) {
                        img.src = state.imageUrlCache.get(key);
                    } else {
                        try {
                            const blob = await base64ToBlob(imageData.data, imageData.mimeType);
                            const url = URL.createObjectURL(blob);
                            state.imageUrlCache.set(key, url);
                            img.src = url;
                        } catch (e) {
                            console.error(`[Memory] BlobまたはObjectURLの生成に失敗しました (Key: ${key}):`, e);
                            img.alt = '画像表示エラー';
                        }
                    }
                    imageElements.push(img.outerHTML);
                }
                let imageIndex = 0;
                const replacedHtml = contentDiv.innerHTML.replace(imagePlaceholderRegex, () => {
                    return imageIndex < imageElements.length ? imageElements[imageIndex++] : '';
                });
                contentDiv.innerHTML = replacedHtml;
                if (imageIndex < imageElements.length) {
                    const fragment = document.createDocumentFragment();
                    for (let i = imageIndex; i < imageElements.length; i++) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = imageElements[i];
                        fragment.appendChild(tempDiv.firstChild);
                    }
                    contentDiv.appendChild(fragment);
                }
            };
            await processImages();
        }
        
        // 5. メタ情報（ツール使用履歴など）を再生成して追加
        if (updatedMessage.role === 'model') {
            const detailsFragment = document.createDocumentFragment();
            // ツール使用履歴
            if (updatedMessage.executedFunctions && updatedMessage.executedFunctions.length > 0) {
                const details = document.createElement('details');
                details.classList.add('function-call-details');
                const uniqueFunctions = [...new Set(updatedMessage.executedFunctions)];
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
                detailsFragment.appendChild(details);
            }
            // Web検索結果
            if (updatedMessage.search_web_results && updatedMessage.search_web_results.length > 0) {
                const details = document.createElement('details');
                details.classList.add('function-call-details');
                const summary = document.createElement('summary');
                summary.innerHTML = `🌐 Web検索結果 (${updatedMessage.search_web_results.length}件)`;
                details.appendChild(summary);
                const list = document.createElement('ul');
                list.classList.add('function-call-list');
                updatedMessage.search_web_results.forEach(result => {
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
                detailsFragment.appendChild(details);
            }
            
            // 生成したメタ情報を適切な場所に追加
            if (contentDiv.innerHTML.trim() !== '') {
                contentDiv.appendChild(detailsFragment);
            } else {
                messageElement.appendChild(detailsFragment);
            }
        }

        // 6. Prism.jsでハイライトを再適用
        if (window.Prism) {
            contentDiv.querySelectorAll('pre code').forEach((block) => {
                Prism.highlightElement(block);
            });
        }

        // 7. 編集UIを閉じる
        this.finishEditing(messageElement);

        // 8. DBへの保存処理
        try {
            const requiresTitleUpdate = (index === state.currentMessages.findIndex(m => m.role === 'user'));
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

        elements.userInput.focus();
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
            await uiUtils.showCustomAlert("システムプロンプトを編集中は削除できません。");
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

        if (messageToDelete.role === 'user') {
            indicesToDelete.push(index);
            confirmMessage = `メッセージ「${messageContentPreview}」を削除しますか？`;
            deleteTargetDescription = `単一メッセージ (index: ${index}, role: user)`;

            const nextMessageIndex = index + 1;
            if (nextMessageIndex < state.currentMessages.length && state.currentMessages[nextMessageIndex].role === 'error') {
                indicesToDelete.push(nextMessageIndex);
                confirmMessage = `メッセージ「${messageContentPreview}」と、それに対するエラー応答を削除しますか？`;
                deleteTargetDescription = `メッセージペア (user at ${index}, error at ${nextMessageIndex})`;
            }
        } else if (messageToDelete.role === 'model' && messageToDelete.isCascaded && messageToDelete.siblingGroupId) {
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

            // 先にDOMから要素を削除
            indicesToDelete.forEach(idx => {
                const elementToRemove = elements.messageContainer.querySelector(`.message[data-index="${idx}"]`);
                if (elementToRemove) {
                    elementToRemove.remove();
                }
            });
            // その後stateを更新
            indicesToDelete.sort((a, b) => b - a).forEach(idx => {
                state.currentMessages.splice(idx, 1);
            });
            // 最後にインデックスを振り直す
            elements.messageContainer.querySelectorAll('.message').forEach((el, i) => {
                el.dataset.index = i;
            });

            console.log(`メッセージ削除完了 (state)。削除件数: ${indicesToDelete.length}`);

            const newFirstUserMsgIndex = state.currentMessages.findIndex(m => m.role === 'user');
            let requiresTitleUpdate = indicesToDelete.includes(originalFirstUserMsgIndex);

            try {
                // 先にUIを完全に更新し、インデックスのズレを解消する
                uiUtils.renderChatMessages();
    
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
                
                if (state.settings.autoScroll) {
                    requestAnimationFrame(() => {
                        uiUtils.scrollToBottom();
                    });
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
            
            // 先にDOMから要素を削除
            const messagesToRemove = state.currentMessages.slice(index + 1);
            messagesToRemove.forEach((msg, i) => {
                const elementToRemove = elements.messageContainer.querySelector(`.message[data-index="${index + 1 + i}"]`);
                if (elementToRemove) {
                    elementToRemove.remove();
                }
            });
            // その後stateを更新
            state.currentMessages.splice(index + 1);

            try {
                const baseHistory = state.currentMessages.filter(msg => !msg.isCascaded || msg.isSelected);
                const historyForApi = this._prepareApiHistory(baseHistory);

                // プレースホルダーをstateとUIに「追加」
                const modelMessage = { role: 'model', content: '', timestamp: Date.now() };
                state.currentMessages.push(modelMessage);
                const modelMessageIndex = state.currentMessages.length - 1;
                uiUtils.appendMessage(modelMessage.role, modelMessage.content, modelMessageIndex, true);
                uiUtils.scrollToBottom();

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


                // プレースホルダーを削除し、元の応答と新しい応答をstateに追加
                state.currentMessages.splice(modelMessageIndex, 1, ...originalResponses, newAggregatedMessage);
                // 最終結果を全再描画
                uiUtils.renderChatMessages(() => uiUtils.scrollToBottom());
                await dbUtils.saveChat();

            } catch(error) {
                console.error("--- retryFromMessage: 最終catchブロックでエラー捕捉 ---", error);
                const errorMessage = (error.name !== 'AbortError') ? (error.message || "不明なエラーが発生しました。") : "リクエストがキャンセルされました。";
                // プレースホルダーをエラーメッセージに置き換える
                const errorIndex = state.currentMessages.findIndex(m => m.timestamp === modelMessage.timestamp);
                if (errorIndex !== -1) {
                    state.currentMessages[errorIndex] = { role: 'error', content: errorMessage, timestamp: Date.now() };
                }
                uiUtils.renderChatMessages(() => uiUtils.scrollToBottom());
                await dbUtils.saveChat();
            } finally {
                uiUtils.setSendingState(false);
                state.abortController = null; 
                if (state.settings.autoScroll) {
                    requestAnimationFrame(() => {
                        uiUtils.scrollToBottom();
                    });
                }
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

        // 新しいファイル選択が開始されるたびに、必ずリストをクリアする
        state.selectedFilesForUpload = [];

        console.log("--- [DEBUG ①] ファイルが選択されました ---");
        Array.from(fileList).forEach(file => {
            console.log(`ファイル名: ${file.name}, サイズ: ${file.size}, 種類: ${file.type}`);
        });

        const newFiles = Array.from(fileList);
        let currentTotalSize = 0; // クリアしたので0からスタート
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

            // 配列はクリアされているので、重複チェックは不要
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
            console.log(`${skippedCount}個のファイルがスキップされました（サイズ超過）。`);
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

        console.log("--- [DEBUG ②] 添付が確定されました ---");
        state.selectedFilesForUpload.forEach(item => {
            console.log(`[DEBUG ②-A] 確定されたファイル: ${item.file.name}, サイズ: ${item.file.size}, 種類: ${item.file.type}`);
        });

        elements.confirmAttachBtn.disabled = true;
        elements.confirmAttachBtn.textContent = '処理中...';

        const attachmentsToAdd = [];
        let encodingError = false;

        for (const item of state.selectedFilesForUpload) {
            try {
                // 確実なキャッシュ回避のため、一度Base64に変換し、そこから新しいBlobを再生成する
                const base64Data = await this.fileToBase64(item.file);
                const rehydratedBlob = await this.base64ToBlob(base64Data, item.file.type);
                
                console.log(`[DEBUG ②-B] ファイル「${item.file.name}」をBase64経由で再生成しました。`, {
                    originalSize: item.file.size,
                    newBlobSize: rehydratedBlob.size,
                    originalType: item.file.type,
                    newBlobType: rehydratedBlob.type
                });

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
                    file: rehydratedBlob,
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
        const { messagesForApi, generationConfig, systemInstruction, tools, isFirstCall } = apiParams;
        let lastError = null;
        const maxRetries = state.settings.enableAutoRetry ? state.settings.maxRetries : 0;
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

                // 非ストリーミングの処理に統一
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
        
        // 既存のオブジェクトURLがあれば解放する
        uiUtils.revokeExistingObjectUrl();
        
        // 新しいURLをstateに保存
        state.backgroundImageUrl = url;
        
        const chatScreen = elements.chatScreen;
        const isAlreadyVisible = chatScreen.classList.contains('background-visible');
    
        // フェードアウト完了後に画像を設定してフェードインさせる処理
        const switchImageAndFadeIn = () => {
            document.documentElement.style.setProperty('--chat-background-image', `url("${url}")`);
            chatScreen.classList.add('background-visible');
        };
    
        if (isAlreadyVisible) {
            // 画像が表示されている場合：一度フェードアウトさせてから切り替える
            chatScreen.addEventListener('transitionend', switchImageAndFadeIn, { once: true });
            chatScreen.classList.remove('background-visible');
        } else {
            // 画像がない場合：即座に切り替えてフェードイン
            switchImageAndFadeIn();
        }
        
        // 一時的な背景が適用されたことを示すフラグを立てる
    

        state.isTemporaryBackgroundActive = true;
        
        // サムネイルUIを更新（新しいURLでサムネイルが表示される）
        uiUtils.updateBackgroundSettingsUI();
        
        const message = `背景画像を一時的に変更しました。この変更はリロードするか、設定から背景を再設定すると元に戻ります。`;
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
    async exportProfile() {
        console.log('[Debug Event] exportProfile が呼び出されました。');

        if (!state.activeProfile) {
            return uiUtils.showCustomAlert("エクスポートするプロファイルが選択されていません。");
        }
        
        // stateのデータを汚染しないようにディープコピーする
        const profileToExport = JSON.parse(JSON.stringify(state.activeProfile));
        
        // アイコンBlobがあればBase64に変換して埋め込む
        if (state.activeProfile.icon instanceof Blob) {
            try {
                const base64Icon = await this.fileToBase64(state.activeProfile.icon);
                profileToExport.icon = {
                    mimeType: state.activeProfile.icon.type,
                    data: base64Icon
                };
            } catch (error) {
                console.error("アイコンのBase64変換に失敗:", error);
                return uiUtils.showCustomAlert("アイコンのエクスポート処理に失敗しました。");
            }
        }

        delete profileToExport.id; // DBのIDは不要なので削除

        const jsonString = JSON.stringify(profileToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = profileToExport.name.replace(/[\\/:*?"<>|]/g, '_');
        a.href = url;
        a.download = `${safeName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    async importProfile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (state.profiles.length >= MAX_PROFILES) {
                    return uiUtils.showCustomAlert(`プロファイルの上限数（${MAX_PROFILES}個）に達しているため、プロファイルをインポートできません。`);
                }
                const importedData = JSON.parse(event.target.result);

                if (!importedData.name || !importedData.settings) {
                    throw new Error("無効なファイルです。'name'と'settings'プロパティが必要です。");
                }

                let newProfile = { ...importedData };
                
                if (newProfile.icon && newProfile.icon.data) {
                    try {
                        newProfile.icon = await this.base64ToBlob(newProfile.icon.data, newProfile.icon.mimeType);
                    } catch (error) {
                        console.error("インポート時のアイコン復元に失敗:", error);
                        newProfile.icon = null;
                    }
                }

                let finalName = newProfile.name;
                const existingNames = state.profiles.map(p => p.name);
                while (existingNames.includes(finalName)) {
                    finalName = `${IMPORT_PREFIX}${finalName}`;
                }
                newProfile.name = finalName;

                const newId = await dbUtils.addProfile(newProfile);
                const newlyAddedProfile = await dbUtils.getProfile(newId);
                state.profiles.push(newlyAddedProfile);
                
                uiUtils.updateProfileSwitcherUI();
                await uiUtils.showCustomAlert(`プロファイル「${finalName}」をインポートしました。`);

            } catch (error) {
                console.error("プロファイルのインポートに失敗:", error);
                await uiUtils.showCustomAlert(`プロファイルのインポートに失敗しました: ${error.message}`);
            }
        };
        reader.readAsText(file);
    },
}; // appLogic終了

window.appLogic = appLogic;
window.state = state;
