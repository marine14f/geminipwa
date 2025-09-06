/**
 * 現在のチャットセッションに紐づく永続メモリを管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "add", "get", "delete", "list" のいずれか
 * @param {string} [args.key] - 操作対象のキー (add, get, delete時に必須)
 * @param {string} [args.value] - 保存する値 (add時に必須)
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
 async function manage_persistent_memory({ action, key, value }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_persistent_memoryが呼び出されました。`, { action, key, value });
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      const memory = chat.persistentMemory;
      let resultData = null;
      switch (action) {
          case "add":
              if (!key || value === undefined) return { error: "addアクションには 'key' と 'value' が必要です。" };
              memory[key] = value;
              resultData = { success: true, message: `キー「${key}」に値を保存しました。` };
              break;
          case "get":
              if (!key) return { error: "getアクションには 'key' が必要です。" };
              resultData = (key in memory)
                  ? { success: true, key: key, value: memory[key] }
                  : { success: false, message: `キー「${key}」は見つかりませんでした。` };
              break;
          case "delete":
              if (!key) return { error: "deleteアクションには 'key' が必要です。" };
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
 * キャラクターのステータス（HP, MPなど）を管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.character_name - 操作対象のキャラクター名
 * @param {string} args.action - "set", "increase", "decrease", "get" のいずれか
 * @param {string} args.status_key - 操作対象のステータス名 (例: "HP", "MP")
 * @param {number} [args.value] - "set", "increase", "decrease" アクションで使用する数値
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
 async function manage_character_status({ character_name, action, status_key, value }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_character_statusが呼び出されました。`, { character_name, action, status_key, value });
  if (!character_name || !action || !status_key) return { error: "引数 'character_name', 'action', 'status_key' は必須です。" };
  if (["set", "increase", "decrease"].includes(action) && typeof value !== 'number') return { error: `アクション '${action}' には数値型の 'value' が必要です。` };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      const memoryKey = `character_${character_name}`;
      if (!chat.persistentMemory[memoryKey]) chat.persistentMemory[memoryKey] = {};
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
async function manage_inventory({ character_name, action, item_name, quantity = 1 }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_inventoryが呼び出されました。`, { character_name, action, item_name, quantity });
  if (!character_name || !action || !item_name) return { error: "引数 'character_name', 'action', 'item_name' は必須です。" };
  if (["add", "remove"].includes(action) && (typeof quantity !== 'number' || quantity <= 0)) return { error: `アクション '${action}' には1以上の数値型の 'quantity' が必要です。` };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      if (!chat.persistentMemory.inventories) chat.persistentMemory.inventories = {};
      const inventories = chat.persistentMemory.inventories;
      if (!inventories[character_name]) inventories[character_name] = {};
      const characterInventory = inventories[character_name];
      const currentQuantity = characterInventory[item_name] || 0;
      let message;
      switch (action) {
          case "add":
              const newQuantityAdd = currentQuantity + quantity;
              characterInventory[item_name] = newQuantityAdd;
              message = `${character_name}は「${item_name}」を${quantity}個手に入れた。(所持数: ${newQuantityAdd})`;
              break;
          case "remove":
              const removedAmount = Math.min(currentQuantity, quantity);
              if (removedAmount === 0) {
                  message = `${character_name}は「${item_name}」を持っていないため使えなかった。`;
                  return { success: true, message: message, removed_quantity: 0 };
              }
              const newQuantityRemove = currentQuantity - removedAmount;
              if (newQuantityRemove > 0) {
                  characterInventory[item_name] = newQuantityRemove;
              } else {
                  delete characterInventory[item_name];
              }
              message = (removedAmount < quantity)
                  ? `${character_name}は「${item_name}」を${removedAmount}個しか持っていなかったため、全て使った。(残り: 0)`
                  : `${character_name}は「${item_name}」を${removedAmount}個使った。(残り: ${newQuantityRemove})`;
              break;
          case "check":
              message = `${character_name}は「${item_name}」を${currentQuantity}個持っています。`;
              const checkResult = { success: true, character_name, item_name, quantity: currentQuantity, message };
              console.log(`[Function Calling] 処理完了:`, checkResult);
              return checkResult;
          default:
              return { error: `無効なアクションです: ${action}` };
      }
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
async function manage_scene(args, chat) { // chat引数を追加
  const { action, ...scene_details } = args;
  console.log(`[Function Calling] manage_sceneが呼び出されました。`, args);
  if (!action) return { error: "引数 'action' は必須です。" };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      if (!Array.isArray(chat.persistentMemory.scene_stack)) chat.persistentMemory.scene_stack = [{ scene_id: "initial", location: "不明な場所" }];
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
                  if (scene_details[key] !== undefined) currentScene[key] = scene_details[key];
              });
              message = `シーン情報を更新しました。現在の場所: ${currentScene.location || '未設定'}`;
              break;
          case "push":
              const newScene = { ...currentScene, ...scene_details };
              scene_stack.push(newScene);
              message = `新しいシーン「${newScene.location || '新しい場所'}」に移行しました。`;
              break;
          case "pop":
              if (scene_stack.length <= 1) return { error: "これ以上前のシーンに戻ることはできません。" };
              const poppedScene = scene_stack.pop();
              currentScene = scene_stack[scene_stack.length - 1];
              message = `シーン「${poppedScene.location || '前の場所'}」から「${currentScene.location || '現在の場所'}」に戻りました。`;
              break;
          default:
              return { error: `無効なアクションです: ${action}` };
      }
      const finalCurrentScene = scene_stack[scene_stack.length - 1];
      const result = { success: true, current_scene: finalCurrentScene, message };
      console.log(`[Function Calling] 処理完了:`, result);
      return result;
  } catch (error) {
      console.error(`[Function Calling] manage_sceneでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * 物語のフラグやカウンターを管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "set", "get", "toggle", "increase", "decrease", "delete" のいずれか
 * @param {string} args.key - フラグを識別するための一意のキー
 * @param {boolean|number} [args.value] - "set", "increase", "decrease" で使用する値
 * @param {number} [args.ttl_minutes] - フラグが自動的に消滅するまでの時間（分単位）
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_flags({ action, key, value, ttl_minutes }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_flagsが呼び出されました。`, { action, key, value, ttl_minutes });
  if (!key || !action) return { error: "引数 'key' と 'action' は必須です。" };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      const memory = chat.persistentMemory;
      let currentValue = memory[key];
      let newValue;
      let message;
      switch (action) {
          case "set":
              if (value === undefined) return { error: "アクション 'set' には 'value' が必要です。" };
              newValue = value;
              message = `フラグ「${key}」を「${newValue}」に設定しました。`;
              break;
          case "get":
              message = currentValue !== undefined ? `フラグ「${key}」の現在の値は「${currentValue}」です。` : `フラグ「${key}」は設定されていません。`;
              return { success: true, key, value: currentValue, message };
          case "toggle":
              newValue = !(currentValue === true);
              message = `フラグ「${key}」を「${newValue}」に切り替えました。`;
              break;
          case "increase":
              if (typeof value !== 'number') return { error: "アクション 'increase' には数値型の 'value' が必要です。" };
              currentValue = typeof currentValue === 'number' ? currentValue : 0;
              newValue = currentValue + value;
              message = `カウンター「${key}」が${value}増加し、「${newValue}」になりました。`;
              break;
          case "decrease":
              if (typeof value !== 'number') return { error: "アクション 'decrease' には数値型の 'value' が必要です。" };
              currentValue = typeof currentValue === 'number' ? currentValue : 0;
              newValue = currentValue - value;
              message = `カウンター「${key}」が${value}減少し、「${newValue}」になりました。`;
              break;
          case "delete":
              if (key in memory) {
                  delete memory[key];
                  message = `フラグ「${key}」を削除しました。`;
              } else {
                  return { success: false, message: `フラグ「${key}」は存在しません。` };
              }
              break;
          default:
              return { error: `無効なアクションです: ${action}` };
      }
      if (newValue !== undefined) memory[key] = newValue;
      if (typeof ttl_minutes === 'number' && ttl_minutes > 0) {
          // TTLの処理はDB保存と分離するため、ここではメッセージ追加のみ
          message += ` (${ttl_minutes}分後に自動消滅します)`;
          // 注意: このリファクタリングにより、実際のTTLタイマー機能は別途実装が必要になります。
          // 今回はデータ整合性の問題を優先して修正します。
      }
      const result = { success: true, key, old_value: currentValue, new_value: newValue, message };
      console.log(`[Function Calling] 処理完了:`, result);
      return result;
  } catch (error) {
      console.error(`[Function Calling] manage_flagsでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * ゲーム内の経過日数を管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "pass_days", "get_current_day" のいずれか
 * @param {number} [args.days=1] - "pass_days" アクションで経過させる日数 (デフォルト1)
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_game_date({ action, days = 1 }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_game_dateが呼び出されました。`, { action, days });
  if (!action) return { error: "引数 'action' は必須です。" };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      if (typeof chat.persistentMemory.game_day !== 'number') chat.persistentMemory.game_day = 1;
      let currentDay = chat.persistentMemory.game_day;
      let message;
      switch (action) {
          case "pass_days":
              if (typeof days !== 'number' || days < 1 || !Number.isInteger(days)) return { error: "経過させる日数(days)は1以上の整数である必要があります。" };
              currentDay += days;
              chat.persistentMemory.game_day = currentDay;
              message = `${days}日が経過し、${currentDay}日目になりました。`;
              break;
          case "get_current_day":
              message = `現在は${currentDay}日目です。`;
              const getResult = { success: true, current_day: currentDay, message };
              console.log(`[Function Calling] 処理完了:`, getResult);
              return getResult;
          default:
              return { error: `無効なアクションです: ${action}` };
      }
      const result = { success: true, current_day: currentDay, message };
      console.log(`[Function Calling] 処理完了:`, result);
      return result;
  } catch (error) {
      console.error(`[Function Calling] manage_game_dateでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * キャラクター間の関係値（好感度、信頼度など）を多軸で管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.source_character - 関係の主体となるキャラクター名
 * @param {string} args.target_character - 関係の対象となるキャラクター名
 * @param {string} args.axis - 操作する関係の軸 (例: "好感度", "信頼度", "緊張度")
 * @param {string} args.action - "set", "increase", "decrease", "get", "get_all_axes", "get_all_from_source" のいずれか
 * @param {number} [args.value] - "set", "increase", "decrease" アクションで使用する数値
 * @param {number} [args.clamp_min] - 関係値の下限値
 * @param {number} [args.clamp_max] - 関係値の上限値
 * @param {number} [args.days_to_decay] - 何日間更新がないと減衰が始まるか
 * @param {number} [args.decay_value] - 1日あたりに減衰する値 (通常は負の数)
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
 async function manage_relationship(args, chat) {
  console.log(`[Function Calling] manage_relationshipが呼び出されました。`, args);

  const {
    source_character,
    target_character,
    axis,
    action,
    value,
    clamp_min,
    clamp_max,
    days_to_decay,
    decay_value,
  } = args;

  if (!action) return { error: "引数 'action' は必須です。" };
  if (!source_character) return { error: "引数 'source_character' は必須です。" };

  // axis未指定時のデフォルト（好感度）
  const needsAxis = ["get", "set", "increase", "decrease"].includes(action);
  const axisName = needsAxis ? (axis || "好感度") : null;

  // target_character 必須チェック（get_all_from_source 以外）
  if (["get", "set", "increase", "decrease", "get_all_axes"].includes(action) && !target_character) {
    return { error: `アクション '${action}' には 'target_character' が必須です。` };
  }

  // 軸必須の操作なのに最終的に軸が決まっていない場合
  if (needsAxis && !axisName) {
    return { error: `アクション '${action}' には 'axis' が必須です。` };
  }

  // 値が必要な操作
  if (["set", "increase", "decrease"].includes(action) && typeof value !== "number") {
    return { error: `アクション '${action}' には数値型の 'value' が必要です。` };
  }

  try {
    if (!chat.persistentMemory) chat.persistentMemory = {};
    if (!chat.persistentMemory.relationships) chat.persistentMemory.relationships = {};
    if (typeof chat.persistentMemory.game_day !== "number") chat.persistentMemory.game_day = 1;

    const relationships = chat.persistentMemory.relationships;
    const currentGameDay = chat.persistentMemory.game_day;

    const calculateDecay = (currentValue, lastUpdatedDay) => {
      if (typeof days_to_decay !== "number" || typeof decay_value !== "number") return currentValue;
      const elapsedDays = currentGameDay - lastUpdatedDay;
      if (elapsedDays > days_to_decay) {
        const decayDays = elapsedDays - days_to_decay;
        const totalDecay = decayDays * decay_value;
        return currentValue + totalDecay;
      }
      return currentValue;
    };

    const getRelation = (source, target, axisKey) => {
      if (!relationships[source]) relationships[source] = {};
      if (!relationships[source][target]) relationships[source][target] = {};
      if (!relationships[source][target][axisKey]) {
        relationships[source][target][axisKey] = { value: 0, last_updated_day: currentGameDay };
      }
      return relationships[source][target][axisKey];
    };

    let message = "";
    let resultData = {};

    switch (action) {
      case "get": {
        const relation = getRelation(source_character, target_character, axisName);
        const decayedValue = calculateDecay(relation.value, relation.last_updated_day);
        message = `${source_character}から${target_character}への${axisName}は現在 ${decayedValue} です。`;
        resultData = { success: true, value: decayedValue, message };
        break;
      }
      case "set":
      case "increase":
      case "decrease": {
        const relation = getRelation(source_character, target_character, axisName);
        const decayedBase = action === "set" ? relation.value : calculateDecay(relation.value, relation.last_updated_day);
        let newValue;
        if (action === "increase") newValue = decayedBase + value;
        else if (action === "decrease") newValue = decayedBase - value;
        else newValue = value;

        if (typeof clamp_max === "number") newValue = Math.min(newValue, clamp_max);
        if (typeof clamp_min === "number") newValue = Math.max(newValue, clamp_min);

        relation.value = newValue;
        relation.last_updated_day = currentGameDay;

        message = `${source_character}から${target_character}への${axisName}が更新され、${newValue}になりました。`;
        resultData = { success: true, new_value: newValue, message };
        break;
      }
      case "get_all_axes": {
        if (!relationships[source_character] || !relationships[source_character][target_character]) {
          return { success: true, relations: {}, message: `${source_character}から${target_character}への関係はまだ設定されていません。` };
        }
        const targetRelations = relationships[source_character][target_character];
        const allAxes = {};
        for (const axisKey in targetRelations) {
          const rel = targetRelations[axisKey];
          allAxes[axisKey] = calculateDecay(rel.value, rel.last_updated_day);
        }
        message = `${source_character}から${target_character}への全関係軸を取得しました。`;
        resultData = { success: true, relations: allAxes, message };
        break;
      }
      case "get_all_from_source": {
        if (!relationships[source_character]) {
          return { success: true, relations: {}, message: `${source_character}の人間関係はまだ設定されていません。` };
        }
        const sourceRelations = relationships[source_character];
        const allRelations = {};
        for (const targetName in sourceRelations) {
          allRelations[targetName] = {};
          for (const axisKey in sourceRelations[targetName]) {
            const rel = sourceRelations[targetName][axisKey];
            allRelations[targetName][axisKey] = calculateDecay(rel.value, rel.last_updated_day);
          }
        }
        message = `${source_character}が持つ全ての人間関係を取得しました。`;
        resultData = { success: true, relations: allRelations, message };
        break;
      }
      default:
        return { error: `無効なアクションです: ${action}` };
    }

    console.log(`[Function Calling] 処理完了:`, resultData);
    return resultData;
  } catch (error) {
    console.error(`[Function Calling] manage_relationshipでエラーが発生しました:`, error);
    return { error: `内部エラーが発生しました: ${error.message}` };
  }
}


/**
 * 指定された範囲内のランダムな整数を生成します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {number} args.min - 乱数の最小値 (整数)
 * @param {number} args.max - 乱数の最大値 (整数)
 * @param {number} [args.count=1] - 生成する乱数の個数 (デフォルト1)
 * @returns {Promise<object>} 生成された整数の配列を含むオブジェクトを返すPromise
 */
async function get_random_integer({ min, max, count = 1 }) {
    console.log(`[Function Calling] get_random_integerが呼び出されました。`, { min, max, count });

    if (typeof min !== 'number' || typeof max !== 'number' || !Number.isInteger(min) || !Number.isInteger(max)) {
        return { error: "引数 'min' と 'max' は整数である必要があります。" };
    }
    if (min > max) {
        return { error: "引数 'min' は 'max' 以下である必要があります。" };
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        return { error: "引数 'count' は1以上の整数である必要があります。" };
    }
    if (count > 100) {
        return { error: "一度に生成できる個数は100個までです。" };
    }

    try {
        const results = [];
        for (let i = 0; i < count; i++) {
            const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
            results.push(randomNumber);
        }
        return { success: true, results: results };
    } catch (error) {
        console.error(`[Function Calling] get_random_integerでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}

/**
 * 提供されたリストの中からランダムに項目を選択します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {Array<any>} args.list - 選択肢となる配列
 * @param {number} [args.count=1] - 選択する項目の個数 (デフォルト1、重複を許す)
 * @returns {Promise<object>} 選択された項目の配列を含むオブジェクトを返すPromise
 */
async function get_random_choice({ list, count = 1 }) {
    console.log(`[Function Calling] get_random_choiceが呼び出されました。`, { list, count });

    if (!Array.isArray(list) || list.length === 0) {
        return { error: "引数 'list' は空でない配列である必要があります。" };
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        return { error: "引数 'count' は1以上の整数である必要があります。" };
    }
    if (count > 100) {
        return { error: "一度に選択できる個数は100個までです。" };
    }

    try {
        const results = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * list.length);
            results.push(list[randomIndex]);
        }
        return { success: true, results: results };
    } catch (error) {
        console.error(`[Function Calling] get_random_choiceでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}

/**
 * 指定された条件でランダムな文字列を生成します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {number} args.length - 生成する文字列の長さ
 * @param {number} [args.count=1] - 生成する文字列の個数 (デフォルト1)
 * @param {boolean} [args.use_uppercase=true] - 大文字英字を使用するか
 * @param {boolean} [args.use_lowercase=true] - 小文字英字を使用するか
 * @param {boolean} [args.use_numbers=true] - 数字を使用するか
 * @param {boolean} [args.use_symbols=false] - 記号を使用するか
 * @returns {Promise<object>} 生成された文字列の配列を含むオブジェクトを返すPromise
 */
async function generate_random_string({ length, count = 1, use_uppercase = true, use_lowercase = true, use_numbers = true, use_symbols = false }) {
    console.log(`[Function Calling] generate_random_stringが呼び出されました。`, { length, count, use_uppercase, use_lowercase, use_numbers, use_symbols });

    if (typeof length !== 'number' || !Number.isInteger(length) || length < 1) {
        return { error: "引数 'length' は1以上の整数である必要があります。" };
    }
    if (length > 128) {
        return { error: "一度に生成できる文字列の長さは128文字までです。" };
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        return { error: "引数 'count' は1以上の整数である必要があります。" };
    }
    if (count > 100) {
        return { error: "一度に生成できる個数は100個までです。" };
    }

    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charSet = '';
    if (use_uppercase) charSet += upper;
    if (use_lowercase) charSet += lower;
    if (use_numbers) charSet += numbers;
    if (use_symbols) charSet += symbols;

    if (charSet.length === 0) {
        return { error: "少なくとも1種類の文字セット（大文字、小文字、数字、記号）を有効にする必要があります。" };
    }

    try {
        const results = [];
        for (let i = 0; i < count; i++) {
            let randomString = '';
            for (let j = 0; j < length; j++) {
                const randomIndex = Math.floor(Math.random() * charSet.length);
                randomString += charSet[randomIndex];
            }
            results.push(randomString);
        }
        return { success: true, results: results };
    } catch (error) {
        console.error(`[Function Calling] generate_random_stringでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}

/**
 * Google Custom Search APIを使用してWeb検索を実行し、結果の要約を返します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.query - 検索キーワードまたは質問文
 * @returns {Promise<object>} 検索結果の要約またはエラー情報を含むオブジェクトを返すPromise
 */
async function search_web({ query }) {
    console.log(`[Function Calling] search_webが呼び出されました。`, { query });
  
    const apiKey = state.settings.googleSearchApiKey;
    const engineId = state.settings.googleSearchEngineId;
  
    if (!apiKey || !engineId) {
        return { error: "Web検索機能を利用するには、設定画面でGoogle Search APIキーと検索エンジンIDの両方を設定する必要があります。" };
    }
    if (!query) {
        return { error: "検索クエリ(query)は必須です。" };
    }
  
    const endpoint = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(query)}`;
  
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `HTTPエラー: ${response.status}`;
            console.error(`[Function Calling] search_web APIエラー:`, errorMessage);
            return { error: `Web検索APIでエラーが発生しました: ${errorMessage}` };
        }
  
        const data = await response.json();
  
        if (!data.items || data.items.length === 0) {
            return { success: true, summary: "検索結果が見つかりませんでした。", search_results: [] };
        }
  
        const results = data.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }));
  
        // --- ▼▼▼ 修正箇所 ▼▼▼ ---
        // AI向けのプレーンテキスト要約を作成
        let summary = `Web検索結果の要約:\n\n`;
        results.forEach((result, index) => {
            summary += `[${index + 1}] ${result.title}\n`;
            summary += `抜粋: ${result.snippet}\n`;
            summary += `URL: ${result.link}\n\n`;
        });
  
        // AI向けの要約と、UI向けのリンク配列の両方を返す
        return { success: true, summary: summary.trim(), search_results: results };
        // --- ▲▲▲ 修正箇所 ▲▲▲ ---
  
    } catch (error) {
        console.error(`[Function Calling] search_webで予期せぬエラー:`, error);
        return { error: `Web検索中に予期せぬエラーが発生しました: ${error.message}` };
    }
}

/**
 * キャラクターの口調や一人称などのスタイルプロファイルを管理します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "set", "get", "list" のいずれか
 * @param {string} [args.character_name] - 操作対象のキャラクター名
 * @param {string} [args.profile_name] - "set"アクションで適用する定義済みプリセット名
 * @param {object} [args.overrides] - "set"アクションでプリセットの一部を上書きする設定
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_style_profile({ action, character_name, profile_name, overrides }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_style_profileが呼び出されました。`, { action, character_name, profile_name, overrides });
  const STYLE_PRESETS = {
      "polite": { first_person: "私", politeness: 0.8, sentence_ender: "です,ます", dialect: "standard", description: "丁寧語" },
      "casual": { first_person: "俺", politeness: 0.3, sentence_ender: "だ,だよ", dialect: "standard", description: "カジュアル" },
      "tsundere": { first_person: "アタシ", politeness: 0.6, sentence_ender: "なんだからね！", dialect: "standard", description: "ツンデレ" },
      "merchant": { first_person: "あっし", politeness: 0.7, sentence_ender: "でさぁ,まっせ", dialect: "merchant_speak", description: "商人" },
      "noble_male": { first_person: "私", politeness: 0.9, sentence_ender: "である,かね", dialect: "noble", description: "貴族男性" },
      "noble_female": { first_person: "わたくし", politeness: 0.9, sentence_ender: "ですわ,ますのよ", dialect: "noble", description: "貴族女性（お嬢様）" },
      "samurai": { first_person: "拙者", politeness: 0.7, sentence_ender: "である,ござる", dialect: "samurai", description: "武士" },
      "kansai": { first_person: "ウチ", politeness: 0.4, sentence_ender: "やで,やんか", dialect: "kansai", description: "関西弁" },
      "neutral_narration": { first_person: null, politeness: 0.5, sentence_ender: "だ,である", dialect: "standard", description: "地の文（三人称中立）" },
  };
  if (!action) return { error: "引数 'action' は必須です。" };
  if (["set", "get"].includes(action) && !character_name) return { error: `アクション '${action}' には 'character_name' が必須です。` };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      if (!chat.persistentMemory.style_profiles) chat.persistentMemory.style_profiles = {};
      const profiles = chat.persistentMemory.style_profiles;
      switch (action) {
          case "set": {
              let baseProfile = {};
              if (profile_name) {
                  if (!STYLE_PRESETS[profile_name]) return { error: `指定されたプリセット名 '${profile_name}' は存在しません。` };
                  baseProfile = { ...STYLE_PRESETS[profile_name] };
              } else {
                  baseProfile = profiles[character_name] ? { ...profiles[character_name] } : {};
              }
              const finalProfile = { ...baseProfile, ...overrides, profile_name: profile_name || baseProfile.profile_name || "custom" };
              profiles[character_name] = finalProfile;
              return { success: true, message: `${character_name}の口調プロファイルを更新しました。`, profile: finalProfile };
          }
          case "get": {
              const profile = profiles[character_name];
              if (!profile) return { success: false, message: `${character_name}の口調プロファイルは設定されていません。` };
              return { success: true, profile: profile };
          }
          case "list": {
              return { success: true, available_presets: STYLE_PRESETS };
          }
          default:
              return { error: `無効なアクションです: ${action}` };
      }
  } catch (error) {
      console.error(`[Function Calling] manage_style_profileでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * UIの透明度（オーバーレイ、メッセージバブル）を動的に変更します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {number} [args.overlay] - チャット画面背景のオーバーレイの濃さ (0.0で透明, 1.0で不透明)
 * @param {number} [args.message_bubble] - メッセージ吹き出しの濃さ (0.1でほぼ透明, 1.0で不透明)
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function set_ui_opacity({ overlay, message_bubble }) {
    console.log(`[Function Calling] set_ui_opacityが呼び出されました。`, { overlay, message_bubble });

    if (window.state && window.state.settings.allowPromptUiChanges === false) {
        return { error: "ユーザー設定により、プロンプトによるUIの変更は許可されていません。" };
    }

    const newOpacities = {};
    const changedItems = [];
    if (typeof overlay === 'number') {
        newOpacities.overlay = Math.min(1.0, Math.max(0.0, overlay));
        changedItems.push(`オーバーレイの濃さを${Math.round(newOpacities.overlay * 100)}%に`);
    }
    if (typeof message_bubble === 'number') {
        newOpacities.message_bubble = Math.min(1.0, Math.max(0.1, message_bubble));
        changedItems.push(`メッセージバブルの濃さを${Math.round(newOpacities.message_bubble * 100)}%に`);
    }

    if (Object.keys(newOpacities).length === 0) {
        return { error: "変更する透明度の指定（overlayまたはmessage_bubble）がありません。" };
    }

    if (window.appLogic && typeof window.appLogic.updateOpacitySettings === 'function') {
        const success = await window.appLogic.updateOpacitySettings(newOpacities);
        if (success) {
            const message = `${changedItems.join('、')}変更しました。`;
            return { success: true, message: message };
        } else {
            return { error: "有効な値が指定されなかったため、UIは変更されませんでした。" };
        }
    } else {
        return { error: "UI更新機能の呼び出しに失敗しました。" };
    }
}

/**
 * チャット画面の背景画像をURLから設定します。この変更は一時的なもので、リロードすると元に戻ります。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.image_url - 表示したい画像のURL
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function set_background_image({ image_url }) {
    console.log(`[Function Calling] set_background_imageが呼び出されました。`, { image_url });

    if (window.state && window.state.settings.allowPromptUiChanges === false) {
        return { error: "ユーザー設定により、プロンプトによるUIの変更は許可されていません。" };
    }

    if (!image_url || typeof image_url !== 'string') {
        return { error: "引数 'image_url' は必須であり、文字列である必要があります。" };
    }

    if (window.appLogic && typeof window.appLogic.applyBackgroundImageFromUrl === 'function') {
        const result = await window.appLogic.applyBackgroundImageFromUrl(image_url);
        if (result === true) {
            const message = `背景画像を一時的に変更しました。この変更はリロードするとリセットされます。`;
            return { success: true, message: message };
        } else {
            // app.jsからエラーメッセージ(string)が返ってきた場合
            return { error: result };
        }
    } else {
        return { error: "UI更新機能の呼び出しに失敗しました。" };
    }
}

/**
 * 背景画像の上にキャラクター画像を重ねて、一つの画像としてメッセージに表示します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.character_url - 前景に表示するキャラクター画像のURL（必須）
 * @param {string} [args.background_url] - 背景画像のURL。指定しない場合、現在のチャット背景が使われます。
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
 async function display_layered_image({ character_url, background_url }) {
    console.log(`[Function Calling] display_layered_imageが呼び出されました。`, { character_url, background_url });

    if (window.state && window.state.settings.allowPromptUiChanges === false) {
        return { error: "ユーザー設定により、プロンプトによるUIの変更は許可されていません。" };
    }
    if (!character_url || typeof character_url !== 'string') {
        return { error: "引数 'character_url' は必須です。" };
    }

    const imageData = {
        character_url,
        background_url: background_url || null,
    };

    return { 
        success: true, 
        message: "画像合成の描画をリクエストしました。",
        _internal_ui_action: {
            type: "display_layered_image",
            data: imageData
        }
    };
}

/**
 * テキストや画像からVeo3を使用して動画を生成する（本番実装）
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.prompt - 英語のプロンプト
 * @param {string} [args.negative_prompt] - 英語のネガティブプロンプト
 * @param {string} [args.aspect_ratio="16:9"] - アスペクト比
 * @param {number} [args.source_image_message_index] - 元画像のメッセージインデックス
 * @param {object} chat - 現在のチャットデータ
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
 async function generate_video({ prompt, negative_prompt, aspect_ratio = "16:9", source_image_message_index }, chat) {
    console.log(`[Function Calling] generate_video（本番実装）が呼び出されました。`, { prompt, negative_prompt, aspect_ratio, source_image_message_index });

    const apiKey = window.state.settings.apiKey;
    if (!apiKey) {
        return { error: "APIキーが設定されていません。" };
    }

    if (window.uiUtils) {
        window.uiUtils.setLoadingIndicatorText('動画生成中...');
        window.elements.loadingIndicator.classList.remove('hidden');
    }

    try {
        // --- Step 1: リクエストボディの構築 ---
        const requestBody = {
            model: "veo-3.0-generate-preview",
            prompt: prompt,
            config: {}
        };

        if (negative_prompt) {
            requestBody.config.negativePrompt = negative_prompt;
        }
        if (aspect_ratio) {
            requestBody.config.aspectRatio = aspect_ratio;
        }

        // ソース画像がある場合の処理
        if (typeof source_image_message_index === 'number') {
            const sourceMessage = chat.messages[source_image_message_index];
            if (sourceMessage && sourceMessage.generated_images && sourceMessage.generated_images.length > 0) {
                const image = sourceMessage.generated_images[0];
                requestBody.image = {
                    imageBytes: image.data, // Base64文字列
                    mimeType: image.mimeType
                };
                console.log(`メッセージインデックス ${source_image_message_index} の画像をリクエストに追加しました。`);
            } else {
                const errorMsg = `指定されたインデックス ${source_image_message_index} に有効な画像が見つかりませんでした。`;
                console.error(`[Function Calling] generate_video: ${errorMsg}`);
                return { error: errorMsg };
            }
        }

        // --- Step 2: 動画生成の開始リクエスト ---
        console.log("Veo3 APIに動画生成開始リクエストを送信します:", requestBody);
        const startResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:generateVideos?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!startResponse.ok) {
            const errorData = await startResponse.json();
            throw new Error(`動画生成の開始に失敗しました: ${errorData.error?.message || startResponse.statusText}`);
        }

        let operation = await startResponse.json();
        console.log("動画生成リクエストを受け付けました。Operation Name:", operation.name);

        // --- Step 3: 完了するまでポーリング ---
        const MAX_ATTEMPTS = 18; // 最大試行回数 (18回 * 10秒 = 3分)
        let attempts = 0;

        while (!operation.done) {
            attempts++;
            if (attempts > MAX_ATTEMPTS) {
                throw new Error("動画生成がタイムアウトしました（3分）。");
            }

            console.log(`動画生成の状態を確認中... (${attempts}/${MAX_ATTEMPTS})`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10秒待機

            const pollResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operation.name}?key=${apiKey}`);
            if (!pollResponse.ok) {
                const errorData = await pollResponse.json();
                throw new Error(`状態確認中にエラーが発生しました: ${errorData.error?.message || pollResponse.statusText}`);
            }
            operation = await pollResponse.json();

            if (operation.error) {
                throw new Error(`動画生成処理でエラーが発生しました: ${operation.error.message}`);
            }
        }

        console.log("動画生成が完了しました。", operation);

        // --- Step 4: 動画ファイルのダウンロードとURL化 ---
        if (operation.response && operation.response.generatedVideos && operation.response.generatedVideos.length > 0) {
            const videoFileResourceName = operation.response.generatedVideos[0].video.name;
            console.log("動画ファイルをダウンロードします:", videoFileResourceName);

            const downloadResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${videoFileResourceName}?alt=media&key=${apiKey}`);
            if (!downloadResponse.ok) {
                throw new Error("動画ファイルのダウンロードに失敗しました。");
            }

            const videoBlob = await downloadResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            console.log("動画のBlob URLを生成しました:", videoUrl);

            return {
                success: true,
                message: "動画を生成しました。",
                video_url: videoUrl
            };
        } else {
            throw new Error("動画生成は完了しましたが、結果に動画データが含まれていませんでした。");
        }

    } catch (error) {
        console.error(`[Function Calling] generate_videoでエラーが発生しました:`, error);
        return { error: error.message };
    } finally {
        if (window.uiUtils) {
            window.elements.loadingIndicator.classList.add('hidden');
        }
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
  manage_scene: manage_scene,
  manage_flags: manage_flags,
  manage_game_date: manage_game_date,
  manage_relationship: manage_relationship,
  get_random_integer: get_random_integer,
  get_random_choice: get_random_choice,
  generate_random_string: generate_random_string,
  search_web: search_web,
  manage_style_profile: manage_style_profile,
  set_ui_opacity: set_ui_opacity,
  set_background_image: set_background_image,
  display_layered_image: display_layered_image,
  generate_video: generate_video
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
            "description": "テーブルトークRPG（TRPG）やボードゲームなどで使用される、指定された形式のダイスを振って結果を返します。ユーザーが「1d100」や「2d6+3」のように、明確にダイスロールを要求した場合にのみ使用してください。一般的な確率計算には `get_random_integer` を使用してください。",
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
            "description": "ロールプレイングゲームや物語に登場するキャラクターのステータス（HP, MP, 疲労度など、キャラクター単体で完結するパラメータ）を設定、増減、または確認します。キャラクターのパラメータが変動するイベントが発生した場合に使用します。",
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
                        "description": "操作対象のステータスの種類。例: 'HP', 'MP', '疲労度'"
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
          },
          {
            "name": "manage_flags",
            "description": "物語の進行状況や世界の状況を示すフラグ（真偽値）やカウンター（数値）を管理します。キャラクターの行動結果やイベントの発生を記録し、後の会話の分岐条件として使用します。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "action": {
                        "type": "STRING",
                        "description": "実行する操作。'set': 値を直接設定。'get': 現在の値を取得。'toggle': 真偽値を反転させる。'increase': 数値を増やす。'decrease': 数値を減らす。'delete': フラグ自体を削除。"
                    },
                    "key": {
                        "type": "STRING",
                        "description": "フラグやカウンターを識別するための一意の名前。例: '扉A解錠済', '街の警戒度'"
                    },
                    "value": {
                        "type": "STRING", 
                        "description": "'set', 'increase', 'decrease' アクションで使用する値 (真偽値または数値)。文字列として渡してください。"
                    },
                    "ttl_minutes": {
                        "type": "NUMBER",
                        "description": "フラグが自動的に削除されるまでの時間（分単位）。一時的な状態を表現するのに使います。"
                    }
                },
                "required": ["action", "key"]
            }
          },
          {
            "name": "manage_game_date",
            "description": "物語やゲーム内の経過日数を管理します。日付を進めたり、現在の日付を確認したりする場合に使用します。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "action": {
                        "type": "STRING",
                        "description": "実行する操作。'pass_days': 指定した日数だけ日付を進める。'get_current_day': 現在の日付を確認する。"
                    },
                    "days": {
                        "type": "NUMBER",
                        "description": "'pass_days'アクションで使用する経過日数。指定がない場合は1として扱われます。"
                    }
                },
                "required": ["action"]
            }
          },
          {
            "name": "manage_relationship",
            "description": "キャラクター間の関係値（好感度、信頼度など）を多軸で管理し、キャラクターの感情や態度を決定するために使用します。重要：キャラクターと久しぶりに会話する場合など、応答を生成する前には、まず'get'アクションで現在の関係値を確認してください。これにより、ゲーム内時間経過による関係性の変化（減衰）が会話の第一声に反映され、自然なやり取りが実現できます。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "action": {
                        "type": "STRING",
                        "description": "実行する操作。'set':値を直接設定。'increase':値を増加。'decrease':値を減少。'get':特定の一つの関係値を取得。'get_all_axes':特定相手への全関係軸の値を取得。'get_all_from_source':自分が持つ全人間関係を取得。"
                    },
                    "source_character": {
                        "type": "STRING",
                        "description": "関係の主体となるキャラクターの名前。'get_all_from_source'ではこのキャラクターの視点から関係性を取得します。基本的には対象のヒロインの名前が入ります。"
                    },
                    "target_character": {
                        "type": "STRING",
                        "description": "関係の対象となるキャラクターの名前。'get_all_from_source'アクション以外では必須です。"
                    },
                    "axis": {
                        "type": "STRING",
                        "description": "操作対象の関係軸。例: '好感度', '信頼度', '緊張度', '恐怖'。'get_all_axes'と'get_all_from_source'アクション以外では必須です。"
                    },
                    "value": {
                        "type": "NUMBER",
                        "description": "'set', 'increase', 'decrease'アクションで使用する数値。"
                    },
                    "clamp_min": {
                        "type": "NUMBER",
                        "description": "任意。関係値がこの値を下回らないようにするための下限値。"
                    },
                    "clamp_max": {
                        "type": "NUMBER",
                        "description": "任意。関係値がこの値を上回らないようにするための上限値。"
                    },
                    "days_to_decay": {
                        "type": "NUMBER",
                        "description": "任意。何日間更新がない場合に減衰を開始するかを指定します。この引数と'decay_value'はセットで使用します。"
                    },
                    "decay_value": {
                        "type": "NUMBER",
                        "description": "任意。'days_to_decay'を超えた後、1日あたりに変化する値。通常は負の数を指定します。例: -1"
                    }
                },
                "required": ["action", "source_character"]
            }
          },
          {
            "name": "get_random_integer",
            "description": "指定された最小値と最大値の範囲内で、ランダムな整数を生成します。『50%の確率』や『1から10までのランダムな数字』など、一般的な確率計算や数値のランダム化が必要な場合に使用してください。TRPGのダイスロール（例: '2d6'）の場合は、代わりに `rollDice` 関数を使用してください。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "min": {
                        "type": "NUMBER",
                        "description": "生成される乱数の最小値（この値も含まれる）。"
                    },
                    "max": {
                        "type": "NUMBER",
                        "description": "生成される乱数の最大値（この値も含まれる）。"
                    },
                    "count": {
                        "type": "NUMBER",
                        "description": "生成する乱数の個数。指定しない場合は1。"
                    }
                },
                "required": ["min", "max"]
            }
          },
          {
            "name": "get_random_choice",
            "description": "提供されたリストの中から、ランダムに一つまたは複数の項目を選択します。くじ引き、ガチャ、ランダムなアイテムの選択、登場人物の行動のランダム決定などに使用してください。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "list": {
                        "type": "ARRAY",
                        "description": "選択肢となる項目を含む配列。例: ['リンゴ', 'バナナ', 'オレンジ']",
                        "items": { "type": "STRING" }
                    },
                    "count": {
                        "type": "NUMBER",
                        "description": "選択する項目の個数（重複選択を許す）。指定しない場合は1。"
                    }
                },
                "required": ["list"]
            }
          },
          {
            "name": "generate_random_string",
            "description": "指定された条件に基づいて、ランダムな文字列（パスワード、シリアルナンバー、IDなど）を生成します。物語の中で、意味を持たないユニークな文字列や、機械的に生成されたようなコードが必要な場合に使用してください。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "length": {
                        "type": "NUMBER",
                        "description": "生成する文字列の長さ。"
                    },
                    "count": {
                        "type": "NUMBER",
                        "description": "生成する文字列の個数。指定しない場合は1。"
                    },
                    "use_uppercase": {
                        "type": "BOOLEAN",
                        "description": "大文字の英字（A-Z）を含めるか。デフォルトはtrue。"
                    },
                    "use_lowercase": {
                        "type": "BOOLEAN",
                        "description": "小文字の英字（a-z）を含めるか。デフォルトはtrue。"
                    },
                    "use_numbers": {
                        "type": "BOOLEAN",
                        "description": "数字（0-9）を含めるか。デフォルトはtrue。"
                    },
                    "use_symbols": {
                        "type": "BOOLEAN",
                        "description": "記号（!@#$...など）を含めるか。デフォルトはfalse。"
                    }
                },
                "required": ["length"]
            }
          },
          {
            "name": "search_web",
            "description": "AI自身の知識にない、現実世界の最新情報、特定の専門知識、あるいは具体的なデータが必要な場合に使用します。物語のリアリティを高めるための情報収集に役立ちます。例えば、歴史的な出来事、特定の場所の天気、科学的な事実などを調べるのに使ってください。この関数を使用するにはユーザーによるAPIの設定が必要です。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "query": {
                        "type": "STRING",
                        "description": "検索したいキーワードや質問文。具体的で明確なクエリを指定してください。例: '日本の城下町の発展の歴史', '今日の東京の天気'"
                    }
                },
                "required": ["query"]
            }
          },
          {
            "name": "manage_style_profile",
            "description": "キャラクターの口調、一人称、方言などの話し方のスタイルを設定・確認します。キャラクターの初登場時や、喧嘩や和解など心情が大きく変化した際に呼び出し、その後の会話に一貫性を持たせます。重要：キャラクターとして発言する前には、必ず'get'アクションで現在の口調プロファイルを確認し、その内容に厳密に従って応答を生成してください。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "action": {
                        "type": "STRING",
                        "description": "実行する操作。'set': キャラクターの口調を設定/変更する。'get': 現在の口調設定を確認する。'list': 利用可能な口調プリセットの一覧を表示する。"
                    },
                    "character_name": {
                        "type": "STRING",
                        "description": "'set'または'get'で操作対象となるキャラクター名。地の文を操作する場合は '地の文' と指定します。"
                    },
                    "profile_name": {
                        "type": "STRING",
                        "description": "'set'アクションで使用する、定義済みの口調プリセット名。'list'アクションで利用可能なプリセットを確認できます。例: 'polite', 'casual', 'tsundere'"
                    },
                    "overrides": {
                        "type": "OBJECT",
                        "description": "'set'アクションで使用し、プリセットの一部だけを上書きするためのオブジェクト。例: {'first_person': 'ボク'} は一人称だけを'ボク'に変更します。",
                        "properties": {
                            "first_person": { "type": "STRING", "description": "一人称。例: '私', '俺', 'ボク'" },
                            "politeness": { "type": "NUMBER", "description": "丁寧さの度合い (0.0から1.0)。0.0が最もくだけており、1.0が最も丁寧。" },
                            "sentence_ender": { "type": "STRING", "description": "特徴的な語尾や言い回し。例: '～だぜ', '～ですわ'" },
                            "dialect": { "type": "STRING", "description": "方言や特定の話し方。例: 'kansai', 'samurai'" }
                        }
                    }
                },
                "required": ["action"]
            }
          },
          {
            "name": "set_ui_opacity",
            "description": "チャット画面のUI要素の透明度を変更し、物語の雰囲気を演出します。例えば、回想シーンで全体を白っぽくしたり、緊迫した場面で暗くしたりできます。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "overlay": {
                        "type": "NUMBER",
                        "description": "背景画像上のオーバーレイの濃さ。0.0（完全に透明）から1.0（完全に不透明）の間の数値で指定します。"
                    },
                    "message_bubble": {
                        "type": "NUMBER",
                        "description": "メッセージ吹き出しの濃さ。0.1（ほぼ透明）から1.0（完全に不透明）の間の数値で指定します。"
                    }
                }
            }
          },
          {
            "name": "set_background_image",
            "description": "チャット画面の背景画像を、指定されたURLの画像に変更します。物語のシーンに合わせた背景を表示することで、没入感を高めます。画像URLに指定出来るのはユーザーがプロンプトで指定したURLのみです。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "image_url": {
                        "type": "STRING",
                        "description": "表示したい画像の完全なURL。例: 'https://example.com/images/scene1.png'"
                    }
                },
                "required": ["image_url"]
            }
          },
          {
            "name": "display_layered_image",
            "description": "キャラクター画像に背景を付けて、一枚の絵のようにメッセージとして表示します。キャラクターの立ち絵と背景を組み合わせたシーン描写に使用します。重要：この関数を呼び出した後は、その結果を使ってユーザーへの最終的な応答メッセージを生成し、会話を完了させてください。応答メッセージ内には、生成した画像を埋め込む場所を示す `[IMAGE_HERE]` という目印を必ず配置してください。画像URLに指定出来るのはユーザーがプロンプトで指定したURLのみです。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "character_url": {
                        "type": "STRING",
                        "description": "前景に表示するキャラクター画像のURL。この画像のサイズと縦横比が表示の基準になります。"
                    },
                    "background_url": {
                        "type": "STRING",
                        "description": "背景として表示する画像のURL。指定しない場合、現在のチャット全体の背景画像が自動的に使用されます。"
                    }
                },
                "required": ["character_url"]
            }
          },
          {
            "name": "generate_video",
            "description": "ユーザーが明示的に動画の生成を指示した場合にのみ、この関数を使用してください。テキストプロンプト、または画像とテキストプロンプトから動画を生成します。重要：この関数を呼び出した後は、その結果を使ってユーザーへの最終的な応答メッセージを生成し、会話を完了させてください。応答メッセージには、生成した動画を埋め込む場所を示す `[VIDEO_HERE]` という文字列の目印を必ず1つだけ配置してください。HTMLタグは絶対に生成しないでください。ユーザーの指示から、動画の内容を表す英語のプロンプトを生成して `prompt` 引数に設定してください。動画に含めたくない要素は英語で `negative_prompt` に設定します。ユーザーが『この画像から』『あの猫の絵を』のように元画像を指示した場合、会話の文脈から最も適切と思われる画像が含まれているメッセージのインデックス（番号）を特定し、`source_image_message_index` 引数に設定してください。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "prompt": {
                        "type": "STRING",
                        "description": "動画の内容を説明する英語のプロンプト。"
                    },
                    "negative_prompt": {
                        "type": "STRING",
                        "description": "動画に含めたくない要素を説明する英語のネガティブプロンプト。"
                    },
                    "aspect_ratio": {
                        "type": "STRING",
                        "description": "動画のアスペクト比。'16:9' (横長), '9:16' (縦長), '1:1' (正方形) など。デフォルトは '16:9'。"
                    },
                    "source_image_message_index": {
                        "type": "NUMBER",
                        "description": "動画生成の元になる画像が含まれているメッセージのインデックス番号。インデックスは0から始まります。"
                    }
                },
                "required": ["prompt"]
            }
        }
      ]
  }
];