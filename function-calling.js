/*
 * function-calling.js (merged)
 * - Tools: calculate, manage_persistent_memory
 * - Per-chat persistent memory: mutations are immediately persisted to IndexedDB
 * - Guards: usable only after first message is saved (currentChatId must exist)
 */

(function () {
  // ===== Helpers =====
  const ok = (message, extra = {}) => ({ success: true, message, ...extra });
  const fail = (message, extra = {}) => ({ success: false, message, ...extra });

  // Debounced saver (coalesce multiple mutations)
  let saveTimer = null;
  async function savePersistentMemorySoon() {
    if (saveTimer) clearTimeout(saveTimer);
    await new Promise((resolve) => {
      saveTimer = setTimeout(async () => {
        try {
          if (window.dbUtils && typeof window.dbUtils.saveChat === "function") {
            await window.dbUtils.saveChat();
          } else {
            console.warn("[Function Calling] dbUtils.saveChat が見つかりません");
          }
        } catch (e) {
          console.warn("[Function Calling] 永続メモリ保存に失敗:", e);
        } finally {
          saveTimer = null;
          resolve();
        }
      }, 50);
    });
  }

  function ensureState() {
    if (!window.state) throw new Error("global state is missing");
    if (!("currentPersistentMemory" in window.state)) {
      window.state.currentPersistentMemory = {};
    }
  }

  function ensureUsableChat() {
    // 要件: 最初のメッセージ送信後（= currentChatId が存在）
    if (!window.state || !window.state.currentChatId) {
      return fail(
        "この関数は最初のメッセージ送信後に使用できます。先にメッセージを送信してください。"
      );
    }
    return null;
  }

  // ===== calculate (四則演算) =====
  function calculate(args) {
    const { expression } = args || {};
    if (typeof expression !== "string" || expression.trim() === "") {
      return fail("'expression' は必須の文字列です。");
    }
    // 許可する文字のみ（数字, + - * / . () 半角スペース）
    const safe = /^[0-9+*/(). -]+$/;
    if (!safe.test(expression)) {
      return fail("使用できない文字が含まれています（四則演算と括弧のみ対応）。");
    }
    try {
      // eslint-disable-next-line no-new-func
      const result = Function("\"use strict\";return (" + expression + ")")();
      if (typeof result !== "number" || !isFinite(result)) {
        return fail("計算結果が数値ではありません。");
      }
      return ok("計算しました。", { expression, result });
    } catch (e) {
      return fail("式の評価に失敗しました。", { error: String((e && e.message) || e) });
    }
  }

  // ===== manage_persistent_memory =====
  async function managePersistentMemory(args) {
    console.log("[Function Calling] manage_persistent_memory が呼び出されました", args);
    try {
      ensureState();
    } catch (e) {
      return fail("内部状態が初期化されていません: " + e.message);
    }

    const guard = ensureUsableChat();
    if (guard) return guard; // 前提条件 NG

    const { action, key, value } = args || {};
    const mem = window.state.currentPersistentMemory || (window.state.currentPersistentMemory = {});

    const a = String(action || "").toLowerCase();
    if (!a || !["add", "get", "delete", "list"].includes(a)) {
      return fail("action は 'add' | 'get' | 'delete' | 'list' のいずれかです。");
    }
    if ((a === "add" || a === "get" || a === "delete") && (!key || typeof key !== "string")) {
      return fail("'key' は必須の文字列です。");
    }
    if (a === "add" && (value === undefined || value === null)) {
      return fail("'value' は 'add' アクションで必須です。");
    }

    switch (a) {
      case "add": {
        mem[key] = String(value);
        await savePersistentMemorySoon();
        return ok(`キー「${key}」に値を保存しました。`, { key, value: mem[key] });
      }
      case "get": {
        if (!(key in mem)) return ok(`キー「${key}」は未登録です。`, { exists: false });
        return ok(`キー「${key}」の値です。`, { exists: true, key, value: mem[key] });
      }
      case "delete": {
        if (key in mem) {
          delete mem[key];
          await savePersistentMemorySoon();
          return ok(`キー「${key}」を削除しました。`);
        }
        return ok(`キー「${key}」は存在しませんでした。`);
      }
      case "list": {
        const keys = Object.keys(mem);
        return ok("保存されているキーの一覧です。", { keys, count: keys.length });
      }
    }
  }

  // ===== Merge function declarations safely =====
  function mergeFunctionDeclarations(existing, incoming) {
    const flat = [];
    const pushDecl = (decl) => {
      const name = decl && decl.name;
      if (!name) return;
      const already = flat.find((d) => d.name === name);
      if (!already) flat.push(decl);
    };

    // Existing
    if (Array.isArray(existing)) {
      for (const block of existing) {
        if (block && Array.isArray(block.function_declarations)) {
          for (const decl of block.function_declarations) pushDecl(decl);
        }
      }
    }
    // Incoming (wins over existing with same name by replacing)
    for (const decl of incoming) {
      const idx = flat.findIndex((d) => d.name === decl.name);
      if (idx >= 0) flat.splice(idx, 1, decl); else flat.push(decl);
    }
    return [{ function_declarations: flat }];
  }

  const calcDecl = {
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
  };

  const memDecl = {
    name: "manage_persistent_memory",
    description:
      "現在の会話で登場した重要な情報（例：記念日、登場人物の設定、世界の法則など）を、会話を跨いで記憶・参照・削除するための長期記憶を管理する。他の会話には影響しない。",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "'add' | 'get' | 'delete' | 'list' のいずれか。",
        },
        key: {
          type: "STRING",
          description: "情報を識別するための一意の文字列 (add, get, delete時に必須)。",
        },
        value: {
          type: "STRING",
          description: "保存する情報 (add時に必須)。",
        },
      },
      required: ["action"],
    },
  };

  window.functionDeclarations = mergeFunctionDeclarations(
    window.functionDeclarations,
    [calcDecl, memDecl]
  );

  // ===== Register implementations =====
  window.functionCallingTools = Object.assign({}, window.functionCallingTools, {
    calculate,
    manage_persistent_memory: managePersistentMemory,
  });

  // ===== Small debug helpers =====
  window.debugListPersistentMemory = function () {
    try {
      ensureState();
      console.log("[Debug] currentPersistentMemory:", window.state.currentPersistentMemory);
    } catch (e) {
      console.warn(e);
    }
  };
})();
