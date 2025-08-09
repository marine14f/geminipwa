// function-calling.js  — full file / v3
// - Tools: calculate, manage_persistent_memory
// - Per-chat persistent memory (session-scoped)
// - Works even if currentChatId is not yet issued (ephemeral in-memory update)
// - Immediately persists on add/delete if chatId exists

(function () {
    'use strict';
  
    // -----------------------------
    // Small helpers
    // -----------------------------
    function ensureGlobalState() {
      const g = typeof window !== 'undefined' ? window : globalThis;
      if (!g.state) g.state = {};
      if (typeof g.state.currentPersistentMemory !== 'object' || g.state.currentPersistentMemory == null) {
        g.state.currentPersistentMemory = {};
      }
      return g;
    }
  
    // -----------------------------
    // Tool: manage_persistent_memory
    // -----------------------------
    async function manage_persistent_memory({ action, key, value }) {
      console.log(`[Function Calling] manage_persistent_memoryが呼び出されました。`, { action, key, value });
  
      const g = ensureGlobalState();
      const state = g.state;
  
      // 初回直後などで currentChatId が未発行のことがある
      // 先に保存を試み、それでも未発行なら今回はインメモリのみ更新(ephemeral)
      let ephemeral = false;
      if (!state.currentChatId) {
        try {
          if (g.dbUtils?.saveChat) {
            await g.dbUtils.saveChat();
          }
        } catch (e) {
          console.warn('[Function Calling] pre-save failed', e);
        }
        if (!state.currentChatId) {
          ephemeral = true;
          console.warn('[Function Calling] chatId未確定のため、今回はインメモリのみ更新します。');
        }
      }
  
      try {
        const memory = state.currentPersistentMemory || {};
        let resultData = null;
  
        switch (action) {
          case 'add': {
            if (!key || value === undefined) {
              return { error: "addアクションには 'key' と 'value' が必要です。" };
            }
            memory[key] = value;
            resultData = { success: true, message: `キー「${key}」に値を保存しました。` };
  
            // 可能なら即保存（ephemeral時はスキップ）
            if (!ephemeral && g.dbUtils?.saveChat) {
              try { await g.dbUtils.saveChat(); } catch (e) { console.warn('[Function Calling] saveChat failed', e); }
            }
            break;
          }
  
          case 'get': {
            if (!key) return { error: "getアクションには 'key' が必要です。" };
            if (key in memory) resultData = { success: true, key, value: memory[key] };
            else resultData = { success: false, message: `キー「${key}」は見つかりませんでした。` };
            break;
          }
  
          case 'delete': {
            if (!key) return { error: "deleteアクションには 'key' が必要です。" };
            if (key in memory) {
              delete memory[key];
              resultData = { success: true, message: `キー「${key}」を削除しました。` };
  
              // 可能なら即保存（ephemeral時はスキップ）
              if (!ephemeral && g.dbUtils?.saveChat) {
                try { await g.dbUtils.saveChat(); } catch (e) { console.warn('[Function Calling] saveChat failed', e); }
              }
            } else {
              resultData = { success: false, message: `キー「${key}」は見つかりませんでした。` };
            }
            break;
          }
  
          case 'list': {
            const keys = Object.keys(memory);
            resultData = { success: true, count: keys.length, keys };
            break;
          }
  
          default:
            return { error: `無効なアクションです: ${action}` };
        }
  
        // stateへ反映（DB保存は上で実施／ephemeralは次の通常保存で落ちる）
        state.currentPersistentMemory = memory;
  
        console.log(`[Function Calling] 処理完了、state.currentPersistentMemoryを更新しました:`, resultData);
        return resultData;
  
      } catch (error) {
        console.error(`[Function Calling] manage_persistent_memoryでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
      }
    }
  
    // -----------------------------
    // Tool: calculate (四則演算)
    // -----------------------------
    async function calculate({ expression }) {
      console.log(`[Function Calling] calculateが呼び出されました。式: ${expression}`);
  
      // 適度な入力バリデーション（数字、演算子、括弧、小数点、空白のみ）
      const allowedChars = /^[0-9+\-*/().\s]+$/;
      if (typeof expression !== 'string' || !allowedChars.test(expression)) {
        console.error('[Function Calling] calculate: 式に許可されていない文字が含まれています。');
        return { error: '無効な式です。四則演算と括弧のみ使用できます。' };
      }
  
      try {
        // 安全側に倒すなら専用パーサを使うべきだが、ここでは最小構成
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expression})`)();
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error('計算結果が無効です。');
        }
        console.log(`[Function Calling] calculate: 計算結果: ${result}`);
        return { result };
      } catch (error) {
        console.error(`[Function Calling] calculate: 計算エラー: ${error.message}`);
        return { error: `計算エラー: ${error.message}` };
      }
    }
  
    // -----------------------------
    // Register tool implementations
    // -----------------------------
    const g = typeof window !== 'undefined' ? window : globalThis;
    g.functionCallingTools = Object.assign({}, g.functionCallingTools, {
      calculate,
      manage_persistent_memory
    });
  
    // -----------------------------
    // Register tool declarations (merge safely)
    // -----------------------------
    function mergeFunctionDeclarations(existing, incoming) {
      // existing: array like [{ function_declarations: [...] }, ...] or undefined
      // incoming: array of decl objects
      const flat = [];
  
      // flatten existing
      if (Array.isArray(existing)) {
        for (const block of existing) {
          if (block && Array.isArray(block.function_declarations)) {
            for (const decl of block.function_declarations) {
              if (!flat.find(d => d.name === (decl && decl.name))) flat.push(decl);
            }
          }
        }
      }
  
      // apply incoming (replace by name)
      for (const decl of incoming) {
        const idx = flat.findIndex(d => d.name === decl.name);
        if (idx >= 0) flat.splice(idx, 1, decl);
        else flat.push(decl);
      }
  
      return [{ function_declarations: flat }];
    }
  
    const calcDecl = {
      name: 'calculate',
      description: 'ユーザーから与えられた数学的な計算式（四則演算）を評価し、その正確な結果を返します。複雑な計算や、信頼性が求められる計算の場合に必ず使用してください。',
      parameters: {
        type: 'OBJECT',
        properties: {
          expression: {
            type: 'STRING',
            description: "計算する数式。例: '2 * (3 + 5)'"
          }
        },
        required: ['expression']
      }
    };
  
    const memDecl = {
      name: 'manage_persistent_memory',
      description: '現在の会話セッションに限定して、重要な情報（記念日、登場人物の設定、世界の法則など）を後から参照できるように記憶・管理します。他の会話には影響しません。',
      parameters: {
        type: 'OBJECT',
        properties: {
          action: {
            type: 'STRING',
            description: "実行する操作を選択します。'add': 情報を追加/上書き, 'get': 情報を取得, 'delete': 情報を削除, 'list': 記憶している全ての情報キーを一覧表示。"
          },
          key: {
            type: 'STRING',
            description: "情報を識別するための一意のキー（名前）。'add', 'get', 'delete' アクションで必須です。例: '主人公の性格', '次の目的地'"
          },
          value: {
            type: 'STRING',
            description: "キーに紐付けて記憶させる情報の内容。'add' アクションで必須です。例: '冷静沈着', '東の塔'"
          }
        },
        required: ['action']
      }
    };
  
    g.functionDeclarations = mergeFunctionDeclarations(g.functionDeclarations, [calcDecl, memDecl]);
  
    console.log('[Function Calling] tools & declarations registered (v3)');
  })();
  