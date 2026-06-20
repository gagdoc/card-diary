import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getImageFromDrive } from '../../lib/drive';
import { Image as ImageIcon, Loader } from 'lucide-react';

export const DriveImage = ({ src, alt, className, onClick, ...props }) => {
    const { token, login } = useAuth();
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
                setLoading(true);
                setError(false);
                setImageUrl(srcString);
                setLoading(false);
                return;
            }

            // Case 2: src is a Drive ID (object or string)
            if (isDriveType && srcId) {
                if (!token || token === 'mock-google-access-token') {
                    setImageUrl(null);
                    setError(true);
                    setLoading(false);
                    return;
                }

                setLoading(true);
                setError(false);
                setImageUrl(null);
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
            <div className={`bg-gray-100 flex flex-col items-center justify-center gap-2 ${className}`} {...props}>
                <Loader className="w-6 h-6 animate-spin text-gray-400" />
                <span className="text-[10px] font-black tracking-wider text-gray-400">로딩중</span>
            </div>
        );
    }

    if (error || !imageUrl) {
        const isDriveImage = isDriveType && srcId;
        const needsGoogleLogin = isDriveImage && (!token || token === 'mock-google-access-token');

        return (
            <div className={`bg-gray-100 flex flex-col items-center justify-center gap-2 text-center ${className}`} {...props}>
                <ImageIcon className="w-6 h-6 text-gray-300" />
                {isDriveImage && (
                    <span className="px-3 text-[10px] font-bold leading-snug text-gray-400">
                        {needsGoogleLogin ? 'Google 로그인 필요' : '이미지 로딩 실패'}
                    </span>
                )}
                {isDriveImage && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            login?.();
                        }}
                        className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        다시 로그인
                    </button>
                )}
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
