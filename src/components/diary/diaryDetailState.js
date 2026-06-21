export const getEntryImages = (entry = {}) => {
    const images = Array.isArray(entry.images) ? entry.images.filter(Boolean) : [];
    return images.length > 0 ? images : (entry.imageUrl ? [entry.imageUrl] : []);
};

export const getEntryText = (entry = {}) => ({
    title: entry.title?.trim() || '제목 없는 일기',
    content: entry.content?.trim() || '작성된 내용이 없습니다.',
});

export const moveImageIndex = (current, direction, count) => {
    if (count <= 0) return 0;
    return (current + direction + count) % count;
};
