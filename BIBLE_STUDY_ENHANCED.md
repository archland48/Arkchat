# Enhanced Bible Study Features 📖

## 增強功能說明

當回答聖經問題時，系統現在會自動包含以下完整內容：

### 1. 原文解釋 (Original Language Explanation)
- ✅ 自動獲取希臘文/希伯來文原文字彙分析
- ✅ 包含 Strong's Number
- ✅ 語法結構和詞性分析
- ✅ 原文字義解釋

**數據來源**: FHL API `qp.php` (字彙分析)

### 2. 經文註釋 (Commentary)
- ✅ 自動獲取多種註釋書的內容
- ✅ 明確標註註釋來源（如：CBOL註釋、信望愛站註釋等）
- ✅ 提供多個註釋觀點

**數據來源**: FHL API `sc.php` (註釋查詢)

**可用註釋書**:
- CBOL加插註釋
- parsing 註釋
- 信望愛站註釋
- 串珠
- 蔡茂堂牧師講道
- 盧俊義牧師講道
- 康來昌牧師講道

### 3. 經文交叉引用 (Cross References)
- ✅ AI 自動提供 5-10 個相關經文
- ✅ 連接舊約和新約相關主題
- ✅ 解釋經文之間的關聯

**實現方式**: AI 根據上下文和知識庫自動生成

### 4. 歷史背景 (Historical Background)
- ✅ 解釋寫作時的歷史和文化背景
- ✅ 說明作者、受眾和時代背景
- ✅ 相關歷史事件和習俗

**實現方式**: AI 根據上下文和知識庫自動生成

### 5. 反思提示 (Reflection Questions)
- ✅ 提供 2-3 個深入的反思問題
- ✅ 幫助讀者將經文應用到生活中
- ✅ 鼓勵靈性成長和實踐應用

**實現方式**: AI 根據上下文自動生成

---

## 使用範例

### 查詢單節經文

**輸入**: `約翰福音 3:16`

**系統會自動**:
1. 獲取經文內容
2. 獲取原文分析（希臘文字彙、Strong's Number）
3. 獲取註釋（多種註釋書）
4. AI 生成交叉引用、歷史背景、反思問題

**輸出格式**:
```markdown
## 原文解釋
- 關鍵字：ἠγάπησεν (agapēsen) - Strong's G25
- 語法：動詞，過去式，第三人稱單數
- 原義：無條件的愛，犧牲的愛

## 經文註釋
【CBOL註釋】約翰福音 3:16
神愛世人的愛是犧牲的愛...

【信望愛站註釋】
這節經文是整本聖經的核心...

## 經文交叉引用
相關經文：
- 約翰一書 4:9-10 - 神如何顯明祂的愛
- 羅馬書 5:8 - 基督為我們死
- 以弗所書 2:4-5 - 神的愛和恩典

## 歷史背景
約翰福音寫於主後 90-100 年...

## 反思提示
1. 我如何回應神無條件的愛？
2. 我是否願意像神愛我一樣去愛他人？
```

---

## API 端點

### 獲取註釋
```typescript
GET /api/bible?action=commentary&book=約&chapter=3&verse=16
GET /api/bible?action=commentary&book=約&chapter=3&verse=16&commentary_id=1
```

### 列出所有註釋書
```typescript
GET /api/bible?action=commentaries
```

### 獲取原文分析
```typescript
GET /api/bible?action=word-analysis&book=約&chapter=3&verse=16
```

---

## 技術實現

### 數據獲取流程

1. **檢測 Bible 查詢** (`detectBibleQuery`)
   - 識別經文引用格式
   - 解析書卷、章節、節數

2. **並行獲取數據** (`Promise.allSettled`)
   - 經文內容 (`getBibleVerse`)
   - 註釋 (`getCommentary`)
   - 原文分析 (`getWordAnalysis`)

3. **格式化上下文** (`format*Context`)
   - 將數據格式化為 AI 可讀的上下文

4. **增強系統提示** (`bibleSystemPrompt`)
   - 明確要求 AI 包含所有必需元素
   - 提供格式指導

5. **AI 生成回答**
   - AI 根據上下文和提示生成完整回答
   - 包含交叉引用、歷史背景、反思問題

---

## 錯誤處理

- ✅ 使用 `Promise.allSettled` 確保部分失敗不影響整體
- ✅ 如果註釋或原文分析獲取失敗，仍會返回經文內容
- ✅ 錯誤會記錄到控制台，但不影響用戶體驗

---

## 未來增強

- [ ] 添加更多註釋書支援
- [ ] 實現自動交叉引用搜索（通過關鍵字搜索）
- [ ] 添加歷史背景數據庫
- [ ] 支援多版本經文對照
- [ ] 添加主題查經功能
