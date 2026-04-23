import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getImageFromDrive } from '../../lib/drive';
import { Image as ImageIcon } from 'lucide-react';

export const DriveImage = ({ src, alt, className, onClick, ...props }) => {
    const { token } = useAuth();
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Stable dependencies for useEffect
    const srcString = typeof src === 'string' ? src : null;
    const isUrl = srcString && (srcString.startsWith('data:') || srcString.startsWith('http') || srcString.startsWith('blob:'));

    // If it's a string and NOT a URL, assume it's a Drive ID
    const srcId = src?.id || (!isUrl && srcString ? srcString : null);
    const isDriveType = (src && src.type === 'drive') || (!isUrl && !!srcString);

    useEffect(() => {
        let isMounted = true;

        const fetchImage = async () => {
            if (!src) {
                setImageUrl(null);
                setLoading(false);
                return;
            }

            // Case 1: src is a URL/Base64 string
            if (isUrl) {
                setImageUrl(srcString);
                setLoading(false);
                return;
            }

            // Case 2: src is a Drive ID (object or string)
            if (isDriveType && srcId) {
                setLoading(true);
                setError(false);
                try {
                    // Always fetch blob for high res experience (Original behavior)
                    const url = await getImageFromDrive(token, srcId);

                    if (isMounted) {
                        if (url) {
                            setImageUrl(url);
                        } else {
                            setError(true);
                        }
                        setLoading(false);
                    }
                } catch (err) {
                    console.error("Failed to load Drive image", err);
                    if (isMounted) {
                        setError(true);
                        setLoading(false);
                    }
                }
                return;
            }

            // Unknown format
            console.warn("Unknown image src format:", src);
            setLoading(false);
            setError(true);
        };

        fetchImage();

        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [srcId, isDriveType, isUrl, srcString, token]); // src의 파생값들로 구성 — src 직접 추가 시 객체 참조 문제 발생

    if (loading) {
        return (
            <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`} {...props}>
                <ImageIcon className="w-6 h-6 text-gray-400 opacity-50" />
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div className={`bg-gray-100 flex items-center justify-center ${className}`} {...props}>
                <ImageIcon className="w-6 h-6 text-gray-300" />
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            className={className}
            onClick={onClick}
            {...props}
        />
    );
};
