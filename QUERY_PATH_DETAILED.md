# 查詢檢測與生成路徑詳細說明

## 查詢示例：`什麼是愛？`

---

## 完整路徑流程圖

```
用戶輸入: "什麼是愛？"
  ↓
[1] ChatArea.tsx - handleSendMessage()
  ├─ 創建 userMessage
  ├─ 發送 POST /api/chat
  └─ body: { model, messages, bibleModeEnabled: false }
  ↓
[2] app/api/chat/route.ts - POST()
  ├─ 提取 lastMessage = "什麼是愛？"
  ├─ 調用 detectBibleQuery("什麼是愛？")
  └─ ↓
  ↓
[3] lib/bible-utils.ts - detectBibleQuery()
  ├─ lowerMessage = "什麼是愛？"
  ├─ 檢查 verse/chapter patterns → 無匹配
  ├─ 檢查 search keywords → 無匹配
  ├─ 檢查 Bible theme keywords:
  │   ├─ "愛" 在 bibleThemeKeywords 中 ✅
  │   ├─ 中文檢測: lowerMessage.includes("愛") → true ✅
  │   └─ hasThemeKeyword = true
  ├─ 檢查問題模式:
  │   ├─ questionWords.test("什麼是愛？") → true ✅ (匹配到 "什麼是")
  │   └─ isBibleQuestion = true ✅
  ├─ 返回: { type: "search", keyword: "什麼是愛？" }
  └─ ↓
  ↓
[4] app/api/chat/route.ts - 處理 search 查詢
  ├─ bibleQuery.type === "search" ✅
  ├─ isBibleQuery = true
  ├─ keyword = "什麼是愛？"
  ├─ 檢查是否需要 advanced_cross_reference:
  │   └─ needsAdvancedCrossRef = false (無交叉引用關鍵字)
  └─ ↓
  ↓
[5] FHL API 調用 (並行執行)
  ├─ [5.1] searchBible("什麼是愛？", "unv", 15, false)
  │   └─ API: https://bible.fhl.net/json/search.php?q=什麼是愛？&version=unv&limit=15&gb=0
  │   └─ 返回: 15 條相關經文
  │   └─ 格式化: formatBibleSearchContext()
  │
  ├─ [5.2] getTopicStudy("什麼是愛？", "all", false, false)
  │   └─ API: https://bible.fhl.net/json/st.php?keyword=什麼是愛？&N=4&gb=0
  │   └─ 返回: Torrey & Naves 主題查經資料
  │   └─ 格式化: [Topic Study Resources - 主題查經資料]
  │
  └─ [5.3] searchCommentary("什麼是愛？", undefined, false)
      └─ API: https://bible.fhl.net/json/ssc.php?q=什麼是愛？&gb=0
      └─ 返回: 註釋搜尋結果
      └─ 格式化: [Commentary Search Results - 註釋搜尋結果]
  ↓
[6] 構建 Bible Context
  ├─ bibleContext = ""
  ├─ += formatBibleSearchContext(searchData)
  │   └─ [Bible Search Results - 聖經搜尋結果]
  │   └─ 包含 15 條經文，每條包含：書卷、章節、經文內容
  ├─ += Topic Study Context
  │   └─ [Topic Study Resources - 主題查經資料 (Torrey & Naves)]
  │   └─ 包含多個主題查經條目
  └─ += Commentary Context
      └─ [Commentary Search Results - 註釋搜尋結果]
      └─ 包含多個註釋條目
  ↓
[7] 生成系統提示詞
  ├─ needsAdvancedCrossRef = false
  ├─ 生成標準 Bible 學習提示詞:
  │   ├─ 核心要求 (Core Requirements)
  │   ├─ 1. 原文解釋 (Original Language Explanation) - REQUIRED
  │   ├─ 2. 經文註釋 (Commentary) - REQUIRED (必須註明出處)
  │   ├─ 3. 經文交叉引用 (Cross References) - REQUIRED
  │   ├─ 4. 歷史背景 (Historical Background) - REQUIRED
  │   └─ 5. 反思提示 (Reflection Questions) - REQUIRED
  ├─ 數據使用優先級說明
  ├─ 格式要求
  └─ += bibleContext (所有 FHL API 數據)
  ↓
[8] 構建消息數組
  ├─ systemMessage = {
  │     role: "system",
  │     content: "[系統提示詞] + [Bible Context]"
  │   }
  ├─ enhancedMessages = [systemMessage, ...messages]
  └─ messages 包含用戶消息: "什麼是愛？"
  ↓
[9] 調用 AI API
  ├─ openai.chat.completions.create({
  │     model: "grok-4-fast",
  │     messages: enhancedMessages,
  │     stream: true,
  │     temperature: 0.7
  │   })
  └─ ↓
  ↓
[10] AI 生成回答
  ├─ 接收系統提示詞（包含所有 FHL API 數據）
  ├─ 根據要求生成回答，包含：
  │   ├─ 1. 原文解釋（從 word analysis 數據）
  │   ├─ 2. 經文註釋（從 commentary 數據，註明出處）
  │   ├─ 3. 交叉引用（從 search 結果）
  │   ├─ 4. 歷史背景（AI 生成）
  │   └─ 5. 反思提示（AI 生成）
  └─ 流式返回內容
  ↓
[11] ChatArea.tsx - 處理流式響應
  ├─ 接收流式數據
  ├─ 解析 content chunks
  ├─ 實時更新 UI
  └─ 顯示完整答案
```

---

## 詳細步驟說明

### Step 1: 用戶輸入處理

**文件**: `components/ChatArea.tsx`

```typescript
handleSendMessage("什麼是愛？")
  ↓
POST /api/chat
  body: {
    model: "grok-4-fast",
    messages: [{ role: "user", content: "什麼是愛？" }],
    bibleModeEnabled: false
  }
```

---

### Step 2: API 路由接收

**文件**: `app/api/chat/route.ts`

```typescript
const { messages, model, bibleModeEnabled } = await req.json();
const lastMessage = messages[messages.length - 1]; // "什麼是愛？"
```

---

### Step 3: Bible 查詢檢測

**文件**: `lib/bible-utils.ts` → `detectBibleQuery()`

#### 3.1 檢查經文/章節模式
```typescript
// 檢查 "約翰福音 3:16" 等格式
// ❌ 無匹配
```

#### 3.2 檢查搜索關鍵字模式
```typescript
// 檢查 "search for..." 等格式
// ❌ 無匹配
```

#### 3.3 檢查 Bible 主題關鍵字
```typescript
bibleThemeKeywords = ["愛", "love", "信心", "faith", ...]
hasThemeKeyword = bibleThemeKeywords.some(keyword => {
  if (/[\u4e00-\u9fa5]/.test(keyword)) {
    // 中文：使用 includes()
    return "什麼是愛？".includes("愛"); // ✅ true
  }
})
// ✅ hasThemeKeyword = true
```

#### 3.4 檢查問題模式
```typescript
questionWords = /(什麼|什麼是|什麼意思|如何|怎樣|...)/i
questionWords.test("什麼是愛？") // ✅ true (匹配到 "什麼是")

isBibleQuestion = 
  questionWords.test(message) && hasThemeKeyword
  // ✅ true && true = true
```

#### 3.5 返回結果
```typescript
return {
  type: "search",
  keyword: "什麼是愛？"
}
```

---

### Step 4: 處理 Search 查詢

**文件**: `app/api/chat/route.ts`

```typescript
if (bibleQuery.type === "search" && bibleQuery.keyword) {
  isBibleQuery = true;
  const keyword = "什麼是愛？";
  
  // 檢查是否需要 advanced_cross_reference
  const needsAdvancedCrossRef = /(交叉引用|相關經文|...)/i.test("什麼是愛？");
  // ❌ false (無交叉引用關鍵字)
```

---

### Step 5: FHL API 調用

#### 5.1 搜索經文
```typescript
const searchData = await searchBible("什麼是愛？", "unv", 15, false);
// API: https://bible.fhl.net/json/search.php?q=什麼是愛？&version=unv&limit=15&gb=0
// 返回: {
//   record: [
//     { chineses: "約翰一書", chap: 4, sec: 8, bible_text: "沒有愛心的..." },
//     { chineses: "哥林多前書", chap: 13, sec: 4, bible_text: "愛是恆久忍耐..." },
//     ... (15 條)
//   ],
//   record_count: 15
// }
```

#### 5.2 獲取主題查經資料
```typescript
const topicData = await getTopicStudy("什麼是愛？", "all", false, false);
// API: https://bible.fhl.net/json/st.php?keyword=什麼是愛？&N=4&gb=0
// 返回: {
//   record: [
//     { book: 0, topic: "Love", text: "Torrey (English) content..." },
//     { book: 2, topic: "愛", text: "Torrey (中文) content..." },
//     ... (多個條目)
//   ]
// }
```

#### 5.3 搜索註釋
```typescript
const commentarySearch = await searchCommentary("什麼是愛？", undefined, false);
// API: https://bible.fhl.net/json/ssc.php?q=什麼是愛？&gb=0
// 返回: {
//   results: [
//     { commentary_name: "CBOL註釋", book: "約翰一書", chapter_start: 4, verse_start: 8, title: "...", content: "..." },
//     ... (多個註釋)
//   ]
// }
```

---

### Step 6: 格式化 Bible Context

```typescript
bibleContext = "";

// 添加搜索結果
bibleContext += formatBibleSearchContext(searchData);
// 輸出:
// [Bible Search Results - 聖經搜尋結果]
// 約翰一書 4:8 - 沒有愛心的，就不認識神，因為神就是愛。
// 哥林多前書 13:4 - 愛是恆久忍耐，又有恩慈；愛是不嫉妒...
// ... (15 條)

// 添加主題查經資料
bibleContext += "\n\n[Topic Study Resources - 主題查經資料 (Torrey & Naves)]\n";
// [Torrey (中文)] 愛
// ... (主題查經內容)

// 添加註釋
bibleContext += "\n\n[Commentary Search Results - 註釋搜尋結果]\n";
// [CBOL註釋] 約翰一書 4:8
// ... (註釋內容)
```

---

### Step 7: 生成系統提示詞

```typescript
const systemMessage = {
  role: "system",
  content: `
You are an expert Bible study assistant...

## 核心要求 (Core Requirements):

### 1. **原文解釋 (Original Language Explanation)** - REQUIRED
   - 必須使用上下文中的原文分析數據
   - Explain key words from the original Hebrew/Greek text
   - Include Strong's Numbers if provided
   ...

### 2. **經文註釋 (Commentary)** - REQUIRED
   - 必須使用上下文中的註釋數據
   - 必須明確標註出處，例如："根據CBOL註釋..."
   ...

### 3. **經文交叉引用 (Cross References)** - REQUIRED
   - 優先使用上下文中的交叉引用經文
   - List 5-10 related verses
   ...

### 4. **歷史背景 (Historical Background)** - REQUIRED
   ...

### 5. **反思提示 (Reflection Questions)** - REQUIRED
   ...

## 數據使用優先級 (Data Priority):
1. 第一優先: 使用 FHL Bible API 提供的數據
2. 第二優先: 如果 API 數據不足，補充使用知識庫

${bibleContext}
`
};
```

---

### Step 8: 構建消息數組

```typescript
const enhancedMessages = [
  systemMessage,  // 包含系統提示詞 + Bible Context
  { role: "user", content: "什麼是愛？" }
];
```

---

### Step 9: 調用 AI API

```typescript
const completion = await openai.chat.completions.create({
  model: "grok-4-fast",
  messages: enhancedMessages,
  stream: true,
  temperature: 0.7
});
```

---

### Step 10: AI 生成回答

AI 根據系統提示詞和 Bible Context 生成回答，包含：

1. **原文解釋**
   - 從經文中提取關鍵字（如"愛"）
   - 如果有 word analysis 數據，使用 Strong's Number
   - 解釋希臘文/希伯來文原義

2. **經文註釋**
   - 使用 commentary 數據
   - 明確標註出處："根據CBOL註釋..."、"根據Torrey主題查經..."
   - 提供多個註釋觀點

3. **交叉引用**
   - 使用 search 結果中的相關經文
   - 列出 5-10 個相關經文
   - 解釋經文之間的關聯

4. **歷史背景**
   - AI 根據上下文生成
   - 說明寫作背景、作者、受眾

5. **反思提示**
   - AI 生成 2-3 個反思問題
   - 幫助讀者應用經文

---

### Step 11: 流式返回與 UI 更新

**文件**: `components/ChatArea.tsx`

```typescript
// 接收流式數據
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // 解析 content chunks
  const parsed = JSON.parse(data);
  if (parsed.content) {
    assistantContent += parsed.content;
    // 實時更新 UI
    onUpdateConversation(conversation.id, {
      messages: [...updatedMessages, assistantMessage]
    });
  }
}
```

---

## 關鍵檢測點

### ✅ 檢測成功的原因

1. **問題詞匹配**: "什麼是" 匹配 `questionWords` 正則
2. **主題關鍵字匹配**: "愛" 在 `bibleThemeKeywords` 中
3. **中文檢測修復**: 使用 `includes()` 而非 `\b` 邊界
4. **問題模式匹配**: `isBibleQuestion = true`

### 📊 數據流

```
用戶輸入
  ↓
detectBibleQuery() → { type: "search", keyword: "什麼是愛？" }
  ↓
FHL API 調用 (3個並行)
  ├─ searchBible() → 15 條經文
  ├─ getTopicStudy() → 主題查經資料
  └─ searchCommentary() → 註釋資料
  ↓
格式化為 bibleContext
  ↓
添加到系統提示詞
  ↓
AI 生成回答（包含所有必需元素）
```

---

## 預期輸出格式

AI 應該生成類似這樣的回答：

```markdown
# 什麼是愛？：聖經指南

## 原文解釋
關鍵字：愛 (agape) - Strong's G26
...

## 經文註釋
【CBOL註釋】約翰一書 4:8
...

## 交叉引用
相關經文：
- 約翰一書 4:8 - 沒有愛心的，就不認識神...
- 哥林多前書 13:4-8 - 愛是恆久忍耐...
- 約翰福音 3:16 - 神愛世人...
...

## 歷史背景
...

## 反思提示
1. ...
2. ...
3. ...
```

---

## 總結

**檢測路徑**: ✅ 成功
- 問題詞 + 主題關鍵字 → `isBibleQuestion = true`
- 返回 `{ type: "search", keyword: "什麼是愛？" }`

**API 調用**: ✅ 3個並行調用
- searchBible (15 條經文)
- getTopicStudy (主題查經)
- searchCommentary (註釋)

**生成路徑**: ✅ 完整
- 系統提示詞 + Bible Context → AI 生成詳細回答
- 包含所有必需元素（原文、註釋、交叉引用、歷史背景、反思）
