# study_topic_deep MCP Prompt 集成

## 概述

已将系统提示词更新为使用 fhl-bible MCP 的 `study_topic_deep` prompt 模板，而不是手动实现步骤。

---

## 更改说明

### 之前：手动实现步骤

系统提示词中手动列出了 6 个步骤，并说明了每个步骤的要求。

### 现在：使用 MCP Prompt 模板

系统提示词直接使用 fhl-bible MCP 的 `study_topic_deep` prompt 模板内容，保持与 MCP Server 的一致性。

---

## MCP Prompt 模板内容

根据 `FHL_MCP_SERVER/src/fhl_bible_mcp/prompts/study/study_topic_deep.py`：

```python
# 主題研究 - 「{topic}」

## 步驟 1: 搜尋相關經文
**執行**: search_bible 在 {version} 中搜尋「{topic}」
**輸出**: 總數統計 + 最相關的 {max_verses} 處經文

## 步驟 2: 查詢主題查經資料
**執行**: get_topic_study 取得「{topic}」的主題查經
**輸出**: Torrey 和 Naves 相關條目，聖經神學架構

## 步驟 3: 搜尋註釋討論
**執行**: search_commentary 在註釋書中搜尋「{topic}」
**輸出**: 註釋家見解摘要，不同神學傳統觀點

## 步驟 4: 比較兩約教導
**執行**: 分別搜尋舊約和新約相關經文
**輸出**: 兩約異同，救恩歷史發展脈絡

## 步驟 5: 研究原文洞察
**執行**: lookup_strongs 查詢關鍵希伯來文/希臘文字詞
**輸出**: 原文字義如何豐富主題理解

## 步驟 6: 綜合分析與應用
**執行**: 整合所有資料
**輸出**: 整體教導總結、3-5個核心真理、生活應用

💡 工具: search_bible, get_topic_study, search_commentary, lookup_strongs
```

---

## 系统提示词更新

### 更新后的格式

```typescript
${isSearchQuery ? `
## Study Strategy: study_topic_deep - 主題研究，全面探討聖經主題

# 主題研究 - 「${detectedBibleQuery.keyword || "主題"}」

## 步驟 1: 搜尋相關經文
**執行**: search_bible 在 unv 中搜尋「${detectedBibleQuery.keyword || "主題"}」
**輸出**: 總數統計 + 最相關的經文
- Use the Bible search results provided in the context
- Show total count and most relevant verses

## 步驟 2: 查詢主題查經資料
**執行**: get_topic_study 取得「${detectedBibleQuery.keyword || "主題"}」的主題查經
**輸出**: Torrey 和 Naves 相關條目，聖經神學架構
- Use the topic study resources (Torrey & Naves) provided in the context
- Show biblical theological framework

## 步驟 3: 搜尋註釋討論
**執行**: search_commentary 在註釋書中搜尋「${detectedBibleQuery.keyword || "主題"}」
**輸出**: 註釋家見解摘要，不同神學傳統觀點
- Use the commentary search results provided in the context
- Show insights from different theological traditions

## 步驟 4: 比較兩約教導
**執行**: 分別搜尋舊約和新約相關經文
**輸出**: 兩約異同，救恩歷史發展脈絡
- Use the two testament comparison data provided in the context
- Compare Old Testament vs New Testament teachings
- Show similarities and differences
- Explain salvation history development

## 步驟 5: 研究原文洞察
**執行**: lookup_strongs 查詢關鍵希伯來文/希臘文字詞
**輸出**: 原文字義如何豐富主題理解
- Use the Strong's Number search results provided in the context
- Show how original language meanings enrich topic understanding

## 步驟 6: 綜合分析與應用
**執行**: 整合所有資料
**輸出**: 整體教導總結、3-5個核心真理、生活應用
- Integrate all data from Steps 1-5
- Provide overall teaching summary
- List 3-5 core truths
- Include practical life application

💡 工具: search_bible, get_topic_study, search_commentary, lookup_strongs

**Structure your response following these 6 steps with clear headings.**
` : ""}
```

---

## 优势

### ✅ 与 MCP 保持一致

- 使用与 fhl-bible MCP Server 相同的 prompt 模板
- 保持 prompt 格式和内容的一致性
- 便于未来与 MCP Server 集成

### ✅ 标准化流程

- 遵循 MCP 定义的 6 步骤流程
- 使用标准化的工具和输出格式
- 确保研究质量的一致性

### ✅ 易于维护

- 如果 MCP prompt 更新，可以同步更新
- 减少重复代码
- 保持代码简洁

---

## API 调用流程

### 查询示例：`什麼是愛？`

```
用户输入: "什麼是愛？"
  ↓
[1] detectBibleQuery() → { type: "search", keyword: "什麼是愛？" }
  ↓
[2] 处理 search 查询
  ↓
[3] 并行调用 API:
  ├─ [3.1] searchBible("什麼是愛？") → 15 条经文
  │   └─ Step 1: 搜尋相關經文 ✅
  │
  ├─ [3.2] getTopicStudy("什麼是愛？") → 主题查经资料
  │   └─ Step 2: 查詢主題查經資料 ✅
  │
  ├─ [3.3] searchCommentary("什麼是愛？") → 注释资料
  │   └─ Step 3: 搜尋註釋討論 ✅
  │
  ├─ [3.4] 兩約教導比較 → 旧约 vs 新约
  │   └─ Step 4: 比較兩約教導 ✅
  │
  ├─ [3.5] searchByStrongs() → 原文研究
  │   └─ Step 5: 研究原文洞察 ✅
  │
  └─ [3.6] advanced_cross_reference → 三层次交叉引用
      └─ 补充交叉引用
  ↓
[4] 格式化结果并添加到 bibleContext
  ↓
[5] AI 生成回答（使用 study_topic_deep prompt 指导）
  └─ Step 6: 綜合分析與應用 ✅
```

---

## 总结

✅ **已实现**：
- 使用 fhl-bible MCP 的 `study_topic_deep` prompt 模板
- 保持与 MCP Server 的一致性
- 系统提示词包含完整的 6 步骤指导
- 动态插入查询关键字

✅ **效果**：
- 与 MCP 标准保持一致
- 标准化的研究流程
- 易于维护和更新
- 确保研究质量

现在系统会在处理 search 查询时使用 fhl-bible MCP 的 `study_topic_deep` prompt 模板，提供「主題研究，全面探討聖經主題」！
