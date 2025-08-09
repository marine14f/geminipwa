/**
 * function-calling.js
 * - Gemini Function Calling 用の function_declarations と実装
 * - IndexedDB 永続メモリ (per chat) を manage_persistent_memory で扱う
 * - 依存: window.state, window.dbUtils, window.appLogic (存在すれば), window.fetch など
 */

 (() => {
    // ---- ツール宣言（Gemini v1beta 形式）--------------------------------------
    const functionDeclarations = [
      {
        name: "calculate",
        description:
          "ユーザーから与えられた数学的な計算式（四則演算）を評価し、その正確な結果を返します。複雑な計算や、信頼性が求められる計算の場合に必ず使用してください。",
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
      },
      {
        name: "manage_persistent_memory",
        description:
          "現在の会話セッションに限定して、重要な情報（記念日、登場人物の設定、世界の法則など）を後から参照できるように記憶・管理します。他の会話には影響しません。",
        parameters: {
          type: "OBJECT",
          properties: {
            action: {
              type: "STRING",
              description:
                "実行する操作を選択します。'add': 情報を追加/上書き, 'get': 情報を取得, 'delete': 情報を削除, 'list': 記憶している全ての情報キーを一覧表示。",
            },
            key: {
              type: "STRING",
              description:
                "情報を識別するための一意のキー（名前）。'add', 'get', 'delete' アクションで必須です。例: '主人公の性格', '次の目的地'",
            },
            value: {
              type: "STRING",
              description:
                "キーに紐付けて記憶させる情報の内容。'add' アクションで必須です。例: '冷静沈着', '東の塔'",
            },
          },
          required: ["action"],
        },
      },
    ];
  
    // グローバルへエクスポート（index.html から参照）
    window.functionDeclarations = functionDeclarations;
    console.log("[Function Calling] tools & declarations registered (v5)");
  
    // ---- ツール実装 ------------------------------------------------------------
  
    async function tool_calculate(args) {
      const { expression } = args || {};
      if (typeof expression !== "string" || !expression.trim()) {
        return {
          name: "calculate",
          response: { success: false, message: "式が空です。" },
        };
      }
      // 極めて限定的な評価（四則演算と括弧のみに制限）
      if (!/^[\d+\-*/().\s]+$/.test(expression)) {
        return {
          name: "calculate",
          response: { success: false, message: "不正な文字が含まれています。" },
        };
      }
      try {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expression})`)();
        if (Number.isFinite(result)) {
          return {
            name: "calculate",
            response: { success: true, result },
          };
        }
        throw new Error("計算結果が有限数ではありません。");
      } catch (e) {
        return {
          name: "calculate",
          response: { success: false, message: `計算エラー: ${e.message}` },
        };
      }
    }
  
    /**
     * 重要: ここが今回の修正ポイント
     * - chatId 未確定でも、saveChat() を一度呼び出して ID を確定させる
     * - state.currentPersistentMemory を更新してから、必ず saveChat() で DB へ永続化
     */
    async function tool_manage_persistent_memory(args) {
      const { action, key, value } = args || {};
      console.log("[Function Calling] manage_persistent_memoryが呼び出されました。", args);
  
      const state = window.state || (window.state = {});
      if (!state.currentPersistentMemory) state.currentPersistentMemory = {};
  
      const mem = state.currentPersistentMemory;
  
      const ensureChatId = async () => {
        // 既にIDがあるなら何もしない
        if (state.currentChatId) return state.currentChatId;
  
        // まだIDがない場合：現在の state を DB へ保存して ID を払い出す
        // saveChat は新規なら keyPath autoIncrement により ID を採番し、
        // 保存成功時に state.currentChatId へ反映します。
        if (window.dbUtils?.saveChat) {
          await window.dbUtils.saveChat();
          if (state.currentChatId) return state.currentChatId;
        }
        // 念のための保険：IDが取れなければ例外
        throw new Error("chatId を確定できませんでした。");
      };
  
      try {
        switch (action) {
          case "add": {
            if (!key) return { name: "manage_persistent_memory", response: { success: false, message: "key が必要です。" } };
            if (typeof value !== "string") return { name: "manage_persistent_memory", response: { success: false, message: "value は文字列で指定してください。" } };
  
            mem[key] = value; // まずは state を更新
            // ここで chatId を必ず確定させてから保存
            await ensureChatId();
            // saveChat() は persistentMemory も含めて保存します。
            await window.dbUtils.saveChat();
  
            return {
              name: "manage_persistent_memory",
              response: { success: true, message: `キー「${key}」に値を保存しました。` },
            };
          }
          case "get": {
            if (!key) return { name: "manage_persistent_memory", response: { success: false, message: "key が必要です。" } };
            const v = mem[key];
            return {
              name: "manage_persistent_memory",
              response: { success: true, value: v ?? null, hit: v !== undefined },
            };
          }
          case "delete": {
            if (!key) return { name: "manage_persistent_memory", response: { success: false, message: "key が必要です。" } };
            const existed = Object.prototype.hasOwnProperty.call(mem, key);
            if (existed) delete mem[key];
            await ensureChatId();
            await window.dbUtils.saveChat();
            return {
              name: "manage_persistent_memory",
              response: { success: true, deleted: existed },
            };
          }
          case "list": {
            return {
              name: "manage_persistent_memory",
              response: { success: true, keys: Object.keys(mem) },
            };
          }
          default:
            return {
              name: "manage_persistent_memory",
              response: { success: false, message: `未知の action: ${action}` },
            };
        }
      } catch (e) {
        console.error("[Function Calling] manage_persistent_memory エラー:", e);
        return {
          name: "manage_persistent_memory",
          response: { success: false, message: e?.message || String(e) },
        };
      }
    }
  
    // ---- ツールディスパッチャ --------------------------------------------------
    window.executeToolCall = async (toolCall) => {
      const { functionCall } = toolCall || {};
      if (!functionCall?.name) return null;
  
      if (functionCall.name === "calculate") {
        return await tool_calculate(functionCall.args || {});
      }
      if (functionCall.name === "manage_persistent_memory") {
        return await tool_manage_persistent_memory(functionCall.args || {});
      }
      return {
        name: functionCall.name,
        response: { success: false, message: "未対応のツールです。" },
      };
    };
  
    /**
     * 複数ツール呼び出し（index.html 側の呼び出しに対応）
     * - 戻り値は { role:'tool', name, response } の配列
     */
    window.executeToolCalls = async (toolCalls) => {
      const results = [];
      for (const call of toolCalls) {
        const res = await window.executeToolCall(call);
        if (res) {
          results.push({
            role: "tool",
            name: res.name,
            response: res.response,
            timestamp: Date.now(),
          });
        }
      }
      return results;
    };
  })();
  