import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { openGooglePhotoPicker } from '../../lib/picker';
import { Image as ImageIcon, Loader } from 'lucide-react';

export const GooglePhotoPicker = ({ onSelect, className }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    const handlePick = async () => {
        if (!token) {
            alert("먼저 Google 로그인을 해주세요.");
            return;
        }

        setLoading(true);
        try {
            const mediaItems = await openGooglePhotoPicker(token);

            if (mediaItems && mediaItems.length > 0) {
                const processedPhotos = [];

                for (const item of mediaItems) {
                    try {
                        // The item structure from Photos Picker API:
                        // item.mediaFile.baseUrl - the base URL for the media
                        // item.mediaFile.mimeType - the MIME type
                        // item.type - "PHOTO" or "VIDEO"
                        const mediaFile = item.mediaFile;
                        if (!mediaFile || !mediaFile.baseUrl) {
                            console.warn('Media item has no baseUrl:', item);
                            continue;
                        }

                        // Append =d to get the full download, or =w2048-h2048 for large size
                        const downloadUrl = `${mediaFile.baseUrl}=w2048-h2048`;
                        console.log('Downloading photo from:', downloadUrl);

                        // IMPORTANT: baseUrl requires Authorization header!
                        const response = await fetch(downloadUrl, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });

                        if (!response.ok) {
                            console.error('Failed to download photo:', response.status, response.statusText);
                            continue;
                        }

                        const blob = await response.blob();
                        console.log('Downloaded blob:', blob.size, blob.type);

                        // Convert blob to DataURL for consistency with local upload
                        const dataUrl = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });

                        processedPhotos.push(dataUrl);
                    } catch (err) {
                        console.error("사진 다운로드 실패:", err);
                    }
                }

                console.log('Total photos processed:', processedPhotos.length);

                if (processedPhotos.length > 0) {
                    onSelect(processedPhotos);
                }
            }
        } catch (error) {
            console.error("Google Photos Picker 오류:", error);
            if (error.message.includes('팝업')) {
                alert(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePick}
            disabled={loading}
            className={`p-3 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors text-gray-600 flex-shrink-0 ${className}`}
            title="Google 포토에서 선택"
        >
            {loading ? (
                <Loader className="w-6 h-6 animate-spin" />
            ) : (
                <ImageIcon className="w-6 h-6" />
            )}
        </button>
    );
};
