# 策略选择：study_verse_deep vs study_topic_deep

## 概述

系统现在根据查询类型自动选择合适的研究策略：
- **经文/书卷查询** → `study_verse_deep`（深入研讀經文）
- **主题查询** → `study_topic_deep`（主題研究，全面探討聖經主題）

---

## 查询类型检测

### 1. Verse/Chapter 查询（使用 study_verse_deep）

**检测条件**:
- `bibleQuery.type === "verse"` 或 `bibleQuery.type === "chapter"`
- 包含书卷名称和章节号

**示例**:
- "約翰福音 3:16"
- "John 3:16"
- "創世記 1"
- "馬太福音 5"

**使用的策略**: `study_verse_deep`

---

### 2. Search 查询（使用 study_topic_deep）

**检测条件**:
- `bibleQuery.type === "search"`
- 包含主题关键字（如"愛"、"信心"、"福音"等）

**示例**:
- "什麼是愛？"
- "如何禱告"
- "信心"
- "福音"

**使用的策略**: `study_topic_deep`

---

## study_verse_deep 实现

### API 调用流程

```
用户输入: "約翰福音 3:16"
  ↓
[1] detectBibleQuery() → { type: "verse", book: "約翰福音", chapter: 3, verse: "16" }
  ↓
[2] 处理 verse 查询
  ↓
[3] 顺序调用 API:
  ├─ [3.1] Step 1: getBibleVerse() → 获取经文内容（包含 Strong's Number）
  │   └─ study_verse_deep Step 1 ✅
  │
  ├─ [3.2] Step 2: getWordAnalysis() → 分析原文字彙
  │   └─ study_verse_deep Step 2 ✅
  │
  ├─ [3.3] Step 3: lookupStrongs() → 研究關鍵字詞（从 word analysis 提取 Strong's 号码）
  │   └─ study_verse_deep Step 3 ✅ (新增)
  │
  ├─ [3.4] Step 4: getCommentary() → 查詢註釋解經
  │   └─ study_verse_deep Step 4 ✅
  │
  └─ [3.5] Step 5: searchBible() → 連結相關經文（交叉引用）
      └─ study_verse_deep Step 5 ✅
  ↓
[4] 格式化结果并添加到 bibleContext
  ↓
[5] AI 生成回答（使用 study_verse_deep prompt 指导）
  └─ study_verse_deep Step 6: 綜合研讀總結 ✅
```

### Step 3: lookupStrongs 实现

**新增功能**:
- 从 `getWordAnalysis` 结果中提取 Strong's 号码
- 调用 `lookupStrongs` 查询 Strong's 字典
- 格式化输出：原文、音譯、字義、用法

**输出格式**:
```
[study_verse_deep - Step 3: Strong's Dictionary Lookup - Strong's 字典查詢]

Strong's G26:
原文: ἀγάπη
音譯: agape
字義: love, affection, benevolence
用法: Used in New Testament to refer to...

Strong's H157:
原文: אָהַב
音譯: ahab
字義: to love
用法: Used in Old Testament...
```

---

## study_topic_deep 实现

### API 调用流程

```
用户输入: "什麼是愛？"
  ↓
[1] detectBibleQuery() → { type: "search", keyword: "什麼是愛？" }
  ↓
[2] 处理 search 查询
  ↓
[3] 顺序调用 API:
  ├─ [3.1] Priority 1: searchBible() → 15 条经文
  │   └─ study_topic_deep Step 1 ✅
  │
  ├─ [3.2] Priority 2: getTopicStudy() → 主题查经资料
  │   └─ study_topic_deep Step 2 ✅
  │
  ├─ [3.3] Priority 2 (Step 4): 兩約教導比較
  │   └─ study_topic_deep Step 4 ✅
  │
  ├─ [3.4] Priority 3: searchCommentary() → 注释资料
  │   └─ study_topic_deep Step 3 ✅
  │
  ├─ [3.5] Priority 4: searchByStrongs() → 原文研究
  │   └─ study_topic_deep Step 5 ✅
  │
  └─ [3.6] Priority 5: advanced_cross_reference → 三层次交叉引用
      └─ 补充交叉引用
  ↓
[4] 格式化结果并添加到 bibleContext
  ↓
[5] AI 生成回答（使用 study_topic_deep prompt 指导）
  └─ study_topic_deep Step 6: 綜合分析與應用 ✅
```

---

## 系统提示词选择

### Verse 查询 → study_verse_deep Prompt

```typescript
${isVerseQuery && detectedBibleQuery.book && detectedBibleQuery.chapter ? `
## Study Strategy: study_verse_deep - 深入研讀經文

# 深入研讀經文 - ${detectedBibleQuery.book} ${detectedBibleQuery.chapter}:${detectedBibleQuery.verse}

## 步驟 1: 獲取經文內容
## 步驟 2: 分析原文字彙
## 步驟 3: 研究關鍵字詞
## 步驟 4: 查詢註釋解經
## 步驟 5: 連結相關經文
## 步驟 6: 綜合研讀總結
` : ""}
```

### Search 查询 → study_topic_deep Prompt

```typescript
${isSearchQuery ? `
## Study Strategy: study_topic_deep - 主題研究，全面探討聖經主題

# 主題研究 - 「${detectedBibleQuery.keyword || "主題"}」

## 步驟 1: 搜尋相關經文
## 步驟 2: 查詢主題查經資料
## 步驟 3: 搜尋註釋討論
## 步驟 4: 比較兩約教導
## 步驟 5: 研究原文洞察
## 步驟 6: 綜合分析與應用
` : ""}
```

---

## 对比总结

| 特性 | study_verse_deep | study_topic_deep |
|------|-----------------|------------------|
| **适用查询** | 经文/书卷查询 | 主题查询 |
| **检测条件** | `type === "verse"` 或 `type === "chapter"` | `type === "search"` |
| **步骤数** | 6 步 | 6 步 |
| **主要 API** | getBibleVerse, getWordAnalysis, lookupStrongs, getCommentary | searchBible, getTopicStudy, searchCommentary, searchByStrongs |
| **重点** | 深入分析单节经文 | 全面探讨主题 |
| **交叉引用** | 标准或高级（可选） | 自动应用高级三层次 |

---

## 总结

✅ **已实现**:
- 根据查询类型自动选择策略
- Verse/Chapter 查询 → `study_verse_deep`
- Search 查询 → `study_topic_deep`
- 为 verse 查询添加了 `lookupStrongs`（Step 3）
- 系统提示词根据查询类型动态选择

✅ **效果**:
- 更精准的研究策略
- 符合 MCP prompt 标准
- 自动适配不同查询类型
- 提供更专业的研经体验

现在系统会根据查询类型自动选择合适的研究策略！
