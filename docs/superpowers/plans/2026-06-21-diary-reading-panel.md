# Diary Reading Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 월 목록의 일기를 클릭하면 같은 오른쪽 패널에서 사진과 본문을 읽고, 명시적인 수정 동작을 통해서만 편집 화면에 진입하게 한다.

**Architecture:** `MonthDetail`이 목록/상세 전환 상태를 소유하고 새 `DiaryDetail`이 읽기 전용 표시와 사진 선택을 담당한다. `App`은 새 글 작성과 기존 글 편집을 구분하며, `DiaryEditor`는 지정된 일기를 편집한 뒤 닫혀 기존 상세 패널로 돌아간다.

**Tech Stack:** React 19, Vite, Tailwind CSS, Framer Motion, Node.js built-in test runner

---

## File Structure

- Create `src/components/diary/diaryDetailState.js`: 과거/현재 이미지 데이터 정규화와 갤러리 인덱스 이동을 담당하는 순수 함수.
- Create `src/components/diary/diaryDetailState.test.js`: 이미지 정규화와 순환 이동 회귀 테스트.
- Create `src/components/diary/DiaryDetail.jsx`: 읽기 전용 제목·본문·메타데이터·사진 갤러리 UI.
- Modify `src/components/diary/MonthDetail.jsx`: 월 목록과 선택 일기 상세를 같은 패널에서 전환.
- Modify `src/App.jsx`: 새 글 작성과 상세에서 요청한 편집 진입을 분리.
- Modify `src/components/diary/DiaryEditor.jsx`: 미완성 강조 코드를 제거하고 지정된 일기 편집 및 완료/취소 복귀를 복구.
- Modify `package.json`: Node 테스트 실행 스크립트 추가.

### Task 1: Gallery State Utilities

**Files:**
- Create: `src/components/diary/diaryDetailState.test.js`
- Create: `src/components/diary/diaryDetailState.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing utility tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getEntryImages, moveImageIndex } from './diaryDetailState.js';

test('getEntryImages prefers images and removes empty values', () => {
  assert.deepEqual(getEntryImages({ images: ['a', null, 'b'], imageUrl: 'legacy' }), ['a', 'b']);
});

test('getEntryImages falls back to legacy imageUrl', () => {
  assert.deepEqual(getEntryImages({ imageUrl: 'legacy' }), ['legacy']);
});

test('moveImageIndex wraps in both directions', () => {
  assert.equal(moveImageIndex(0, -1, 3), 2);
  assert.equal(moveImageIndex(2, 1, 3), 0);
  assert.equal(moveImageIndex(0, 1, 0), 0);
});
```

- [ ] **Step 2: Add the test script and verify RED**

Add to `package.json` scripts:

```json
"test": "node --test src/**/*.test.js"
```

Run: `npm test`

Expected: FAIL because `diaryDetailState.js` does not exist.

- [ ] **Step 3: Implement the minimal pure functions**

```js
export const getEntryImages = (entry = {}) => {
  const images = Array.isArray(entry.images) ? entry.images.filter(Boolean) : [];
  return images.length > 0 ? images : (entry.imageUrl ? [entry.imageUrl] : []);
};

export const moveImageIndex = (current, direction, count) => {
  if (count <= 0) return 0;
  return (current + direction + count) % count;
};
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test`

Expected: 3 tests pass.

### Task 2: Read-Only Diary Detail

**Files:**
- Create: `src/components/diary/DiaryDetail.jsx`
- Modify: `src/components/diary/diaryDetailState.test.js`

- [ ] **Step 1: Add failing tests for display fallbacks**

Extend the utility API and tests:

```js
import { getEntryImages, getEntryText, moveImageIndex } from './diaryDetailState.js';

test('getEntryText supplies readable fallbacks', () => {
  assert.deepEqual(getEntryText({ title: ' ', content: '' }), {
    title: '제목 없는 일기',
    content: '작성된 내용이 없습니다.',
  });
});
```

Run: `npm test`

Expected: FAIL because `getEntryText` is not exported.

- [ ] **Step 2: Implement the text fallback utility**

```js
export const getEntryText = (entry = {}) => ({
  title: entry.title?.trim() || '제목 없는 일기',
  content: entry.content?.trim() || '작성된 내용이 없습니다.',
});
```

- [ ] **Step 3: Build `DiaryDetail`**

Implement a component with this public interface:

```jsx
export const DiaryDetail = ({ entry, month, onBack, onEdit }) => {
  // reset selectedImageIndex when entry.id changes
  // render back/edit header, main DriveImage, thumbnail buttons,
  // previous/next controls, title, full whitespace-preserved content,
  // and optional created time/location metadata
};
```

Use `getEntryImages`, `getEntryText`, `moveImageIndex`, existing `DriveImage`, and `date-fns/format`. Hide gallery controls when fewer than two images exist, label buttons in Korean, and use `whitespace-pre-wrap` for the full body.

- [ ] **Step 4: Verify utilities and production compilation**

Run: `npm test && npm run build`

Expected: tests pass and Vite build succeeds once the current malformed JSX is addressed in Task 4; at this checkpoint the test suite must pass even if the pre-existing JSX build error remains.

### Task 3: Month List-to-Detail Navigation

**Files:**
- Modify: `src/components/diary/MonthDetail.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add selection state to `MonthDetail`**

Change the public interface to:

```jsx
export const MonthDetail = ({ year, month, onClose, onCreateEntry, onEditEntry }) => {
  const [selectedEntryId, setSelectedEntryId] = React.useState(null);
  const selectedEntry = monthEntries.find(entry => entry.id === selectedEntryId) || null;

  if (selectedEntry) {
    return (
      <DiaryDetail
        entry={selectedEntry}
        month={month}
        onBack={() => setSelectedEntryId(null)}
        onEdit={() => onEditEntry(selectedEntry)}
      />
    );
  }
  // existing list panel
};
```

Change each list row to `onClick={() => setSelectedEntryId(entry.id)}` and the bottom action to `onClick={onCreateEntry}`. Preserve the star button's propagation guard.

- [ ] **Step 2: Separate App create and edit handlers**

Use these responsibilities in `App.jsx`:

```jsx
const handleCreateEntry = () => {
  setSelectedDate(new Date(selectedYear, selectedMonth ?? new Date().getMonth(), new Date().getDate()));
  setEditingEntry(null);
  setIsEditorOpen(true);
};

const handleEditEntry = (entry) => {
  setEditingEntry(entry);
  setIsEditorOpen(true);
};
```

Pass `onCreateEntry={handleCreateEntry}` and `onEditEntry={handleEditEntry}` to `MonthDetail`. Keep `MonthDetail` mounted behind the editor so its selected detail survives editor close.

- [ ] **Step 3: Run lint and record only relevant failures**

Run: `npm run lint`

Expected: no new lint failures in `App.jsx`, `MonthDetail.jsx`, or `DiaryDetail.jsx`.

### Task 4: Focused Editing and Return to Detail

**Files:**
- Modify: `src/components/diary/DiaryEditor.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Remove the incomplete highlight implementation**

Delete `highlightedId`, `highlightedRef`, the scroll/highlight effect, conditional ref/ring classes, and restore the valid empty/list ternary `) : (`. This removes the current line 406 parse error.

- [ ] **Step 2: Restore explicit focused editing**

Add an effect that starts editing only when `initialEditingEntryId` resolves to an entry:

```jsx
React.useEffect(() => {
  if (!initialEditingEntryId || editingId) return;
  const entry = entries.find(item => item.id === initialEditingEntryId);
  if (entry) startEditing(entry);
}, [initialEditingEntryId, entries, editingId]);
```

For a focused edit, make `cancelEditing` call `onClose()` after clearing local edit fields. After `saveEditing` updates the entry, call `onClose()` so the still-mounted `MonthDetail` reveals the same detailed entry with updated context data.

- [ ] **Step 3: Verify the focused editor path**

Run: `npm test && npm run lint && npm run build`

Expected: tests pass, lint has no errors, and the production build succeeds.

### Task 5: Browser Verification and Final Cleanup

**Files:**
- Modify only if verification reveals a scoped defect in files listed above.

- [ ] **Step 1: Start the app**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL.

- [ ] **Step 2: Verify the approved B flow in the browser**

Confirm:

1. A month card opens its month list.
2. Clicking an entry replaces the same right panel with read-only details.
3. All available photos can be selected with thumbnails and previous/next controls.
4. Back restores the same month list.
5. Edit opens the chosen entry's editor.
6. Save or cancel returns to that entry's detail.
7. New Story still opens a blank editor.

- [ ] **Step 3: Run final verification**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: all commands exit 0.

- [ ] **Step 4: Review the final diff**

Run: `git status --short && git diff --stat && git diff -- src/App.jsx src/components/diary/DiaryEditor.jsx src/components/diary/MonthDetail.jsx src/components/diary/DiaryDetail.jsx src/components/diary/diaryDetailState.js src/components/diary/diaryDetailState.test.js package.json`

Expected: only the approved feature, test, and existing user-owned `DiaryEditor.jsx` work are represented; `.superpowers/` remains untracked and excluded from the feature commit.
