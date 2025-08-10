// function-calling.js

/**
 * 現在のチャットセッションに紐づく永続メモリを管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "add", "get", "delete", "list" のいずれか
 * @param {string} [args.key] - 操作対象のキー (add, get, delete時に必須)
 * @param {string} [args.value] - 保存する値 (add時に必須)
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
 async function manage_persistent_memory({ action, key, value }) {
  console.log(`[Function Calling] manage_persistent_memoryが呼び出されました。`, { action, key, value });

  // 前提条件: チャットが保存されているか（IDが存在するか）を確認
  if (!state.currentChatId) {
      const errorMsg = "チャットがまだ保存されていません。最初のメッセージを送信してから、再度実行してください。";
      console.error(`[Function Calling] エラー: ${errorMsg}`);
      return { error: errorMsg };
  }

  try {
      // 最新のチャットデータを取得
      const chat = await dbUtils.getChat(state.currentChatId);
      if (!chat) {
          throw new Error(`チャットデータ (ID: ${state.currentChatId}) が見つかりません。`);
      }

      // メモリ空間を初期化（存在しない場合）
      if (!chat.persistentMemory) {
          chat.persistentMemory = {};
      }
      const memory = chat.persistentMemory;
      let resultData = null;

      switch (action) {
          case "add":
              if (!key || value === undefined) {
                  return { error: "addアクションには 'key' と 'value' が必要です。" };
              }
              memory[key] = value;
              resultData = { success: true, message: `キー「${key}」に値を保存しました。` };
              break;

          case "get":
              if (!key) {
                  return { error: "getアクションには 'key' が必要です。" };
              }
              if (key in memory) {
                  resultData = { success: true, key: key, value: memory[key] };
              } else {
                  resultData = { success: false, message: `キー「${key}」は見つかりませんでした。` };
              }
              break;

          case "delete":
              if (!key) {
                  return { error: "deleteアクションには 'key' が必要です。" };
              }
              if (key in memory) {
                  delete memory[key];
                  resultData = { success: true, message: `キー「${key}」を削除しました。` };
              } else {
                  resultData = { success: false, message: `キー「${key}」は見つかりませんでした。` };
              }
              break;

          case "list":
              const keys = Object.keys(memory);
              resultData = { success: true, count: keys.length, keys: keys };
              break;

          default:
              return { error: `無効なアクションです: ${action}` };
      }

      // 変更をDBに保存
      chat.updatedAt = Date.now(); // 更新日時を更新
      await dbUtils.saveChat(chat.title); // タイトルは既存のものを維持

      // stateにも反映
      state.currentPersistentMemory = memory;

      console.log(`[Function Calling] 処理完了:`, resultData);
      return resultData;

  } catch (error) {
      console.error(`[Function Calling] manage_persistent_memoryでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}


window.functionCallingTools = {
  /**
   * 文字列形式の四則演算の式を計算し、結果を返す関数
   * @param {object} args - AIによって提供される引数オブジェクト
   * @param {string} args.expression - 計算する数式 (例: "2 * (3 + 5)")
   * @returns {Promise<object>} 計算結果またはエラーを含むオブジェクトを返すPromise
   */
  calculate: async function({ expression }) {
    console.log(`[Function Calling] calculateが呼び出されました。式: ${expression}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 意図的な遅延

    const allowedChars = /^[0-9+\-*/().\s]+$/;
    if (!allowedChars.test(expression)) {
      console.error("[Function Calling] calculate: 式に許可されていない文字が含まれています。");
      return { error: "無効な式です。四則演算と括弧のみ使用できます。" };
    }

    try {
      const result = new Function(`return ${expression}`)();
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error("計算結果が無効です。");
      }
      console.log(`[Function Calling] calculate: 計算結果: ${result}`);
      return { result: result };
    } catch (error) {
      console.error(`[Function Calling] calculate: 計算エラー: ${error.message}`);
      return { error: `計算エラー: ${error.message}` };
    }
  },
  // 新しい関数を登録
  manage_persistent_memory: manage_persistent_memory
};

/**
* AIに提供するツールの定義情報 (Tool Declaration)
*/
window.functionDeclarations = [
  {
      "function_declarations": [
          {
              "name": "calculate",
              "description": "ユーザーから与えられた数学的な計算式（四則演算）を評価し、その正確な結果を返します。複雑な計算や、信頼性が求められる計算の場合に必ず使用してください。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "expression": {
                          "type": "STRING",
                          "description": "計算する数式。例: '2 * (3 + 5)'"
                      }
                  },
                  "required": ["expression"]
              }
          },
          // 新しい関数の定義を追加
          {
              "name": "manage_persistent_memory",
              "description": "現在の会話セッションに限定して、重要な情報（記念日、登場人物の設定、世界の法則など）を後から参照できるように記憶・管理します。他の会話には影響しません。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "action": {
                          "type": "STRING",
                          "description": "実行する操作を選択します。'add': 情報を追加/上書き, 'get': 情報を取得, 'delete': 情報を削除, 'list': 記憶している全ての情報キーを一覧表示。"
                      },
                      "key": {
                          "type": "STRING",
                          "description": "情報を識別するための一意のキー（名前）。'add', 'get', 'delete' アクションで必須です。例: '主人公の性格', '次の目的地'"
                      },
                      "value": {
                          "type": "STRING",
                          "description": "キーに紐付けて記憶させる情報の内容。'add' アクションで必須です。例: '冷静沈着', '東の塔'"
                      }
                  },
                  "required": ["action"]
              }
          }
      ]
  }
];