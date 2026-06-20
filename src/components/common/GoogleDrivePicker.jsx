import React, { useState } from 'react';
import { HardDrive, Loader, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDriveImageAsDataUrl, listDriveImages } from '../../lib/drive';
import { DriveImage } from './DriveImage';

export const GoogleDrivePicker = ({ onSelect, className, disabled = false }) => {
    const { token, handleTokenExpired } = useAuth();
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectingId, setSelectingId] = useState(null);
    const [error, setError] = useState('');

    const loadImages = async (pageToken = null, append = false) => {
        if (!token || token === 'mock-google-access-token') {
            alert('Google Drive 이미지를 사용하려면 Google 로그인을 해주세요.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const result = await listDriveImages(token, pageToken);
            if (result.error) {
                setError(result.error);
            }
            setFiles(prev => append ? [...prev, ...(result.files || [])] : (result.files || []));
            setNextPageToken(result.nextPageToken || null);
        } catch (err) {
            if (err.status === 401) {
                setOpen(false);
                handleTokenExpired();
            } else {
                setError(err.message || '이미지를 불러오지 못했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        if (disabled) return;

        setOpen(true);
        if (files.length === 0) {
            loadImages();
        }
    };

    const handleSelect = async (file) => {
        setSelectingId(file.id);
        setError('');
        try {
            const dataUrl = await getDriveImageAsDataUrl(token, file.id);
            if (!dataUrl) {
                setError('이미지를 불러오지 못했습니다. Drive 권한을 확인해주세요.');
                return;
            }
            onSelect([dataUrl]);
            setOpen(false);
        } catch (err) {
            if (err.status === 401) {
                setOpen(false);
                handleTokenExpired();
            } else {
                setError(err.message || '이미지를 불러오지 못했습니다.');
            }
        } finally {
            setSelectingId(null);
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                disabled={loading || disabled}
                className={`p-3 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors text-gray-600 flex-shrink-0 ${className}`}
                title="Google Drive에서 선택"
            >
                {loading ? (
                    <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                    <HardDrive className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
            </button>

            {open && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-[28px] w-full max-w-3xl max-h-[82vh] shadow-2xl overflow-hidden flex flex-col">
                        <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black font-outfit text-gray-900">Google Drive</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Choose an image</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => loadImages()}
                                    disabled={loading}
                                    className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-colors"
                                    title="새로고침"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-colors"
                                    title="닫기"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6">
                            {error && (
                                <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                    {error}
                                </div>
                            )}

                            {loading && files.length === 0 ? (
                                <div className="h-64 flex items-center justify-center text-gray-400">
                                    <Loader className="w-8 h-8 animate-spin" />
                                </div>
                            ) : files.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400">
                                    <HardDrive className="w-10 h-10 mb-3 opacity-40" />
                                    <p className="font-bold">Drive에서 이미지를 찾지 못했습니다.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {files.map(file => (
                                        <button
                                            key={file.id}
                                            onClick={() => handleSelect(file)}
                                            disabled={!!selectingId}
                                            className="group text-left rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-xl transition-all disabled:opacity-60"
                                        >
                                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                                <DriveImage
                                                    src={{ type: 'drive', id: file.id }}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                {selectingId === file.id && (
                                                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                                        <Loader className="w-7 h-7 animate-spin text-gray-900" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <p className="text-xs font-bold text-gray-700 truncate" title={file.name}>{file.name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {nextPageToken && (
                                <div className="pt-6">
                                    <button
                                        onClick={() => loadImages(nextPageToken, true)}
                                        disabled={loading}
                                        className="w-full py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-sm font-black text-gray-700 transition-colors disabled:opacity-50"
                                    >
                                        More Images
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
