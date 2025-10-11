/**
 * Dropbox APIと通信するためのヘルパーオブジェクト (V2 - アセット分離対応版)
 */
 window.dropboxApi = {
    APP_KEY: 'tzq2d3onnfa630w',
    METADATA_PATH: '/gemini_pwa_data.json',
    ASSETS_DIR_PATH: '/Gemini_PWA_Assets',

    /**
     * IndexedDBからトークン情報を取得する
     * @returns {Promise<object|null>} 保存されているトークン情報
     */
    async _getTokens() {
        if (!window.dbUtils) return null;
        const tokenData = await dbUtils.getSetting('dropboxTokens');
        return tokenData ? tokenData.value : null;
    },

    /**
     * 新しいトークン情報をIndexedDBに保存する
     * @param {object} tokens - 保存するトークン情報
     */
    async _saveTokens(tokens) {
        if (!window.dbUtils) return;
        await dbUtils.saveSetting('dropboxTokens', tokens);
    },

    /**
     * リフレッシュトークンを使って新しいアクセストークンを取得する
     * @param {string} refreshToken - リフレッシュトークン
     * @returns {Promise<object>} 新しいトークン情報
     */
    async _refreshAccessToken(refreshToken) {
        console.log('[Dropbox API] Access token expired. Refreshing...');
        const url = 'https://api.dropboxapi.com/oauth2/token';
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);
        params.append('client_id', this.APP_KEY);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });

        if (!response.ok) {
            const errorJson = await response.json();
            throw new Error(errorJson.error_description || 'Failed to refresh token');
        }

        const newAccessTokenData = await response.json();
        const tokens = await this._getTokens() || {};
        const newTokens = {
            ...tokens,
            ...newAccessTokenData,
            expires_at: Date.now() + (newAccessTokenData.expires_in - 300) * 1000,
        };

        await this._saveTokens(newTokens);
        console.log('[Dropbox API] Token refreshed and saved successfully.');
        return newTokens;
    },

    /**
     * APIリクエストを送信する共通関数
     * @param {string} domain - 'api' or 'content'
     * @param {string} endpoint - APIエンドポイント
     * @param {object} options - fetch APIに渡すオプション
     * @param {number} retryCount - リトライ回数
     * @returns {Promise<any>} APIからのレスポンス
     */
    async _request(domain, endpoint, options = {}, retryCount = 0) {
        let tokens = await this._getTokens();
        if (!tokens || !tokens.access_token) {
            throw new Error("Dropbox is not connected.");
        }

        if (Date.now() >= tokens.expires_at) {
            if (!tokens.refresh_token) {
                await this.disconnect();
                throw new Error("Session expired. Please reconnect to Dropbox.");
            }
            tokens = await this._refreshAccessToken(tokens.refresh_token);
        }

        const url = `https://${domain}.dropboxapi.com/2${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${tokens.access_token}`,
            ...options.headers,
        };

        try {
            const response = await fetch(url, { ...options, headers });

            if (!response.ok) {
                if (response.status === 401 && retryCount === 0) {
                    console.log('[Dropbox API] Received 401, forcing token refresh and retrying...');
                    tokens = await this._refreshAccessToken(tokens.refresh_token);
                    return this._request(domain, endpoint, options, 1);
                }
                
                let errorText = `Dropbox API Error (${response.status}): ${response.statusText}`;
                try {
                    const errorJson = await response.json();
                    errorText = errorJson.error_summary || JSON.stringify(errorJson.error) || errorText;
                } catch (e) { /* ignore */ }
                throw new Error(errorText);
            }

            if (endpoint === '/files/download') {
                return response.blob();
            }
            
            const responseText = await response.text();
            return responseText ? JSON.parse(responseText) : {};

        } catch (error) {
            // "not found"エラーは呼び出し元で正常ケースとして処理するため、コンソールへのエラー出力を抑制する
            if (!error.message.includes('not_found')) {
                console.error(`[Dropbox API] Request error for ${endpoint}:`, error);
            }
            throw error;
        }
    },

    // --- Public API ---

    async testConnection() {
        return this._request('api', '/users/get_current_account', { method: 'POST' });
    },

    async uploadMetadata(content) {
        const args = { path: this.METADATA_PATH, mode: 'overwrite', mute: true };
        return this._request('content', '/files/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify(args),
            },
            body: content,
        });
    },

    async downloadMetadata() {
        const args = { path: this.METADATA_PATH };
        try {
            const blob = await this._request('content', '/files/download', {
                method: 'POST',
                headers: { 'Dropbox-API-Arg': JSON.stringify(args) },
            });
            return blob.text();
        } catch (error) {
            // "path/not_found" という文字列を含むエラーの場合のみ、ファイルなし(null)として扱う
            if (error && error.message && error.message.includes('path/not_found')) {
                return null;
            }
            // それ以外のエラーは、一時的なネットワークエラーの可能性があるので、そのままスローする
            throw error;
        }
    },


    async uploadAsset(assetBlob, assetId) {
        const path = `${this.ASSETS_DIR_PATH}/${assetId}`;
        const args = { path: path, mode: 'overwrite', mute: true };
        return this._request('content', '/files/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify(args),
            },
            body: assetBlob,
        });
    },

    async downloadAsset(assetId) {
        const path = `${this.ASSETS_DIR_PATH}/${assetId}`;
        const args = { path: path };
        try {
            return await this._request('content', '/files/download', {
                method: 'POST',
                headers: { 'Dropbox-API-Arg': JSON.stringify(args) },
            });
        } catch (error) {
            if (error.message.includes('path/not_found')) {
                console.warn(`[Dropbox API] Asset not found on cloud: ${assetId}`);
                return null;
            }
            throw error;
        }
    },

    async listAssets() {
        let allEntries = [];
        let hasMore = true;
        let cursor = null;
        let path = this.ASSETS_DIR_PATH;
        let loopCount = 0; // ★デバッグ用ループカウンター

        try {
            while (hasMore) {
                loopCount++; // ★デバッグ用
                let response;
                if (cursor) {
                    // ★デバッグログ: 2回目以降のリクエスト情報を表示
                    console.log(`%c[DEBUG_SYNC_PAGINATION] Loop ${loopCount}: Continuing with cursor -> ${cursor}`, 'color: purple; font-weight: bold;');
                    response = await this._request('api', '/files/list_folder/continue', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cursor: cursor }),
                    });
                } else {
                    // ★デバッグログ: 初回リクエスト情報を表示
                    console.log(`%c[DEBUG_SYNC_PAGINATION] Loop ${loopCount}: Starting with path -> ${path}`, 'color: purple; font-weight: bold;');
                    response = await this._request('api', '/files/list_folder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: path, recursive: false, limit: 500 }), // ★デバッグのため上限を500に設定
                    });
                }

                // ★デバッグログ: APIからの生の応答をすべて表示
                console.log(`%c[DEBUG_SYNC_PAGINATION] Loop ${loopCount} RAW RESPONSE:`, 'color: purple;', response);

                if (response.entries) {
                    allEntries = allEntries.concat(response.entries);
                }
                
                hasMore = response.has_more;
                cursor = response.cursor;

                // ★デバッグログ: ループ継続判定の直後の状態を表示
                console.log(`%c[DEBUG_SYNC_PAGINATION] Loop ${loopCount} End State: has_more = ${hasMore}, new cursor = ${cursor}, total entries = ${allEntries.length}`, 'color: purple; font-weight: bold;');
            }
            return allEntries;
        } catch (error) {
            if (error.message.includes('path/not_found')) {
                return [];
            }
            throw error;
        }
    },

    async ensureAssetsFolderExists() {
        try {
            // フォルダのメタデータを取得しようと試みる
            await this._request('api', '/files/get_metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: this.ASSETS_DIR_PATH }),
            });
        } catch (error) {
            if (error.message.includes('path/not_found')) {
                // フォルダが存在しない場合のみ作成する
                console.log(`[Dropbox API] Assets folder not found. Creating folder: ${this.ASSETS_DIR_PATH}`);
                await this._request('api', '/files/create_folder_v2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: this.ASSETS_DIR_PATH, autorename: false }),
                });
            } else {
                // その他のエラーはそのままスローする
                throw error;
            }
        }
    },

    async deleteAssets(assetIds) {
        if (!assetIds || assetIds.length === 0) return;
        const entries = assetIds.map(id => ({ path: `${this.ASSETS_DIR_PATH}/${id}` }));

        // Step 1: Start the delete job
        const initialResponse = await this._request('api', '/files/delete_batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: entries }),
        });

        // If it's not an async job, we're done
        if (initialResponse['.tag'] !== 'async_job_id') {
            console.log('[Dropbox API] Delete job completed synchronously or no job ID returned.', initialResponse);
            return;
        }

        const jobId = initialResponse.async_job_id;
        console.log(`[Dropbox API] Started async delete job: ${jobId}. Polling for completion...`);

        // Step 2: Poll for job completion
        const maxAttempts = 60; // Poll for up to 2 minutes (60 attempts * 2s)
        let attempts = 0;
        let jobStatus;

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        do {
            await sleep(2000); // Wait 2 seconds between checks
            attempts++;

            try {
                jobStatus = await this._request('api', '/files/delete_batch/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ async_job_id: jobId }),
                });
                console.log(`[Dropbox API] Polling delete job #${attempts}: Status is '${jobStatus['.tag']}'`);
            } catch (pollError) {
                // If polling fails, we can't know the status, so we must throw
                console.error(`[Dropbox API] Polling for delete job failed.`, pollError);
                throw new Error(`Polling for delete job ${jobId} failed: ${pollError.message}`);
            }

        } while (jobStatus['.tag'] === 'in_progress' && attempts < maxAttempts);

        // Step 3: Check final status
        if (jobStatus['.tag'] === 'complete') {
            console.log('[Dropbox API] Async delete job completed successfully.');
            return; // Success!
        } else {
            const errorMessage = `Async delete job did not complete successfully. Final status: ${jobStatus['.tag']}. Details: ${JSON.stringify(jobStatus)}`;
            console.error(`[Dropbox API] ${errorMessage}`);
            throw new Error(errorMessage);
        }
    },


    async getAccessToken(code, redirectUri, codeVerifier) {
        console.log('[Dropbox API] Requesting access token...');
        const url = 'https://api.dropboxapi.com/oauth2/token';
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', redirectUri);
        params.append('client_id', this.APP_KEY);
        params.append('code_verifier', codeVerifier);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });

        if (!response.ok) {
            const errorJson = await response.json();
            throw new Error(errorJson.error_description || `Token API Error (${response.status})`);
        }

        const tokenData = await response.json();
        tokenData.expires_at = Date.now() + (tokenData.expires_in - 300) * 1000;
        
        await this._saveTokens(tokenData); 
        
        return tokenData;
    },

    async disconnect() {
        const tokens = await this._getTokens();
        if (tokens && tokens.access_token) {
            try {
                await this._request('api', '/auth/token/revoke', { method: 'POST' });
            } catch (error) {
                console.warn("Failed to revoke token on Dropbox side, but clearing local tokens anyway.", error);
            }
        }
        await dbUtils.saveSetting('dropboxTokens', null);
        console.log('[Dropbox API] Disconnected and local tokens cleared.');
    },

    async uploadAssetsInBatches(assetsToUpload, progressCallback) {
        if (!assetsToUpload || assetsToUpload.length === 0) {
            console.log('[Dropbox API] No assets to upload in batch.');
            return;
        }

        const total = assetsToUpload.length;
        console.log(`[Dropbox API] Starting batch upload for ${total} assets.`);

        const BATCH_SIZE = 5;
        const DELAY_MS = 1000;
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < total; i++) {
            const { assetId, asset } = assetsToUpload[i];
            
            if (progressCallback) {
                progressCallback(i + 1, total);
            }

            try {
                await this.uploadAsset(asset.blob, assetId);
                console.log(`[Dropbox API] Batch upload: Successfully uploaded ${assetId} (${i + 1}/${total})`);
            } catch (error) {
                console.error(`[Dropbox API] Batch upload: Failed to upload ${assetId}.`, error);
                throw new Error(`Failed to upload asset ${assetId} during batch operation. Aborting. Original error: ${error.message}`);
            }

            if ((i + 1) % BATCH_SIZE === 0 && i < total - 1) {
                console.log(`[Dropbox API] Batch limit reached. Waiting for ${DELAY_MS}ms...`);
                await sleep(DELAY_MS);
            }
        }
        console.log(`[Dropbox API] Batch upload completed for ${total} assets.`);
    },

    // --- Lock File Operations ---

    async uploadLockFile() {
        const path = '/.sync_lock';
        const args = { path: path, mode: 'overwrite', mute: true };
        const content = `Sync started at ${new Date().toISOString()}`;
        console.log('[Dropbox API] Uploading lock file...');
        return this._request('content', '/files/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify(args),
            },
            body: content,
        });
    },

    async deleteLockFile() {
        const path = '/.sync_lock';
        console.log('[Dropbox API] Deleting lock file...');
        try {
            return await this._request('api', '/files/delete_v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path }),
            });
        } catch (error) {
            // "not_found" を含むエラーは正常ケースとして扱う
            if (error.message.includes('not_found')) {
                console.warn('[Dropbox API] Lock file not found during deletion, which is okay.');
                return null;
            }
            // Rethrow other errors
            throw error;
        }
    },


    async checkLockFile() {
        const path = '/.sync_lock';
        try {
            await this._request('api', '/files/get_metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path }),
            });
            console.log('[Dropbox API] Lock file found.');
            return true; // File exists
        } catch (error) {
            if (error.message.includes('path/not_found')) {
                console.log('[Dropbox API] Lock file not found.');
                return false; // File does not exist
            }
            // Rethrow other network or API errors
            throw error;
        }
    }
};
