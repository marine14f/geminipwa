/**
 * function-calling.js
 * - Gemini Function Calling: tool declarations + 実装
 * - manage_persistent_memory は chatId 未確定でも saveChat() を使って確定→DB 保存まで行う
 * - tools 取得関数 window.getGeminiTools() を公開（API呼び出し側はこれを使う）
 *
 * 注意: モデル名はユーザー指定の gemini-2.5-pro を維持します。
 */

 (() => {
    // =========================
    // ツール宣言（declarations）
    // =========================
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
  
    // API へ渡す正しい tools 形式を返すヘルパ
    // これを使えば "tools: [{ function_declarations: [...] }]" で常に正しい形になる
    function getGeminiTools() {
      return [{ function_declarations: functionDeclarations }];
    }
  
    // 外部からも参照できるように公開
    window.functionDeclarations = functionDeclarations;
    window.getGeminiTools = getGeminiTools;
  
    console.log("[Function Calling] tools & declarations registered (v5)");
  
    // =========================
    // 各ツールの実装
    // =========================
  
    async function tool_calculate(args) {
      const { expression } = args || {};
      if (typeof expression !== "string" || !expression.trim()) {
        return { name: "calculate", response: { success: false, message: "式が空です。" } };
      }
      if (!/^[\d+\-*/().\s]+$/.test(expression)) {
        return { name: "calculate", response: { success: false, message: "不正な文字が含まれています。" } };
      }
      try {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expression})`)();
        if (Number.isFinite(result)) {
          return { name: "calculate", response: { success: true, result } };
        }
        throw new Error("計算結果が有限数ではありません。");
      } catch (e) {
        return { name: "calculate", response: { success: false, message: `計算エラー: ${e.message}` } };
      }
    }
  
    async function tool_manage_persistent_memory(args) {
      const { action, key, value } = args || {};
      console.log("[Function Calling] manage_persistent_memoryが呼び出されました。", args);
  
      const state = (window.state = window.state || {});
      if (!state.currentPersistentMemory) state.currentPersistentMemory = {};
      const mem = state.currentPersistentMemory;
  
      // chatId を確定させる（なければ saveChat() で払い出し）
      const ensureChatId = async () => {
        if (state.currentChatId) return state.currentChatId;
        if (window.dbUtils?.saveChat) {
          await window.dbUtils.saveChat();
          if (state.currentChatId) return state.currentChatId;
        }
        throw new Error("chatId を確定できませんでした。");
      };
  
      try {
        switch (action) {
          case "add": {
            if (!key) return { name: "manage_persistent_memory", response: { success: false, message: "key が必要です。" } };
            if (typeof value !== "string") return { name: "manage_persistent_memory", response: { success: false, message: "value は文字列で指定してください。" } };
            mem[key] = value;               // まず state を更新
            await ensureChatId();           // ID 確定
            await window.dbUtils.saveChat(); // 永続化
            return { name: "manage_persistent_memory", response: { success: true, message: `キー「${key}」に値を保存しました。` } };
          }
          case "get": {
            if (!key) return { name: "manage_persistent_memory", response: { success: false, message: "key が必要です。" } };
            const v = mem[key];
            return { name: "manage_persistent_memory", response: { success: true, value: v ?? null, hit: v !== undefined } };
          }
          case "delete": {
            if (!key) return { name: "manage_persistent_memory", response: { success: false, message: "key が必要です。" } };
            const existed = Object.prototype.hasOwnProperty.call(mem, key);
            if (existed) delete mem[key];
            await ensureChatId();
            await window.dbUtils.saveChat();
            return { name: "manage_persistent_memory", response: { success: true, deleted: existed } };
          }
          case "list": {
            return { name: "manage_persistent_memory", response: { success: true, keys: Object.keys(mem) } };
          }
          default: {
            return { name: "manage_persistent_memory", response: { success: false, message: `未知の action: ${action}` } };
          }
        }
      } catch (e) {
        console.error("[Function Calling] manage_persistent_memory エラー:", e);
        return { name: "manage_persistent_memory", response: { success: false, message: e?.message || String(e) } };
      }
    }
  
    // =========================
    // ツールディスパッチャ
    // =========================
    window.executeToolCall = async (toolCall) => {
      const { functionCall } = toolCall || {};
      if (!functionCall?.name) return null;
  
      if (functionCall.name === "calculate") {
        return await tool_calculate(functionCall.args || {});
      }
      if (functionCall.name === "manage_persistent_memory") {
        return await tool_manage_persistent_memory(functionCall.args || {});
      }
      return { name: functionCall.name, response: { success: false, message: "未対応のツールです。" } };
    };
  
    window.executeToolCalls = async (toolCalls) => {
      const results = [];
      for (const call of toolCalls || []) {
        const res = await window.executeToolCall(call);
        if (res) {
          results.push({ role: "tool", name: res.name, response: res.response, timestamp: Date.now() });
        }
      }
      return results;
    };
  })();
  