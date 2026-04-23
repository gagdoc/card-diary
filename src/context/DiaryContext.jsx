import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { loadFromDrive, saveToDrive as saveJsonToDrive, saveImageToDrive, ensureImagesFolder } from '../lib/drive';

const DiaryContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useDiary = () => useContext(DiaryContext);

export const DiaryProvider = ({ children }) => {
    const { token } = useAuth();
    const [entries, setEntries] = useState(() => {
        const saved = localStorage.getItem('diaryValues');
        return saved ? JSON.parse(saved) : [];
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from Drive on mount/login
    useEffect(() => {
        if (token && !isLoaded) {
            loadFromDrive(token).then(data => {
                if (data) {
                    setEntries(data);
                }
                setIsLoaded(true);
            });
        }
    }, [token, isLoaded]);

    // Save to LocalStorage and Drive on change
    useEffect(() => {
        localStorage.setItem('diaryValues', JSON.stringify(entries));

        if (token && isLoaded) {
            const timeoutId = setTimeout(async () => {
                // Pre-process entries to upload pending images

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

                // Check if any changes were made (images uploaded) to update local state?
                // Updating local state with Drive IDs is good practice to avoid re-uploading
                // However, directly calling setEntries here might cause loop if not careful.
                // But since we only replace data:image with object, it won't match "startsWith('data:image')" next time.
                // Let's verify if deep equality changed or just overwrite.

                // IMPORTANT: We should update the local state with the uploaded IDs 
                // so the UI knows they are saved and standardizes the format.
                // But we must be careful not to trigger infinite loop if setEntries triggers useEffect.
                // JSON.stringify comparison might work.

                const currentStr = JSON.stringify(entries);
                const newStr = JSON.stringify(processedEntries);

                if (currentStr !== newStr) {
                    setEntries(processedEntries);
                    // The useEffect will run again, but this time no data:image, so it proceeds to saveJsonToDrive
                    return;
                }

                saveJsonToDrive(token, processedEntries);
            }, 1000); // 1 second debounce
            return () => clearTimeout(timeoutId);
        }
    }, [entries, token, isLoaded]);

    const addEntry = (entry) => {
        setEntries(prev => [...prev, { ...entry, id: uuidv4(), createdAt: new Date().toISOString() }]);
    };

    const updateEntry = (id, updatedEntry) => {
        setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, ...updatedEntry } : entry));
    };

    const deleteEntry = (id) => {
        setEntries(prev => prev.filter(entry => entry.id !== id));
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
        <DiaryContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry, getEntriesByMonth, getEntriesByDate }}>
            {children}
        </DiaryContext.Provider>
    );
};
