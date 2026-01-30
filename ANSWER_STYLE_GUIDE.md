# 答案風格指南：確保一致的詳細聖經指南風格

## 目標

確保所有 Bible 相關查詢（如「如何禱告」）都生成**第一個答案的風格**：
- ✅ 詳細的聖經指南
- ✅ 包含大量經文引用
- ✅ 結構化的實踐步驟
- ✅ 表格化的框架（如 ACTS 禱告法）
- ✅ 聖經依據明確標註

---

## 第一個答案的特點分析

### 結構特點

1. **開場介紹**
   - 溫暖的聖經基礎陳述
   - 包含關鍵經文引用
   - 格式：主題 + 鼓勵性介紹 + 經文

2. **編號章節**
   - 使用清晰的編號（1., 2., 3.）
   - 每個章節有明確標題
   - 包含詳細內容和經文引用

3. **表格化框架**
   - ACTS 禱告法使用表格
   - 結構清晰，易於理解

4. **聖經依據**
   - 每個原則都有經文支持
   - 格式：書卷名 章:節：「經文內容」

5. **實踐原則**
   - 列出具體的實踐步驟
   - 每個步驟都有聖經依據

---

## 已實施的改進

### 1. 增強檢測邏輯 ✅

```typescript
// lib/bible-utils.ts
const isBibleQuestion = 
  // Pattern 2: Question word + Bible theme keyword (禱告, 愛, 信心等)
  (questionWords.test(message) && (hasThemeKeyword || hasFaithKeyword)) ||
  // ...
```

**效果**：確保「如何禱告」總是被檢測為 Bible 查詢。

### 2. 改進系統提示詞 ✅

```typescript
// lib/bible-prompts.ts
case "study_topic_deep":
  strategyGuidance = `
**Response Style Requirements**:
- ✅ Start with a brief introduction that sets the biblical foundation
- ✅ Include specific Bible verse references in format: "書卷名 章:節"
- ✅ Use numbered sections with clear headings
- ✅ Provide practical examples, templates, and structured frameworks
- ✅ Use tables for structured information
- ✅ Include "聖經依據" (Biblical basis) for each principle
- ✅ Format verses as: "書卷名 章:節：「經文內容」"
- ✅ Structure like: "主題：聖經指南與實踐步驟" → numbered sections
```

**效果**：AI 會按照第一個答案的風格生成回答。

### 3. 改進錯誤處理 ✅

```typescript
// app/api/chat/route.ts
} catch (error) {
  console.error("Error searching Bible:", error);
  // 即使 API 失敗，也標記為 Bible 查詢，使用增強提示詞
  isBibleQuery = true;
  bibleContext += "\n\n[Note: Bible API search failed, but answering from Bible perspective]";
}
```

**效果**：即使 API 失敗，也會使用增強提示詞。

### 4. 添加詳細日誌 ✅

```typescript
console.log("=== Bible Query Detection ===");
console.log("User Query:", lastMessage.content);
console.log("Detected Query:", JSON.stringify(bibleQuery));
console.log("Prompt Strategy:", promptStrategy?.name || "none");
console.log("Bible Context Length:", bibleContext.length);
```

**效果**：可以追蹤每次查詢的處理路徑。

---

## 答案風格模板

### 理想答案結構

```
# 主題：聖經指南與實踐步驟

[開場介紹]
主題是...（書卷名 章:節：「經文內容」）。[鼓勵性說明]（書卷名 章:節：「經文」）。

## 1. [主要方法/框架]
[詳細說明]

[書卷名 章:節：「完整經文」]

結構：[步驟說明]

## 2. [實踐框架]
[框架名稱]：簡單[數字]步框架

| 步驟 | 英文 | 中文重點 | 範例禱詞 |
|------|------|----------|----------|
| A | Adoration | 讚美神 | 「...」（詩篇145） |
| ... | ... | ... | ... |

## 3. [實踐原則]（聖經依據）
- [原則1]：[說明]（書卷名 章:節：「經文」）。
- [原則2]：[說明]（書卷名 章:節：「經文」）。
- [原則3]：[說明]（書卷名 章:節：「經文」）。
```

---

## 確保一致性的機制

### 1. 檢測邏輯
- ✅ 「如何 + 主題關鍵字」總是被檢測
- ✅ 「禱告」在 `bibleThemeKeywords` 中
- ✅ 問題模式檢測已增強

### 2. Prompt 策略
- ✅ `study_topic_deep` 策略確保詳細回答
- ✅ 系統提示詞明確要求第一個答案的風格

### 3. API 調用
- ✅ 調用 FHL API 獲取經文、主題查經、註釋
- ✅ 即使失敗也使用增強提示詞

### 4. 錯誤處理
- ✅ API 失敗時仍標記為 Bible 查詢
- ✅ 使用增強提示詞確保 Bible 視角

---

## 驗證方法

### 測試查詢「如何禱告」

1. **檢查日誌**：
   ```
   === Bible Query Detection ===
   User Query: 如何禱告
   Detected Query: {"type":"search","keyword":"如何禱告"}
   Prompt Strategy: study_topic_deep
   ```

2. **檢查 API 調用**：
   - `search.php?q=如何禱告` ✅
   - `st.php?keyword=如何禱告` ✅
   - `ssc.php?keyword=如何禱告` ✅

3. **檢查答案風格**：
   - ✅ 開場有經文引用
   - ✅ 使用編號章節
   - ✅ 包含表格（如 ACTS）
   - ✅ 每個原則有聖經依據
   - ✅ 格式：書卷名 章:節：「經文內容」

---

## 總結

**第一個答案的風格**：
- ✅ 詳細的聖經指南
- ✅ 結構化的實踐步驟
- ✅ 表格化的框架
- ✅ 明確的聖經依據
- ✅ 溫暖鼓勵的語調

**確保機制**：
1. ✅ 增強檢測邏輯
2. ✅ 改進系統提示詞
3. ✅ 改進錯誤處理
4. ✅ 添加詳細日誌

現在「如何禱告」應該**總是**生成第一個答案的風格！🎉
