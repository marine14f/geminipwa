// function-calling.js の manage_persistent_memory をこの全文に置き換え
async function manage_persistent_memory({ action, key, value }) {
    console.log(`[Function Calling] manage_persistent_memoryが呼び出されました。`, { action, key, value });
  
    // --- 1) state を必ず用意 ---
    const g = (typeof window !== 'undefined' ? window : globalThis);
    if (!g.state) g.state = {};
    if (typeof g.state.currentPersistentMemory !== "object" || g.state.currentPersistentMemory == null) {
      g.state.currentPersistentMemory = {};
    }
    const state = g.state;
  
    // --- 2) チャットIDが未確定でも動けるようにする ---
    // まずは保存を試してIDを発行。ダメなら今回はインメモリのみ更新(ephemeral)にする。
    let ephemeral = false;
    if (!state.currentChatId) {
      try {
        if (g.dbUtils?.saveChat) { await g.dbUtils.saveChat(); }
      } catch (e) {
        console.warn("[Function Calling] pre-save failed", e);
      }
      if (!state.currentChatId) {
        ephemeral = true; // このターンはDB未保存でも先にメモリだけ更新しておく
        console.warn("[Function Calling] chatId未確定のため、今回はインメモリのみ更新します。");
      }
    }
  
    try {
      // --- 3) いつも最新の state.currentPersistentMemory を操作 ---
      const memory = state.currentPersistentMemory || {};
      let resultData = null;
  
      switch (action) {
        case "add": {
          if (!key || value === undefined) {
            return { error: "addアクションには 'key' と 'value' が必要です。" };
          }
          memory[key] = value;
          resultData = { success: true, message: `キー「${key}」に値を保存しました。` };
  
          // 追加：可能なら即DB保存（ephemeral時はスキップ）
          if (!ephemeral && g.dbUtils?.saveChat) {
            try { await g.dbUtils.saveChat(); } catch (e) { console.warn("[Function Calling] saveChat failed", e); }
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
  
            // 追加：可能なら即DB保存（ephemeral時はスキップ）
            if (!ephemeral && g.dbUtils?.saveChat) {
              try { await g.dbUtils.saveChat(); } catch (e) { console.warn("[Function Calling] saveChat failed", e); }
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
  
      // --- 4) state を上書き（DB保存は上でやってる／ephemeralは次の通常保存で落ちる） ---
      state.currentPersistentMemory = memory;
  
      console.log(`[Function Calling] 処理完了、state.currentPersistentMemoryを更新しました:`, resultData);
      return resultData;
  
    } catch (error) {
      console.error(`[Function Calling] manage_persistent_memoryでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
    }
  }
  