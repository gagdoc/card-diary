import test from 'node:test';
import assert from 'node:assert/strict';
import { getEntryImages, getEntryText, moveImageIndex } from './diaryDetailState.js';

test('getEntryImages prefers images and removes empty values', () => {
    assert.deepEqual(
        getEntryImages({ images: ['a', null, 'b'], imageUrl: 'legacy' }),
        ['a', 'b'],
    );
});

test('getEntryImages falls back to legacy imageUrl', () => {
    assert.deepEqual(getEntryImages({ imageUrl: 'legacy' }), ['legacy']);
});

test('moveImageIndex wraps in both directions', () => {
    assert.equal(moveImageIndex(0, -1, 3), 2);
    assert.equal(moveImageIndex(2, 1, 3), 0);
    assert.equal(moveImageIndex(0, 1, 0), 0);
});

test('getEntryText supplies readable fallbacks', () => {
    assert.deepEqual(getEntryText({ title: ' ', content: '' }), {
        title: '제목 없는 일기',
        content: '작성된 내용이 없습니다.',
    });
});
