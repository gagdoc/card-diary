// Google Photos Picker API (New Session-Based Flow, 2025+)
// Docs: https://developers.google.com/photos/picker/guides/get-started-picker

const PICKER_API_BASE = 'https://photospicker.googleapis.com/v1';

/**
 * Create a new Picker session.
 * Returns session object with pickerUri and id.
 */
export const createPickerSession = async (oauthToken) => {
    const response = await fetch(`${PICKER_API_BASE}/sessions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${oauthToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create picker session:', response.status, errorData);
        throw new Error(`Failed to create picker session: ${response.status}`);
    }

    return await response.json();
};

/**
 * Poll (GET) a picker session to check if user has finished selecting.
 * Returns updated session object.
 */
export const getPickerSession = async (oauthToken, sessionId) => {
    const response = await fetch(`${PICKER_API_BASE}/sessions/${sessionId}`, {
        headers: {
            'Authorization': `Bearer ${oauthToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to poll session: ${response.status}`);
    }

    return await response.json();
};

/**
 * List selected media items from a completed session.
 * Returns array of media items.
 */
export const listPickedMediaItems = async (oauthToken, sessionId) => {
    const response = await fetch(`${PICKER_API_BASE}/mediaItems?sessionId=${sessionId}`, {
        headers: {
            'Authorization': `Bearer ${oauthToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to list media items: ${response.status}`);
    }

    const data = await response.json();
    return data.mediaItems || [];
};

/**
 * Open the Google Photos picker in a popup window and wait for user selection.
 * Returns an array of media items selected by the user, or null if cancelled.
 */
export const openGooglePhotoPicker = async (oauthToken) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // IMPORTANT: Open popup/tab FIRST, synchronously during user click event.
    // iOS Safari blocks window.open() after any async/await call.
    let popup;
    if (isIOS) {
        // iOS: open a new tab (less likely to be blocked than popup)
        popup = window.open('about:blank', '_blank');
    } else {
        popup = window.open('about:blank', 'GooglePhotosPicker', 'width=900,height=700,left=200,top=100');
    }

    if (!popup) {
        throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
    }

    // Show loading state in the popup
    popup.document.write(`
        <html>
        <head><title>Google Photos</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:-apple-system,sans-serif;background:#f9fafb;">
            <div style="text-align:center;">
                <div style="width:40px;height:40px;border:3px solid #e5e7eb;border-top:3px solid #3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
                <p style="color:#6b7280;font-size:14px;">Google 포토를 불러오는 중...</p>
            </div>
            <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </body>
        </html>
    `);

    try {
        // Step 1: Create session (popup is already open)
        const session = await createPickerSession(oauthToken);
        console.log('Picker session created:', session.id);

        // Step 2: Redirect the already-open popup to the picker URL
        const pickerUrl = session.pickerUri;
        popup.location.href = pickerUrl;

        // Step 3: Poll the session until user finishes selecting
        const POLL_INTERVAL = 3000;
        const TIMEOUT = 5 * 60 * 1000;
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    if (Date.now() - startTime > TIMEOUT) {
                        console.log('Picker session timed out');
                        try { popup.close(); } catch (e) { /* ignore COOP errors */ }
                        resolve(null);
                        return;
                    }

                    const updatedSession = await getPickerSession(oauthToken, session.id);
                    console.log('Poll result - mediaItemsSet:', updatedSession.mediaItemsSet);

                    if (updatedSession.mediaItemsSet) {
                        console.log('User finished selection! Fetching media items...');
                        try { popup.close(); } catch (e) { /* ignore COOP errors */ }

                        const items = await listPickedMediaItems(oauthToken, session.id);
                        console.log('Selected media items:', items.length, items);
                        resolve(items);
                        return;
                    }

                    setTimeout(poll, POLL_INTERVAL);
                } catch (error) {
                    console.error('Polling error:', error);
                    if (Date.now() - startTime > TIMEOUT) {
                        try { popup.close(); } catch (e) { /* ignore */ }
                        reject(error);
                    } else {
                        setTimeout(poll, POLL_INTERVAL);
                    }
                }
            };

            setTimeout(poll, POLL_INTERVAL);
        });
    } catch (error) {
        // If session creation fails, close the popup we already opened
        try { popup.close(); } catch (e) { /* ignore */ }
        throw error;
    }
};
