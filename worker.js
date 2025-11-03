// worker.js
export default {
    async fetch(request, env, ctx) {
      // CORSプリフライトリクエストへの対応
      if (request.method === 'OPTIONS') {
        return handleOptions(request);
      }
  
      // POSTリクエスト以外は弾く
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'POSTリクエストを使用してください' }), {
          status: 405,
          headers: corsHeaders('application/json'),
        });
      }
  
      try {
        const { url } = await request.json();
        if (!url || !url.startsWith('http')) {
          return new Response(JSON.stringify({ error: '有効なURLが指定されていません' }), {
            status: 400,
            headers: corsHeaders('application/json'),
          });
        }
  
        // ターゲットURLにアクセス
        const targetResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          },
        });
  
        if (!targetResponse.ok) {
          throw new Error(`ターゲットサーバーからのエラー: ${targetResponse.status} ${targetResponse.statusText}`);
        }
  
        const contentType = targetResponse.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          // HTML以外でもテキスト系ならそのまま返す試み
          if (contentType.startsWith('text/')) {
               const text = await targetResponse.text();
               return new Response(JSON.stringify({ content: text.trim() }), { headers: corsHeaders('application/json') });
          }
          throw new Error(`HTMLまたはテキストではないコンテンツタイプです: ${contentType}`);
        }
  
        const html = await targetResponse.text();
        const textContent = extractMainContent(html);
  
        const responseBody = JSON.stringify({ content: textContent });
        return new Response(responseBody, {
          headers: corsHeaders('application/json'),
        });
  
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: corsHeaders('application/json'),
        });
      }
    },
  };
  
  // CORSヘッダーを生成するヘルパー
  function corsHeaders(contentType = 'text/plain') {
    return {
      'Access-Control-Allow-Origin': '*', // ★本番環境では、アプリのドメインに限定することを推奨します
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': contentType,
    };
  }
  
  // プリフライトリクエスト用のハンドラ
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
  
  /**
   * HTML文字列から主要なテキストコンテンツを抽出する簡易関数
   * @param {string} html
   * @returns {string}
   */
  function extractMainContent(html) {
    // 1. 不要な要素を削除
    let cleanHtml = html
      .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, '');
  
    // 2. HTMLタグを改行に置換（一部のブロック要素）
    cleanHtml = cleanHtml.replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n');
    
    // 3. 残りのHTMLタグを削除
    cleanHtml = cleanHtml.replace(/<[^>]+>/g, ' ');
  
    // 4. HTMLエンティティをデコード
    cleanHtml = cleanHtml
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  
    // 5. 連続する空白や改行を整理
    const text = cleanHtml
      .replace(/[ \t]{2,}/g, ' ') // 2つ以上の連続するスペース/タブを1つに
      .replace(/\n{3,}/g, '\n\n'); // 3つ以上の連続する改行を2つに
  
    return text.trim();
  }
  