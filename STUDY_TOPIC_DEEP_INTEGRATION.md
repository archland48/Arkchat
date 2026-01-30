# study_topic_deep 集成文档

## 概述

已将 `getTopicStudy` 升级为完整的 `study_topic_deep` 策略，实现「主題研究，全面探討聖經主題」。

---

## study_topic_deep 策略步骤

根据 FHL_MCP_SERVER 中的 `study_topic_deep.py`，该策略包含 6 个步骤：

### Step 1: 搜尋相關經文 ✅
- **执行**: `search_bible` 在 `unv` 中搜尋主題
- **输出**: 總數統計 + 最相關的經文
- **实现**: Priority 1 - `searchBible(keyword, "unv", 15, false)`

### Step 2: 查詢主題查經資料 ✅
- **执行**: `get_topic_study` 取得主題查經
- **输出**: Torrey 和 Naves 相關條目，聖經神學架構
- **实现**: Priority 2 - `getTopicStudy(keyword, "all", false, false)`
- **更新**: 已添加 `[study_topic_deep - Step 2]` 标识

### Step 3: 搜尋註釋討論 ✅
- **执行**: `search_commentary` 在註釋書中搜尋主題
- **输出**: 註釋家見解摘要，不同神學傳統觀點
- **实现**: Priority 3 - `searchCommentary(keyword, undefined, false)`

### Step 4: 比較兩約教導 ✅ (新增)
- **执行**: 分別搜尋舊約和新約相關經文
- **输出**: 兩約異同，救恩歷史發展脈絡
- **实现**: Priority 2 (Step 4) - 从 `searchBible` 结果中过滤旧约（book IDs 1-39）和新约（book IDs 40-66）
- **新增**: `[study_topic_deep - Step 4: Two Testament Comparison]`

### Step 5: 研究原文洞察 ✅
- **执行**: `lookup_strongs` 查詢關鍵希伯來文/希臘文字詞
- **输出**: 原文字義如何豐富主題理解
- **实现**: Priority 4 - `searchByStrongs()` (通过 Strong's Number 搜索)

### Step 6: 綜合分析與應用
- **执行**: 整合所有資料
- **输出**: 整體教導總結、3-5個核心真理、生活應用
- **实现**: AI 生成（通过系统提示词指导）

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
  ├─ [3.2] study_topic_deep - Step 2: getTopicStudy("什麼是愛？")
  │   └─ Step 2: 查詢主題查經資料 ✅
  │
  ├─ [3.3] study_topic_deep - Step 4: 兩約教導比較
  │   ├─ 从 searchBible 结果过滤旧约 (book IDs 1-39)
  │   └─ 从 searchBible 结果过滤新约 (book IDs 40-66)
  │   └─ Step 4: 比較兩約教導 ✅ (新增)
  │
  ├─ [3.4] searchCommentary("什麼是愛？") → 注释资料
  │   └─ Step 3: 搜尋註釋討論 ✅
  │
  ├─ [3.5] searchByStrongs() → 原文研究
  │   └─ Step 5: 研究原文洞察 ✅
  │
  └─ [3.6] advanced_cross_reference → 三层次交叉引用
      └─ 补充交叉引用
  ↓
[4] 格式化结果
  └─ [study_topic_deep - Step 2: Topic Study Resources]
  └─ [study_topic_deep - Step 4: Two Testament Comparison]
  ↓
[5] AI 生成回答（包含 6 个步骤的综合分析）
```

---

## 详细实现

### Step 2: 查詢主題查經資料

```typescript
// Priority 2: study_topic_deep - Step 2
const topicData = await getTopicStudy(keyword, "all", false, false);
// 格式化输出：
// [study_topic_deep - Step 2: Topic Study Resources - 主題查經資料 (Torrey & Naves)]
```

### Step 4: 比較兩約教導 (新增)

```typescript
// 从 Priority 1 的 searchBible 结果中过滤
const otVerses = searchData.record?.filter((v: any) => v.bid >= 1 && v.bid <= 39).slice(0, 5) || [];
const ntVerses = searchData.record?.filter((v: any) => v.bid >= 40 && v.bid <= 66).slice(0, 5) || [];

// 格式化输出：
// [study_topic_deep - Step 4: Two Testament Comparison - 兩約教導比較]
// ## 舊約教導 (Old Testament Teaching)
// ## 新約教導 (New Testament Teaching)
// **分析要求**: 比較兩約的異同，說明救恩歷史發展脈絡
```

---

## 输出格式

### Bible Context 格式

```
[study_topic_deep - Step 2: Topic Study Resources - 主題查經資料 (Torrey & Naves)]

[Torrey (中文)] 愛
愛是神的本性，也是基督徒生活的核心...

[Naves (中文)] 愛
愛是聖經中最重要的主題之一...

---

[study_topic_deep - Step 4: Two Testament Comparison - 兩約教導比較]

## 舊約教導 (Old Testament Teaching):
Found 5 relevant verses:

- 申命記 6:5 - 你要盡心、盡性、盡力愛耶和華你的神...
- 利未記 19:18 - 不可報仇，也不可埋怨你本國的子民...
- 詩篇 23:6 - 我一生一世必有恩惠慈愛隨著我...
...

## 新約教導 (New Testament Teaching):
Found 5 relevant verses:

- 約翰一書 4:8 - 沒有愛心的，就不認識神，因為神就是愛...
- 哥林多前書 13:4 - 愛是恆久忍耐，又有恩慈...
- 約翰福音 3:16 - 神愛世人，甚至將他的獨生子賜給他們...
...

**分析要求**: 比較兩約的異同，說明救恩歷史發展脈絡，以及主題在兩約中的發展。
```

---

## 系统提示词增强

系统提示词已更新，明确要求使用 `study_topic_deep` 策略：

```
## Study Strategy: study_topic_deep - 主題研究，全面探討聖經主題

You are providing a comprehensive topic study following the study_topic_deep strategy:

### Step 1: 搜尋相關經文 ✅
- Use the Bible search results provided in the context
- Show total count and most relevant verses

### Step 2: 查詢主題查經資料 ✅
- Use the topic study resources (Torrey & Naves) provided in the context
- Show biblical theological framework

### Step 3: 搜尋註釋討論 ✅
- Use the commentary search results provided in the context
- Show insights from different theological traditions

### Step 4: 比較兩約教導 ✅
- Use the two testament comparison data provided in the context
- Compare Old Testament vs New Testament teachings
- Show similarities and differences
- Explain salvation history development

### Step 5: 研究原文洞察 ✅
- Use the Strong's Number search results provided in the context
- Show how original language meanings enrich topic understanding

### Step 6: 綜合分析與應用
- Integrate all data from Steps 1-5
- Provide overall teaching summary
- List 3-5 core truths
- Include practical life application

**Structure your response following these 6 steps with clear headings.**
```

---

## 优势

### ✅ 完整策略

- 6 个步骤全部实现
- 从经文搜索到综合应用
- 符合 FHL_MCP_SERVER 的 `study_topic_deep` 策略

### ✅ 两约比较

- 自动比较旧约和新约
- 显示救恩历史发展脉络
- 提供更全面的主题研究

### ✅ 效率优化

- 复用 Priority 1 的 `searchBible` 结果
- 通过过滤实现两约比较
- 避免重复 API 调用

---

## 与之前实现的对比

### 之前：`getTopicStudy`

```
Priority 2: getTopicStudy()
  └─ 只获取主题查经资料（Torrey & Naves）
```

### 现在：`study_topic_deep`

```
Priority 2: study_topic_deep
  ├─ Step 2: getTopicStudy() → 主题查经资料
  └─ Step 4: 兩約教導比較 → 旧约 vs 新约对比
```

---

## 总结

✅ **已实现**：
- `getTopicStudy` 升级为 `study_topic_deep` 策略
- Step 2: 查询主题查经资料（保留原有功能）
- Step 4: 比较两约教导（新增）
- 系统提示词增强，明确要求使用 6 步骤策略
- 输出格式标识清晰（`[study_topic_deep - Step X]`）

✅ **效果**：
- 更全面的主题研究
- 自动两约比较
- 符合 FHL_MCP_SERVER 的 `study_topic_deep` 策略
- 提供救恩历史发展脉络

现在系统会在处理 search 查询时自动应用 `study_topic_deep` 策略，提供「主題研究，全面探討聖經主題」！
