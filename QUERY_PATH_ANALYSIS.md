# 查詢路徑分析：「如何禱告」為什麼會有不同答案？

## 問題描述

查詢「如何禱告」時，得到兩個不同的答案：

### 答案 1：詳細的聖經指南 ✅
- 包含大量聖經引用（羅馬書8:26, 馬可福音11:24, 詩篇34:17等）
- 詳細的主禱文和 ACTS 禱告法
- 包含實踐原則和聖經依據
- **更偏向基督教/聖經視角**

### 答案 2：通用的禱告指南 ⚠️
- 提到不同宗教（基督教、天主教、佛教、伊斯蘭教）
- 更通用，不那麼專注於聖經
- 也包含主禱文和 ACTS，但更強調「不同信仰有不同形式」

---

## 檢索和生成路徑分析

### 路徑 1：Bible 查詢模式（答案 1 - 詳細聖經指南）

**觸發條件**：
1. ✅ 查詢包含「禱告」關鍵字（在 `bibleThemeKeywords` 中，第97行）
2. ✅ 查詢包含「如何」問題模式
3. ✅ 被檢測為 `type: "search"`，`keyword: "如何禱告"`

**檢測流程**：
```
用戶查詢: "如何禱告"
  ↓
detectBibleQuery("如何禱告")
  ↓
檢查 bibleThemeKeywords:
  → "禱告" 在列表中 ✅
  → hasThemeKeyword = true
  ↓
檢查問題模式:
  → "如何" 匹配問題詞 ✅
  → hasThemeKeyword = true (禱告是主題關鍵字)
  → isBibleQuestion = true (問題詞 + 主題關鍵字)
  ↓
返回: { type: "search", keyword: "如何禱告" }
```

**API 調用流程**：
```
bibleQuery = { type: "search", keyword: "如何禱告" }
  ↓
selectPromptStrategy(bibleQuery)
  → keyword = "如何禱告" (長度 < 20, 無數字)
  → isTopicQuery = true
  → 返回 study_topic_deep 策略
  ↓
API 調用階段 (app/api/chat/route.ts 第 278-330 行):
  1. searchBible("如何禱告", "unv", 10, false)
     → 調用: https://bible.fhl.net/json/search.php?q=如何禱告&version=unv&limit=10&gb=0
     → 返回: 相關經文（如：馬太福音6:9-13, 路加福音11:1-4等）
  2. getTopicStudy("如何禱告", "all", false, false)
     → 調用: https://bible.fhl.net/json/st.php?keyword=如何禱告&N=4&count_only=0&gb=0
     → 返回: Torrey & Naves 主題查經資料
  3. searchCommentary("如何禱告", undefined, false)
     → 調用: https://bible.fhl.net/json/ssc.php?keyword=如何禱告&gb=0
     → 返回: 註釋書中的討論
  ↓
格式化上下文:
  - formatBibleSearchContext() - 格式化搜索結果
  - 添加主題查經資料（Torrey & Naves）
  - 添加註釋搜索結果
  ↓
generateEnhancedPrompt()
  → 使用 study_topic_deep 策略
  → 生成增強系統提示詞，包含：
     - 主題定義
     - 原文字彙分析
     - 舊約中的主題
     - 新約中的發展
     - 關鍵經文精選
     - 神學綜合
     - 實踐應用
  ↓
發送給 AI Model (grok-4-fast)
  → 系統消息包含：
     - 增強提示詞（study_topic_deep 策略）
     - Bible 上下文（經文、主題查經、註釋）
  → AI 生成包含所有必需元素的詳細回答
```

**結果**：詳細的聖經指南，包含大量經文引用和實踐原則 ✅

---

### 路徑 2：普通查詢模式（答案 2 - 通用指南）

**觸發條件**：
1. ❌ 查詢未被檢測為 Bible 查詢
2. ❌ 或 FHL API 調用失敗
3. ❌ 或 Bible Study 模式未開啟（但這不應該影響檢測）

**可能的原因**：

#### 原因 A：檢測邏輯邊界情況

**問題**：「如何禱告」應該被檢測，但有時可能不被檢測：

```typescript
// lib/bible-utils.ts 第 167-169 行（舊版本）
const isBibleQuestion = 
  /(什麼|什麼是|什麼意思|如何|怎樣|為什麼|為何|who|what|how|why|where|when|explain|tell me about).*(聖經|bible|神|god|耶穌|jesus|基督|christ|信仰|faith|福音|gospel|教會|church)/i.test(message) ||
  /(聖經|bible|神|god|耶穌|jesus|基督|christ|信仰|faith|福音|gospel|教會|church).*(什麼|什麼是|什麼意思|如何|怎樣|為什麼|為何|who|what|how|why|where|when|explain|tell me about)/i.test(message);
```

**分析**：
- ⚠️ 「如何禱告」中，「禱告」不在 `isBibleQuestion` 的關鍵字列表中
- ✅ 但「禱告」在 `bibleThemeKeywords` 中，應該被 `hasThemeKeyword` 檢測到
- ✅ 第 185 行的邏輯：`if (hasBibleKeyword || hasThemeKeyword || hasFaithKeyword || isBibleQuestion || isSingleKeyword)`

**結論**：理論上應該被檢測，但 `isBibleQuestion` 的正則可能不夠完善。

#### 原因 B：FHL API 調用失敗

**問題**：如果 FHL API 調用失敗，`bibleContext` 為空：

```typescript
// app/api/chat/route.ts 第 327-329 行
} catch (error) {
  console.error("Error searching Bible:", error);
  // bibleContext 保持為空
}
```

**結果**：
- `isBibleQuery = true`（已檢測到）
- `bibleContext = ""`（API 失敗，無數據）
- AI 收到增強提示詞，但沒有 Bible 上下文數據
- AI 可能生成通用回答

#### 原因 C：系統提示詞差異

**路徑 1（有 Bible 上下文）**：
```typescript
const enhancedPrompt = generateEnhancedPrompt(query, strategy, bibleContext);
// 包含：Bible 上下文 + 增強提示詞
```

**路徑 2（無 Bible 上下文）**：
```typescript
const systemMessage = {
  content: "You are a helpful Bible study assistant..."
  // 沒有增強提示詞，沒有 Bible 上下文
};
```

---

## 實際代碼路徑對比

### 路徑 1：成功檢測 + API 成功

```typescript
// 1. 檢測
detectBibleQuery("如何禱告")
  → { type: "search", keyword: "如何禱告" }

// 2. 選擇策略
selectPromptStrategy({ type: "search", keyword: "如何禱告" })
  → { name: "study_topic_deep", ... }

// 3. API 調用
searchBible("如何禱告", ...) → 成功，返回經文
getTopicStudy("如何禱告", ...) → 成功，返回主題查經
searchCommentary("如何禱告", ...) → 成功，返回註釋

// 4. 格式化
bibleContext = "[Bible Search Results]...\n[Topic Study]...\n[Commentary]..."

// 5. 生成提示詞
generateEnhancedPrompt(query, strategy, bibleContext)
  → 包含完整 Bible 上下文和增強提示詞

// 6. AI 生成
→ 詳細的聖經指南 ✅
```

### 路徑 2：檢測失敗 或 API 失敗

```typescript
// 情況 A：檢測失敗
detectBibleQuery("如何禱告")
  → { type: null } // 未檢測到

isBibleQuery = false
bibleContext = ""
promptStrategy = null

// 使用標準提示詞
systemMessage = "You are a helpful Bible study assistant..."

// AI 生成
→ 通用的禱告指南 ⚠️

// 情況 B：檢測成功但 API 失敗
detectBibleQuery("如何禱告")
  → { type: "search", keyword: "如何禱告" }

isBibleQuery = true
try {
  searchBible("如何禱告", ...) → 失敗，拋出錯誤
} catch (error) {
  console.error("Error searching Bible:", error);
  // bibleContext 保持為空
}

bibleContext = "" // 空！

// 生成提示詞（但無上下文）
generateEnhancedPrompt(query, strategy, "")
  → 只有增強提示詞，沒有 Bible 數據

// AI 生成
→ 可能生成通用回答 ⚠️
```

---

## 解決方案

### 方案 1：增強檢測邏輯 ✅（已實施）

改進 `isBibleQuestion` 檢測，確保「如何 + 主題關鍵字」總是被檢測：

```typescript
// 新版本（已更新）
const questionWords = /(什麼|什麼是|什麼意思|如何|怎樣|為什麼|為何|who|what|how|why|where|when|explain|tell me about)/i;
const bibleCoreKeywords = /(聖經|bible|神|god|上帝|耶穌|jesus|基督|christ|主|lord|信仰|faith|福音|gospel|教會|church)/i;

const isBibleQuestion = 
  // Pattern 1: Question word + Bible core keyword
  (questionWords.test(message) && bibleCoreKeywords.test(message)) ||
  // Pattern 2: Question word + Bible theme keyword (禱告, 愛, 信心等)
  (questionWords.test(message) && (hasThemeKeyword || hasFaithKeyword)) ||
  // Pattern 3: Bible core keyword + Question word
  (bibleCoreKeywords.test(message) && questionWords.test(message));
```

**效果**：確保「如何禱告」總是被檢測為 Bible 查詢。

---

### 方案 2：改進錯誤處理

確保 API 失敗時也有 fallback：

```typescript
} catch (error) {
  console.error("Error searching Bible:", error);
  // 即使失敗，也標記為 Bible 查詢，使用增強提示詞
  isBibleQuery = true;
  bibleContext += "\n\n[Note: Bible search failed, but answering from Bible perspective based on general knowledge]";
}
```

---

### 方案 3：添加詳細日誌

記錄每次查詢的檢測結果和處理路徑：

```typescript
console.log("=== Bible Query Detection ===");
console.log("Query:", lastMessage.content);
console.log("Detected:", bibleQuery);
console.log("Is Bible Query:", isBibleQuery);
console.log("Prompt Strategy:", promptStrategy?.name);
console.log("Bible Context Length:", bibleContext.length);
console.log("Advanced Prompt:", advancedPrompt);
```

---

## 驗證方法

### 測試檢測邏輯

```typescript
// 測試 detectBibleQuery
const result = detectBibleQuery("如何禱告");
console.log(result);
// 應該返回: { type: "search", keyword: "如何禱告" }
```

### 檢查 API 調用

在瀏覽器開發者工具的 Network 標籤中檢查：
1. 是否有 `search.php?q=如何禱告` 請求
2. 是否有 `st.php?keyword=如何禱告` 請求
3. 是否有 `ssc.php?keyword=如何禱告` 請求

### 檢查系統提示詞

在 API 日誌中檢查：
1. `isBibleQuery` 是否為 `true`
2. `bibleContext` 是否有內容
3. `promptStrategy` 是否為 `study_topic_deep`

---

## 總結

**答案 1（詳細聖經指南）**：
- ✅ 路徑：Bible 查詢檢測成功 → FHL API 調用成功 → 增強提示詞 + Bible 上下文 → 詳細回答

**答案 2（通用指南）**：
- ⚠️ 路徑 A：Bible 查詢檢測失敗 → 標準提示詞 → 通用回答
- ⚠️ 路徑 B：Bible 查詢檢測成功但 FHL API 失敗 → 增強提示詞但無上下文 → 可能生成通用回答

**根本原因**：
1. 檢測邏輯可能有邊界情況（`isBibleQuestion` 正則不夠完善）
2. FHL API 調用可能失敗
3. 錯誤處理不夠完善

**已實施的改進**：
1. ✅ 增強 `isBibleQuestion` 檢測邏輯
2. ⚠️ 改進錯誤處理（建議實施）
3. ⚠️ 添加詳細日誌（建議實施）

---

## 建議

1. **立即實施**：增強檢測邏輯（已完成）
2. **建議實施**：改進錯誤處理，確保 API 失敗時也有 Bible 視角
3. **建議實施**：添加詳細日誌，方便調試和追蹤問題
