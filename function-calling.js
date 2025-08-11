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

/**
 * TRPGなどで使用するダイスロールを実行する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.expression - ダイスロールの式 (例: "2d6", "1d100+5")
 * @returns {Promise<object>} ダイスロールの結果詳細を含むオブジェクトを返すPromise
 */
async function rollDice({ expression }) {
    console.log(`[Function Calling] rollDiceが呼び出されました。式: ${expression}`);

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

/**
 * タイマーを管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "start", "check", "stop" のいずれか
 * @param {string} args.timer_name - タイマーを識別するための一意の名前
 * @param {number} [args.duration_minutes] - タイマーの期間（分単位）。startアクションで必須
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_timer({ action, timer_name, duration_minutes }) {
    console.log(`[Function Calling] manage_timerが呼び出されました。`, { action, timer_name, duration_minutes });

    if (!timer_name) {
        return { error: "タイマー名(timer_name)は必須です。" };
    }

    switch (action) {
        case "start":
            if (typeof duration_minutes !== 'number' || duration_minutes <= 0) {
                return { error: "タイマーを開始するには、0より大きい分数(duration_minutes)が必要です。" };
            }
            return appLogic.timerManager.start(timer_name, duration_minutes);

        case "check":
            return appLogic.timerManager.check(timer_name);

        case "stop":
            return appLogic.timerManager.stop(timer_name);

        default:
            return { error: `無効なアクションです: ${action}` };
    }
}

/**
 * キャラクターのステータス（HP, MP, 好感度など）を管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.character_name - 操作対象のキャラクター名
 * @param {string} args.action - "set", "increase", "decrease", "get" のいずれか
 * @param {string} args.status_key - 操作対象のステータス名 (例: "HP", "好感度")
 * @param {number} [args.value] - "set", "increase", "decrease" アクションで使用する数値
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_character_status({ character_name, action, status_key, value }) {
    console.log(`[Function Calling] manage_character_statusが呼び出されました。`, { character_name, action, status_key, value });

    if (!character_name || !action || !status_key) {
        return { error: "引数 'character_name', 'action', 'status_key' は必須です。" };
    }

    if (["set", "increase", "decrease"].includes(action) && typeof value !== 'number') {
        return { error: `アクション '${action}' には数値型の 'value' が必要です。` };
    }

    try {
        const chat = await dbUtils.getChat(state.currentChatId);
        if (!chat) {
            throw new Error(`チャットデータ (ID: ${state.currentChatId}) が見つかりません。`);
        }

        if (!chat.persistentMemory) chat.persistentMemory = {};
        
        const memoryKey = `character_${character_name}`;
        if (!chat.persistentMemory[memoryKey]) {
            chat.persistentMemory[memoryKey] = {};
        }
        const characterStatus = chat.persistentMemory[memoryKey];

        let currentValue = characterStatus[status_key] || 0;
        let newValue;
        let message;

        switch (action) {
            case "set":
                newValue = value;
                message = `${character_name}の${status_key}を${newValue}に設定しました。`;
                break;
            
            case "increase":
                newValue = currentValue + value;
                message = `${character_name}の${status_key}が${value}上昇し、${newValue}になりました。`;
                break;

            case "decrease":
                newValue = currentValue - value;
                message = `${character_name}の${status_key}が${value}減少し、${newValue}になりました。`;
                break;

            case "get":
                message = `${character_name}の現在の${status_key}は${currentValue}です。`;
                const getResult = { success: true, character_name, status_key, value: currentValue, message };
                console.log(`[Function Calling] 処理完了:`, getResult);
                return getResult;

            default:
                return { error: `無効なアクションです: ${action}` };
        }

        characterStatus[status_key] = newValue;
        
        chat.updatedAt = Date.now();
        await dbUtils.saveChat(chat.title);

        state.currentPersistentMemory = chat.persistentMemory;

        const result = { success: true, character_name, status_key, old_value: currentValue, new_value: newValue, message };
        console.log(`[Function Calling] 処理完了:`, result);
        return result;

    } catch (error) {
        console.error(`[Function Calling] manage_character_statusでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}

/**
 * キャラクターの所持品を管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.character_name - 操作対象のキャラクター名
 * @param {string} args.action - "add", "remove", "check" のいずれか
 * @param {string} args.item_name - 操作対象のアイテム名
 * @param {number} [args.quantity=1] - "add", "remove" アクションで使用する個数 (デフォルト1)
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_inventory({ character_name, action, item_name, quantity = 1 }) {
    console.log(`[Function Calling] manage_inventoryが呼び出されました。`, { character_name, action, item_name, quantity });

    if (!character_name || !action || !item_name) {
        return { error: "引数 'character_name', 'action', 'item_name' は必須です。" };
    }
    if (["add", "remove"].includes(action) && (typeof quantity !== 'number' || quantity <= 0)) {
        return { error: `アクション '${action}' には1以上の数値型の 'quantity' が必要です。` };
    }

    try {
        const chat = await dbUtils.getChat(state.currentChatId);
        if (!chat) {
            throw new Error(`チャットデータ (ID: ${state.currentChatId}) が見つかりません。`);
        }

        if (!chat.persistentMemory) chat.persistentMemory = {};
        if (!chat.persistentMemory.inventories) chat.persistentMemory.inventories = {};
        
        const inventories = chat.persistentMemory.inventories;
        if (!inventories[character_name]) {
            inventories[character_name] = {};
        }
        const characterInventory = inventories[character_name];
        
        const currentQuantity = characterInventory[item_name] || 0;
        let message;

        switch (action) {
            case "add":
                const newQuantityAdd = currentQuantity + quantity;
                characterInventory[item_name] = newQuantityAdd;
                message = `${character_name}は「${item_name}」を${quantity}個手に入れた。(所持数: ${newQuantityAdd})`;
                break;

            // ▼▼▼【ここから変更】▼▼▼
            case "remove":
                const removedAmount = Math.min(currentQuantity, quantity); // 実際に削除する個数
                
                if (removedAmount === 0) {
                    message = `${character_name}は「${item_name}」を持っていないため使えなかった。`;
                    // 処理は成功として扱い、AIに状況を正しく伝える
                    return { success: true, message: message, removed_quantity: 0 };
                }

                const newQuantityRemove = currentQuantity - removedAmount;
                if (newQuantityRemove > 0) {
                    characterInventory[item_name] = newQuantityRemove;
                } else {
                    delete characterInventory[item_name]; // 0個になったら所持品リストから削除
                }
                
                if (removedAmount < quantity) {
                    message = `${character_name}は「${item_name}」を${removedAmount}個しか持っていなかったため、全て使った。(残り: 0)`;
                } else {
                    message = `${character_name}は「${item_name}」を${removedAmount}個使った。(残り: ${newQuantityRemove})`;
                }
                break;
            // ▲▲▲【ここまで変更】▲▲▲

            case "check":
                message = `${character_name}は「${item_name}」を${currentQuantity}個持っています。`;
                const checkResult = { success: true, character_name, item_name, quantity: currentQuantity, message };
                console.log(`[Function Calling] 処理完了:`, checkResult);
                return checkResult;

            default:
                return { error: `無効なアクションです: ${action}` };
        }
        
        chat.updatedAt = Date.now();
        await dbUtils.saveChat(chat.title);
        state.currentPersistentMemory = chat.persistentMemory;

        const result = { success: true, message };
        console.log(`[Function Calling] 処理完了:`, result);
        return result;

    } catch (error) {
        console.error(`[Function Calling] manage_inventoryでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}

/**
 * 物語のシーン（場所、時間、雰囲気など）を管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "set", "get", "push", "pop" のいずれか
 * @param {string} [args.scene_id] - シーンを識別するための一意のID
 * @param {string} [args.location] - 場所名
 * @param {string} [args.time_of_day] - 時間帯 ("morning", "noon", "evening", "night")
 * @param {string} [args.mood] - 雰囲気 ("sweet", "calm", "tense", "dark"など)
 * @param {string} [args.pov] - 視点 ("first", "third")
 * @param {string} [args.notes] - その他のメモ
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_scene(args) {
    const { action, ...scene_details } = args;
    console.log(`[Function Calling] manage_sceneが呼び出されました。`, args);

    if (!action) {
        return { error: "引数 'action' は必須です。" };
    }

    try {
        const chat = await dbUtils.getChat(state.currentChatId);
        if (!chat) {
            throw new Error(`チャットデータ (ID: ${state.currentChatId}) が見つかりません。`);
        }

        if (!chat.persistentMemory) chat.persistentMemory = {};
        if (!Array.isArray(chat.persistentMemory.scene_stack)) {
            chat.persistentMemory.scene_stack = [{ scene_id: "initial", location: "不明な場所" }];
        }
        const scene_stack = chat.persistentMemory.scene_stack;

        let message;
        let currentScene = scene_stack[scene_stack.length - 1];

        switch (action) {
            case "get":
                message = `現在のシーン情報を取得しました。`;
                const getResult = { success: true, current_scene: currentScene, message };
                console.log(`[Function Calling] 処理完了:`, getResult);
                return getResult;

            case "set":
                Object.keys(scene_details).forEach(key => {
                    if (scene_details[key] !== undefined) {
                        currentScene[key] = scene_details[key];
                    }
                });
                message = `シーン情報を更新しました。現在の場所: ${currentScene.location || '未設定'}`;
                break;

            case "push":
                const newScene = { ...currentScene, ...scene_details };
                scene_stack.push(newScene);
                message = `新しいシーン「${newScene.location || '新しい場所'}」に移行しました。`;
                break;
            
            case "pop":
                if (scene_stack.length <= 1) {
                    return { error: "これ以上前のシーンに戻ることはできません。" };
                }
                const poppedScene = scene_stack.pop();
                currentScene = scene_stack[scene_stack.length - 1];
                message = `シーン「${poppedScene.location || '前の場所'}」から「${currentScene.location || '現在の場所'}」に戻りました。`;
                break;

            default:
                return { error: `無効なアクションです: ${action}` };
        }
        
        const finalCurrentScene = scene_stack[scene_stack.length - 1];
        
        chat.updatedAt = Date.now();
        await dbUtils.saveChat(chat.title);

        state.currentPersistentMemory = chat.persistentMemory;
        state.currentScene = finalCurrentScene;

        const result = { success: true, current_scene: finalCurrentScene, message };
        console.log(`[Function Calling] 処理完了:`, result);
        return result;

    } catch (error) {
        console.error(`[Function Calling] manage_sceneでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}


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
  rollDice: rollDice,
  manage_timer: manage_timer,
  manage_character_status: manage_character_status,
  manage_inventory: manage_inventory,
  manage_scene: manage_scene
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
          },
          {
            "name": "manage_timer",
            "description": "指定した時間（分単位）でタイマーを設定、確認、停止します。時間制限のあるイベントや、一定時間後の応答をシミュレートするのに使用します。タイマーが時間切れになると、AIにその事実が通知されます。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "action": {
                        "type": "STRING",
                        "description": "実行する操作。'start': タイマーを開始, 'check': 残り時間を確認, 'stop': タイマーを停止。"
                    },
                    "timer_name": {
                        "type": "STRING",
                        "description": "タイマーを識別するための一意の名前。例: '爆弾解除タイマー', '返信待ちタイマー'"
                    },
                    "duration_minutes": {
                        "type": "NUMBER",
                        "description": "'start'アクション時に設定するタイマーの期間（分単位）。例: 5"
                    }
                },
                "required": ["action", "timer_name"]
            }
          },
          {
            "name": "manage_character_status",
            "description": "ロールプレイングゲームや物語に登場するキャラクターのステータス（HP, MP, 好感度, 疲労度など）を設定、増減、または確認します。キャラクターのパラメータが変動するイベントが発生した場合に使用します。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "character_name": {
                        "type": "STRING",
                        "description": "操作対象のキャラクターの名前。例: '主人公', 'ヒロインA'"
                    },
                    "action": {
                        "type": "STRING",
                        "description": "実行する操作。'set': 値を直接設定, 'increase': 値を増加, 'decrease': 値を減少, 'get': 現在の値を確認。"
                    },
                    "status_key": {
                        "type": "STRING",
                        "description": "操作対象のステータスの種類。例: 'HP', 'MP', '好感度', '疲労度'"
                    },
                    "value": {
                        "type": "NUMBER",
                        "description": "'set', 'increase', 'decrease' アクションで使用する数値。例: 10"
                    }
                },
                "required": ["character_name", "action", "status_key"]
            }
          },
          {
            "name": "manage_inventory",
            "description": "キャラクターの所持品（アイテム）を管理します。アイテムの追加、削除、所持確認ができます。物語の中でキャラクターがアイテムを手に入れたり、使ったりした場合に使用してください。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "character_name": {
                        "type": "STRING",
                        "description": "操作対象のキャラクターの名前。例: '主人公'"
                    },
                    "action": {
                        "type": "STRING",
                        "description": "実行する操作。'add': アイテムを追加, 'remove': アイテムを削除/消費, 'check': 所持数を確認。"
                    },
                    "item_name": {
                        "type": "STRING",
                        "description": "操作対象のアイテムの名前。例: '薬草', 'ポーション'"
                    },
                    "quantity": {
                        "type": "NUMBER",
                        "description": "'add'または'remove'アクションで使用するアイテムの個数。指定がない場合は1として扱われます。"
                    }
                },
                "required": ["character_name", "action", "item_name"]
            }
          },
          {
            "name": "manage_scene",
            "description": "物語の場面設定（場所、時間帯、雰囲気、視点など）を管理します。場面転換や時間経過、視点変更が発生した際に呼び出し、現在のシーン情報を更新・確認します。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "action": {
                        "type": "STRING",
                        "description": "実行する操作。'set': 現在のシーン情報を部分的に更新する。'get': 現在のシーン情報を取得する。'push': 新しいシーンに移行する（前のシーンは記憶される）。'pop': 一つ前のシーンに戻る。"
                    },
                    "scene_id": {
                        "type": "STRING",
                        "description": "シーンを識別するための一意のID。後で参照する場合などに使用します。"
                    },
                    "location": {
                        "type": "STRING",
                        "description": "場面の場所。例: '薄暗い酒場', '王城の謁見の間'"
                    },
                    "time_of_day": {
                        "type": "STRING",
                        "description": "場面の時間帯。'morning', 'noon', 'evening', 'night' から選択します。"
                    },
                    "mood": {
                        "type": "STRING",
                        "description": "場面の雰囲気。例: 'sweet'(甘い), 'calm'(穏やか), 'tense'(緊迫), 'dark'(不穏), 'comical'(滑稽)"
                    },
                    "pov": {
                        "type": "STRING",
                        "description": "物語の視点。'first'(一人称), 'third'(三人称) から選択します。"
                    },
                    "notes": {
                        "type": "STRING",
                        "description": "シーンに関するその他の補足情報。例: '外は土砂降りの雨が降っている'"
                    }
                },
                "required": ["action"]
            }
          }
      ]
  }
];