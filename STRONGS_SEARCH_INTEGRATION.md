# Strong's Number 搜尋集成說明

## 概述

在 API 調用階段，新增了 `search_by_strongs` 功能，用於補充原文研究。當處理 search 查詢時，系統會自動根據關鍵字查找對應的 Strong's Numbers，並搜尋相關經文。

---

## 實現方式

### 1. 關鍵字到 Strong's Number 映射

系統維護了一個關鍵字到 Strong's Numbers 的映射表，包含常見的聖經主題關鍵字：

```typescript
const keywordToStrongs = {
  "愛": [
    { number: "G26", testament: "NT" },  // agape (新約)
    { number: "H157", testament: "OT" }  // ahab (舊約)
  ],
  "信心": [{ number: "G4102", testament: "NT" }],  // pistis
  "禱告": [
    { number: "G4336", testament: "NT" },  // proseuche (新約)
    { number: "H6419", testament: "OT" }  // palal (舊約)
  ],
  // ... 更多映射
};
```

### 2. 自動提取關鍵字

當用戶查詢包含問題詞時（如"什麼是愛？"），系統會：
1. 移除問題詞（什麼、如何、為什麼等）
2. 提取核心關鍵字（"愛"）
3. 查找對應的 Strong's Numbers

### 3. 並行調用 searchByStrongs

對於每個匹配的 Strong's Number，系統會並行調用：
```typescript
searchByStrongs(number, testament, 10, false)
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
[3] 並行調用 4 個 API:
  ├─ [3.1] searchBible("什麼是愛？") → 15 條經文
  ├─ [3.2] getTopicStudy("什麼是愛？") → 主題查經資料
  ├─ [3.3] searchCommentary("什麼是愛？") → 註釋資料
  └─ [3.4] searchByStrongs() → 原文研究
      ├─ searchByStrongs("G26", "NT", 10) → 新約中 agape 的經文
      └─ searchByStrongs("H157", "OT", 10) → 舊約中 ahab 的經文
  ↓
[4] 格式化結果
  └─ [Original Language Study - Strong's Number Search]
      ├─ Strong's G26 (New Testament): Found X occurrences
      │   - 約翰一書 4:8 - ...
      │   - 哥林多前書 13:4 - ...
      │   ...
      └─ Strong's H157 (Old Testament): Found Y occurrences
          - 詩篇 18:1 - ...
          - ...
  ↓
[5] 添加到 bibleContext
  ↓
[6] AI 生成回答（包含原文研究）
```

---

## 支持的關鍵字映射

### 已實現的映射

| 關鍵字 | Strong's Numbers | 說明 |
|--------|------------------|------|
| 愛 / love | G26 (NT), H157 (OT) | agape (新約), ahab (舊約) |
| 信心 / faith / 信 | G4102 (NT) | pistis |
| 禱告 / prayer | G4336 (NT), H6419 (OT) | proseuche (新約), palal (舊約) |
| 福音 / gospel | G2098 (NT) | euangelion |
| 救恩 / salvation | G4991 (NT), H3444 (OT) | soteria (新約), yeshuah (舊約) |
| 恩典 / grace | G5485 (NT), H2580 (OT) | charis (新約), chen (舊約) |
| 平安 / peace | G1515 (NT), H7965 (OT) | eirene (新約), shalom (舊約) |
| 希望 / hope | G1680 (NT) | elpis |
| 真理 / truth | G225 (NT), H571 (OT) | aletheia (新約), emeth (舊約) |
| 生命 / life | G2222 (NT), H2416 (OT) | zoe (新約), chay (舊約) |
| 罪 / sin | G266 (NT), H2403 (OT) | hamartia (新約), chattath (舊約) |
| 赦免 / forgiveness | G859 (NT), H5545 (OT) | aphesis (新約), calach (舊約) |

---

## 輸出格式

### Bible Context 格式

```
[Original Language Study - Strong's Number Search - 原文研究 (Strong's Number 搜尋)]

Strong's G26 (New Testament - 新約):
Found 116 occurrences

- 約翰一書 4:8 - 沒有愛心的，就不認識神，因為神就是愛。
- 哥林多前書 13:4 - 愛是恆久忍耐，又有恩慈；愛是不嫉妒...
- 約翰福音 3:16 - 神愛世人，甚至將他的獨生子賜給他們...
- 羅馬書 5:8 - 惟有基督在我們還作罪人的時候為我們死...
- 以弗所書 2:4 - 然而神既有豐富的憐憫...

Strong's H157 (Old Testament - 舊約):
Found 238 occurrences

- 詩篇 18:1 - 耶和華，我的力量啊，我愛你！
- 申命記 6:5 - 你要盡心、盡性、盡力愛耶和華你的神...
- ...
```

---

## 系統提示詞增強

系統提示詞已更新，明確要求使用 Strong's Number 搜尋結果：

```
### 1. **原文解釋 (Original Language Explanation)** - REQUIRED
   - **優先使用**上下文中的 Strong's Number 搜尋結果（search_by_strongs）
   - 上下文中的 "[Original Language Study - Strong's Number Search]" 提供了以 Strong's Number 搜尋的經文
   - 這些經文展示了該原文字在聖經中的使用情況
   - 分析該原文字在不同經文中的語義範圍和用法
   - 說明該原文字如何增強對主題的理解
```

---

## 優勢

### ✅ 補充原文研究

1. **多層次原文分析**:
   - 關鍵字搜尋 → 找到相關經文
   - Strong's Number 搜尋 → 找到該原文字的所有使用情況
   - 對比分析 → 理解原文字的語義範圍

2. **新舊約對比**:
   - 對於同時存在於新舊約的主題（如"愛"），提供兩約的原文對比
   - 展示原文字在不同約中的使用差異

3. **語義範圍分析**:
   - 通過 Strong's Number 搜尋，可以看到該原文字在聖經中的所有使用情況
   - 幫助理解原文字的完整語義範圍

---

## 使用示例

### 查詢：`什麼是愛？`

**系統會自動**：
1. ✅ 提取關鍵字："愛"
2. ✅ 查找 Strong's Numbers：G26 (NT), H157 (OT)
3. ✅ 並行調用：
   - `searchByStrongs("G26", "NT", 10)` → 新約中 agape 的經文
   - `searchByStrongs("H157", "OT", 10)` → 舊約中 ahab 的經文
4. ✅ 格式化結果並添加到 bibleContext
5. ✅ AI 使用這些數據生成詳細的原文解釋

**輸出包含**：
- 原文解釋：agape (G26) 和 ahab (H157) 的區別
- 使用情況：該原文字在聖經中的出現次數和典型用法
- 語義範圍：通過多處經文展示原文字的完整含義

---

## 技術細節

### 關鍵字清理邏輯

```typescript
const cleanKeyword = keyword.toLowerCase()
  .replace(/(什麼|什麼是|什麼意思|如何|怎樣|為什麼|為何|...)/gi, "")
  .trim();
```

移除問題詞，提取核心關鍵字。

### 並行調用

```typescript
const strongsSearches = await Promise.allSettled(
  strongsToSearch.slice(0, 2).map(({ number, testament }) =>
    searchByStrongs(number, testament, 10, false)
  )
);
```

最多並行調用 2 個 Strong's Numbers（新約和舊約各一個）。

---

## 未來擴展

### 可以添加的映射

- 更多主題關鍵字
- 從經文中自動提取 Strong's Numbers（如果 API 返回）
- 動態 Strong's Number 發現（通過 word analysis API）

---

## 總結

✅ **已實現**：
- search_by_strongs 集成到 search 查詢處理
- 關鍵字到 Strong's Number 映射
- 並行 API 調用
- 格式化輸出
- 系統提示詞增強

✅ **效果**：
- 補充原文研究
- 提供多層次原文分析
- 新舊約對比
- 語義範圍分析

現在系統會在處理 search 查詢時自動調用 `search_by_strongs`，補充原文研究數據！
