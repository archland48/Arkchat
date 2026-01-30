# Advanced Cross Reference 交叉引用分析

## 功能說明

`advanced_cross_reference` 是一個進階的交叉引用分析功能，提供多層次（1-3 層）的經文網絡分析。

---

## 觸發方式

### 自動檢測關鍵字

當用戶查詢中包含以下關鍵字時，系統會自動應用 `advanced_cross_reference`：

- **中文關鍵字**:
  - `交叉引用`
  - `相關經文`
  - `經文網絡`
  - `引用關係`
  - `經文關係`
  - `找出相關`
  - `找連結`
  - `連結經文`

- **英文關鍵字**:
  - `cross reference`
  - `related verses`
  - `verse network`
  - `reference relation`
  - `verse relation`
  - `connect`
  - `link verse`

### 查詢示例

```
✅ "約翰福音 3:16 的交叉引用"
✅ "找出約翰福音 3:16 的相關經文"
✅ "約翰福音 3:16 cross reference"
✅ "約翰福音 3:16 的經文網絡"
✅ "連結約翰福音 3:16 的相關經文"
```

---

## 分析層次

### Layer 1: 直接引用關係 (Direct References)

**功能**: 識別直接引用關係
- 本節引用的舊約經文
- 新約中引用本節的經文
- 相同關鍵字的直接引用

**方法**: 
- 提取經文中的關鍵字
- 搜尋包含相同關鍵字的經文
- 過濾掉當前經文本身

**輸出**: 5-10 處直接相關經文

---

### Layer 2: 主題相關經文 (Thematic Connections)

**功能**: 搜尋相同主題的經文
- 主題串連
- 神學主題相關
- 教導主題相關

**方法**:
- 識別經文中的主題（如：愛、信心、救恩、恩典等）
- 搜尋相同主題的經文
- 建立主題網絡

**輸出**: 5-8 處主題相關經文

**支援的主題**:
- 愛 (love)
- 信心 (faith)
- 救恩 (salvation)
- 恩典 (grace)
- 平安 (peace)
- 希望 (hope)
- 真理 (truth)
- 生命 (life)
- 神 (god)
- 耶穌 (jesus)
- 基督 (christ)
- 聖靈 (spirit)
- 罪 (sin)
- 赦免 (forgiveness)
- 禱告 (prayer)
- 敬拜 (worship)

---

### Layer 3: 對照經文 (Contrasting/Complementary Verses)

**功能**: 找出對比或補充的經文
- 相似教導
- 對立觀點
- 補充說明

**方法**:
- 識別對比主題（如：愛 vs 恨、信心 vs 懷疑）
- 搜尋對照經文
- 分析對比關係

**輸出**: 3-5 處對照經文

**對照主題映射**:
- 愛 ↔ 恨、敵對
- 信心 ↔ 懷疑、不信
- 救恩 ↔ 審判、定罪
- 恩典 ↔ 律法、行為
- 平安 ↔ 憂慮、恐懼
- 生命 ↔ 死亡、滅亡
- 真理 ↔ 謊言、虛假

---

## 使用示例

### 示例 1: 基本交叉引用查詢

**用戶輸入**: `約翰福音 3:16 的交叉引用`

**系統處理**:
1. 檢測到 `advanced_cross_reference` 關鍵字
2. 獲取主經文：約翰福音 3:16
3. 執行三層分析：
   - **Layer 1**: 搜尋包含「愛」、「世人」、「獨生子」等關鍵字的經文
   - **Layer 2**: 搜尋「愛」、「救恩」主題的經文
   - **Layer 3**: 搜尋對照主題（如：審判、定罪）的經文
4. 生成多層次引用網絡
5. AI 生成綜合分析

**輸出包含**:
```
## Layer 1: 直接引用關係
- 約翰一書 4:9-10 - 神差他獨生子到世間來...
- 羅馬書 5:8 - 惟有基督在我們還作罪人的時候為我們死...
- 以弗所書 2:4-5 - 然而神既有豐富的憐憫...

## Layer 2: 主題相關經文
主題: 愛
- 哥林多前書 13:4-8 - 愛是恆久忍耐...
- 約翰一書 4:16 - 神就是愛...

主題: 救恩
- 羅馬書 10:9 - 你若口裡認耶穌為主...
- 以弗所書 2:8 - 你們得救是本乎恩...

## Layer 3: 對照經文
對照主題: 審判
- 約翰福音 3:18 - 信他的人，不被定罪...
- 啟示錄 20:12 - 我又看見死了的人...
```

---

### 示例 2: 英文查詢

**用戶輸入**: `John 3:16 cross reference`

**系統處理**: 與中文查詢相同，自動應用三層分析

---

### 示例 3: 主題查詢 + 交叉引用

**用戶輸入**: `找出關於「愛」的相關經文`

**系統處理**:
1. 檢測為主題查詢
2. 如果包含「相關」、「連結」等關鍵字，也會應用交叉引用分析
3. 執行主題研究和交叉引用分析

---

## 數據流程

```
用戶查詢: "約翰福音 3:16 的交叉引用"
  ↓
detectBibleQuery() → { type: "verse", book: "約翰福音", chapter: 3, verse: "16" }
  ↓
detectAdvancedPrompt() → "advanced_cross_reference"
  ↓
獲取主經文
  ↓
提取關鍵字 → ["愛", "世人", "獨生子", "賜給", "永生"]
  ↓
提取主題 → ["愛", "救恩"]
  ↓
提取對照主題 → ["審判", "定罪"]
  ↓
並行執行三層搜索:
  ├─ Layer 1: 關鍵字搜索 (3個關鍵字 × 10結果)
  ├─ Layer 2: 主題搜索 (2個主題 × 8結果)
  └─ Layer 3: 對照主題搜索 (2個對照 × 5結果)
  ↓
格式化為多層次引用網絡
  ↓
生成增強系統提示詞
  ↓
AI 生成綜合交叉引用分析
```

---

## 輸出格式

### 系統提示詞增強

當檢測到 `advanced_cross_reference` 時，系統提示詞會包含：

```
## Advanced Prompt: Cross Reference Analysis (advanced_cross_reference)

You should provide:
- Direct references (quoted verses)
- Thematic connections
- Contrasting or complementary verses
- Verse relationship network (1-3 layers deep)
- Comprehensive cross-reference analysis
```

### AI 回答結構

AI 會生成包含以下結構的回答：

1. **主經文內容**
   - 完整經文
   - 上下文

2. **Layer 1: 直接引用關係**
   - 直接引用的經文
   - 引用關係說明

3. **Layer 2: 主題相關經文**
   - 主題網絡
   - 主題發展脈絡

4. **Layer 3: 對照經文**
   - 對比分析
   - 補充說明

5. **綜合解讀**
   - 經文網絡總結
   - 神學意義
   - 實踐應用

---

## 技術實現

### 關鍵函數

#### `extractKeyWords(text: string): string[]`
提取經文中的關鍵字

#### `extractThemes(text: string, verseData: any): string[]`
識別經文中的主題

#### `extractContrastingThemes(text: string): string[]`
識別對照主題

### API 調用

```typescript
// Layer 1: 關鍵字搜索
const layer1Searches = await Promise.allSettled(
  keyWords.slice(0, 3).map((keyword) => 
    searchBible(keyword, "unv", 10, false)
  )
);

// Layer 2: 主題搜索
const layer2Searches = await Promise.allSettled(
  themes.slice(0, 2).map((theme) => 
    searchBible(theme, "unv", 8, false)
  )
);

// Layer 3: 對照主題搜索
const layer3Searches = await Promise.allSettled(
  contrastingThemes.slice(0, 2).map((theme) => 
    searchBible(theme, "unv", 5, false)
  )
);
```

---

## 優勢

✅ **多層次分析**: 1-3 層深度引用網絡
✅ **自動檢測**: 智能識別用戶意圖
✅ **主題網絡**: 建立主題相關經文網絡
✅ **對照分析**: 提供對比和補充經文
✅ **綜合解讀**: AI 生成全面的交叉引用分析

---

## 與標準交叉引用的區別

### 標準交叉引用 (study_verse_deep)
- 單層搜索
- 基於關鍵字
- 簡單相關經文列表

### 進階交叉引用 (advanced_cross_reference)
- **三層分析**
- **主題網絡**
- **對照經文**
- **關係網絡圖**
- **綜合解讀**

---

## 使用建議

1. **明確查詢**: 使用「交叉引用」、「相關經文」等關鍵字
2. **經文查詢**: 查詢特定經節時，加上「交叉引用」關鍵字
3. **主題研究**: 主題查詢時，也可以加上「相關經文」來獲得交叉引用

---

## 總結

`advanced_cross_reference` 提供：
- ✅ 多層次（1-3 層）引用網絡
- ✅ 直接引用、主題相關、對照經文
- ✅ 自動檢測和應用
- ✅ 全面的交叉引用分析

讓 Bible study 更加深入和全面！
