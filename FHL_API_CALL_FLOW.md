# FHL Bible API 調用流程說明

## 當前實現方式

**重要說明**：目前是**直接調用 FHL API** (`https://bible.fhl.net/json/`)，而不是通過 fhl-bible MCP Server。

---

## 調用架構

```
用戶查詢
  ↓
detectBibleQuery() - 檢測是否為 Bible 查詢
  ↓
app/api/chat/route.ts - 處理查詢
  ↓
lib/fhl-api.ts - 直接調用 FHL API
  ↓
https://bible.fhl.net/json/ - FHL API 端點
  ↓
返回數據 → 格式化 → 提供給 AI
```

---

## 詳細調用流程

### 1. 查詢檢測階段

**文件**: `lib/bible-utils.ts`

```typescript
detectBibleQuery(message: string): BibleQuery
```

**功能**:
- 檢測用戶消息是否包含 Bible/信仰相關關鍵字
- 識別查詢類型：`verse` | `chapter` | `search` | `null`
- 解析書卷名稱、章節、節數

**示例**:
- `約翰福音 3:16` → `{ type: "verse", book: "約翰福音", chapter: 3, verse: "16" }`
- `愛` → `{ type: "search", keyword: "愛" }`

---

### 2. API 調用階段

**文件**: `app/api/chat/route.ts`

當檢測到 Bible 查詢時，會根據類型調用不同的函數：

#### A. 經文查詢 (verse)

```typescript
// 1. 獲取經文
const verseData = await getBibleVerse(
  bookId,        // 書卷 ID (如: 43 = 約翰福音)
  chapter,       // 章數
  verse,         // 節數 (可選)
  "unv",         // 版本 (預設: 和合本)
  false,         // 是否包含 Strong's Number
  false          // 是否簡體中文
);

// 2. 格式化經文上下文
bibleContext += formatBibleContext(verseData);

// 3. 如果指定了節數，並行獲取註釋和原文分析
const [commentaryData, wordData] = await Promise.allSettled([
  getCommentary(bookId, chapter, verseNum),
  getWordAnalysis(bookId, chapter, verseNum)
]);
```

#### B. 章節查詢 (chapter)

```typescript
const chapterData = await getBibleChapter(
  bookId,
  chapter,
  "unv",
  false
);
bibleContext += formatBibleContext(chapterData);
```

#### C. 關鍵字搜索 (search)

```typescript
const searchData = await searchBible(
  keyword,       // 搜索關鍵字 (如: "愛")
  "unv",         // 版本
  10,            // 結果數量限制
  false          // 是否簡體中文
);
bibleContext += formatBibleSearchContext(searchData);
```

---

### 3. FHL API 直接調用

**文件**: `lib/fhl-api.ts`

所有函數都直接使用 `fetch()` 調用 FHL API：

#### A. 獲取經文 (`qb.php`)

```typescript
export async function getBibleVerse(...) {
  const params = new URLSearchParams({
    bid: bookId.toString(),      // 書卷 ID
    chap: chapter.toString(),    // 章數
    sec: verse,                  // 節數 (可選)
    version: "unv",              // 版本
    strong: "0",                 // Strong's Number
    gb: "0",                     // 繁簡體 (0=繁體, 1=簡體)
  });

  const response = await fetch(
    `https://bible.fhl.net/json/qb.php?${params.toString()}`
  );
  return response.json();
}
```

**API 端點**: `https://bible.fhl.net/json/qb.php`

**參數**:
- `bid`: 書卷編號 (1-66)
- `chap`: 章數
- `sec`: 節數 (可選，不提供則返回整章)
- `version`: 版本代碼 (預設: unv = 和合本)
- `strong`: 是否包含 Strong's Number (0/1)
- `gb`: 繁簡體 (0=繁體, 1=簡體)

#### B. 搜索經文 (`search.php`)

```typescript
export async function searchBible(keyword, version, limit, simplified) {
  const params = new URLSearchParams({
    q: keyword,
    version,
    limit: limit.toString(),
    gb: simplified ? "1" : "0",
  });

  const response = await fetch(
    `https://bible.fhl.net/json/search.php?${params.toString()}`
  );
  return response.json();
}
```

**API 端點**: `https://bible.fhl.net/json/search.php`

#### C. 獲取註釋 (`sc.php`)

```typescript
export async function getCommentary(bookId, chapter, verse, commentaryId, simplified) {
  const params = new URLSearchParams({
    bid: bookId.toString(),
    chap: chapter.toString(),
    sec: verse.toString(),
    gb: simplified ? "1" : "0",
  });

  if (commentaryId) {
    params.append("book", commentaryId.toString());
  }

  const response = await fetch(
    `https://bible.fhl.net/json/sc.php?${params.toString()}`
  );
  return response.json();
}
```

**API 端點**: `https://bible.fhl.net/json/sc.php`

#### D. 獲取原文分析 (`qp.php`)

```typescript
export async function getWordAnalysis(bookId, chapter, verse, simplified) {
  const params = new URLSearchParams({
    bid: bookId.toString(),
    chap: chapter.toString(),
    sec: verse.toString(),
    gb: simplified ? "1" : "0",
  });

  const response = await fetch(
    `https://bible.fhl.net/json/qp.php?${params.toString()}`
  );
  return response.json();
}
```

**API 端點**: `https://bible.fhl.net/json/qp.php`

---

## 數據格式化

**文件**: `lib/bible-utils.ts`

獲取數據後，會格式化為 AI 可讀的上下文：

### 1. 經文格式化

```typescript
formatBibleContext(verseData)
// 輸出格式:
// [Bible Reference - 和合本]
// 約翰福音 3:16
// 神愛世人，甚至將他的獨生子賜給他們...
```

### 2. 搜索結果格式化

```typescript
formatBibleSearchContext(searchData)
// 輸出格式:
// [Bible Search Results - Found 50 results]
// 約翰福音 3:16
// 神愛世人...
// 約翰一書 4:9
// 神差他獨生子到世間來...
```

### 3. 註釋格式化

```typescript
formatCommentaryContext(commentaryData)
// 輸出格式:
// [Bible Commentary]
// [CBOL註釋] 約翰福音 3:16
// 神愛世人的愛是犧牲的愛...
```

### 4. 原文分析格式化

```typescript
formatWordAnalysisContext(wordData)
// 輸出格式:
// [Original Language Word Analysis]
// Word: 愛
// Strong's Number: G25
// Meaning: 無條件的愛...
```

---

## 完整調用示例

### 示例 1: 查詢 "約翰福音 3:16"

```typescript
// 1. 檢測查詢
const query = detectBibleQuery("約翰福音 3:16");
// → { type: "verse", book: "約翰福音", chapter: 3, verse: "16" }

// 2. 轉換書卷名稱
const bookId = parseBookName("約翰福音"); // → 43

// 3. 獲取經文
const verseData = await getBibleVerse(43, 3, "16", "unv", false, false);
// → 調用: https://bible.fhl.net/json/qb.php?bid=43&chap=3&sec=16&version=unv&strong=0&gb=0

// 4. 並行獲取註釋和原文分析
const [commentary, wordAnalysis] = await Promise.allSettled([
  getCommentary(43, 3, 16),      // sc.php?bid=43&chap=3&sec=16
  getWordAnalysis(43, 3, 16)     // qp.php?bid=43&chap=3&sec=16
]);

// 5. 格式化上下文
let context = formatBibleContext(verseData);
context += formatCommentaryContext(commentary.value);
context += formatWordAnalysisContext(wordAnalysis.value);

// 6. 提供給 AI
const systemMessage = {
  role: "system",
  content: `${bibleSystemPrompt}\n\n${context}`
};
```

### 示例 2: 搜索 "愛"

```typescript
// 1. 檢測查詢
const query = detectBibleQuery("愛");
// → { type: "search", keyword: "愛" }

// 2. 搜索經文
const searchData = await searchBible("愛", "unv", 10, false);
// → 調用: https://bible.fhl.net/json/search.php?q=愛&version=unv&limit=10&gb=0

// 3. 格式化結果
const context = formatBibleSearchContext(searchData);
// → 包含前 10 個搜索結果

// 4. 提供給 AI
const systemMessage = {
  role: "system",
  content: `${bibleSystemPrompt}\n\n${context}`
};
```

---

## 使用的 FHL API 端點

| 功能 | API 端點 | 參數 |
|------|----------|------|
| 獲取經文 | `qb.php` | bid, chap, sec, version, strong, gb |
| 搜索經文 | `search.php` | q, version, limit, gb |
| 獲取註釋 | `sc.php` | bid, chap, sec, book (commentary_id), gb |
| 原文分析 | `qp.php` | bid, chap, sec, gb |
| 版本列表 | `ab.php` | (無參數) |
| 書卷列表 | `listall.html` | (無參數) |

**API 基礎 URL**: `https://bible.fhl.net/json/`

**文檔**: https://bible.fhl.net/api/

---

## 與 fhl-bible MCP Server 的區別

### 當前方式（直接 FHL API）
- ✅ 簡單直接
- ✅ 無需額外進程
- ✅ 快速響應
- ❌ 功能有限（僅基本功能）

### MCP Server 方式（未實現）
- ✅ 功能完整（27 個工具函數）
- ✅ 支援更多功能（Strong's、次經、使徒教父等）
- ❌ 需要額外進程
- ❌ 架構更複雜

---

## 數據流向圖

```
用戶輸入: "約翰福音 3:16"
    ↓
detectBibleQuery()
    ↓
{ type: "verse", book: "約翰福音", chapter: 3, verse: "16" }
    ↓
parseBookName("約翰福音") → bookId: 43
    ↓
並行調用:
  ├─ getBibleVerse(43, 3, "16")
  │   └─ fetch("https://bible.fhl.net/json/qb.php?bid=43&chap=3&sec=16...")
  │       └─ 返回: { record: [{ bible_text: "神愛世人..." }] }
  │
  ├─ getCommentary(43, 3, 16)
  │   └─ fetch("https://bible.fhl.net/json/sc.php?bid=43&chap=3&sec=16...")
  │       └─ 返回: { record: [{ book_name: "CBOL註釋", com_text: "..." }] }
  │
  └─ getWordAnalysis(43, 3, 16)
      └─ fetch("https://bible.fhl.net/json/qp.php?bid=43&chap=3&sec=16...")
          └─ 返回: { record: [{ word: "愛", strongs: "G25", ... }] }
    ↓
格式化上下文:
  ├─ formatBibleContext() → "[Bible Reference]\n約翰福音 3:16\n神愛世人..."
  ├─ formatCommentaryContext() → "[Bible Commentary]\n[CBOL註釋]..."
  └─ formatWordAnalysisContext() → "[Original Language Analysis]\nWord: 愛..."
    ↓
合併上下文 → bibleContext
    ↓
添加到系統消息 → systemMessage
    ↓
發送給 AI → AI 生成包含所有必需元素的回答
```

---

## 總結

**當前實現**：
- ✅ 直接調用 FHL API (`https://bible.fhl.net/json/`)
- ✅ 使用 `fetch()` 進行 HTTP 請求
- ✅ 支持經文查詢、搜索、註釋、原文分析
- ✅ 數據格式化後提供給 AI

**調用流程**：
1. 檢測 Bible 查詢
2. 解析查詢類型
3. 調用對應的 FHL API 函數
4. 格式化返回數據
5. 提供給 AI 生成回答

**API 端點**：
- `qb.php` - 經文查詢
- `search.php` - 關鍵字搜索
- `sc.php` - 註釋查詢
- `qp.php` - 原文分析
