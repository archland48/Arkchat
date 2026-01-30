# FHL Bible Prompts 集成說明

## 概述

已將 FHL Bible MCP Server 的 prompts 邏輯集成到 API 調用階段，讓 Bible study 的回答更加準確和全面。

---

## 新增的 API 函數

### 1. Strong's Dictionary 相關

#### `lookupStrongs(number, testament?, simplified?)`
查詢 Strong's 原文字典

**支援格式**:
- `"G3056"` - 希臘文（新約）
- `"H430"` - 希伯來文（舊約）
- `3056, "NT"` - 數字 + 約別

**API 端點**: `sd.php`

**使用示例**:
```typescript
// 查詢希臘文 "logos" (G3056)
const strongs = await lookupStrongs("G3056");

// 查詢希伯來文 "elohim" (H430)
const strongs = await lookupStrongs("H430");
```

#### `searchByStrongs(number, testament?, limit?, simplified?)`
以 Strong's Number 搜尋經文

**使用示例**:
```typescript
// 搜尋 G3056 在聖經中的所有出現位置
const occurrences = await searchByStrongs("G3056", undefined, 50);
```

---

### 2. 主題研究相關

#### `getTopicStudy(keyword, source?, simplified?, countOnly?)`
查詢主題查經資料（Torrey, Naves）

**參數**:
- `keyword`: 主題關鍵字
- `source`: `"all"` | `"torrey_en"` | `"naves_en"` | `"torrey_zh"` | `"naves_zh"` (預設: `"all"`)
- `simplified`: 是否簡體中文
- `countOnly`: 是否只返回總數

**API 端點**: `st.php`

**使用示例**:
```typescript
// 查詢「愛」的主題研究
const topicStudy = await getTopicStudy("愛", "all", false, false);
```

#### `searchCommentary(keyword, commentaryId?, simplified?)`
在註釋書中搜尋關鍵字

**API 端點**: `ssc.php`

**使用示例**:
```typescript
// 在所有註釋書中搜尋「信心」
const results = await searchCommentary("信心");

// 在特定註釋書中搜尋
const results = await searchCommentary("信心", 1);
```

---

## Prompt 策略系統

### 自動選擇策略

系統會根據查詢類型自動選擇合適的 prompt 策略：

#### 1. `study_verse_deep` - 深入研讀經文

**觸發條件**: 查詢特定經節（如：`約翰福音 3:16`）

**執行步驟**:
1. ✅ 獲取經文內容（包含 Strong's Number）
2. ✅ 分析原文字彙（希臘文/希伯來文）
3. ✅ 研究關鍵字詞（Strong's 字典）
4. ✅ 查詢註釋解經
5. ✅ 連結相關經文（交叉引用）
6. ✅ 綜合研讀總結

**使用的工具**:
- `get_bible_verse`
- `get_word_analysis`
- `lookup_strongs`
- `get_commentary`
- `search_bible`

---

#### 2. `study_topic_deep` - 主題研究

**觸發條件**: 查詢主題關鍵字（如：`愛`、`信心`、`福音`）

**執行步驟**:
1. ✅ 搜尋相關經文
2. ✅ 查詢主題查經資料（Torrey, Naves）
3. ✅ 搜尋註釋討論
4. ✅ 比較兩約教導
5. ✅ 研究原文洞察
6. ✅ 綜合分析與應用

**使用的工具**:
- `search_bible`
- `get_topic_study`
- `search_commentary`
- `lookup_strongs`

---

#### 3. `reading_chapter` - 整章讀經

**觸發條件**: 查詢整章（如：`創世記 1`）

**執行步驟**:
1. ✅ 獲取整章經文
2. ✅ 查詢章節註釋
3. ✅ 提供讀經指引

---

### 進階 Prompts 檢測

系統會自動檢測用戶意圖，應用進階 prompts：

#### `advanced_cross_reference` - 交叉引用分析

**觸發關鍵字**:
- `交叉引用`、`cross reference`、`相關經文`、`related verses`
- `找出相關`、`找連結`、`connect`

**功能**:
- 直接引用關係
- 主題相關經文
- 對照經文
- 經文網絡（1-3 層深度）

---

#### `advanced_parallel_gospels` - 四福音對照

**觸發關鍵字**:
- `四福音`、`parallel gospels`、`對觀`、`synoptic`
- `比較福音`、`gospel compar`
- `馬太馬可路加`

**功能**:
- 平行經文對照
- 內容異同分析
- 作者視角分析
- 獨特內容識別
- 神學綜合

---

#### `advanced_character_study` - 聖經人物研究

**觸發關鍵字**:
- `人物研究`、`character study`、`研究人物`
- `保羅`、`peter`、`david`、`moses`、`abraham`

**功能**:
- 9 大維度全面分析
- 生平時間線
- 性格特質
- 關係網絡
- 主要事件
- 屬靈教訓

---

#### `study_translation_compare` - 版本比較

**觸發關鍵字**:
- `版本比較`、`translation compare`、`比較譯本`
- `和合本現代`、`unv kjv`、`不同版本`

**功能**:
- 多譯本並列顯示
- 關鍵差異標示
- 原文根據分析
- 翻譯選擇說明
- 解經影響討論

---

#### `study_word_original` - 原文字詞研究

**觸發關鍵字**:
- `原文研究`、`word study`、`原文字`
- `greek word`、`hebrew word`、`strong number`
- `研究字`、`字義`

**功能**:
- Strong's Number 查詢
- 原文拼寫與發音
- 字義範圍
- 字根分析
- 出現次數統計
- 典型經文
- 同義詞/反義詞
- 神學意義

---

## 實際應用示例

### 示例 1: 深入研讀經文

**用戶查詢**: `約翰福音 3:16`

**系統處理**:
1. 檢測為 `verse` 查詢
2. 選擇 `study_verse_deep` 策略
3. 執行步驟：
   - 獲取經文（含 Strong's）
   - 分析原文字彙
   - 查詢關鍵字的 Strong's 字典（如：G25 "愛"）
   - 獲取註釋
   - 搜尋相關經文（交叉引用）
4. 生成增強系統提示詞
5. AI 生成包含所有必需元素的回答

**回答包含**:
- ✅ 原文解釋（G25 "agape" 的意義）
- ✅ 經文註釋（CBOL 等註釋書）
- ✅ 交叉引用（約翰一書 4:9-10, 羅馬書 5:8 等）
- ✅ 歷史背景（約翰寫作背景）
- ✅ 反思提示（2-3 個問題）

---

### 示例 2: 主題研究

**用戶查詢**: `愛`

**系統處理**:
1. 檢測為 `search` 查詢
2. 判斷為主題查詢（短關鍵字）
3. 選擇 `study_topic_deep` 策略
4. 執行步驟：
   - 搜尋相關經文（10 處）
   - 查詢 Torrey & Naves 主題查經
   - 搜尋註釋書中的討論
   - 比較舊約和新約的教導
5. 生成增強系統提示詞
6. AI 生成全面主題研究

**回答包含**:
- ✅ 主題定義
- ✅ 原文字彙分析（G25, H2617 等）
- ✅ 舊約中的主題
- ✅ 新約中的發展
- ✅ 關鍵經文精選
- ✅ 神學綜合
- ✅ 實踐應用

---

### 示例 3: 交叉引用分析

**用戶查詢**: `約翰福音 3:16 的交叉引用`

**系統處理**:
1. 檢測為 `verse` 查詢
2. 檢測到 `advanced_cross_reference` 關鍵字
3. 應用交叉引用分析策略
4. 搜尋相關經文（多層次）
5. 建立經文網絡

**回答包含**:
- ✅ 直接引用關係
- ✅ 主題相關經文（1-3 層深度）
- ✅ 對照經文
- ✅ 經文關係網絡圖
- ✅ 綜合解讀

---

## 數據流程

```
用戶查詢
  ↓
detectBibleQuery() - 檢測查詢類型
  ↓
selectPromptStrategy() - 選擇 prompt 策略
  ↓
detectAdvancedPrompt() - 檢測進階 prompts
  ↓
根據策略執行步驟：
  ├─ study_verse_deep:
  │   ├─ getBibleVerse (含 Strong's)
  │   ├─ getWordAnalysis
  │   ├─ lookupStrongs (關鍵字)
  │   ├─ getCommentary
  │   └─ searchBible (相關經文)
  │
  ├─ study_topic_deep:
  │   ├─ searchBible
  │   ├─ getTopicStudy (Torrey, Naves)
  │   ├─ searchCommentary
  │   └─ lookupStrongs (關鍵字)
  │
  └─ advanced_*:
      └─ 根據類型執行相應步驟
  ↓
格式化數據為上下文
  ↓
generateEnhancedPrompt() - 生成增強系統提示詞
  ↓
發送給 AI Model
  ↓
AI 生成包含所有必需元素的回答
```

---

## 文件結構

```
Arkchat/
├── lib/
│   ├── fhl-api.ts          # FHL API 客戶端（新增函數）
│   ├── bible-utils.ts      # Bible 查詢檢測和格式化
│   └── bible-prompts.ts    # Prompt 策略系統（新增）
├── app/
│   └── api/
│       └── chat/
│           └── route.ts    # 集成 prompts 的聊天 API
└── FHL_PROMPTS_INTEGRATION.md  # 本文檔
```

---

## 支援的 Prompts 列表

### 基礎 Prompts
- ✅ `study_verse_deep` - 深入研讀經文
- ✅ `study_topic_deep` - 主題研究
- ✅ `reading_chapter` - 整章讀經

### 進階 Prompts
- ✅ `advanced_cross_reference` - 交叉引用分析
- ✅ `advanced_parallel_gospels` - 四福音對照
- ✅ `advanced_character_study` - 聖經人物研究
- ✅ `study_translation_compare` - 版本比較
- ✅ `study_word_original` - 原文字詞研究

---

## 未來增強

- [ ] 添加更多進階 prompts（如：`special_sermon_prep`）
- [ ] 支援版本比較功能（多譯本對照）
- [ ] 添加人物研究的 9 維度分析
- [ ] 優化交叉引用的多層次網絡
- [ ] 添加符類福音的詳細對照

---

## 總結

✅ **已實現**:
- Strong's Dictionary 查詢和搜索
- 主題研究（Torrey, Naves）
- 註釋搜索
- Prompt 策略自動選擇
- 進階 prompts 檢測
- 增強系統提示詞生成

✅ **效果**:
- 更準確的 Bible study 回答
- 更全面的經文分析
- 自動應用合適的研究策略
- 包含原文、註釋、交叉引用等完整元素
