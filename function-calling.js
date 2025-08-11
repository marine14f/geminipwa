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

  if (!state.currentChatId) {
      const errorMsg = "チャットがまだ保存されていません。最初のメッセージを送信してから、再度実行してください。";
      console.error(`[Function Calling] エラー: ${errorMsg}`);
      return { error: errorMsg };
  }

  try {
      const chat = await dbUtils.getChat(state.currentChatId);
      if (!chat) {
          throw new Error(`チャットデータ (ID: ${state.currentChatId}) が見つかりません。`);
      }

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

      chat.updatedAt = Date.now();
      await dbUtils.saveChat(chat.title);

      state.currentPersistentMemory = memory;

      console.log(`[Function Calling] 処理完了:`, resultData);
      return resultData;

  } catch (error) {
      console.error(`[Function Calling] manage_persistent_memoryでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * 現在の日付と時刻をJST（日本標準時）で取得する関数
 * @returns {Promise<object>} JSTの日付、曜日、時刻を含むオブジェクトを返すPromise
 */
async function getCurrentDateTime() {
    console.log(`[Function Calling] getCurrentDateTimeが呼び出されました。`);
    try {
        const options = {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        const formatter = new Intl.DateTimeFormat('ja-JP', options);
        const parts = formatter.formatToParts(new Date());

        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        const weekday = parts.find(p => p.type === 'weekday').value;
        const hour = parts.find(p => p.type === 'hour').value;
        const minute = parts.find(p => p.type === 'minute').value;
        const second = parts.find(p => p.type === 'second').value;

        const result = {
            date: `${year}年${month}月${day}日`,
            weekday: weekday,
            time: `${hour}:${minute}:${second}`,
            timezone: "JST (UTC+9)"
        };

        console.log(`[Function Calling] getCurrentDateTime: 取得結果:`, result);
        return result;

    } catch (error) {
        console.error(`[Function Calling] getCurrentDateTimeでエラーが発生しました:`, error);
        return { error: `時刻の取得中にエラーが発生しました: ${error.message}` };
    }
}

// ▼▼▼【ここから追加】▼▼▼
/**
 * TRPGなどで使用するダイスロールを実行する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.expression - ダイスロールの式 (例: "2d6", "1d100+5")
 * @returns {Promise<object>} ダイスロールの結果詳細を含むオブジェクトを返すPromise
 */
async function rollDice({ expression }) {
    console.log(`[Function Calling] rollDiceが呼び出されました。式: ${expression}`);

    // 式をパースするための正規表現 (例: 2d6+3)
    const diceRegex = /^(?<count>\d+)d(?<sides>\d+)(?:(?<modifier_op>[+-])(?<modifier_val>\d+))?$/i;
    const match = expression.trim().match(diceRegex);

    if (!match) {
        const errorMsg = "無効なダイス形式です。「(個数)d(面数)+(補正値)」の形式で指定してください。(例: 1d6, 2d10+5)";
        console.error(`[Function Calling] rollDice: ${errorMsg}`);
        return { error: errorMsg };
    }

    const { count, sides, modifier_op, modifier_val } = match.groups;
    const numCount = parseInt(count, 10);
    const numSides = parseInt(sides, 10);
    const numModifier = modifier_val ? parseInt(modifier_val, 10) : 0;

    // バリデーション
    if (numCount < 1 || numCount > 100) {
        return { error: "ダイスの個数は1個から100個までです。" };
    }
    if (numSides < 1 || numSides > 1000) {
        return { error: "ダイスの面数は1面から1000面までです。" };
    }
    if (numModifier > 10000) {
        return { error: "補正値は10000までです。" };
    }

    try {
        const rolls = [];
        let sum = 0;
        for (let i = 0; i < numCount; i++) {
            // 1からnumSidesまでのランダムな整数を生成
            const roll = Math.floor(Math.random() * numSides) + 1;
            rolls.push(roll);
            sum += roll;
        }

        let total = sum;
        if (modifier_op === '+') {
            total += numModifier;
        } else if (modifier_op === '-') {
            total -= numModifier;
        }

        const result = {
            expression: expression,
            rolls: rolls,
            sum: sum,
            modifier: modifier_op ? `${modifier_op}${numModifier}` : "なし",
            total: total
        };

        console.log(`[Function Calling] rollDice: 実行結果:`, result);
        return result;

    } catch (error) {
        console.error(`[Function Calling] rollDiceで予期せぬエラー:`, error);
        return { error: `ダイスロール中に予期せぬエラーが発生しました: ${error.message}` };
    }
}
// ▲▲▲【ここまで追加】▲▲▲


window.functionCallingTools = {
  calculate: async function({ expression }) {
    console.log(`[Function Calling] calculateが呼び出されました。式: ${expression}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

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
  manage_persistent_memory: manage_persistent_memory,
  getCurrentDateTime: getCurrentDateTime,
  // ▼▼▼【ここから追加】▼▼▼
  rollDice: rollDice
  // ▲▲▲【ここまで追加】▲▲▲
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
          },
          {
            "name": "getCurrentDateTime",
            "description": "現実世界の現在の日付と時刻（日本時間）を取得します。この情報を利用することで、ユーザーとの会話がより現実的で没入感のあるものになる場合にのみ使用してください。会話の文脈を慎重に判断し、ロールプレイの世界観を壊すなど、不自然になる場合は絶対に使用しないでください。",
            "parameters": {
                "type": "OBJECT",
                "properties": {},
                "required": []
            }
          },
          {
            "name": "rollDice",
            "description": "テーブルトークRPG（TRPG）やボードゲームなどで使用される、指定された形式のダイスを振って結果を返します。例えば「1d100」や「2d6+3」のような形式のダイスロールを要求された場合に使用します。単純な乱数ではなく、ダイスロールの文脈で呼び出してください。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "expression": {
                        "type": "STRING",
                        "description": "ダイスロールの式。XdY+Z (X=個数, Y=面数, Z=補正値) の形式。例: '1d100', '2d6+5', '3d8-2'"
                    }
                },
                "required": ["expression"]
            }
          }
      ]
  }
];