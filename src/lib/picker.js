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
    // Step 1: Create session
    const session = await createPickerSession(oauthToken);
    console.log('Picker session created:', session.id);
    console.log('Picker session details:', JSON.stringify(session));

    // Step 2: Open pickerUri in a popup
    const pickerUrl = session.pickerUri;
    const popup = window.open(pickerUrl, 'GooglePhotosPicker', 'width=900,height=700,left=200,top=100');

    if (!popup) {
        throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
    }

    // Step 3: Poll the session until user finishes selecting
    // NOTE: Cross-Origin-Opener-Policy prevents reading popup.closed,
    // so we rely purely on polling the session status.
    const POLL_INTERVAL = 3000; // Poll every 3 seconds
    const TIMEOUT = 5 * 60 * 1000; // 5 minute timeout
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const poll = async () => {
            try {
                // Check timeout
                if (Date.now() - startTime > TIMEOUT) {
                    console.log('Picker session timed out');
                    try { popup.close(); } catch (e) { /* ignore COOP errors */ }
                    resolve(null);
                    return;
                }

                // Poll session status
                const updatedSession = await getPickerSession(oauthToken, session.id);
                console.log('Poll result - mediaItemsSet:', updatedSession.mediaItemsSet);

                if (updatedSession.mediaItemsSet) {
                    // User finished selecting!
                    console.log('User finished selection! Fetching media items...');
                    try { popup.close(); } catch (e) { /* ignore COOP errors */ }

                    const items = await listPickedMediaItems(oauthToken, session.id);
                    console.log('Selected media items:', items.length, items);
                    resolve(items);
                    return;
                }

                // Continue polling
                setTimeout(poll, POLL_INTERVAL);
            } catch (error) {
                console.error('Polling error:', error);
                // Don't reject immediately - keep trying unless it's a fatal error
                if (Date.now() - startTime > TIMEOUT) {
                    try { popup.close(); } catch (e) { /* ignore */ }
                    reject(error);
                } else {
                    setTimeout(poll, POLL_INTERVAL);
                }
            }
        };

        // Start polling after initial delay
        setTimeout(poll, POLL_INTERVAL);
    });
};
