export default {
    async fetch(request, env, ctx) {
        if (request.method === 'OPTIONS') {
            return handleOptions(request);
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'POSTリクエストを使用してください' }), {
                status: 405,
                headers: corsHeaders('application/json'),
            });
        }

        try {
            const url = new URL(request.url);
            const type = url.searchParams.get('type');

            if (type === 'bedrock_proxy') {
                return await handleBedrockProxy(request, env, ctx);
            }

            if (type === 'vertex_proxy') {
                return await handleVertexProxy(request, env, ctx);
            }

            if (type === 'opencode_go_proxy') {
                return await handleOpenCodeGoProxy(request, env, ctx);
            }

            if (type === 'fetch_url') {
                const requestBody = await request.json();
                return await handleUrlRequest(requestBody);
            }

            return new Response(JSON.stringify({ error: '無効なリクエストタイプです。' }), {
                status: 400,
                headers: corsHeaders('application/json'),
            });

        } catch (e) {
            console.error('[Proxy Worker] エラー発生:', e);
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: corsHeaders('application/json'),
            });
        }
    },
};

// CORSヘッダー
function corsHeaders(contentType = 'application/json') {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Bedrock-Access-Key-Id, X-Bedrock-Secret-Access-Key, X-Bedrock-Region, X-Vertex-Project-Id, X-Vertex-Region, X-Vertex-Service-Account-Key, X-Vertex-Model-Provider, X-OpenCode-Go-Api-Key, X-OpenCode-Go-Endpoint-Type',
        'Content-Type': contentType,
    };
}

// OPTIONSハンドラ
function handleOptions(request) {
    const headers = request.headers;
    if (
        headers.get('Origin') !== null &&
        headers.get('Access-Control-Request-Method') !== null &&
        headers.get('Access-Control-Request-Headers') !== null
    ) {
        return new Response(null, { headers: corsHeaders() });
    } else {
        return new Response(null, { headers: { Allow: 'POST, OPTIONS' } });
    }
}

async function handleOpenCodeGoProxy(request, env, ctx) {
    let apiKey = request.headers.get('X-OpenCode-Go-Api-Key');
    let endpointType = request.headers.get('X-OpenCode-Go-Endpoint-Type') || 'chat';

    if (false && !apiKey) {
        return new Response(JSON.stringify({ error: 'X-OpenCode-Go-Api-Keyヘッダーが設定されていません。' }), {
            status: 400,
            headers: corsHeaders(),
        });
    }

    let clientRequest;
    try {
        const requestText = await request.text();
        const parsedRequest = requestText ? JSON.parse(requestText) : {};
        if (parsedRequest && parsedRequest.payload) {
            apiKey = apiKey || parsedRequest.apiKey;
            endpointType = parsedRequest.endpointType || endpointType;
            clientRequest = parsedRequest.payload;
        } else {
            clientRequest = parsedRequest;
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: `リクエストJSONの解析に失敗しました: ${error.message}` }), {
            status: 400,
            headers: corsHeaders(),
        });
    }

    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'OpenCode Go APIキーが設定されていません。' }), {
            status: 400,
            headers: corsHeaders(),
        });
    }

    const endpoint = endpointType === 'messages'
        ? 'https://opencode.ai/zen/go/v1/messages'
        : 'https://opencode.ai/zen/go/v1/chat/completions';

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    if (endpointType === 'messages') {
        headers['anthropic-version'] = '2023-06-01';
    }

    try {
        const opencodeResponse = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(clientRequest),
        });

        const responseText = await opencodeResponse.text();
        const contentType = opencodeResponse.headers.get('content-type') || 'application/json';

        if (!opencodeResponse.ok) {
            console.error(`[OpenCode Go Proxy] API error ${opencodeResponse.status}:`, responseText.substring(0, 1000));
        }

        return new Response(responseText, {
            status: opencodeResponse.status,
            statusText: opencodeResponse.statusText,
            headers: corsHeaders(contentType),
        });
    } catch (error) {
        console.error('[OpenCode Go Proxy] fetch failed:', error);
        return new Response(JSON.stringify({ error: `OpenCode Go APIへの接続に失敗しました: ${error.message}` }), {
            status: 502,
            headers: corsHeaders(),
        });
    }
}

async function handleBedrockProxy(request, env, ctx) {
    const accessKeyId = request.headers.get('X-Bedrock-Access-Key-Id');
    const secretAccessKey = request.headers.get('X-Bedrock-Secret-Access-Key');
    const region = request.headers.get('X-Bedrock-Region');

    if (!accessKeyId || !secretAccessKey || !region) {
        return new Response(JSON.stringify({ error: '必要なヘッダー(X-Bedrock-Access-Key-Id, X-Bedrock-Secret-Access-Key, X-Bedrock-Region)が不足しています' }), {
            status: 400,
            headers: corsHeaders(),
        });
    }

    if (!env.BEDROCK_SESSIONS) {
        return new Response(JSON.stringify({ error: 'KVストアが設定されていません。' }), {
            status: 500,
            headers: corsHeaders(),
        });
    }

    try {
        const clientRequest = await request.json();
        const { sessionId, modelId, systemInstruction, newMessages, generationConfig, toolConfig, isFullHistory } = clientRequest;

        // クライアントから受け取ったsystemInstructionをログに出力
        console.log("[Worker SystemInstruction Check]", JSON.stringify(systemInstruction, null, 2));

        if (!sessionId || !modelId || !newMessages) {
            return new Response(JSON.stringify({ error: 'リクエストボディの必須パラメータ(sessionId, modelId, newMessages)が不足しています。' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        // KVから過去の会話履歴を取得
        const storedHistoryStr = await env.BEDROCK_SESSIONS.get(sessionId);
        const storedHistory = storedHistoryStr ? JSON.parse(storedHistoryStr) : [];

        // 新しいメッセージをGemini形式からBedrock形式に変換する
        // model -> assistant, tool -> user(toolResult)
        let bedrockNewMessages = [];

        // 直前のアシスタント応答に含まれていたtoolUseIdを履歴から取得（フォールバック用）
        // 複数のtoolUseがある場合に備えて配列で管理
        let toolUseIdsFromHistory = [];
        if (storedHistory.length > 0) {
            // 履歴を逆順で検索して、最後のassistantメッセージを見つける
            for (let i = storedHistory.length - 1; i >= 0; i--) {
                const msg = storedHistory[i];
                if (msg.role === 'assistant' && msg.content) {
                    const toolUseParts = msg.content.filter(p => p.toolUse);
                    if (toolUseParts.length > 0) {
                        toolUseIdsFromHistory = toolUseParts.map(p => p.toolUse.toolUseId);
                        console.log(`[Worker Debug] Found toolUseIds from storedHistory[${i}]:`, toolUseIdsFromHistory);
                        break; // 最初に見つかったassistantメッセージで停止
                    }
                }
            }
        }

        // newMessagesを順番に処理（順序を保持）
        let toolUseIdIndex = 0;
        const toolResults = []; // toolメッセージから変換されたtoolResultを一時保存

        // newMessages内にtoolメッセージが含まれている場合、それより前のメッセージ（user, model）は
        // 履歴と重複している可能性が高いため、フィルタリングする。
        // app.jsは tool実行時に [trigger_user, assistant(tool_use), tool(result)] というセットを送ってくる。
        // storedHistoryには既に [trigger_user, assistant(tool_use)] が含まれているため、
        // 単純に結合すると [trigger_user, assistant, trigger_user, tool(result)] となり、
        // tool_useの直後にtool_resultが来ない（間にuserが入る）ためエラーになる。

        let startIndex = 0;
        const firstToolIndex = newMessages.findIndex(m => m.role === 'tool');
        if (firstToolIndex !== -1 && !isFullHistory) {
            // toolメッセージがある場合、それより前のメッセージはスキップする
            // ただし、isFullHistory=true（再生成時）は全てのメッセージを処理するためスキップしない
            startIndex = firstToolIndex;
            console.log(`[Worker Debug] Skipping messages before index ${startIndex} because tool message found and not full history`);
        }

        // デバッグ: newMessagesの構造を確認
        if (isFullHistory) {
            console.log("[Worker Debug] isFullHistory=true. Inspecting newMessages structure:");
            newMessages.forEach((m, idx) => {
                let info = `[${idx}] ${m.role}`;
                if (m.parts) {
                    m.parts.forEach(p => {
                        if (p.functionCall) info += ` | toolUse(${p.functionCall.name}, id=${p.functionCall._toolUseId})`;
                        if (p.functionResponse) info += ` | toolResult(name=${p.functionResponse.name}, id=${p.functionCallId || p.functionResponse._toolCallId})`;
                    });
                }
                console.log(info);
            });
        }

        // 連続するtoolResultをまとめるためのバッファ
        let pendingToolResults = [];

        for (let i = startIndex; i < newMessages.length; i++) {
            const msg = newMessages[i];

            // roleの正規化
            let role = msg.role;
            if (role === 'model') role = 'assistant';
            if (role === 'tool') role = 'user'; // tool応答はuserメッセージとして扱う

            // contentの変換
            let content = [];

            // toolメッセージ（functionResponse）の処理
            if (msg.role === 'tool') {
                if (msg.parts && Array.isArray(msg.parts)) {
                    for (const part of msg.parts) {
                        if (part.functionResponse) {
                            const tr = part.functionResponse;
                            const toolUseId = tr._toolCallId || tr._toolUseId; // IDは必須

                            if (toolUseId) {
                                const toolResultBlock = {
                                    toolResult: {
                                        toolUseId: toolUseId,
                                        content: [{ json: tr.response }],
                                        status: 'success'
                                    }
                                };
                                pendingToolResults.push(toolResultBlock);
                            } else {
                                console.warn(`[Worker Warning] toolResult without ID found in message ${i}`);
                            }
                        }
                    }
                }
                // toolメッセージの場合はここで処理終了（pendingToolResultsに蓄積）
                // 次のメッセージもtoolなら蓄積を続ける
                continue;
            }

            // tool以外のメッセージが来た場合、蓄積していたtoolResultを吐き出す
            if (pendingToolResults.length > 0) {
                bedrockNewMessages.push({
                    role: 'user',
                    content: [...pendingToolResults]
                });
                pendingToolResults = []; // バッファクリア
            }

            // 通常のメッセージ（user, assistant）の処理
            if (msg.parts && Array.isArray(msg.parts)) {
                for (const part of msg.parts) {
                    if (part.text) {
                        content.push({ text: part.text });
                    } else if (part.functionCall) {
                        // Gemini形式 -> Bedrock toolUse
                        content.push({
                            toolUse: {
                                toolUseId: part.functionCall._toolCallId || part.functionCall._toolUseId || `tool_${Date.now()}_${Math.random()}`,
                                name: part.functionCall.name,
                                input: part.functionCall.args || {}
                            }
                        });
                    } else if (part.toolUse) {
                        content.push({ toolUse: part.toolUse });
                    } else if (part.toolResult) {
                        content.push({ toolResult: part.toolResult });
                    }
                }
            }

            // contentが空でない場合のみ追加
            if (content.length > 0) {
                bedrockNewMessages.push({ role, content });
            }
        }

        // ループ終了後に残っているtoolResultがあれば吐き出す
        if (pendingToolResults.length > 0) {
            bedrockNewMessages.push({
                role: 'user',
                content: [...pendingToolResults]
            });
        }

        // 新しいメッセージを履歴に結合
        // isFullHistory=trueの場合、storedHistoryは使わない（全履歴がnewMessagesに含まれているため）
        let fullHistory;
        if (isFullHistory) {
            fullHistory = bedrockNewMessages;
            console.log(`[Bedrock Proxy] isFullHistory=true: storedHistoryを無視してnewMessagesのみを使用 (${bedrockNewMessages.length}件)`);
        } else {
            fullHistory = [...storedHistory, ...bedrockNewMessages];
            console.log(`[Bedrock Proxy] isFullHistory=false: storedHistory(${storedHistory.length}件) + newMessages(${bedrockNewMessages.length}件) = ${fullHistory.length}件`);
        }

        // 結合後の全履歴から空のcontentを持つメッセージを削除
        fullHistory = fullHistory.filter((msg, idx) => {
            if (!msg.content || msg.content.length === 0) {
                console.log(`[Bedrock Proxy] fullHistory[${idx}]の空contentメッセージを削除。role: ${msg.role}`);
                return false;
            }
            return true;
        });

        // ---------------------------------------------------------
        // Bedrock整合性チェック: Orphaned ToolUseの削除
        // ---------------------------------------------------------
        // Bedrockは toolUse の直後に必ず toolResult を要求する。
        // ユーザーがツール実行中に追加メッセージを送った場合や、履歴の一部が欠落した場合に
        // toolUse だけが残り、直後に通常の user text が来ることがある。
        // これを防ぐため、対応する toolResult が直後にない toolUse は送信前に削除する。
        for (let i = 0; i < fullHistory.length; i++) {
            const msg = fullHistory[i];
            if (msg.role === 'assistant' && msg.content) {
                // toolUseを含むか確認
                const toolUseIndices = msg.content.map((c, idx) => c.toolUse ? idx : -1).filter(idx => idx !== -1);

                if (toolUseIndices.length > 0) {
                    const nextMsg = fullHistory[i + 1];
                    // 直後のメッセージが存在しない、または user ロールでない、または toolResult を含まない場合
                    // 注意: toolUseが最後にある場合（nextMsgがない場合）は、AIがツールを実行しようとしているので削除してはいけない
                    // ただし、今回は newMessages を結合した後なので、最後が toolUse であればそれは今から実行するものなのでOK。
                    // 問題は「過去の履歴」の中で toolUse があり、その次が toolResult でない場合。

                    // nextMsgが存在する場合のみチェックを行う (最後尾の toolUse は許容)
                    if (nextMsg) {
                        const hasNextToolResult = nextMsg.role === 'user' && nextMsg.content && nextMsg.content.some(c => c.toolResult);
                        console.log(`[Worker Debug] Sanitize Check [${i}]: nextMsg exists. Role=${nextMsg.role}, HasToolResult=${hasNextToolResult}, ContentKeys=${JSON.stringify(nextMsg.content ? nextMsg.content.map(c => Object.keys(c)) : [])}`);

                        if (!hasNextToolResult) {
                            console.warn(`[Bedrock Proxy] Orphaned toolUse found at index ${i}. Removing toolUse blocks to prevent API error.`);
                            // toolUse ブロックを削除
                            msg.content = msg.content.filter(c => !c.toolUse);
                        }
                    }
                }
            }
        }

        // 再度、空のcontentを持つメッセージを削除 (toolUse削除により空になった場合)
        fullHistory = fullHistory.filter((msg, idx) => {
            if (!msg.content || msg.content.length === 0) {
                console.log(`[Bedrock Proxy] fullHistory[${idx}]の空contentメッセージを削除(Sanitize後)。role: ${msg.role}`);
                return false;
            }
            // contentの各要素が有効なキーを持つかチェック
            const hasInvalidContent = msg.content.some(c => {
                const validKeys = ['text', 'image', 'toolUse', 'toolResult', 'document', 'video'];
                return !validKeys.some(key => c[key] !== undefined);
            });
            if (hasInvalidContent) {
                console.log(`[Bedrock Proxy] fullHistory[${idx}]に無効なcontentブロックがあります:`, JSON.stringify(msg.content));
                // 無効なcontentブロックをフィルタリング
                msg.content = msg.content.filter(c => {
                    const validKeys = ['text', 'image', 'toolUse', 'toolResult', 'document', 'video'];
                    return validKeys.some(key => c[key] !== undefined);
                });
                if (msg.content.length === 0) {
                    console.log(`[Bedrock Proxy] fullHistory[${idx}]のcontentが空になったため削除`);
                    return false;
                }
            }
            return true;
        });

        console.log(`[Bedrock Proxy Debug] fullHistory件数: ${fullHistory.length}`);

        // デバッグ用: Bedrockに送信するメッセージ構造を詳細にログ出力
        console.log(`[Bedrock Proxy Debug] 送信メッセージ構造:`);
        fullHistory.forEach((msg, idx) => {
            let info = `  [${idx}] role=${msg.role}, content=[`;
            if (msg.content && Array.isArray(msg.content)) {
                const contentInfos = msg.content.map(c => {
                    if (c.text) return `text(${c.text.substring(0, 30)}...)`;
                    if (c.toolUse) return `toolUse(name=${c.toolUse.name}, id=${c.toolUse.toolUseId})`;
                    if (c.toolResult) return `toolResult(id=${c.toolResult.toolUseId})`;
                    return `unknown(${Object.keys(c).join(',')})`;
                });
                info += contentInfos.join(', ');
            }
            info += ']';
            console.log(info);
        });


        const bedrockRequestBody = {
            modelId: modelId,
            messages: fullHistory,
            inferenceConfig: generationConfig,
        };

        if (systemInstruction && systemInstruction.parts && systemInstruction.parts.length > 0) {
            bedrockRequestBody.system = systemInstruction.parts.map(p => ({ text: p.text }));
        }

        if (toolConfig) {
            bedrockRequestBody.toolConfig = toolConfig;
        }

        const host = `bedrock-runtime.${region}.amazonaws.com`;

        // fetchが'%'を'%25'に再エンコードするため、署名計算(Canonical Request)もそれに合わせる必要がある
        const singleEncodedModelId = encodeURIComponent(modelId);
        // endpointにはシングルエンコードされたパスを使用
        const endpoint = `https://${host}/model/${singleEncodedModelId}/converse`;

        const service = 'bedrock';
        const method = 'POST';
        const payload = JSON.stringify(bedrockRequestBody);

        // AWS Signature V4 Signing
        const datetime = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const date = datetime.substr(0, 8);
        const credentialScope = `${date}/${region}/${service}/aws4_request`;

        const signedHeaders = 'content-type;host;x-amz-date';
        const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${datetime}\n`;
        const payloadHash = await sha256(payload);
        // Canonical Requestには二重エンコードされたパスを使用
        const canonicalRequest = `${method}\n/model/${singleEncodedModelId.replace(/%/g, '%25')}/converse\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

        const stringToSign = `AWS4-HMAC-SHA256\n${datetime}\n${credentialScope}\n${await sha256(canonicalRequest)}`;
        const signingKey = await getSignatureKey(secretAccessKey, date, region, service);
        const signature = hex(await hmac(signingKey, stringToSign));

        const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        const bedrockResponse = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Amz-Date': datetime,
                'Authorization': authorizationHeader,
                'Accept': 'application/json',
            },
            body: payload
        });

        const bedrockData = await bedrockResponse.json();
        console.log("Bedrock Proxy Response Data:", JSON.stringify(bedrockData)); // デバッグ用ログ追加

        if (!bedrockResponse.ok) {
            console.error("Bedrock APIからのエラー:", bedrockData);
            return new Response(JSON.stringify({ error: `Bedrock APIエラー: ${bedrockData.message || bedrockResponse.statusText}` }), {
                status: bedrockResponse.status,
                headers: corsHeaders(),
            });
        }

        // 成功した場合、AIの返信も履歴に追加してKVに保存
        if (bedrockData.output && bedrockData.output.message) {
            const newHistory = [...fullHistory, bedrockData.output.message];
            ctx.waitUntil(env.BEDROCK_SESSIONS.put(sessionId, JSON.stringify(newHistory)));
        }

        return new Response(JSON.stringify(bedrockData), {
            status: 200,
            headers: corsHeaders(),
        });

    } catch (e) {
        console.error('[Bedrock Proxy] エラー:', e);
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: corsHeaders(),
        });
    }
}

// AWS SigV4 Helper Functions
async function getSignatureKey(key, dateStamp, regionName, serviceName) {
    const kDate = await hmac(`AWS4${key}`, dateStamp);
    const kRegion = await hmac(kDate, regionName);
    const kService = await hmac(kRegion, serviceName);
    const kSigning = await hmac(kService, 'aws4_request');
    return kSigning;
}

async function hmac(key, data) {
    const encoder = new TextEncoder();
    const keyData = (key instanceof ArrayBuffer || key instanceof Uint8Array) ? key : encoder.encode(key);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
}

async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return hex(hash);
}

function hex(buffer) {
    return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function handleUrlRequest(requestBody) {
    const { url } = requestBody;
    if (!url || !url.startsWith('http')) {
        return new Response(JSON.stringify({ error: '有効なURLが指定されていません' }), { status: 400, headers: corsHeaders('application/json') });
    }
    try {
        const targetUrlObj = new URL(url);
        const refererUrl = `${targetUrlObj.protocol}//${targetUrlObj.host}/`;
        const requestHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Referer': refererUrl,
        };

        const targetResponse = await fetch(url, { headers: requestHeaders });
        const text = await targetResponse.text();
        return new Response(JSON.stringify({ content: text }), { headers: corsHeaders('application/json') });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders('application/json') });
    }
}

// =============================================================================
// Vertex AI Proxy Handler
// =============================================================================

async function handleVertexProxy(request, env, ctx) {
    const projectId = request.headers.get('X-Vertex-Project-Id');
    const region = request.headers.get('X-Vertex-Region');
    const serviceAccountKeyBase64 = request.headers.get('X-Vertex-Service-Account-Key');
    const modelProvider = request.headers.get('X-Vertex-Model-Provider'); // 'anthropic' or undefined (google)

    if (!projectId || !region || !serviceAccountKeyBase64) {
        return new Response(JSON.stringify({ error: '必要なヘッダー(X-Vertex-Project-Id, X-Vertex-Region, X-Vertex-Service-Account-Key)が不足しています' }), {
            status: 400,
            headers: corsHeaders(),
        });
    }

    try {
        // Base64エンコードされたサービスアカウントキーをデコード
        let serviceAccountKey;
        try {
            const decodedKey = atob(serviceAccountKeyBase64);
            serviceAccountKey = JSON.parse(decodedKey);
        } catch (e) {
            return new Response(JSON.stringify({ error: 'サービスアカウントキーのデコードに失敗しました。有効なJSONを Base64 エンコードして送信してください。' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        // サービスアカウントキーの検証
        if (!serviceAccountKey.private_key || !serviceAccountKey.client_email) {
            return new Response(JSON.stringify({ error: 'サービスアカウントキーに必要なフィールド(private_key, client_email)が不足しています' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        // クライアントリクエストのパース
        const clientRequest = await request.json();

        // アクセストークンを取得
        const accessToken = await getVertexAccessToken(serviceAccountKey);

        // Anthropic (Claude) モデルの場合
        if (modelProvider === 'anthropic') {
            const { modelId, anthropic_version, messages, system, max_tokens, temperature, top_p, top_k, tools, tool_choice, stream } = clientRequest;

            if (!modelId || !messages) {
                return new Response(JSON.stringify({ error: 'リクエストボディの必須パラメータ(modelId, messages)が不足しています。' }), {
                    status: 400,
                    headers: corsHeaders(),
                });
            }

            console.log(`[Vertex Proxy] Anthropic Claude モデル: ${modelId}, プロジェクト: ${projectId}, リージョン: ${region}`);

            // Claudeモデルはglobalリージョンでは動作しないため、us-east5を使用
            let effectiveRegion = region;
            if (region === 'global') {
                console.warn("[Vertex Proxy] Claudeモデルはglobalリージョンをサポートしていません。us-east5を使用します。");
                effectiveRegion = 'us-east5';
            }

            // Vertex AI Claude エンドポイント
            // 形式: https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/publishers/anthropic/models/{model}:rawPredict
            const endpoint = `https://${effectiveRegion}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${effectiveRegion}/publishers/anthropic/models/${modelId}:rawPredict`;

            // Anthropic形式のリクエストボディを構築
            const anthropicRequestBody = {
                anthropic_version: anthropic_version || "vertex-2023-10-16",
                messages: messages,
                max_tokens: max_tokens || 4096,
            };

            if (system) anthropicRequestBody.system = system;
            if (temperature !== undefined) anthropicRequestBody.temperature = temperature;
            if (top_p !== undefined) anthropicRequestBody.top_p = top_p;
            if (top_k !== undefined) anthropicRequestBody.top_k = top_k;
            if (tools && tools.length > 0) anthropicRequestBody.tools = tools;
            if (tool_choice) anthropicRequestBody.tool_choice = tool_choice;
            if (stream !== undefined) anthropicRequestBody.stream = stream;

            console.log("[Vertex Proxy] Anthropic リクエストを送信:", endpoint);
            console.log("[Vertex Proxy] Anthropic リクエストボディ (概要):", JSON.stringify({
                anthropic_version: anthropicRequestBody.anthropic_version,
                messages_count: anthropicRequestBody.messages?.length || 0,
                max_tokens: anthropicRequestBody.max_tokens,
                has_system: !!anthropicRequestBody.system,
                has_tools: !!(anthropicRequestBody.tools && anthropicRequestBody.tools.length > 0)
            }));

            // Vertex AI Anthropic APIを呼び出し
            const vertexResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(anthropicRequestBody)
            });

            // レスポンスをテキストとして読み取り
            const responseText = await vertexResponse.text();
            console.log("[Vertex Proxy] Anthropic レスポンス受信 (status:", vertexResponse.status, "):", responseText.substring(0, 500));

            // HTMLレスポンスのチェック
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                console.error("[Vertex Proxy] HTMLエラーページを受信しました。エンドポイントが正しくない可能性があります。");
                return new Response(JSON.stringify({
                    error: `Vertex AI Anthropic APIエラー: エンドポイントが見つかりません。リージョン「${effectiveRegion}」でこのモデルが利用可能か確認してください。`,
                    details: `Endpoint: ${endpoint}`,
                    hint: 'Claude モデルは us-east5 または europe-west1 リージョンで利用可能です。'
                }), {
                    status: 404,
                    headers: corsHeaders(),
                });
            }

            let vertexData;
            try {
                vertexData = JSON.parse(responseText);
            } catch (e) {
                console.error("[Vertex Proxy] JSONパースエラー:", e, "Response:", responseText.substring(0, 200));
                return new Response(JSON.stringify({ error: `Vertex AI Anthropic APIエラー: レスポンスのパースに失敗しました` }), {
                    status: 500,
                    headers: corsHeaders(),
                });
            }

            if (!vertexResponse.ok) {
                console.error("Vertex AI Anthropic APIからのエラー:", vertexData);
                return new Response(JSON.stringify({ error: `Vertex AI Anthropic APIエラー: ${vertexData.error?.message || vertexResponse.statusText}` }), {
                    status: vertexResponse.status,
                    headers: corsHeaders(),
                });
            }

            // Anthropic形式のレスポンスをそのまま返す（app.jsで変換済み）
            return new Response(JSON.stringify(vertexData), {
                status: 200,
                headers: corsHeaders(),
            });
        }

        // Google (Gemini) モデルの場合（既存の処理）
        const { modelId, contents, systemInstruction, generationConfig, tools, toolConfig, safetySettings } = clientRequest;

        if (!modelId || !contents) {
            return new Response(JSON.stringify({ error: 'リクエストボディの必須パラメータ(modelId, contents)が不足しています。' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        console.log(`[Vertex Proxy] モデル: ${modelId}, プロジェクト: ${projectId}, リージョン: ${region}`);

        // Vertex AI APIエンドポイントを構築
        // グローバルリージョンの場合は異なるエンドポイント形式を使用
        let endpoint;
        if (region === 'global') {
            endpoint = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${modelId}:generateContent`;
        } else {
            endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${modelId}:generateContent`;
        }

        // リクエストボディを構築
        const vertexRequestBody = {
            contents: contents,
        };

        if (generationConfig) {
            vertexRequestBody.generationConfig = generationConfig;
        }

        if (systemInstruction) {
            vertexRequestBody.systemInstruction = systemInstruction;
        }

        if (tools && tools.length > 0) {
            vertexRequestBody.tools = tools;
        }

        if (toolConfig) {
            vertexRequestBody.toolConfig = toolConfig;
        }

        if (safetySettings && safetySettings.length > 0) {
            vertexRequestBody.safetySettings = safetySettings;
        }

        console.log("[Vertex Proxy] リクエストを送信:", endpoint);

        // Vertex AI APIを呼び出し
        const vertexResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(vertexRequestBody)
        });

        // レスポンスをテキストとして読み取り、JSONかどうかを確認
        const responseText = await vertexResponse.text();
        console.log("[Vertex Proxy] レスポンス受信 (status:", vertexResponse.status, "):", responseText.substring(0, 500));

        // HTMLレスポンスのチェック（エラーページの可能性）
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error("[Vertex Proxy] HTMLエラーページを受信しました。エンドポイントが正しくない可能性があります。");
            return new Response(JSON.stringify({
                error: `Vertex AI APIエラー: エンドポイントが見つかりません。リージョン「${region}」でこのモデルが利用可能か確認してください。`,
                details: `Endpoint: ${endpoint}`,
                hint: 'gemini-3-pro-previewの場合、us-central1リージョンを試してください。'
            }), {
                status: 404,
                headers: corsHeaders(),
            });
        }

        let vertexData;
        try {
            vertexData = JSON.parse(responseText);
        } catch (e) {
            console.error("[Vertex Proxy] JSONパースエラー:", e, "Response:", responseText.substring(0, 200));
            return new Response(JSON.stringify({ error: `Vertex AI APIエラー: レスポンスのパースに失敗しました` }), {
                status: 500,
                headers: corsHeaders(),
            });
        }

        if (!vertexResponse.ok) {
            console.error("Vertex AI APIからのエラー:", vertexData);
            return new Response(JSON.stringify({ error: `Vertex AI APIエラー: ${vertexData.error?.message || vertexResponse.statusText}` }), {
                status: vertexResponse.status,
                headers: corsHeaders(),
            });
        }

        return new Response(JSON.stringify(vertexData), {
            status: 200,
            headers: corsHeaders(),
        });

    } catch (e) {
        console.error('[Vertex Proxy] エラー:', e);
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: corsHeaders(),
        });
    }
}

// =============================================================================
// Google Service Account Authentication Helper Functions
// =============================================================================

/**
 * サービスアカウントキーからアクセストークンを取得
 * @param {Object} serviceAccountKey - サービスアカウントのJSONキー
 * @returns {Promise<string>} アクセストークン
 */
async function getVertexAccessToken(serviceAccountKey) {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1時間有効

    // JWTヘッダー
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    // JWTペイロード
    const payload = {
        iss: serviceAccountKey.client_email,
        sub: serviceAccountKey.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: expiry,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
    };

    // JWTを生成
    const jwt = await createSignedJwt(header, payload, serviceAccountKey.private_key);

    // アクセストークンを取得
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`アクセストークンの取得に失敗しました: ${errorData.error_description || errorData.error}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}

/**
 * RS256署名付きJWTを生成
 * @param {Object} header - JWTヘッダー
 * @param {Object} payload - JWTペイロード
 * @param {string} privateKeyPem - PEM形式の秘密鍵
 * @returns {Promise<string>} 署名済みJWT
 */
async function createSignedJwt(header, payload, privateKeyPem) {
    // Base64URL エンコード
    const base64UrlEncode = (obj) => {
        const json = JSON.stringify(obj);
        const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const headerBase64 = base64UrlEncode(header);
    const payloadBase64 = base64UrlEncode(payload);
    const unsignedToken = `${headerBase64}.${payloadBase64}`;

    // PEM形式の秘密鍵をCryptoKeyに変換
    const cryptoKey = await importPrivateKey(privateKeyPem);

    // 署名を生成
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
        { name: 'RSASSA-PKCS1-v1_5' },
        cryptoKey,
        encoder.encode(unsignedToken)
    );

    // 署名をBase64URLエンコード
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${unsignedToken}.${signatureBase64}`;
}

/**
 * PEM形式の秘密鍵をCryptoKeyにインポート
 * @param {string} pem - PEM形式の秘密鍵
 * @returns {Promise<CryptoKey>} CryptoKeyオブジェクト
 */
async function importPrivateKey(pem) {
    // PEMヘッダー/フッターを削除してBase64デコード
    const pemContents = pem
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
        .replace(/-----END RSA PRIVATE KEY-----/g, '')
        .replace(/\s/g, '');

    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return await crypto.subtle.importKey(
        'pkcs8',
        bytes.buffer,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256',
        },
        false,
        ['sign']
    );
}
