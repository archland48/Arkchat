# 查詢分析：為什麼「如何禱告」會有不同答案？

## 問題描述

用戶查詢「如何禱告」時，得到兩個不同的答案：

### 答案 1：詳細的聖經指南
- ✅ 包含大量聖經引用（羅馬書8:26, 馬可福音11:24, 詩篇34:17等）
- ✅ 詳細的主禱文和 ACTS 禱告法
- ✅ 包含實踐原則和聖經依據
- ✅ 更偏向基督教/聖經視角

### 答案 2：通用的禱告指南
- ⚠️ 提到不同宗教（基督教、天主教、佛教、伊斯蘭教）
- ⚠️ 更通用，不那麼專注於聖經
- ⚠️ 也包含主禱文和 ACTS，但更強調「不同信仰有不同形式」

---

## 檢索和生成路徑分析

### 路徑 1：Bible 查詢模式（答案 1）

**觸發條件**：
1. ✅ 查詢包含「禱告」關鍵字（在 `bibleThemeKeywords` 中）
2. ✅ 查詢包含「如何」問題模式（匹配 `isBibleQuestion`）
3. ✅ 被檢測為 `type: "search"`，`keyword: "如何禱告"`

**處理流程**：
```
用戶查詢: "如何禱告"
  ↓
detectBibleQuery() 
  → 檢測到 "禱告" 在 bibleThemeKeywords
  → 檢測到 "如何" 匹配問題模式
  → 返回 { type: "search", keyword: "如何禱告" }
  ↓
selectPromptStrategy()
  → 判斷為主題查詢（短關鍵字）
  → 選擇 study_topic_deep 策略
  ↓
API 調用階段：
  1. searchBible("如何禱告", "unv", 10, false)
     → 調用 FHL API: search.php?q=如何禱告
     → 返回相關經文
  2. getTopicStudy("如何禱告", "all", false, false)
     → 調用 FHL API: st.php?keyword=如何禱告
     → 返回 Torrey & Naves 主題查經
  3. searchCommentary("如何禱告", undefined, false)
     → 調用 FHL API: ssc.php?keyword=如何禱告
     → 返回註釋書中的討論
  ↓
格式化上下文：
  - formatBibleSearchContext() - 格式化搜索結果
  - 添加主題查經資料
  - 添加註釋搜索結果
  ↓
generateEnhancedPrompt()
  → 生成 study_topic_deep 策略的增強提示詞
  → 包含：主題定義、原文字彙、兩約教導、神學綜合、實踐應用
  ↓
發送給 AI Model
  → 使用增強系統提示詞
  → AI 生成包含所有必需元素的詳細回答
```

**結果**：詳細的聖經指南，包含大量經文引用和實踐原則

---

### 路徑 2：普通查詢模式（答案 2）

**觸發條件**：
1. ❌ 查詢未被檢測為 Bible 查詢（可能的原因見下方）
2. ❌ 或 Bible Study 模式未開啟
3. ❌ 或 FHL API 調用失敗

**處理流程**：
```
用戶查詢: "如何禱告"
  ↓
detectBibleQuery()
  → 可能未被檢測（原因見下方）
  → 返回 { type: null }
  ↓
isBibleQuery = false
bibleContext = ""
  ↓
使用標準系統提示詞：
  "You are a helpful Bible study assistant..."
  （沒有增強提示詞）
  ↓
發送給 AI Model
  → 沒有 Bible 上下文數據
  → AI 基於訓練數據生成通用回答
  → 可能提到不同宗教，因為沒有強制使用 Bible 資料
```

**結果**：通用的禱告指南，提到不同宗教

---

## 可能導致不同答案的原因

### 原因 1：檢測邏輯邊界情況

**問題**：「如何禱告」應該被檢測，但有時可能不被檢測：

```typescript
// lib/bible-utils.ts 第 167-169 行
const isBibleQuestion = 
  /(什麼|什麼是|什麼意思|如何|怎樣|為什麼|為何|who|what|how|why|where|when|explain|tell me about).*(聖經|bible|神|god|耶穌|jesus|基督|christ|信仰|faith|福音|gospel|教會|church)/i.test(message) ||
  /(聖經|bible|神|god|耶穌|jesus|基督|christ|信仰|faith|福音|gospel|教會|church).*(什麼|什麼是|什麼意思|如何|怎樣|為什麼|為何|who|what|how|why|where|when|explain|tell me about)/i.test(message);
```

**分析**：
- ✅ 「如何禱告」應該匹配第一個正則：`/如何.*禱告/i`
- ⚠️ 但「禱告」不在 `isBibleQuestion` 的關鍵字列表中
- ✅ 不過「禱告」在 `bibleThemeKeywords` 中，應該被 `hasThemeKeyword` 檢測到

**結論**：理論上應該被檢測，但可能有邊界情況。

---

### 原因 2：Bible Study 模式開關

**問題**：如果 Bible Study 模式未開啟，即使檢測到 Bible 查詢，也可能不應用增強提示詞。

**檢查點**：
- `bibleModeEnabled` 狀態
- 是否影響查詢處理邏輯

**當前代碼**：Bible Study 模式開關主要用於 UI 顯示，不影響 API 檢測邏輯。

---

### 原因 3：FHL API 調用失敗

**問題**：如果 FHL API 調用失敗，`bibleContext` 為空，AI 會生成通用回答。

**檢查點**：
```typescript
// app/api/chat/route.ts
try {
  const searchData = await searchBible(bibleQuery.keyword, "unv", 10, false);
  bibleContext += formatBibleSearchContext(searchData);
} catch (error) {
  console.error("Error searching Bible:", error);
  // bibleContext 保持為空
}
```

**結果**：如果 API 失敗，`bibleContext` 為空，AI 生成通用回答。

---

### 原因 4：系統提示詞差異

**問題**：不同的系統提示詞會導致不同的回答風格。

**路徑 1（Bible 查詢）**：
```typescript
const enhancedPrompt = generateEnhancedPrompt(query, strategy, bibleContext);
// 包含：原文解釋、註釋、交叉引用、歷史背景、反思提示
```

**路徑 2（普通查詢）**：
```typescript
const systemMessage = {
  content: "You are a helpful Bible study assistant..."
  // 沒有增強提示詞，沒有 Bible 上下文
};
```

---

## 解決方案

### 方案 1：增強檢測邏輯

確保「如何禱告」等查詢總是被檢測：

```typescript
// 在 detectBibleQuery 中添加更明確的檢測
const prayerPatterns = [
  /如何.*禱告/i,
  /怎樣.*禱告/i,
  /how.*pray/i,
  /禱告.*方法/i,
  /prayer.*method/i,
];

for (const pattern of prayerPatterns) {
  if (pattern.test(message)) {
    return {
      type: "search",
      keyword: message.trim(),
    };
  }
}
```

### 方案 2：強制 Bible 模式

當 Bible Study 模式開啟時，強制所有查詢都使用 Bible 資料：

```typescript
// 在 API 中添加 bibleModeEnabled 參數
if (bibleModeEnabled && !isBibleQuery) {
  // 強制應用 Bible 查詢邏輯
  const forcedQuery = detectBibleQuery(lastMessage.content);
  if (forcedQuery.type === null) {
    // 即使未檢測到，也嘗試搜索
    forcedQuery = { type: "search", keyword: lastMessage.content };
  }
}
```

### 方案 3：改進錯誤處理

確保 API 失敗時有 fallback：

```typescript
try {
  const searchData = await searchBible(keyword, "unv", 10, false);
  bibleContext += formatBibleSearchContext(searchData);
} catch (error) {
  console.error("Error searching Bible:", error);
  // 即使失敗，也標記為 Bible 查詢，使用增強提示詞
  isBibleQuery = true;
  bibleContext += "\n\n[Note: Bible search failed, but answering from Bible perspective]";
}
```

---

## 建議的改進

1. **統一檢測邏輯**：確保所有「如何 + Bible 關鍵字」的查詢都被檢測
2. **強制 Bible 模式**：當 Bible Study 模式開啟時，強制使用 Bible 資料
3. **改進錯誤處理**：API 失敗時也要使用增強提示詞
4. **添加日誌**：記錄每次查詢的檢測結果和處理路徑

---

## 驗證方法

### 測試查詢檢測

```typescript
// 測試 detectBibleQuery
console.log(detectBibleQuery("如何禱告"));
// 應該返回: { type: "search", keyword: "如何禱告" }
```

### 檢查 API 調用

```typescript
// 在 API 路由中添加日誌
console.log("Bible Query:", bibleQuery);
console.log("Is Bible Query:", isBibleQuery);
console.log("Bible Context Length:", bibleContext.length);
console.log("Prompt Strategy:", promptStrategy?.name);
```

### 檢查系統提示詞

```typescript
// 記錄實際使用的系統提示詞
console.log("System Message:", systemMessage.content.substring(0, 200));
```

---

## 總結

**答案 1（詳細聖經指南）**：
- ✅ 路徑：Bible 查詢檢測成功 → FHL API 調用成功 → 增強提示詞 → 詳細回答

**答案 2（通用指南）**：
- ⚠️ 路徑：Bible 查詢檢測失敗 或 FHL API 失敗 → 標準提示詞 → 通用回答

**根本原因**：
1. 檢測邏輯可能有邊界情況
2. FHL API 調用可能失敗
3. 錯誤處理不夠完善

**解決方案**：
1. 增強檢測邏輯
2. 強制 Bible 模式
3. 改進錯誤處理
4. 添加詳細日誌
