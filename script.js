// --- 定数 ---
const DB_NAME = 'GeminiPWA_DB';
const DB_VERSION = 8; // スキーマ変更なしのため据え置き
const SETTINGS_STORE = 'settings';
const CHATS_STORE = 'chats';
const CHAT_UPDATEDAT_INDEX = 'updatedAtIndex';
const CHAT_CREATEDAT_INDEX = 'createdAtIndex';
const DEFAULT_MODEL = 'gemini-2.0-flash';
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
const APP_VERSION = "0.26"; // Thought summaries対応、streamingのバグ修正
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
    dummyUserInput: document.getElementById('dummy-user'),
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
        streamingOutput: true,
        streamingSpeed: DEFAULT_STREAMING_SPEED,
        systemPrompt: '',
        temperature: null,
        maxTokens: null,
        topK: null,
        topP: null,
        presencePenalty: null,
        frequencyPenalty: null,
        thinkingBudget: null,
        includeThoughts: true,
        dummyUser: '',
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
        enableProofreading: false,
        proofreadingModelName: 'gemini-2.5-flash',
        proofreadingSystemInstruction: 'あなたはプロの編集者です。受け取った文章の過剰な読点を抑制し、日本語として違和感のない読点の使用量に校正してください。承知しました等の応答は行わず、校正後の文章のみ出力して下さい。読点の抑制以外の編集は禁止です。読点以外の文章には絶対に手を付けないで下さい。',
        geminiEnableGrounding: false,
        geminiEnableFunctionCalling: false,
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
};

function updateMessageMaxWidthVar() {
    const container = elements.messageContainer;
    if (!container) return;
    let maxWidthPx = container.clientWidth * 0.8;
    document.documentElement.style.setProperty('--message-max-width', `${maxWidthPx}px`);
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateMessageMaxWidthVar, 150);
});

// --- ユーティリティ関数 ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function interruptibleSleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            const error = new Error("Sleep aborted");
            error.name = "AbortError";
            return reject(error);
        }
        let timeoutId;
        const onAbort = () => {
            clearTimeout(timeoutId);
            const error = new Error("Sleep aborted");
            error.name = "AbortError";
            reject(error);
        };
        timeoutId = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        signal.addEventListener('abort', onAbort, { once: true });
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// --- Service Worker関連 ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker登録成功 スコープ: ', registration.scope);
                    navigator.serviceWorker.addEventListener('message', event => {
                        if (event.data && event.data.action === 'reloadPage') {
                            alert('アプリが更新されました。ページをリロードします。');
                            window.location.reload();
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
                state.db.onerror = (event) => {
                    console.error(`データベースエラー: ${event.target.error}`);
                };
                resolve(state.db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;
                console.log(`IndexedDBをバージョン ${event.oldVersion} から ${event.newVersion} へアップグレード中...`);
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                    console.log(`オブジェクトストア ${SETTINGS_STORE} 作成`);
                }
                let chatStore;
                if (!db.objectStoreNames.contains(CHATS_STORE)) {
                    chatStore = db.createObjectStore(CHATS_STORE, { keyPath: 'id', autoIncrement: true });
                    console.log(`オブジェクトストア ${CHATS_STORE} 作成`);
                } else {
                     if (transaction) {
                        try { chatStore = transaction.objectStore(CHATS_STORE); } catch (e) { console.error("チャットストアの取得中にエラー(アップグレード):", e); return; }
                    } else { console.warn("チャットストアのアップグレード用トランザクション取得失敗"); }
                }
                if (chatStore && !chatStore.indexNames.contains(CHAT_UPDATEDAT_INDEX)) {
                    chatStore.createIndex(CHAT_UPDATEDAT_INDEX, 'updatedAt', { unique: false });
                    console.log(`インデックス ${CHAT_UPDATEDAT_INDEX} を ${CHATS_STORE} に作成`);
                }
                if (chatStore && !chatStore.indexNames.contains(CHAT_CREATEDAT_INDEX)) {
                    chatStore.createIndex(CHAT_CREATEDAT_INDEX, 'createdAt', { unique: false });
                    console.log(`インデックス ${CHAT_CREATEDAT_INDEX} を ${CHATS_STORE} に作成`);
                }
                if (event.oldVersion < 8) {
                    console.log("DBアップグレード: 新しいメッセージフラグは動的に処理されます。");
                }
            };
        });
    },
    _getStore(storeName, mode = 'readonly') {
        if (!state.db) throw new Error("データベースが開かれていません");
        const transaction = state.db.transaction([storeName], mode);
        return transaction.objectStore(storeName);
    },
    async saveSetting(key, value) {
        await this.openDB();
        return new Promise((resolve, reject) => {
             try {
                const store = this._getStore(SETTINGS_STORE, 'readwrite');
                const request = store.put({ key, value });
                request.onsuccess = () => resolve();
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
    async loadSettings() {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(SETTINGS_STORE);
            const request = store.getAll();
            request.onsuccess = (event) => {
                const settingsArray = event.target.result;
                const loadedSettings = {};
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
                        } else if (typeof defaultValue === 'boolean') {
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
                             if (key === 'temperature' || key === 'topP' || key === 'presencePenalty' || key === 'frequencyPenalty') {
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
                                  state.settings[key] = num;
                             }
                        } else if (typeof defaultValue === 'string') {
                             state.settings[key] = typeof loadedValue === 'string' ? loadedValue : defaultValue;
                        } else {
                            console.warn(`予期しない設定タイプ キー: ${key}`);
                            state.settings[key] = loadedValue;
                        }
                    } else {
                        console.warn(`DBから読み込んだ未知の設定を無視: ${key}`);
                    }
                }
                if (state.settings.darkMode !== true && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                     console.log("OSのダークモード設定を初期適用");
                     state.settings.darkMode = true;
                }
                console.log("設定読み込み完了:", { ...state.settings, backgroundImageBlob: state.settings.backgroundImageBlob ? '[Blob]' : null });
                resolve(state.settings);
            };
            request.onerror = (event) => reject(`設定読み込みエラー: ${event.target.error}`);
        });
    },
    async saveChat(optionalTitle = null) {
        await this.openDB();
        if ((!state.currentMessages || state.currentMessages.length === 0) && !state.currentSystemPrompt) {
            if(state.currentChatId) console.log(`saveChat: 既存チャット ${state.currentChatId} にメッセージもシステムプロンプトもないため保存せず`);
            else console.log("saveChat: 新規チャットに保存するメッセージもシステムプロンプトもなし");
            return Promise.resolve(state.currentChatId);
        }
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE, 'readwrite');
            const now = Date.now();
            const messagesToSave = state.currentMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                thoughtSummary: msg.thoughtSummary || null,
                ...(msg.finishReason && { finishReason: msg.finishReason }),
                ...(msg.safetyRatings && { safetyRatings: msg.safetyRatings }),
                ...(msg.error && { error: msg.error }),
                ...(msg.isCascaded !== undefined && { isCascaded: msg.isCascaded }),
                ...(msg.isSelected !== undefined && { isSelected: msg.isSelected }),
                ...(msg.siblingGroupId !== undefined && { siblingGroupId: msg.siblingGroupId }),
                ...(msg.groundingMetadata && { groundingMetadata: msg.groundingMetadata }),
                ...(msg.attachments && msg.attachments.length > 0 && { attachments: msg.attachments }),
                ...(msg.usageMetadata && { usageMetadata: msg.usageMetadata }),
            }));
            const determineTitleAndSave = (existingChatData = null) => {
                let title;
                if (optionalTitle !== null) {
                    title = optionalTitle;
                } else if (existingChatData && existingChatData.title) {
                    title = existingChatData.title;
                } else {
                    const firstUserMessage = state.currentMessages.find(m => m.role === 'user');
                    title = firstUserMessage ? firstUserMessage.content.substring(0, 50) : "無題のチャット";
                }
                const chatIdForOperation = existingChatData ? existingChatData.id : state.currentChatId;
                const chatData = {
                    messages: messagesToSave,
                    systemPrompt: state.currentSystemPrompt,
                    persistentMemory: state.currentPersistentMemory || {},
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
    async updateChatTitleDb(id, newTitle) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE, 'readwrite');
            const getRequest = store.get(id);
            getRequest.onsuccess = (event) => {
                const chatData = event.target.result;
                if (chatData) {
                    chatData.title = newTitle;
                    chatData.updatedAt = Date.now();
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
    async getChat(id) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE);
            const request = store.get(id);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`チャット ${id} 取得エラー: ${event.target.error}`);
        });
    },
    async getAllChats(sortBy = 'updatedAt') {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE);
            const indexName = sortBy === 'createdAt' ? CHAT_CREATEDAT_INDEX : CHAT_UPDATEDAT_INDEX;
            if (!store.indexNames.contains(indexName)) {
                 console.error(`インデックス "${indexName}" が見つかりません。主キー順でフォールバックします。`);
                 const getAllRequest = store.getAll();
                 getAllRequest.onsuccess = (event) => resolve(event.target.result.reverse());
                 getAllRequest.onerror = (event) => reject(`全チャット取得エラー(フォールバック): ${event.target.error}`);
                 return;
            }
            const index = store.index(indexName);
            const request = index.openCursor(null, 'prev');
            const chats = [];
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    chats.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(chats);
                }
            };
            request.onerror = (event) => reject(`全チャット取得エラー (${sortBy}順): ${event.target.error}`);
        });
    },
    async deleteChat(id) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => { console.log("チャット削除:", id); resolve(); };
            request.onerror = (event) => reject(`チャット ${id} 削除エラー: ${event.target.error}`);
        });
    },
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
    renderChatMessages() {
        if (state.editingMessageIndex !== null) {
            const messageElement = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            if(messageElement) appLogic.cancelEditMessage(state.editingMessageIndex, messageElement);
            else state.editingMessageIndex = null;
        }
        elements.messageContainer.innerHTML = '';
        let currentSiblingGroupId = null;
        let siblingsInGroup = [];
        let siblingIndex = 0;
        for (let i = 0; i < state.currentMessages.length; i++) {
            const msg = state.currentMessages[i];
            if (msg.role === 'tool' || (msg.role === 'model' && msg.tool_calls)) {
                continue;
            }
            if (msg.role === 'model' && msg.isCascaded && msg.siblingGroupId) {
                if (msg.siblingGroupId !== currentSiblingGroupId) {
                    currentSiblingGroupId = msg.siblingGroupId;
                    siblingsInGroup = state.currentMessages.filter(m => m.role === 'model' && m.isCascaded && m.siblingGroupId === currentSiblingGroupId);
                    siblingIndex = 0;
                }
                const currentIndexInGroup = siblingsInGroup.findIndex(m => m === msg);
                if (currentIndexInGroup !== -1) {
                    siblingIndex = currentIndexInGroup + 1;
                }
                if (msg.isSelected) {
                    this.appendMessage(msg.role, msg.content, i, false, {
                        currentIndex: siblingIndex,
                        total: siblingsInGroup.length,
                        siblingGroupId: currentSiblingGroupId
                    }, msg.attachments);
                }
            } else {
                currentSiblingGroupId = null;
                siblingsInGroup = [];
                this.appendMessage(msg.role, msg.content, i, false, null, msg.attachments);
            }
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
                if (role === 'model' && !isStreamingPlaceholder && typeof marked !== 'undefined') {
                    contentDiv.innerHTML = marked.parse(content || '');
                } else if (role === 'user') {
                    const pre = document.createElement('pre'); pre.textContent = content; contentDiv.appendChild(pre);
                } else if (role === 'error') {
                     const p = document.createElement('p'); p.textContent = content; contentDiv.appendChild(p);
                } else if (isStreamingPlaceholder) {
                    contentDiv.innerHTML = '';
                } else {
                    const pre = document.createElement('pre'); pre.textContent = content; contentDiv.appendChild(pre);
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
        const editArea = document.createElement('div');
        editArea.classList.add('message-edit-area', 'hidden');
        messageDiv.appendChild(editArea);
        if (role === 'model' && cascadeInfo && cascadeInfo.total > 1) {
            const cascadeControlsDiv = document.createElement('div');
            cascadeControlsDiv.classList.add('message-cascade-controls');
            const prevButton = document.createElement('button');
            prevButton.textContent = '＜';
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
            nextButton.textContent = '＞';
            nextButton.title = '次の応答';
            nextButton.classList.add('cascade-next-btn');
            nextButton.disabled = cascadeInfo.currentIndex >= cascadeInfo.total;
            nextButton.onclick = () => appLogic.navigateCascade(index, 'next');
            cascadeControlsDiv.appendChild(nextButton);
            const deleteCascadeButton = document.createElement('button');
            deleteCascadeButton.textContent = '✕';
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
            editButton.textContent = '編集'; editButton.title = 'メッセージを編集'; editButton.classList.add('js-edit-btn');
            editButton.onclick = () => appLogic.startEditMessage(index, messageDiv);
            actionsDiv.appendChild(editButton);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '削除'; deleteButton.title = 'この会話ターンを削除'; deleteButton.classList.add('js-delete-btn');
            deleteButton.onclick = () => appLogic.deleteMessage(index);
            actionsDiv.appendChild(deleteButton);
            if (role === 'user') {
                const retryButton = document.createElement('button');
                retryButton.textContent = 'リトライ'; retryButton.title = 'このメッセージから再生成'; retryButton.classList.add('js-retry-btn');
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
    updateStreamingMessage(index, newChar, isThoughtSummary = false) {
        const messageDiv = document.getElementById(`streaming-message-${index}`);
        if (messageDiv && typeof marked !== 'undefined') {
            let targetContentDiv;
            let streamContent;
            if (isThoughtSummary) {
                targetContentDiv = messageDiv.querySelector(`#streaming-thought-summary-${index}`);
                streamContent = state.partialThoughtStreamContent;
            } else {
                targetContentDiv = messageDiv.querySelector('.message-content');
                streamContent = state.partialStreamContent;
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
    finalizeStreamingMessage(index) {
        const messageDiv = document.getElementById(`streaming-message-${index}`);
        if (messageDiv) {
            const finalMessageData = state.currentMessages[index];
            if (!finalMessageData) return;
            if (finalMessageData.thoughtSummary) {
                const thoughtContentDiv = messageDiv.querySelector(`#streaming-thought-summary-${index}`);
                if (thoughtContentDiv && typeof marked !== 'undefined') {
                    try {
                        thoughtContentDiv.innerHTML = marked.parse(finalMessageData.thoughtSummary || '');
                    } catch (e) {
                        console.error("Thought Summary ストリーミング完了時のMarkdownパースエラー:", e);
                        thoughtContentDiv.textContent = finalMessageData.thoughtSummary || '';
                    }
                    thoughtContentDiv.removeAttribute('id');
                } else if (thoughtContentDiv) {
                    thoughtContentDiv.textContent = finalMessageData.thoughtSummary || '';
                    thoughtContentDiv.removeAttribute('id');
                }
            }
            const contentDiv = messageDiv.querySelector('.message-content');
            const finalRawContent = finalMessageData.content || '';
            if (contentDiv && typeof marked !== 'undefined') {
                 try {
                     contentDiv.innerHTML = marked.parse(finalRawContent);
                 } catch (e) {
                     console.error("ストリーミング完了時のMarkdownパースエラー:", e);
                     contentDiv.textContent = finalRawContent;
                 }
            } else if (contentDiv) {
                contentDiv.textContent = finalRawContent;
            }
            messageDiv.removeAttribute('id');
            const msgData = state.currentMessages[index];
            if (msgData && msgData.role === 'model' && msgData.isCascaded) {
                const siblings = appLogic.getCascadedSiblings(index);
                if (siblings.length > 1) {
                    this.renderChatMessages();
                }
            }
        }
        this.scrollToBottom();
    },
    displayError(message, isApiError = false) {
        console.error("エラー表示:", message);
        const errorIndex = state.currentMessages.length;
        this.appendMessage('error', `エラー: ${message}`, errorIndex);
        elements.loadingIndicator.classList.add('hidden');
        this.setSendingState(false);
    },
    scrollToBottom() {
        requestAnimationFrame(() => {
            const mainContent = elements.chatScreen.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = mainContent.scrollHeight;
            }
        });
    },
    updateChatTitle(definitiveTitle = null) {
        let titleText = '新規チャット';
        let baseTitle = '';
        let isNewChat = !state.currentChatId;
        if (state.currentChatId) {
            isNewChat = false;
            if (definitiveTitle !== null) {
                baseTitle = definitiveTitle;
            } else {
                const firstUserMessage = state.currentMessages.find(m => m.role === 'user');
                if (firstUserMessage) {
                    baseTitle = firstUserMessage.content;
                } else if (state.currentMessages.length > 0) {
                    baseTitle = "チャット履歴";
                }
            }
            if(baseTitle) {
                const displayBase = baseTitle.startsWith(IMPORT_PREFIX) ? baseTitle.substring(IMPORT_PREFIX.length) : baseTitle;
                const truncated = displayBase.substring(0, CHAT_TITLE_LENGTH);
                titleText = truncated + (displayBase.length > CHAT_TITLE_LENGTH ? '...' : '');
                if (baseTitle.startsWith(IMPORT_PREFIX)) {
                    titleText = IMPORT_PREFIX + titleText;
                }
            } else if(state.currentMessages.length > 0) {
                titleText = 'チャット履歴';
            }
            if (titleText === '新規チャット' && state.currentMessages.length > 0) {
                titleText = 'チャット履歴';
            }
        }
        const displayTitle = isNewChat ? titleText : `: ${titleText}`;
        elements.chatTitle.textContent = displayTitle;
        document.title = `Gemini PWA Mk-II - ${titleText}`;
    },
    formatDate(timestamp) {
        if (!timestamp) return '';
        try {
            return new Intl.DateTimeFormat('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp));
        } catch (e) {
            console.warn("Intl.DateTimeFormatエラー:", e);
            const d = new Date(timestamp);
            return `${String(d.getFullYear()).slice(-2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    },
    async renderHistoryList() {
        try {
            const chats = await dbUtils.getAllChats(state.settings.historySortOrder);
            elements.historyList.querySelectorAll('.history-item:not(.js-history-item-template)').forEach(item => item.remove());
            if (chats && chats.length > 0) {
                elements.noHistoryMessage.classList.add('hidden');
                const sortOrderText = state.settings.historySortOrder === 'createdAt' ? '作成順' : '更新順';
                elements.historyTitle.textContent = `履歴一覧 (${sortOrderText})`;
                chats.forEach(chat => {
                    const li = elements.historyItemTemplate.cloneNode(true);
                    li.classList.remove('js-history-item-template');
                    li.dataset.chatId = chat.id;
                    const titleText = chat.title || `履歴 ${chat.id}`;
                    const titleEl = li.querySelector('.history-item-title');
                    titleEl.textContent = titleText;
                    titleEl.title = titleText;
                    li.querySelector('.created-date').textContent = `作成: ${this.formatDate(chat.createdAt)}`;
                    li.querySelector('.updated-date').textContent = `更新: ${this.formatDate(chat.updatedAt)}`;
                    li.onclick = (event) => {
                        if (!event.target.closest('.history-item-actions button')) {
                            appLogic.loadChat(chat.id);
                            this.showScreen('chat');
                        }
                    };
                    li.querySelector('.js-edit-title-btn').onclick = (e) => { e.stopPropagation(); appLogic.editHistoryTitle(chat.id, titleEl); };
                    li.querySelector('.js-export-btn').onclick = (e) => { e.stopPropagation(); appLogic.exportChat(chat.id, titleText); };
                    li.querySelector('.js-duplicate-btn').onclick = (e) => { e.stopPropagation(); appLogic.duplicateChat(chat.id); };
                    li.querySelector('.js-delete-btn').onclick = (e) => { e.stopPropagation(); appLogic.confirmDeleteChat(chat.id, titleText); };
                    elements.historyList.appendChild(li);
                });
            } else {
                elements.noHistoryMessage.classList.remove('hidden');
                elements.historyTitle.textContent = '履歴一覧';
            }
        } catch (error) {
            console.error("履歴リストのレンダリングエラー:", error);
            elements.noHistoryMessage.textContent = "履歴の読み込み中にエラーが発生しました。";
            elements.noHistoryMessage.classList.remove('hidden');
            elements.historyTitle.textContent = '履歴一覧';
        }
    },
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
        elements.dummyUserInput.value = state.settings.dummyUser || '';
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
        this.updateUserModelOptions();
        this.updateBackgroundSettingsUI();
        this.applyDarkMode();
        this.applyFontFamily();
        this.toggleSystemPromptVisibility();
    },
    updateUserModelOptions() {
        const group = elements.userDefinedModelsGroup;
        group.innerHTML = '';
        const models = (state.settings.additionalModels || '')
            .split(',')
            .map(m => m.trim())
            .filter(m => m !== '');
        if (models.length > 0) {
            group.disabled = false;
            models.forEach(modelId => {
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = modelId;
                group.appendChild(option);
            });
            if (models.includes(state.settings.modelName)) {
                elements.modelNameSelect.value = state.settings.modelName;
            }
        } else {
            group.disabled = true;
        }
    },
    applyDarkMode() {
        const isDark = state.settings.darkMode;
        document.body.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('light-mode-forced', !isDark);
        elements.themeColorMeta.content = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
        console.log(`ダークモード ${isDark ? '有効' : '無効'}. テーマカラー: ${elements.themeColorMeta.content}`);
    },
    applyFontFamily() {
        const customFont = state.settings.fontFamily?.trim();
        const fontFamilyToApply = customFont ? customFont : DEFAULT_FONT_FAMILY;
        document.documentElement.style.setProperty('--font-family', fontFamilyToApply);
        console.log(`フォント適用: ${fontFamilyToApply}`);
    },
    updateSystemPromptUI() {
        elements.systemPromptEditor.value = state.currentSystemPrompt;
        if (!state.isEditingSystemPrompt) {
            elements.systemPromptDetails.removeAttribute('open');
        }
        this.adjustTextareaHeight(elements.systemPromptEditor, 200);
        this.toggleSystemPromptVisibility();
    },
    toggleSystemPromptVisibility() {
        const shouldHide = state.settings.hideSystemPromptInChat;
        elements.systemPromptArea.classList.toggle('hidden', shouldHide);
        console.log(`システムプロンプト表示エリア ${shouldHide ? '非表示' : '表示'}`);
    },
    showScreen(screenName, fromPopState = false) {
        if (state.editingMessageIndex !== null) {
             const messageElement = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
             if (messageElement) {
                appLogic.cancelEditMessage(state.editingMessageIndex, messageElement);
             } else {
                state.editingMessageIndex = null;
             }
        }
        if (state.isEditingSystemPrompt) {
            appLogic.cancelEditSystemPrompt();
        }
        if (screenName === state.currentScreen) {
            return;
        }
        const allScreens = [elements.chatScreen, elements.historyScreen, elements.settingsScreen];
        let activeScreen = null;
        if (!fromPopState) {
            if (screenName === 'history' || screenName === 'settings') {
                history.pushState({ screen: screenName }, '', `#${screenName}`);
                console.log(`Pushed state: ${screenName}`);
            } else if (screenName === 'chat') {
                history.replaceState({ screen: 'chat' }, '', '#chat');
                console.log(`Replaced state: ${screenName}`);
            }
        } else {
            console.log(`showScreen called from popstate for ${screenName}`);
        }
        allScreens.forEach(screen => {
            screen.classList.remove('active');
            screen.inert = true;
        });
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
        requestAnimationFrame(() => {
            allScreens.forEach(screen => {
                screen.style.transition = 'transform 0.3s ease-in-out';
            });
            if (activeScreen) {
                activeScreen.inert = false;
                activeScreen.classList.add('active');
            }
        });
        state.currentScreen = screenName;
        console.log(`Navigated to screen: ${screenName}`);
    },
    setSendingState(sending) {
        state.isSending = sending;
        if (sending) {
            elements.sendButton.textContent = '止';
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
            elements.sendButton.textContent = '送';
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
    adjustTextareaHeight(textarea = elements.userInput, maxHeight = TEXTAREA_MAX_HEIGHT) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        if (textarea === elements.userInput && !state.isSending) {
            elements.sendButton.disabled = textarea.value.trim() === '' && state.pendingAttachments.length === 0;
        }
    },
    showCustomDialog(dialogElement, focusElement) {
        return new Promise((resolve) => {
            const closeListener = () => {
                dialogElement.removeEventListener('close', closeListener);
                resolve(dialogElement.returnValue);
            };
            dialogElement.addEventListener('close', closeListener);
            dialogElement.showModal();
            if (focusElement) {
                requestAnimationFrame(() => { focusElement.focus(); });
            }
        });
    },
    async showCustomAlert(message) {
        elements.alertMessage.textContent = message;
         const newOkBtn = elements.alertOkBtn.cloneNode(true);
         elements.alertOkBtn.parentNode.replaceChild(newOkBtn, elements.alertOkBtn);
         elements.alertOkBtn = newOkBtn;
        elements.alertOkBtn.onclick = () => elements.alertDialog.close('ok');
        await this.showCustomDialog(elements.alertDialog, elements.alertOkBtn);
    },
    async showCustomConfirm(message) {
        elements.confirmMessage.textContent = message;
         const newOkBtn = elements.confirmOkBtn.cloneNode(true);
         elements.confirmOkBtn.parentNode.replaceChild(newOkBtn, elements.confirmOkBtn);
         elements.confirmOkBtn = newOkBtn;
         const newCancelBtn = elements.confirmCancelBtn.cloneNode(true);
         elements.confirmCancelBtn.parentNode.replaceChild(newCancelBtn, elements.confirmCancelBtn);
         elements.confirmCancelBtn = newCancelBtn;
        elements.confirmOkBtn.onclick = () => elements.confirmDialog.close('ok');
        elements.confirmCancelBtn.onclick = () => elements.confirmDialog.close('cancel');
        const result = await this.showCustomDialog(elements.confirmDialog, elements.confirmOkBtn);
        return result === 'ok';
    },
    async showCustomPrompt(message, defaultValue = '') {
        elements.promptMessage.textContent = message;
        elements.promptInput.value = defaultValue;
         const newOkBtn = elements.promptOkBtn.cloneNode(true);
         elements.promptOkBtn.parentNode.replaceChild(newOkBtn, elements.promptOkBtn);
         elements.promptOkBtn = newOkBtn;
         const newCancelBtn = elements.promptCancelBtn.cloneNode(true);
         elements.promptCancelBtn.parentNode.replaceChild(newCancelBtn, elements.promptCancelBtn);
         elements.promptCancelBtn = newCancelBtn;
         const newPromptInput = elements.promptInput.cloneNode(true);
         elements.promptInput.parentNode.replaceChild(newPromptInput, elements.promptInput);
         elements.promptInput = newPromptInput;
        const enterHandler = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                elements.promptOkBtn.click();
            }
        };
        elements.promptInput.addEventListener('keypress', enterHandler);
        elements.promptOkBtn.onclick = () => elements.promptDialog.close(elements.promptInput.value);
        elements.promptCancelBtn.onclick = () => elements.promptDialog.close('');
        const closeHandler = () => {
            elements.promptInput.removeEventListener('keypress', enterHandler);
            elements.promptDialog.removeEventListener('close', closeHandler);
        };
         elements.promptDialog.addEventListener('close', closeHandler);
        const result = await this.showCustomDialog(elements.promptDialog, elements.promptInput);
        return result;
    },
    updateAttachmentBadgeVisibility() {
        const hasAttachments = state.pendingAttachments.length > 0;
        elements.attachFileBtn.classList.toggle('has-attachments', hasAttachments);
    },
    showFileUploadDialog() {
        if (state.pendingAttachments.length > 0) {
            state.selectedFilesForUpload = state.pendingAttachments.map(att => ({ file: att.file }));
            console.log("送信待ちの添付ファイルをダイアログに復元:", state.selectedFilesForUpload.map(item => item.file.name));
        } else {
            state.selectedFilesForUpload = [];
        }
        this.updateSelectedFilesUI();
        elements.fileUploadDialog.showModal();
        this.updateAttachmentBadgeVisibility();
    },
    updateSelectedFilesUI() {
        elements.selectedFilesList.innerHTML = '';
        let totalSize = 0;
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
            sizeSpan.textContent = formatFileSize(item.file.size);
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
        const hasFiles = state.selectedFilesForUpload.length > 0;
        const isOverSize = totalSize > MAX_TOTAL_ATTACHMENT_SIZE;
        elements.confirmAttachBtn.disabled = !hasFiles || isOverSize;
        if (isOverSize) {
            console.warn(`合計ファイルサイズが上限を超えています: ${formatFileSize(totalSize)}`);
        }
    },
};

// --- アプリケーションロジック (appLogic) ---
const appLogic = {
    initializeApp() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({ breaks: true, gfm: true, sanitize: true, smartypants: false });
            console.log("Marked.js設定完了");
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
        dbUtils.openDB().then(() => {
            return dbUtils.loadSettings();
        }).then(() => {
            this.updateCurrentSystemPrompt();
            uiUtils.applyDarkMode();
            uiUtils.applyFontFamily();
            if (state.settings.backgroundImageBlob instanceof Blob) {
                uiUtils.revokeExistingObjectUrl();
                try {
                     state.backgroundImageUrl = URL.createObjectURL(state.settings.backgroundImageBlob);
                     document.documentElement.style.setProperty('--chat-background-image', `url(${state.backgroundImageUrl})`);
                     console.log("読み込んだBlobから背景画像を適用しました。");
                } catch (e) {
                     console.error("背景画像のオブジェクトURL作成エラー:", e);
                     document.documentElement.style.setProperty('--chat-background-image', 'none');
                }
            } else {
                document.documentElement.style.setProperty('--chat-background-image', 'none');
            }
            uiUtils.applySettingsToUI();
            return dbUtils.getAllChats(state.settings.historySortOrder);
        }).then(chats => {
            if (chats && chats.length > 0) {
                return this.loadChat(chats[0].id);
            } else {
                this.startNewChat();
            }
        }).then(() => {
            history.replaceState({ screen: 'chat' }, '', '#chat');
            state.currentScreen = 'chat';
            console.log("Initial history state set to #chat");
        }).catch(error => {
            console.error("初期化失敗:", error);
            uiUtils.showCustomAlert(`アプリの初期化に失敗しました: ${error}`);
            elements.appContainer.innerHTML = `<p style="padding: 20px; text-align: center; color: red;">アプリの起動に失敗しました。</p>`;
        }).finally(() => {
            updateMessageMaxWidthVar();
            this.setupEventListeners();
            this.updateZoomState();
            uiUtils.adjustTextareaHeight();
            uiUtils.setSendingState(false);
            uiUtils.scrollToBottom();
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
    },
    setupEventListeners() {
        elements.gotoHistoryBtn.addEventListener('click', () => uiUtils.showScreen('history'));
        elements.gotoSettingsBtn.addEventListener('click', () => uiUtils.showScreen('settings'));
        elements.backToChatFromHistoryBtn.addEventListener('click', () => history.back());
        elements.backToChatFromSettingsBtn.addEventListener('click', () => history.back());
        elements.newChatBtn.addEventListener('click', async () => {
            const confirmed = await uiUtils.showCustomConfirm("現在のチャットを保存して新規チャットを開始しますか？");
            if (confirmed) this.confirmStartNewChat();
        });
        elements.sendButton.addEventListener('click', () => {
            if (state.isSending) this.abortRequest();
            else this.handleSend();
        });
        elements.userInput.addEventListener('input', () => uiUtils.adjustTextareaHeight());
        elements.userInput.addEventListener('keypress', (e) => {
            if (state.settings.enterToSend && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!elements.sendButton.disabled) this.handleSend();
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
        elements.saveSettingsBtns.forEach(button => {
            button.addEventListener('click', () => this.saveSettings());
        });
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
        elements.hideSystemPromptToggle.addEventListener('change', () => {
            state.settings.hideSystemPromptInChat = elements.hideSystemPromptToggle.checked;
            uiUtils.toggleSystemPromptVisibility();
        });
        elements.messageContainer.addEventListener('click', (event) => {
            const clickedMessage = event.target.closest('.message');
            if (event.target.closest('.message-actions button, .message-cascade-controls button')) {
                return;
            }
            if (clickedMessage) {
                const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                if (currentlyShown && currentlyShown !== clickedMessage) {
                    currentlyShown.classList.remove('show-actions');
                }
                if (!clickedMessage.classList.contains('editing')) {
                    clickedMessage.classList.toggle('show-actions');
                }
            } else {
                const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                if (currentlyShown) {
                    currentlyShown.classList.remove('show-actions');
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
    },
    handlePopState(event) {
        const targetScreen = event.state?.screen || 'chat';
        console.log(`popstate event fired: Navigating to screen '${targetScreen}' from history state.`);
        uiUtils.showScreen(targetScreen, true);
    },
    updateZoomState() {
        if ('visualViewport' in window) {
            const newZoomState = window.visualViewport.scale > ZOOM_THRESHOLD;
            if (state.isZoomed !== newZoomState) {
                state.isZoomed = newZoomState;
                console.log(`Zoom state updated: ${state.isZoomed}`);
                document.body.classList.toggle('zoomed', state.isZoomed);
            }
        }
    },
    handleTouchStart(event) {
        if (!state.settings.enableSwipeNavigation) return;
        if (event.touches.length > 1 || state.isZoomed) {
            state.touchStartX = 0;
            state.touchStartY = 0;
            state.isSwiping = false;
            return;
        }
        state.touchStartX = event.touches[0].clientX;
        state.touchStartY = event.touches[0].clientY;
        state.isSwiping = false;
        state.touchEndX = state.touchStartX;
        state.touchEndY = state.touchStartY;
    },
    handleTouchMove(event) {
        if (!state.settings.enableSwipeNavigation) return;
        if (!state.touchStartX || event.touches.length > 1 || state.isZoomed) {
            return;
        }
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const diffX = state.touchStartX - currentX;
        const diffY = state.touchStartY - currentY;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            state.isSwiping = true;
            event.preventDefault();
        } else {
            state.isSwiping = false;
        }
        state.touchEndX = currentX;
        state.touchEndY = currentY;
    },
    handleTouchEnd(event) {
         if (!state.settings.enableSwipeNavigation) {
             this.resetSwipeState();
             return;
         }
         this.updateZoomState();
         if (state.isZoomed) {
             console.log("Zoomed state detected on touchend, skipping swipe navigation.");
             this.resetSwipeState();
             return;
         }
         if (!state.isSwiping || !state.touchStartX) {
             this.resetSwipeState();
             return;
         }
        const diffX = state.touchStartX - state.touchEndX;
        const diffY = state.touchStartY - state.touchEndY;
        if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                console.log("左スワイプ検出 -> 設定画面へ");
                uiUtils.showScreen('settings');
            } else {
                console.log("右スワイプ検出 -> 履歴画面へ");
                uiUtils.showScreen('history');
            }
        } else {
            console.log("スワイプ距離不足 or 縦移動大");
        }
        this.resetSwipeState();
    },
    resetSwipeState() {
        state.touchStartX = 0;
        state.touchStartY = 0;
        state.touchEndX = 0;
        state.touchEndY = 0;
        state.isSwiping = false;
    },
    async confirmStartNewChat() {
        if (state.isSending) {
            const confirmed = await uiUtils.showCustomConfirm("送信中です。中断して新規チャットを開始しますか？");
            if (!confirmed) return;
            this.abortRequest();
        }
        if (state.editingMessageIndex !== null) {
            const confirmed = await uiUtils.showCustomConfirm("編集中です。変更を破棄して新規チャットを開始しますか？");
            if (!confirmed) return;
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl);
        }
        if (state.isEditingSystemPrompt) {
            const confirmed = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄して新規チャットを開始しますか？");
            if (!confirmed) return;
            this.cancelEditSystemPrompt();
        }
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して新規チャットを開始しますか？");
            if (!confirmedAttach) return;
            state.pendingAttachments = [];
            uiUtils.updateAttachmentBadgeVisibility();
        }
        if ((state.currentMessages.length > 0 || state.currentSystemPrompt) && state.currentChatId) {
            try {
                await dbUtils.saveChat();
            } catch (error) {
                console.error("新規チャット開始前のチャット保存失敗:", error);
                const conf = await uiUtils.showCustomConfirm("現在のチャットの保存に失敗しました。新規チャットを開始しますか？");
                if (!conf) return;
            }
        }
        this.startNewChat();
        uiUtils.showScreen('chat');
    },
    startNewChat() {
        state.currentChatId = null;
        state.currentMessages = [];
        state.currentSystemPrompt = state.settings.systemPrompt;
        state.pendingAttachments = [];
        state.currentPersistentMemory = {};
        uiUtils.updateSystemPromptUI();
        uiUtils.renderChatMessages();
        uiUtils.updateChatTitle();
        elements.userInput.value = '';
        uiUtils.adjustTextareaHeight();
        uiUtils.setSendingState(false);
    },
    async loadChat(id) {
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
            const chat = await dbUtils.getChat(id);
            if (chat) {
                state.currentChatId = chat.id;
                state.currentMessages = chat.messages?.map(msg => ({ ...msg, attachments: msg.attachments || [] })) || [];
                state.currentPersistentMemory = chat.persistentMemory || {};
                console.log(`チャット ${id} の永続メモリを読み込みました:`, state.currentPersistentMemory);
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
    async duplicateChat(id) {
        if (state.isSending) { const conf = await uiUtils.showCustomConfirm("送信中です。中断してチャットを複製しますか？"); if (!conf) return; this.abortRequest(); }
        if (state.editingMessageIndex !== null) { const conf = await uiUtils.showCustomConfirm("編集中です。変更を破棄してチャットを複製しますか？"); if (!conf) return; const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`); this.cancelEditMessage(state.editingMessageIndex, msgEl); }
        if (state.isEditingSystemPrompt) { const conf = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄してチャットを複製しますか？"); if (!conf) return; this.cancelEditSystemPrompt(); }
        if ((state.currentMessages.length > 0 || state.currentSystemPrompt) && state.currentChatId && state.currentChatId !== id) { try { await dbUtils.saveChat(); } catch (error) { console.error("複製前の現チャット保存失敗:", error); const conf = await uiUtils.showCustomConfirm("現在のチャット保存に失敗しました。複製を続行しますか？"); if (!conf) return; } }
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄してチャットを複製しますか？");
            if (!confirmedAttach) return;
            state.pendingAttachments = [];
        }
        try {
            const chat = await dbUtils.getChat(id);
            if (chat) {
                const originalTitle = chat.title || "無題のチャット";
                const newTitle = originalTitle.replace(new RegExp(DUPLICATE_SUFFIX.replace(/([().])/g, '\\$1') + '$'), '').trim() + DUPLICATE_SUFFIX;
                const duplicatedMessages = [];
                const groupIdMap = new Map();
                (chat.messages || []).forEach(msg => {
                    const newMsg = JSON.parse(JSON.stringify(msg));
                    newMsg.attachments = msg.attachments ? JSON.parse(JSON.stringify(msg.attachments)) : [];
                    newMsg.isCascaded = msg.isCascaded ?? false;
                    newMsg.isSelected = msg.isSelected ?? false;
                    if (msg.siblingGroupId) {
                        if (!groupIdMap.has(msg.siblingGroupId)) {
                            groupIdMap.set(msg.siblingGroupId, `dup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
                        }
                        newMsg.siblingGroupId = groupIdMap.get(msg.siblingGroupId);
                    } else {
                        delete newMsg.siblingGroupId;
                    }
                    duplicatedMessages.push(newMsg);
                });
                const newGroupIds = new Set(duplicatedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                newGroupIds.forEach(gid => {
                    const siblings = duplicatedMessages.filter(m => m.siblingGroupId === gid);
                    siblings.forEach((m, idx) => {
                        m.isSelected = (idx === siblings.length - 1);
                    });
                });
                const newChatData = {
                    messages: duplicatedMessages,
                    systemPrompt: chat.systemPrompt || '',
                    persistentMemory: JSON.parse(JSON.stringify(chat.persistentMemory || {})),
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
                    title: newTitle
                };
                const newChatId = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                    const request = store.add(newChatData);
                    request.onsuccess = (event) => resolve(event.target.result);
                    request.onerror = (event) => reject(event.target.error);
                });
                console.log("チャット複製完了:", id, "->", newChatId);
                if (state.currentScreen === 'history') {
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
    async exportChat(chatId, chatTitle) {
         const confirmed = await uiUtils.showCustomConfirm(`チャット「${chatTitle || 'この履歴'}」をテキスト出力しますか？`);
         if (!confirmed) return;
         try {
             const chat = await dbUtils.getChat(chatId);
             if (!chat || ((!chat.messages || chat.messages.length === 0) && !chat.systemPrompt)) {
                 await uiUtils.showCustomAlert("チャットデータが空です。");
                 return;
             }
             let exportText = '';
             if (chat.systemPrompt) {
                 exportText += `<|#|system|#|>\n${chat.systemPrompt}\n<|#|/system|#|>\n\n`;
             }
             if (chat.messages) {
                 chat.messages.forEach(msg => {
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
             const safeTitle = (chatTitle || `chat_${chatId}_export`).replace(/[<>:"/\\|?*\s]/g, '_');
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
    async confirmDeleteChat(id, title) {
         const confirmed = await uiUtils.showCustomConfirm(`「${title || 'この履歴'}」を削除しますか？`);
         if (confirmed) {
            const isDeletingCurrent = state.currentChatId === id;
            const currentScreenBeforeDelete = state.currentScreen;
            try {
                await dbUtils.deleteChat(id);
                console.log("チャット削除:", id);
                if (isDeletingCurrent) {
                    console.log("表示中のチャットが削除されたため、内部状態を新規チャットにリセット。");
                    this.startNewChat();
                }
                if (currentScreenBeforeDelete === 'history') {
                    console.log("履歴画面での操作のため、リストUIを更新します。");
                    await uiUtils.renderHistoryList();
                    const listIsEmpty = elements.historyList.querySelectorAll('.history-item:not(.js-history-item-template)').length === 0;
                    if (listIsEmpty) {
                        console.log("履歴リストが空になりました。");
                        if (!isDeletingCurrent) {
                            this.startNewChat();
                        }
                    }
                }
            } catch (error) {
                await uiUtils.showCustomAlert(`チャット削除エラー: ${error}`);
                uiUtils.setSendingState(false);
            }
        }
    },
    async editHistoryTitle(chatId, titleElement) {
        const currentTitle = titleElement.textContent;
        const newTitle = await uiUtils.showCustomPrompt("新しいタイトル:", currentTitle);
        const trimmedTitle = (newTitle !== null) ? newTitle.trim() : '';
        if (newTitle !== '' && trimmedTitle !== '' && trimmedTitle !== currentTitle) {
            const finalTitle = trimmedTitle.substring(0, 100);
            try {
                await dbUtils.updateChatTitleDb(chatId, finalTitle);
                titleElement.textContent = finalTitle;
                titleElement.title = finalTitle;
                const dateElement = titleElement.closest('.history-item')?.querySelector('.updated-date');
                if(dateElement) dateElement.textContent = `更新: ${uiUtils.formatDate(Date.now())}`;
                if (state.currentChatId === chatId) {
                    uiUtils.updateChatTitle(finalTitle);
                }
            } catch (error) {
                await uiUtils.showCustomAlert(`タイトル更新エラー: ${error}`);
            }
        } else {
            console.log("タイトル編集キャンセルまたは変更なし");
        }
    },
    async proofreadText(textToProofread) {
        console.log("--- 校正処理開始 ---");
        const { proofreadingModelName, proofreadingSystemInstruction, apiKey, temperature, maxTokens, topK, topP, enableAutoRetry, maxRetries } = state.settings;
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
        console.log("校正APIへの送信データ:", JSON.stringify(requestBody, null, 2));
        let lastError = null;
        const maxProofreadRetries = enableAutoRetry ? maxRetries : 0;
        for (let attempt = 0; attempt <= maxProofreadRetries; attempt++) {
            try {
                if (state.abortController?.signal.aborted) {
                    throw new Error("リクエストがキャンセルされました。");
                }
                if (attempt > 0) {
                    const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                    uiUtils.setLoadingIndicatorText(`校正を再試行中 (${attempt}回目)... ${delay}ms待機`);
                    console.log(`校正APIリトライ ${attempt}: ${delay}ms待機...`);
                    await interruptibleSleep(delay, state.abortController.signal);
                } else {
                    uiUtils.setLoadingIndicatorText('校正中...');
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
    async handleSend(isRetry = false, retryUserMessageIndex = -1) {
        console.log("--- handleSend: 処理開始 ---", { isRetry, retryUserMessageIndex });
        if (state.isSending) { console.warn("handleSend: 既に送信中のため処理を中断"); return; }
        if (state.editingMessageIndex !== null) { await uiUtils.showCustomAlert("他のメッセージを編集中です。"); return; }
        if (state.isEditingSystemPrompt) { await uiUtils.showCustomAlert("システムプロンプトを編集中です。"); return; }
        uiUtils.setSendingState(true);
        try {
            if (!isRetry) {
                const text = elements.userInput.value.trim();
                const attachmentsToSend = [...state.pendingAttachments];
                if (!text && attachmentsToSend.length === 0) {
                    uiUtils.setSendingState(false);
                    return;
                }
                const userMessage = { role: 'user', content: text, timestamp: Date.now(), attachments: attachmentsToSend };
                state.currentMessages.push(userMessage);
                uiUtils.appendMessage(userMessage.role, userMessage.content, state.currentMessages.length - 1, false, null, userMessage.attachments);
                elements.userInput.value = '';
                state.pendingAttachments = [];
                uiUtils.updateAttachmentBadgeVisibility();
                uiUtils.adjustTextareaHeight();
                uiUtils.scrollToBottom();
            }
            await dbUtils.saveChat();
            let loopCount = 0;
            const MAX_LOOPS = 10;
            while (loopCount < MAX_LOOPS) {
                loopCount++;
                uiUtils.setLoadingIndicatorText('応答中...');
                const messagesForApi = state.currentMessages.map(msg => {
                    const parts = [];
                    if (msg.content && msg.content.trim() !== '') parts.push({ text: msg.content });
                    if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                        msg.attachments.forEach(att => parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64Data } }));
                    }
                    if (msg.role === 'model' && msg.tool_calls) {
                        msg.tool_calls.forEach(toolCall => parts.push({ functionCall: toolCall.functionCall }));
                    }
                    if (msg.role === 'tool') {
                        parts.push({ functionResponse: { name: msg.name, response: msg.response } });
                    }
                    return { role: msg.role === 'tool' ? 'tool' : (msg.role === 'model' ? 'model' : 'user'), parts };
                }).filter(c => c.parts.length > 0 && (c.role === 'user' || c.role === 'model' || c.role === 'tool'));
                const generationConfig = {};
                if (state.settings.temperature !== null) generationConfig.temperature = state.settings.temperature;
                if (state.settings.maxTokens !== null) generationConfig.maxOutputTokens = state.settings.maxTokens;
                if (state.settings.topK !== null) generationConfig.topK = state.settings.topK;
                if (state.settings.topP !== null) generationConfig.topP = state.settings.topP;
                const systemInstruction = state.currentSystemPrompt?.trim() ? { role: "system", parts: [{ text: state.currentSystemPrompt.trim() }] } : null;
                
                // ▼▼▼【ここから修正】▼▼▼
                let response;
                let retryCount = 0;
                let lastError = null;
                const maxRetries = state.settings.enableAutoRetry ? state.settings.maxRetries : 0;

                for (let attempt = 0; attempt <= maxRetries; attempt++) {
                    try {
                        if (state.abortController?.signal.aborted) {
                            throw new Error("リクエストがキャンセルされました。");
                        }
                        if (attempt > 0) {
                            const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                            uiUtils.setLoadingIndicatorText(`APIエラー 再試行(${attempt}回目)... ${delay}ms待機`);
                            console.log(`API呼び出し失敗。${delay}ms後にリトライします... (試行 ${attempt + 1}/${maxRetries + 1})`);
                            await interruptibleSleep(delay, state.abortController.signal);
                            uiUtils.setLoadingIndicatorText('応答中...');
                        }
                        response = await apiUtils.callGeminiApi(messagesForApi, generationConfig, systemInstruction, window.functionDeclarations);
                        retryCount = attempt;
                        lastError = null;
                        break;
                    } catch (error) {
                        lastError = error;
                        if (error.name === 'AbortError') {
                            console.error("待機中に中断されました。リトライを中止します。", error);
                            throw error;
                        }
                        if (error.status && error.status >= 400 && error.status < 500) {
                            console.error(`リトライ不可のエラー (ステータス: ${error.status})。リトライを中止します。`, error);
                            throw error;
                        }
                        console.warn(`API呼び出し/処理試行 ${attempt + 1} が失敗しました。`, error);
                    }
                }
                if (lastError) {
                    throw lastError;
                }
                // ▲▲▲【ここまで修正】▲▲▲

                const useStreaming = state.settings.streamingOutput;
                if (useStreaming) {
                    let fullContent = '';
                    let fullThoughtSummary = '';
                    let toolCalls = null;
                    let modelResponseMetadata = {};
                    const modelMessageIndex = state.currentMessages.length;
                    state.currentMessages.push({ role: 'model', content: '', timestamp: Date.now(), retryCount });
                    uiUtils.appendMessage('model', '', modelMessageIndex, true);
                    for await (const chunk of apiUtils.handleStreamingResponse(response)) {
                        if (chunk.type === 'chunk') {
                            if (chunk.contentText) {
                                state.partialStreamContent += chunk.contentText;
                                uiUtils.updateStreamingMessage(modelMessageIndex, null);
                            }
                            if (chunk.thoughtText) {
                                state.partialThoughtStreamContent += chunk.thoughtText;
                                uiUtils.updateStreamingMessage(modelMessageIndex, null, true);
                            }
                            if (chunk.toolCalls) {
                                if (!toolCalls) toolCalls = [];
                                toolCalls.push(...chunk.toolCalls);
                            }
                        } else if (chunk.type === 'metadata') {
                            modelResponseMetadata = chunk;
                        } else if (chunk.type === 'error') {
                            throw new Error(chunk.message || 'ストリーム内でエラーが発生しました');
                        }
                    }
                    fullContent = state.partialStreamContent;
                    fullThoughtSummary = state.partialThoughtStreamContent;
                    state.partialStreamContent = '';
                    state.partialThoughtStreamContent = '';
                    const finalMessage = state.currentMessages[modelMessageIndex];
                    finalMessage.content = fullContent;
                    finalMessage.thoughtSummary = fullThoughtSummary;
                    Object.assign(finalMessage, modelResponseMetadata);
                    if (toolCalls && toolCalls.length > 0) {
                        finalMessage.tool_calls = toolCalls;
                    }
                    uiUtils.finalizeStreamingMessage(modelMessageIndex);
                    await dbUtils.saveChat();
                    if (toolCalls && toolCalls.length > 0) {
                        uiUtils.setLoadingIndicatorText('関数実行中...');
                        const toolResults = await this.executeToolCalls(toolCalls);
                        state.currentMessages.push(...toolResults);
                        await dbUtils.saveChat();
                        uiUtils.renderChatMessages();
                        uiUtils.scrollToBottom();
                        continue;
                    }
                    break;
                } else {
                    const responseData = await response.json();
                    if (!responseData.candidates || responseData.candidates.length === 0) {
                        if (responseData.promptFeedback) {
                            const blockReason = responseData.promptFeedback.blockReason || 'SAFETY';
                            throw new Error(`APIが応答をブロックしました (理由: ${blockReason})`);
                        }
                        throw new Error("API応答に有効な候補が含まれていません。");
                    }
                    const candidate = responseData.candidates[0];
                    const parts = candidate.content?.parts || [];
                    const textPart = parts.find(p => p.text);
                    const toolCallParts = parts.filter(p => p.functionCall);
                    if (toolCallParts.length > 0) {
                        const modelMessageWithToolCall = {
                            role: 'model',
                            content: textPart?.text || '',
                            tool_calls: toolCallParts,
                            timestamp: Date.now()
                        };
                        state.currentMessages.push(modelMessageWithToolCall);
                        await dbUtils.saveChat();
                        uiUtils.renderChatMessages();
                        uiUtils.setLoadingIndicatorText('関数実行中...');
                        const toolResults = await this.executeToolCalls(toolCallParts);
                        state.currentMessages.push(...toolResults);
                        await dbUtils.saveChat();
                        uiUtils.renderChatMessages();
                        uiUtils.scrollToBottom();
                        continue;
                    } else {
                        const finalContent = textPart?.text || '';
                        const modelResponseMetadata = {
                            finishReason: candidate.finishReason,
                            safetyRatings: candidate.safetyRatings,
                            usageMetadata: responseData.usageMetadata
                        };
                        const newMessageData = {
                            role: 'model',
                            content: finalContent,
                            timestamp: Date.now(),
                            ...modelResponseMetadata,
                            retryCount
                        };
                        state.currentMessages.push(newMessageData);
                        await dbUtils.saveChat();
                        uiUtils.renderChatMessages();
                        break;
                    }
                }
            }
        } catch(error) {
            console.error("--- handleSend: 最終catchブロックでエラー捕捉 ---", error);
            if (error.name !== 'AbortError') {
                const errorMessage = error.message || "不明なエラーが発生しました。";
                uiUtils.displayError(errorMessage, true);
                state.currentMessages.push({ role: 'error', content: errorMessage, timestamp: Date.now() });
                await dbUtils.saveChat();
            } else {
                console.log("--- handleSend: リクエストが正常にキャンセルされました。---");
            }
        } finally {
            console.log("--- handleSend: finallyブロック実行。送信状態を解除します。 ---");
            uiUtils.setSendingState(false);
            state.abortController = null;
            state.partialStreamContent = '';
            state.partialThoughtStreamContent = '';
            elements.messageContainer.querySelectorAll('.retrying-hidden').forEach(el => {
                el.classList.remove('retrying-hidden');
            });
            uiUtils.scrollToBottom();
        }
    },
    abortRequest() {
        if (state.abortController) {
            console.log("中断リクエスト送信");
            state.abortController.abort();
        } else {
            console.log("中断するアクティブなリクエストがありません。");
        }
    },
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
                const { messages: importedMessages, systemPrompt: importedSystemPrompt } = this.parseImportedHistory(textContent);
                if (importedMessages.length === 0 && !importedSystemPrompt) {
                    await uiUtils.showCustomAlert("ファイルから有効なメッセージまたはシステムプロンプトを読み込めませんでした。形式を確認してください。");
                    return;
                }
                let currentGroupId = null;
                let lastUserIndex = -1;
                for (let i = 0; i < importedMessages.length; i++) {
                    const msg = importedMessages[i];
                    if (msg.role === 'user') {
                        lastUserIndex = i;
                        currentGroupId = null;
                    } else if (msg.role === 'model' && msg.isCascaded) {
                        if (currentGroupId === null && lastUserIndex !== -1) {
                            currentGroupId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                        }
                        if (currentGroupId) {
                            msg.siblingGroupId = currentGroupId;
                        }
                    } else {
                        currentGroupId = null;
                    }
                }
                const groupIds = new Set(importedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                groupIds.forEach(gid => {
                    const siblings = importedMessages.filter(m => m.siblingGroupId === gid);
                    const selected = siblings.filter(m => m.isSelected);
                    if (selected.length === 0 && siblings.length > 0) {
                        siblings[siblings.length - 1].isSelected = true;
                    } else if (selected.length > 1) {
                        selected.slice(0, -1).forEach(m => m.isSelected = false);
                    }
                });
                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                const newTitle = IMPORT_PREFIX + (fileNameWithoutExt || `Imported_${Date.now()}`);
                const newChatData = {
                    messages: importedMessages,
                    systemPrompt: importedSystemPrompt || '',
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
                    title: newTitle.substring(0, 100)
                };
                const newChatId = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                    const request = store.add(newChatData);
                    request.onsuccess = (event) => resolve(event.target.result);
                    request.onerror = (event) => reject(event.target.error);
                });
                console.log("履歴インポート成功:", newChatId);
                await uiUtils.showCustomAlert(`履歴「${newChatData.title}」をインポートしました。`);
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
        reader.readAsText(file);
    },
    parseImportedHistory(text) {
        const messages = [];
        let systemPrompt = '';
        const blockRegex = /<\|#\|(system|user|model)\|#\|([^>]*)>([\s\S]*?)<\|#\|\/\1\|#\|>/g;
        let match;
        while ((match = blockRegex.exec(text)) !== null) {
            const role = match[1];
            const attributesString = match[2].trim();
            const content = match[3].trim();
            if (role === 'system' && content) {
                systemPrompt = content;
            } else if ((role === 'user' || role === 'model') && (content || attributesString.includes('attachments'))) {
                const messageData = {
                    role: role,
                    content: content,
                    timestamp: Date.now(),
                    attachments: []
                };
                const attributes = {};
                attributesString.split(/\s+/).forEach(attr => {
                    const eqIndex = attr.indexOf('=');
                    if (eqIndex > 0) {
                        const key = attr.substring(0, eqIndex);
                        let value = attr.substring(eqIndex + 1);
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length - 1);
                        }
                        attributes[key] = value.replace(/&quot;/g, '"');
                    } else if (attr) {
                        attributes[attr] = true;
                    }
                });
                if (role === 'model') {
                    messageData.isCascaded = attributes['isCascaded'] === true;
                    messageData.isSelected = attributes['isSelected'] === true;
                }
                if (role === 'user' && attributes['attachments']) {
                    const fileNames = attributes['attachments'].split(';');
                    messageData.attachments = fileNames.map(name => ({
                        name: name,
                        mimeType: 'unknown/unknown',
                        base64Data: ''
                    }));
                }
                messages.push(messageData);
            }
        }
        console.log(`インポートテキストから ${messages.length} 件のメッセージとシステムプロンプト(${systemPrompt ? 'あり' : 'なし'})をパースしました。`);
        return { messages, systemPrompt };
    },
     async handleBackgroundImageUpload(file) {
         console.log("選択されたファイル:", file.name, file.type, file.size);
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
             uiUtils.revokeExistingObjectUrl();
             const blob = file;
             await dbUtils.saveSetting('backgroundImageBlob', blob);
             state.settings.backgroundImageBlob = blob;
             state.backgroundImageUrl = URL.createObjectURL(blob);
             document.documentElement.style.setProperty('--chat-background-image', `url(${state.backgroundImageUrl})`);
             uiUtils.updateBackgroundSettingsUI();
             console.log("背景画像を更新しました。");
         } catch (error) {
             console.error("背景画像アップロード処理エラー:", error);
             await uiUtils.showCustomAlert(`背景画像の処理中にエラーが発生しました: ${error}`);
             uiUtils.revokeExistingObjectUrl();
             document.documentElement.style.setProperty('--chat-background-image', 'none');
             state.settings.backgroundImageBlob = null;
             uiUtils.updateBackgroundSettingsUI();
         }
     },
     async confirmDeleteBackgroundImage() {
         const confirmed = await uiUtils.showCustomConfirm("背景画像を削除しますか？");
         if (confirmed) {
             await this.handleBackgroundImageDelete();
         }
     },
     async handleBackgroundImageDelete() {
         try {
             uiUtils.revokeExistingObjectUrl();
             await dbUtils.saveSetting('backgroundImageBlob', null);
             state.settings.backgroundImageBlob = null;
             document.documentElement.style.setProperty('--chat-background-image', 'none');
             uiUtils.updateBackgroundSettingsUI();
             console.log("背景画像を削除しました。");
         } catch (error) {
             console.error("背景画像削除エラー:", error);
             await uiUtils.showCustomAlert(`背景画像の削除中にエラーが発生しました: ${error}`);
         }
     },
    async saveSettings() {
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
            dummyUser: elements.dummyUserInput.value.trim(),
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
            enableProofreading: elements.enableProofreadingCheckbox.checked,
            proofreadingModelName: elements.proofreadingModelNameSelect.value,
            proofreadingSystemInstruction: elements.proofreadingSystemInstructionTextarea.value.trim(),
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
            this.updateCurrentSystemPrompt();
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
                registration.active.postMessage({ action: 'clearCache' });
                navigator.serviceWorker.addEventListener('message', function handler(event) {
                    if (event.data && event.data.action === 'cacheCleared') {
                        navigator.serviceWorker.removeEventListener('message', handler);
                        window.location.reload();
                    }
                });
                setTimeout(() => {
                    console.warn("Service Workerからの応答がタイムアウトしました。強制的にリロードします。");
                    window.location.reload();
                }, 5000);
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
    async confirmClearAllData() {
        const confirmed = await uiUtils.showCustomConfirm("本当にすべてのデータ（チャット履歴と設定）を削除しますか？この操作は元に戻せません。");
        if (confirmed) {
            try {
                uiUtils.revokeExistingObjectUrl();
                await dbUtils.clearAllData();
                await uiUtils.showCustomAlert("すべてのデータが削除されました。アプリをリセットします。");
                state.currentChatId = null;
                state.currentMessages = [];
                state.currentSystemPrompt = '';
                state.pendingAttachments = [];
                state.settings = {
                    apiKey: '', modelName: DEFAULT_MODEL, streamingOutput: true, streamingSpeed: DEFAULT_STREAMING_SPEED,
                    systemPrompt: '', temperature: null, maxTokens: null, topK: null, topP: null, presencePenalty: null,
                    frequencyPenalty: null, thinkingBudget: null, dummyUser: '', dummyModel: '', concatDummyModel: false,
                    additionalModels: '', pseudoStreaming: false, enterToSend: true, historySortOrder: 'updatedAt',
                    darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
                    backgroundImageBlob: null, fontFamily: '', hideSystemPromptInChat: false, enableSwipeNavigation: true,
                };
                state.backgroundImageUrl = null;
                document.documentElement.style.setProperty('--chat-background-image', 'none');
                uiUtils.applySettingsToUI();
                uiUtils.updateAttachmentBadgeVisibility();
                this.startNewChat();
                uiUtils.showScreen('chat', true);
            } catch (error) {
                await uiUtils.showCustomAlert(`データ削除中にエラーが発生しました: ${error}`);
            }
        }
    },
    async executeToolCalls(toolCalls) {
        const results = await Promise.all(toolCalls.map(async (toolCall) => {
            const functionName = toolCall.functionCall.name;
            const functionArgs = toolCall.functionCall.args;
            console.log(`[Function Calling] 実行: ${functionName}`, functionArgs);
            if (window.functionCallingTools && typeof window.functionCallingTools[functionName] === 'function') {
                try {
                    const result = await window.functionCallingTools[functionName](functionArgs);
                    return { role: 'tool', name: functionName, response: result, timestamp: Date.now() };
                } catch (e) {
                    console.error(`[Function Calling] 関数 '${functionName}' の実行中にエラーが発生しました:`, e);
                    return { role: 'tool', name: functionName, response: { error: `関数実行中の内部エラー: ${e.message}` }, timestamp: Date.now() };
                }
            } else {
                console.error(`[Function Calling] 関数 '${functionName}' が見つかりません。`);
                return { role: 'tool', name: functionName, response: { error: `関数 '${functionName}' が見つかりません。` }, timestamp: Date.now() };
            }
        }));
        return results;
    },
    updateCurrentSystemPrompt() {
        try {
            const settings = state.settings || {};
            let prompt = settings.systemPrompt || "You are a helpful AI assistant.";
            state.currentSystemPrompt = prompt;
            if (elements.systemPromptEditor) {
                elements.systemPromptEditor.value = prompt;
            }
            console.log("System prompt updated:", prompt.substring(0, 50) + "...");
        } catch (err) {
            console.error("Failed to update system prompt:", err);
        }
    }
};

// --- 初期化処理 ---
document.addEventListener('DOMContentLoaded', () => {
    appLogic.initializeApp();
});