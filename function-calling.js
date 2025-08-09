/**
 * AIが利用可能なツール（関数）を定義するオブジェクト
 */
 window.functionCallingTools = {
    /**
     * 文字列形式の四則演算の式を計算し、結果を返す関数
     * @param {object} args - AIによって提供される引数オブジェクト
     * @param {string} args.expression - 計算する数式 (例: "2 * (3 + 5)")
     * @returns {Promise<object>} 計算結果またはエラーを含むオブジェクトを返すPromise
     */
    calculate: async function({ expression }) {
      console.log(`[Function Calling] calculateが呼び出されました。式: ${expression}`);
      
      // ▼▼▼【ここから変更】▼▼▼
      // デバッグのために3秒間の意図的な遅延を追加
      console.log("[Function Calling] デバッグのため、3秒間の遅延を開始します...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("[Function Calling] 遅延が完了し、計算処理を再開します。");
      // ▲▲▲【ここまで変更】▲▲▲

      // セキュリティのため、許可する文字を正規表現で制限
      const allowedChars = /^[0-9+\-*/().\s]+$/;
      if (!allowedChars.test(expression)) {
        console.error("[Function Calling] calculate: 式に許可されていない文字が含まれています。");
        return { error: "無効な式です。四則演算と括弧のみ使用できます。" };
      }
  
      try {
        // new Function() を使って安全に式を評価
        const result = new Function(`return ${expression}`)();
        
        // 結果が数値でない場合（不正な式など）はエラー
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error("計算結果が無効です。");
        }
  
        console.log(`[Function Calling] calculate: 計算結果: ${result}`);
        return { result: result };
      } catch (error) {
        console.error(`[Function Calling] calculate: 計算エラー: ${error.message}`);
        return { error: `計算エラー: ${error.message}` };
      }
    }
  };
  
  /**
   * AIに提供するツールの定義情報 (Tool Declaration)
   * ここで定義した内容を元に、AIはいつ、どの関数を呼び出すべきかを判断します。
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
        }
      ]
    }
  ];