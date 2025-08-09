// function-calling.js — full / v6
// Tools: calculate, manage_persistent_memory
// 変更点(v6):
//  - chatId 解決を強化（state.currentChatId / state.currentChat.id / IndexedDB スキャン / saveChat 再試行）
//  - add/delete 後に IndexedDB('GeminiPWA_DB').chats を直接 put して確実に保存
//  - ツール宣言・実装は既存にマージ登録

(function () {
    'use strict';
  
    // ===== Helpers =====
    function ensureGlobalState() {
      const g = typeof window !== 'undefined' ? window : globalThis;
      if (!g.state) g.state = {};
      if (typeof g.state.currentPersistentMemory !== 'object' || g.state.currentPersistentMemory == null) {
        g.state.currentPersistentMemory = {};
      }
      return g;
    }
  
    // IndexedDB: 最新チャットIDを推定（updatedAt 降順 or id の最大／最後）
    async function findLatestChatIdFromIDB() {
      return new Promise((resolve) => {
        const openReq = indexedDB.open('GeminiPWA_DB');
        openReq.onerror = () => resolve(null);
        openReq.onsuccess = () => {
          const db = openReq.result;
          let tx;
          try {
            tx = db.transaction('chats', 'readonly');
          } catch (e) {
            resolve(null);
            return;
          }
          const store = tx.objectStore('chats');
  
          // getAll が使えるなら簡単
          if (typeof store.getAll === 'function') {
            const allReq = store.getAll();
            allReq.onerror = () => resolve(null);
            allReq.onsuccess = () => {
              const arr = allReq.result || [];
              if (arr.length === 0) { resolve(null); return; }
              // updatedAt があれば降順、無ければ id を文字列比較 or 数値化
              arr.sort((a, b) => {
                const au = a.updatedAt || a.updated_at || 0;
                const bu = b.updatedAt || b.updated_at || 0;
                if (au && bu && au !== bu) return bu - au; // 降順
                // 次善：id 比較（数値化できれば数値）
                const ai = +a.id || 0;
                const bi = +b.id || 0;
                return bi - ai;
              });
              resolve(arr[0]?.id || null);
            };
            return;
          }
  
          // getAll がない環境用：カーソルで走査して最新っぽいものを選ぶ
          let best = null;
          const cursorReq = store.openCursor();
          cursorReq.onerror = () => resolve(null);
          cursorReq.onsuccess = (ev) => {
            const cursor = ev.target.result;
            if (cursor) {
              const v = cursor.value;
              if (!best) best = v;
              else {
                const bu = best.updatedAt || best.updated_at || 0;
                const vu = v.updatedAt || v.updated_at || 0;
                if (vu && vu > bu) best = v;
                else if (!vu && !bu) {
                  const bi = +best.id || 0;
                  const vi = +v.id || 0;
                  if (vi > bi) best = v;
                }
              }
              cursor.continue();
            } else {
              resolve(best?.id || null);
            }
          };
        };
      });
    }
  
    // IndexedDB: chats に persistentMemory を直接書き戻す
    async function persistMemoryToIndexedDB(chatId, memory) {
      if (!chatId) return { skipped: true, reason: 'no chatId' };
  
      return new Promise((resolve) => {
        const openReq = indexedDB.open('GeminiPWA_DB');
        openReq.onerror = () => resolve({ ok: false, error: openReq.error?.message || 'IDB open failed' });
        openReq.onsuccess = () => {
          const db = openReq.result;
          let tx;
          try {
            tx = db.transaction('chats', 'readwrite');
          } catch (e) {
            resolve({ ok: false, error: 'transaction failed: ' + (e?.message || e) });
            return;
          }
          const store = tx.objectStore('chats');
          const getReq = store.get(chatId);
          getReq.onerror = () => resolve({ ok: false, error: getReq.error?.message || 'get failed' });
          getReq.onsuccess = () => {
            const chat = getReq.result;
            if (!chat) { resolve({ ok: false, error: 'chat not found: ' + chatId }); return; }
            chat.persistentMemory = memory || {};
            // 可能なら updatedAt を更新
            try { chat.updatedAt = Date.now(); } catch {}
            const putReq = store.put(chat);
            putReq.onerror = () => resolve({ ok: false, error: putReq.error?.message || 'put failed' });
            putReq.onsuccess = () => resolve({ ok: true });
          };
        };
      });
    }
  
    // chatId を最大限解決する
    async function resolveChatId() {
      const g = ensureGlobalState();
      const state = g.state;
  
      if (state.currentChatId) return state.currentChatId;
      if (state.currentChat && state.currentChat.id) {
        state.currentChatId = state.currentChat.id;
        return state.currentChatId;
      }
  
      // IndexedDB から最新を推定
      const latest = await findLatestChatIdFromIDB();
      if (latest) {
        state.currentChatId = latest;
        return latest;
      }
  
      // ここまで無ければ saveChat を試す（存在する場合）
      try {
        if (g.dbUtils?.saveChat) { await g.dbUtils.saveChat(); }
      } catch (e) {
        console.warn("[Function Calling] resolveChatId: saveChat failed", e);
      }
  
      // 再トライ
      if (state.currentChatId) return state.currentChatId;
      if (state.currentChat && state.currentChat.id) {
        state.currentChatId = state.currentChat.id;
        return state.currentChatId;
      }
      const latest2 = await findLatestChatIdFromIDB();
      if (latest2) {
        state.currentChatId = latest2;
        return latest2;
      }
  
      return null;
    }
  
    // ===== Tool: manage_persistent_memory =====
    async function manage_persistent_memory({ action, key, value }) {
      console.log(`[Function Calling] manage_persistent_memoryが呼び出されました。`, { action, key, value });
  
      const g = ensureGlobalState();
      const state = g.state;
  
      // chatId をできる限り解決
      let chatId = await resolveChatId();
      const ephemeral = !chatId;
      if (ephemeral) {
        console.warn("[Function Calling] chatId未確定のため、今回はインメモリのみ更新します。");
      }
  
      try {
        const memory = state.currentPersistentMemory || {};
        let resultData = null;
  
        switch (action) {
          case "add": {
            if (!key || value === undefined) {
              return { error: "addアクションには 'key' と 'value' が必要です。" };
            }
            memory[key] = value;
            resultData = { success: true, message: `キー「${key}」に値を保存しました。` };
  
            // 可能なら即保存（IDBに直接書く）
            if (!ephemeral) {
              const r = await persistMemoryToIndexedDB(chatId, memory);
              if (!r.ok) console.warn("[Function Calling] IDB persist failed:", r);
              // dbUtils.saveChat があれば併用（任意）
              if (g.dbUtils?.saveChat) { try { await g.dbUtils.saveChat(); } catch (e) { console.warn("[Function Calling] saveChat failed", e); } }
            }
            break;
          }
  
          case "get": {
            if (!key) return { error: "getアクションには 'key' が必要です。" };
            if (key in memory) resultData = { success: true, key, value: memory[key] };
            else resultData = { success: false, message: `キー「${key}」は見つかりませんでした。` };
            break;
          }
  
          case "delete": {
            if (!key) return { error: "deleteアクションには 'key' が必要です。" };
            if (key in memory) {
              delete memory[key];
              resultData = { success: true, message: `キー「${key}」を削除しました。` };
  
              if (!ephemeral) {
                const r = await persistMemoryToIndexedDB(chatId, memory);
                if (!r.ok) console.warn("[Function Calling] IDB persist failed:", r);
                if (g.dbUtils?.saveChat) { try { await g.dbUtils.saveChat(); } catch (e) { console.warn("[Function Calling] saveChat failed", e); } }
              }
            } else {
              resultData = { success: false, message: `キー「${key}」は見つかりませんでした。` };
            }
            break;
          }
  
          case "list": {
            const keys = Object.keys(memory);
            resultData = { success: true, count: keys.length, keys };
            break;
          }
  
          default:
            return { error: `無効なアクションです: ${action}` };
        }
  
        // state へ反映（ephemeral の場合は次の通常保存でDBに落ちる）
        state.currentPersistentMemory = memory;
  
        console.log(`[Function Calling] 処理完了、state.currentPersistentMemoryを更新しました:`, resultData);
        return resultData;
  
      } catch (error) {
        console.error(`[Function Calling] manage_persistent_memoryでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
      }
    }
  
    // ===== Tool: calculate =====
    async function calculate({ expression }) {
      console.log(`[Function Calling] calculateが呼び出されました。式: ${expression}`);
  
      const allowedChars = /^[0-9+\-*/().\s]+$/;
      if (typeof expression !== 'string' || !allowedChars.test(expression)) {
        console.error("[Function Calling] calculate: 式に許可されていない文字が含まれています。");
        return { error: "無効な式です。四則演算と括弧のみ使用できます。" };
      }
  
      try {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expression})`)();
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error("計算結果が無効です。");
        }
        console.log(`[Function Calling] calculate: 計算結果: ${result}`);
        return { result };
      } catch (error) {
        console.error(`[Function Calling] calculate: 計算エラー: ${error.message}`);
        return { error: `計算エラー: ${error.message}` };
      }
    }
  
    // ===== Register implementations =====
    const g = typeof window !== 'undefined' ? window : globalThis;
    g.functionCallingTools = Object.assign({}, g.functionCallingTools, {
      calculate,
      manage_persistent_memory,
    });
  
    // ===== Register declarations (merge) =====
    function mergeFunctionDeclarations(existing, incoming) {
      const flat = [];
      if (Array.isArray(existing)) {
        for (const block of existing) {
          if (block && Array.isArray(block.function_declarations)) {
            for (const decl of block.function_declarations) {
              if (!flat.find(d => d.name === (decl && decl.name))) flat.push(decl);
            }
          }
        }
      }
      for (const decl of incoming) {
        const idx = flat.findIndex(d => d.name === decl.name);
        if (idx >= 0) flat.splice(idx, 1, decl);
        else flat.push(decl);
      }
      return [{ function_declarations: flat }];
    }
  
    const calcDecl = {
      name: "calculate",
      description: "ユーザーから与えられた数学的な計算式（四則演算）を評価し、その正確な結果を返します。複雑な計算や、信頼性が求められる計算の場合に必ず使用してください。",
      parameters: {
        type: "OBJECT",
        properties: {
          expression: {
            type: "STRING",
            description: "計算する数式。例: '2 * (3 + 5)'",
          },
        },
        required: ["expression"],
      },
    };
  
    const memDecl = {
      name: "manage_persistent_memory",
      description: "現在の会話セッションに限定して、重要な情報（記念日、登場人物の設定、世界の法則など）を後から参照できるように記憶・管理します。他の会話には影響しません。",
      parameters: {
        type: "OBJECT",
        properties: {
          action: {
            type: "STRING",
            description: "実行する操作を選択します。'add': 情報を追加/上書き, 'get': 情報を取得, 'delete': 情報を削除, 'list': 記憶している全ての情報キーを一覧表示。",
          },
          key: {
            type: "STRING",
            description: "情報を識別するための一意のキー（名前）。'add', 'get', 'delete' アクションで必須です。例: '主人公の性格', '次の目的地'",
          },
          value: {
            type: "STRING",
            description: "キーに紐付けて記憶させる情報の内容。'add' アクションで必須です。例: '冷静沈着', '東の塔'",
          },
        },
        required: ["action"],
      },
    };
  
    g.functionDeclarations = mergeFunctionDeclarations(g.functionDeclarations, [calcDecl, memDecl]);
  
    console.log("[Function Calling] tools & declarations registered (v6)");
  })();
  