// function-calling.js の manage_persistent_memory をこの全文に置き換え
async function manage_persistent_memory({ action, key, value }) {
    console.log(`[Function Calling] manage_persistent_memoryが呼び出されました。`, { action, key, value });
  
    // 1) state を必ず用意（未初期化クラッシュ回避）
    const g = (typeof window !== 'undefined' ? window : globalThis);
    if (!g.state) g.state = {};
    if (typeof g.state.currentPersistentMemory !== "object" || g.state.currentPersistentMemory == null) {
      g.state.currentPersistentMemory = {};
    }
    const state = g.state;
  
    // 2) 初回直後でも動くようにする（IDが無いなら保存を試み、ダメでもインメモリ更新を許可）
    let ephemeral = false;
    if (!state.currentChatId) {
      try {
        if (g.dbUtils?.saveChat) { await g.dbUtils.saveChat(); }
      } catch (e) {
        console.warn("[Function Calling] pre-save failed", e);
      }
      if (!state.currentChatId) {
        ephemeral = true; // このターンはDB未保存でも先にメモリだけ更新
        console.warn("[Function Calling] chatId未確定のため、今回はインメモリのみ更新します。");
      }
    }
  
    try {
      // 3) 常に state.currentPersistentMemory を操作
      const memory = state.currentPersistentMemory || {};
      let resultData = null;
  
      switch (action) {
        case "add": {
          if (!key || value === undefined) {
            return { error: "addアクションには 'key' と 'value' が必要です。" };
          }
          memory[key] = value;
          resultData = { success: true, message: `キー「${key}」に値を保存しました。` };
  
          // IDが出ていれば即DB保存
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
  
            // IDが出ていれば即DB保存
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
  
      // 4) state へ反映（DB保存は上で実施／ephemeralは次の通常保存で落ちる）
      state.currentPersistentMemory = memory;
  
      console.log(`[Function Calling] 処理完了、state.currentPersistentMemoryを更新しました:`, resultData);
      return resultData;
  
    } catch (error) {
      console.error(`[Function Calling] manage_persistent_memoryでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
    }
  }