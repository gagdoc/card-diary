const DRIVE_FOLDER_NAME = 'CardDiaryData';
const DRIVE_IMAGES_FOLDER_NAME = 'CardDiaryImages';
const DRIVE_FILE_NAME = 'diary_entries.json';

// Helper to find our app folder
export const findAppFolder = async (token) => {
    if (token === 'mock-google-access-token') return 'mock-folder-id';
    try {
        const q = `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NAME}' and trashed=false`;
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const data = await response.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error finding app folder:', error);
        return null;
    }
};

// Helper to create our app folder
export const createAppFolder = async (token) => {
    if (token === 'mock-google-access-token') return 'mock-folder-id';
    try {
        const metadata = {
            name: DRIVE_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
        };

        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
        });
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Error creating app folder:', error);
        return null;
    }
};

// Helper to find images folder (inside app folder or root? Let's put in root for simplicity or inside app folder)
// For simplicity and safety, let's keep it in root for now alongside Data folder, or we can nest it. 
// Let's create it.
export const findImagesFolder = async (token) => {
    if (token === 'mock-google-access-token') return 'mock-images-folder-id';
    try {
        const q = `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_IMAGES_FOLDER_NAME}' and trashed=false`;
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const data = await response.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error finding images folder:', error);
        return null;
    }
};

export const createImagesFolder = async (token) => {
    if (token === 'mock-google-access-token') return 'mock-images-folder-id';
    try {
        const metadata = {
            name: DRIVE_IMAGES_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
        };

        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
        });
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Error creating images folder:', error);
        return null;
    }
};


// Helper to find our data file in the folder
export const findDataFile = async (token, folderId) => {
    if (token === 'mock-google-access-token') return 'mock-data-file-id';
    try {
        const q = `name='${DRIVE_FILE_NAME}' and '${folderId}' in parents and trashed=false`;
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const data = await response.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id; // Use the first match
        }
        return null;
    } catch (error) {
        console.error('Error finding data file:', error);
        return null;
    }
};

// Helper: Create file ID (metadata only)
const createFileMetadata = async (token, folderId) => {
    const metadata = {
        name: DRIVE_FILE_NAME,
        parents: [folderId],
        mimeType: 'application/json'
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata)
    });
    const data = await response.json();
    return data.id;
}

// Upload content to existing file ID
const uploadFileContent = async (token, fileId, data) => {
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

// Helper: Convert Data URL to Blob
const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// Helper to ensure images folder exists and return its ID
export const ensureImagesFolder = async (token) => {
    let folderId = await findImagesFolder(token);
    if (!folderId) {
        folderId = await createImagesFolder(token);
    }
    return folderId;
};

// Save Image to Drive
export const saveImageToDrive = async (token, base64Image, existingFolderId = null) => {
    if (token === 'mock-google-access-token') {
        return `mock-image-${Date.now()}`;
    }
    try {
        let folderId = existingFolderId;

        if (!folderId) {
            folderId = await ensureImagesFolder(token);
        }

        const blob = dataURLtoBlob(base64Image);

        const metadata = {
            name: `img_${Date.now()}.png`, // generic name
            parents: [folderId],
        };

        // Mutipart upload for metadata + content
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: form
        });

        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Failed to upload image", error);
        return null;
    }
}

export const getImageFromDrive = async (token, fileId) => {
    if (token === 'mock-google-access-token') {
        // In mock mode, we might just return the ID if it's already a base64 or a placeholder
        if (fileId.startsWith('mock-image-')) return null; // Can't easily recover base64 from ID in mock mode without more complex storage
        return null;
    }
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error("Error getting image", e);
        return null;
    }
}

// Helper: Get file metadata (e.g., thumbnailLink)
export const getFileMetadata = async (token, fileId, fields = 'id, name, thumbnailLink, webContentLink') => {
    if (token === 'mock-google-access-token') return { id: fileId, name: 'mock-file' };
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fields}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) throw new Error('Failed to fetch file metadata');
        return await response.json();
    } catch (e) {
        console.error("Error getting file metadata", e);
        return null;
    }
}

// Save data to Drive (Create or Update)
export const saveToDrive = async (token, data) => {
    if (token === 'mock-google-access-token') {
        return { success: true };
    }
    try {
        let folderId = await findAppFolder(token);
        if (!folderId) {
            folderId = await createAppFolder(token);
        }
        if (!folderId) throw new Error('Failed to get folder ID');

        let fileId = await findDataFile(token, folderId);
        if (!fileId) {
            fileId = await createFileMetadata(token, folderId);
        }

        if (fileId) {
            const result = await uploadFileContent(token, fileId, data);
            return result;
        }
    } catch (error) {
        console.error('Error saving to drive:', error);
    }
};

// Load data from Drive
export const loadFromDrive = async (token) => {
    if (token === 'mock-google-access-token') {
        return null;
    }
    try {
        const folderId = await findAppFolder(token);
        if (!folderId) return null;

        const fileId = await findDataFile(token, folderId);
        if (!fileId) return null;

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        // Check if response is ok, sometimes it might be empty
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading from drive:', error);
        return null;
    }
};
