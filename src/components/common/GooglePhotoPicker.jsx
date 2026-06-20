import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { openGooglePhotoPicker } from '../../lib/picker';
import { Image as ImageIcon, Loader, X, Smartphone } from 'lucide-react';

export const GooglePhotoPicker = ({ onSelect, className, disabled = false }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPopupGuide, setShowPopupGuide] = useState(false);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    const handlePick = async () => {
        if (disabled) return;

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
                        const mediaFile = item.mediaFile;
                        if (!mediaFile || !mediaFile.baseUrl) {
                            console.warn('Media item has no baseUrl:', item);
                            continue;
                        }

                        const downloadUrl = `${mediaFile.baseUrl}=w2048-h2048`;
                        console.log('Downloading photo from:', downloadUrl);

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
                setShowPopupGuide(true);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handlePick}
                disabled={loading || disabled}
                className={`p-3 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors text-gray-600 flex-shrink-0 ${className}`}
                title="Google 포토에서 선택"
            >
                {loading ? (
                    <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
            </button>

            {/* Popup Blocker Guide Modal */}
            {showPopupGuide && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-blue-500" />
                                <h3 className="font-bold text-gray-900">팝업 허용 필요</h3>
                            </div>
                            <button
                                onClick={() => setShowPopupGuide(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-5 py-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Google 포토를 사용하려면 팝업을 허용해야 합니다.
                            </p>

                            {isIOS ? (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">iPhone / iPad 설정 방법</p>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                            <p className="text-sm text-gray-700"><strong>설정</strong> 앱을 열어주세요</p>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                            <p className="text-sm text-gray-700">아래로 스크롤 → <strong>Safari</strong> 탭</p>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                            <p className="text-sm text-gray-700"><strong>팝업 차단</strong>을 <strong className="text-green-600">끄기</strong>로 변경</p>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                                            <p className="text-sm text-gray-700">이 앱으로 돌아와서 <strong>다시 시도</strong></p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chrome / 기타 브라우저</p>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-700">
                                            주소창에 팝업 차단 알림이 표시되면 <strong>"항상 허용"</strong>을 선택해주세요.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-gray-100">
                            <button
                                onClick={() => { setShowPopupGuide(false); handlePick(); }}
                                className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors"
                            >
                                다시 시도하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
