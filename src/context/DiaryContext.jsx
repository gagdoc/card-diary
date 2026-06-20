import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { loadFromDrive, saveToDrive as saveJsonToDrive, saveImageToDrive, ensureImagesFolder } from '../lib/drive';

const DiaryContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useDiary = () => useContext(DiaryContext);

const LEGACY_STORAGE_KEY = 'diaryValues';
const getStorageKey = (accountId) => `diaryValues:${accountId}`;
const getStoredEntries = (storageKey, allowLegacyFallback = false) => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);

    if (allowLegacyFallback) {
        const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacySaved) return JSON.parse(legacySaved);
    }

    return [];
};

export const DiaryProvider = ({ children }) => {
    const { token, user } = useAuth();
    const isGoogleAccount = token && token !== 'mock-google-access-token';
    const accountId = token === 'mock-google-access-token'
        ? 'guest'
        : token
            ? (user?.email || user?.sub || null)
            : 'local';
    const storageKey = accountId ? getStorageKey(accountId) : null;
    const [entries, setEntries] = useState(() => getStoredEntries(getStorageKey('local'), true));
    const [isLoaded, setIsLoaded] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [syncError, setSyncError] = useState('');
    const [lastSavedAt, setLastSavedAt] = useState(null);

    // Load the isolated local cache for the active account, then hydrate Google accounts from Drive.
    useEffect(() => {
        let cancelled = false;

        const hydrateAccount = async () => {
            if (cancelled) return;

            if (!storageKey) {
                setEntries([]);
                setIsLoaded(false);
                setSyncStatus('idle');
                return;
            }

            const allowLegacyFallback = accountId === 'local' || accountId === 'guest';
            setEntries(getStoredEntries(storageKey, allowLegacyFallback));
            setSyncError('');
            setSyncStatus('idle');

            if (!isGoogleAccount) {
                setIsLoaded(true);
                return;
            }

            setIsLoaded(false);

            try {
                const data = await loadFromDrive(token);
                if (cancelled) return;

                if (data) {
                    setEntries(data);
                }
                setIsLoaded(true);
            } catch (error) {
                console.error('Error loading diary for account:', error);
                if (!cancelled) {
                    setSyncStatus('error');
                    setSyncError('Drive에서 일기를 불러오지 못했습니다.');
                    setIsLoaded(true);
                }
            }
        };

        hydrateAccount();

        return () => {
            cancelled = true;
        };
    }, [accountId, isGoogleAccount, storageKey, token]);

    // Save to this account's isolated LocalStorage and Drive on change
    useEffect(() => {
        if (!storageKey || !isLoaded) return;

        localStorage.setItem(storageKey, JSON.stringify(entries));

        if (isGoogleAccount) {
            const timeoutId = setTimeout(async () => {
                setSyncStatus('syncing');

                try {
                    // Ensure the images folder exists ONCE before processing any images
                    const imagesFolderId = await ensureImagesFolder(token);

                    const processedEntries = await Promise.all(entries.map(async (entry) => {
                        const processedEntry = { ...entry };

                        // Helper to process a single image list
                        const processImages = async (imgList) => {
                            if (!imgList) return [];
                            return await Promise.all(imgList.map(async (img) => {
                                // Check if image is a Base64 string (pending upload)
                                if (typeof img === 'string' && img.startsWith('data:image')) {
                                    console.log('Uploading image to Drive...');
                                    // Pass the resolved folder ID to avoid race conditions
                                    const fileId = await saveImageToDrive(token, img, imagesFolderId);
                                    if (fileId) {
                                        return { type: 'drive', id: fileId };
                                    }
                                    return img; // Return original if upload fails
                                }
                                return img;
                            }));
                        };

                        // Process 'images' array
                        if (processedEntry.images && processedEntry.images.length > 0) {
                            processedEntry.images = await processImages(processedEntry.images);
                        }

                        // Process 'imageUrl' (backward compatibility) with the same folder ID
                        if (typeof processedEntry.imageUrl === 'string' && processedEntry.imageUrl.startsWith('data:image')) {
                            const fileId = await saveImageToDrive(token, processedEntry.imageUrl, imagesFolderId);
                            if (fileId) {
                                processedEntry.imageUrl = { type: 'drive', id: fileId };
                            }
                        }

                        return processedEntry;
                    }));

                    const currentStr = JSON.stringify(entries);
                    const newStr = JSON.stringify(processedEntries);

                    if (currentStr !== newStr) {
                        setEntries(processedEntries);
                        return;
                    }

                    await saveJsonToDrive(token, processedEntries);
                    setSyncStatus('saved');
                    setLastSavedAt(new Date().toISOString());
                } catch (error) {
                    console.error('Diary sync failed:', error);
                    setSyncStatus('error');
                    setSyncError('Drive 저장에 실패했습니다. 네트워크와 로그인 상태를 확인해주세요.');
                }
            }, 1000); // 1 second debounce
            return () => clearTimeout(timeoutId);
        }
    }, [entries, isGoogleAccount, isLoaded, storageKey, token]);

    const markDirty = () => {
        setSyncError('');
        if (isGoogleAccount && isLoaded) {
            setSyncStatus('pending');
        } else {
            setSyncStatus('saved');
            setLastSavedAt(new Date().toISOString());
        }
    };

    const addEntry = (entry) => {
        markDirty();
        setEntries(prev => [...prev, { ...entry, id: uuidv4(), createdAt: new Date().toISOString() }]);
    };

    const updateEntry = (id, updatedEntry) => {
        markDirty();
        setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, ...updatedEntry } : entry));
    };

    const deleteEntry = (id) => {
        markDirty();
        setEntries(prev => prev.filter(entry => entry.id !== id));
    };

    const importEntries = (incomingEntries) => {
        if (!Array.isArray(incomingEntries)) return false;

        markDirty();
        setEntries(prev => {
            const normalizedEntries = incomingEntries.map(entry => ({
                ...entry,
                id: entry.id || uuidv4(),
            }));
            const mergedById = new Map(prev.map(entry => [entry.id, entry]));

            normalizedEntries.forEach(entry => {
                mergedById.set(entry.id, entry);
            });

            return Array.from(mergedById.values());
        });

        return true;
    };

    const getEntriesByMonth = (year, month) => {
        return entries.filter(entry => {
            const date = new Date(entry.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    };

    const getEntriesByDate = (dateObj) => {
        return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getFullYear() === dateObj.getFullYear() &&
                entryDate.getMonth() === dateObj.getMonth() &&
                entryDate.getDate() === dateObj.getDate();
        });
    };

    return (
        <DiaryContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry, importEntries, getEntriesByMonth, getEntriesByDate, syncStatus, syncError, lastSavedAt, isLoaded }}>
            {children}
        </DiaryContext.Provider>
    );
};
