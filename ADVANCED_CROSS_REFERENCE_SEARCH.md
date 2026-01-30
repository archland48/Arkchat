# Advanced Cross-Reference 在 Search 查詢中的集成

## 概述

在 API 調用階段，新增了 `advanced_cross_reference` 功能到 search 查詢處理中，用於補充交叉引用。現在所有 search 查詢都會自動應用三層次交叉引用分析。

---

## 實現方式

### 1. 自動應用（無需用戶明確請求）

與 verse 查詢不同，search 查詢會**自動應用** advanced_cross_reference，無需用戶明確請求。

### 2. 關鍵字和主題提取

從 search 結果中提取：
- **關鍵字**：從前 5 條經文中提取關鍵字
- **主題**：從查詢關鍵字中識別主題
- **對照主題**：識別對比或補充主題

### 3. 三層次分析

```
Layer 1: 直接引用關係 (Direct References)
  └─ 從 search 結果中提取關鍵字 → 搜索相關經文

Layer 2: 主題相關經文 (Thematic Connections)
  └─ 識別主題（愛、信心、救恩等） → 搜索主題相關經文

Layer 3: 對照經文 (Contrasting/Complementary Verses)
  └─ 識別對照主題（愛↔恨、信心↔懷疑） → 搜索對照經文
```

---

## API 調用流程

### 查詢示例：`什麼是愛？`

```
用戶輸入: "什麼是愛？"
  ↓
[1] detectBibleQuery() → { type: "search", keyword: "什麼是愛？" }
  ↓
[2] 處理 search 查詢
  ↓
[3] 並行調用 5 個 API:
  ├─ [3.1] searchBible("什麼是愛？") → 15 條經文
  ├─ [3.2] getTopicStudy("什麼是愛？") → 主題查經資料
  ├─ [3.3] searchCommentary("什麼是愛？") → 註釋資料
  ├─ [3.4] searchByStrongs() → 原文研究
  └─ [3.5] advanced_cross_reference → 三層次交叉引用 (新增)
      ├─ Layer 1: 從 search 結果提取關鍵字 → 搜索相關經文
      ├─ Layer 2: 識別主題「愛」 → 搜索主題相關經文
      └─ Layer 3: 識別對照主題「恨」 → 搜索對照經文
  ↓
[4] 格式化結果
  └─ [Advanced Cross-Reference Analysis - 進階交叉引用分析 (三層次)]
      ├─ Layer 1: 直接引用關係
      ├─ Layer 2: 主題相關經文
      └─ Layer 3: 對照經文
  ↓
[5] 添加到 bibleContext
  ↓
[6] AI 生成回答（包含三層次交叉引用）
```

---

## 詳細實現

### 1. 關鍵字提取

```typescript
function extractKeyWordsFromSearch(searchData: any): string[] {
  // 從前 5 條 search 結果中提取關鍵字
  // 移除常見詞（的、是、在、有等）
  // 返回 top 5 關鍵字
}
```

### 2. 主題提取

```typescript
function extractThemesFromKeyword(keyword: string): string[] {
  // 從關鍵字中識別主題
  // 支持：愛、信心、救恩、恩典、平安等
  // 返回最多 3 個主題
}
```

### 3. 對照主題提取

```typescript
function extractContrastingThemesFromKeyword(keyword: string): string[] {
  // 識別對照主題
  // 愛 → 恨、敵對
  // 信心 → 懷疑、不信
  // 返回最多 2 個對照主題
}
```

### 4. 三層次搜索

```typescript
// Layer 1: 直接引用
const layer1Searches = await Promise.allSettled(
  keyWords.slice(0, 3).map(kw => searchBible(kw, "unv", 8, false))
);

// Layer 2: 主題相關
const layer2Searches = await Promise.allSettled(
  themes.slice(0, 2).map(theme => searchBible(theme, "unv", 8, false))
);

// Layer 3: 對照經文
const layer3Searches = await Promise.allSettled(
  contrastingThemes.slice(0, 2).map(theme => searchBible(theme, "unv", 5, false))
);
```

---

## 輸出格式

### Bible Context 格式

```
[Advanced Cross-Reference Analysis - 進階交叉引用分析 (三層次)]

## Layer 1: 直接引用關係 (Direct References)

關鍵字: 愛
- 約翰一書 4:8 - 沒有愛心的，就不認識神，因為神就是愛。
- 哥林多前書 13:4 - 愛是恆久忍耐，又有恩慈；愛是不嫉妒...
- 約翰福音 3:16 - 神愛世人，甚至將他的獨生子賜給他們...
...

關鍵字: 世人
- 約翰福音 3:16 - 神愛世人...
- 約翰福音 12:47 - 我來本不是要審判世界...
...

## Layer 2: 主題相關經文 (Thematic Connections)

主題: 愛
- 約翰一書 4:16 - 神就是愛；住在愛裡面的，就是住在神裡面...
- 羅馬書 5:8 - 惟有基督在我們還作罪人的時候為我們死...
- 以弗所書 2:4 - 然而神既有豐富的憐憫...
...

主題: 救恩
- 羅馬書 10:9 - 你若口裡認耶穌為主...
- 以弗所書 2:8 - 你們得救是本乎恩...
...

## Layer 3: 對照經文 (Contrasting/Complementary Verses)

對照主題: 恨
- 約翰一書 3:15 - 凡恨他弟兄的，就是殺人的...
- 馬太福音 5:44 - 只是我告訴你們，要愛你們的仇敵...
...

對照主題: 敵對
- 羅馬書 8:7 - 原來體貼肉體的，就是與神為仇...
...
```

---

## 與 Verse 查詢的區別

### Verse 查詢
- 需要用戶明確請求（通過關鍵字檢測）
- 從單一經文中提取關鍵字和主題
- 過濾掉當前經文本身

### Search 查詢（新增）
- **自動應用**（無需用戶明確請求）
- 從多條 search 結果中提取關鍵字和主題
- 提供更廣泛的交叉引用網絡

---

## 系統提示詞增強

系統提示詞已更新，明確要求：

```
### 3. **經文交叉引用 (Cross References)** - REQUIRED
   - **如果上下文包含 "[Advanced Cross-Reference Analysis - 進階交叉引用分析 (三層次)]"**:
     - **必須使用**三層次交叉引用分析數據
     - **Layer 1**: 使用直接引用關係的經文
     - **Layer 2**: 使用主題相關經文
     - **Layer 3**: 使用對照經文
     - 按照三層次結構組織交叉引用內容
```

---

## 優勢

### ✅ 自動應用

- 無需用戶明確請求
- 所有 search 查詢都會自動獲得三層次交叉引用

### ✅ 多層次分析

- Layer 1: 直接引用關係
- Layer 2: 主題相關經文
- Layer 3: 對照經文

### ✅ 更全面的交叉引用

- 從多條 search 結果中提取關鍵字
- 提供更廣泛的經文網絡
- 補充標準交叉引用的不足

---

## 使用示例

### 查詢：`什麼是愛？`

**系統會自動**：
1. ✅ 搜索相關經文（15 條）
2. ✅ 獲取主題查經資料
3. ✅ 搜索註釋
4. ✅ 通過 Strong's Number 搜索原文研究
5. ✅ **應用 advanced_cross_reference**（新增）
   - Layer 1: 從 search 結果提取關鍵字 → 搜索相關經文
   - Layer 2: 識別主題「愛」 → 搜索主題相關經文
   - Layer 3: 識別對照主題「恨」 → 搜索對照經文

**輸出包含**：
- 三層次交叉引用分析
- 直接引用關係
- 主題相關經文
- 對照經文

---

## 總結

✅ **已實現**：
- advanced_cross_reference 集成到 search 查詢處理
- 自動應用（無需用戶明確請求）
- 三層次分析（Layer 1, 2, 3）
- 從 search 結果提取關鍵字和主題
- 格式化輸出
- 系統提示詞增強

✅ **效果**：
- 補充交叉引用
- 提供多層次引用網絡
- 更全面的經文研究
- 自動應用，無需額外請求

現在系統會在處理 search 查詢時自動應用 `advanced_cross_reference`，提供三層次交叉引用分析！
