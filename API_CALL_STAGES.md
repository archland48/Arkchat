# API 调用阶段总结

## 概述

当前系统在处理 **search 查询**时，会按优先级顺序调用以下 API：

---

## API 调用阶段（按优先级）

### Priority 1: Search Bible Verses (主要经文搜索)

**API**: `searchBible(keyword, "unv", 15, false)`

**功能**: 
- 搜索与关键字相关的经文
- 返回最多 15 条经文

**输出格式**: 
```
[Bible Search Results - Found X results]
- 经文列表...
```

**对应 study_topic_deep Step**: Step 1 - 搜尋相關經文

---

### Priority 2: study_topic_deep - Step 2 (主题查经资料)

**API**: `getTopicStudy(keyword, "all", false, false)`

**功能**:
- 获取主题查经资料（Torrey & Naves）
- 包含英文和中文版本

**输出格式**:
```
[study_topic_deep - Step 2: Topic Study Resources - 主題查經資料 (Torrey & Naves)]
[Torrey (中文)] 主题名称
内容...

[Naves (中文)] 主题名称
内容...
```

**对应 study_topic_deep Step**: Step 2 - 查詢主題查經資料

---

### Priority 2 (Step 4): 兩約教導比較

**实现方式**: 从 Priority 1 的 `searchBible` 结果中过滤

**功能**:
- 过滤旧约经文（book IDs 1-39）
- 过滤新约经文（book IDs 40-66）
- 比较两约教导

**输出格式**:
```
[study_topic_deep - Step 4: Two Testament Comparison - 兩約教導比較]

## 舊約教導 (Old Testament Teaching):
Found X relevant verses:
- 经文列表...

## 新約教導 (New Testament Teaching):
Found X relevant verses:
- 经文列表...

**分析要求**: 比較兩約的異同，說明救恩歷史發展脈絡，以及主題在兩約中的發展。
```

**对应 study_topic_deep Step**: Step 4 - 比較兩約教導

---

### Priority 3: Search Commentary (注释搜索)

**API**: `searchCommentary(keyword, undefined, false)`

**功能**:
- 在注释书中搜索关键字
- 获取注释家见解

**输出格式**:
```
[Commentary Search Results - 註釋搜尋結果]
[注释名称] 书卷 章:节
标题...
内容预览...
```

**对应 study_topic_deep Step**: Step 3 - 搜尋註釋討論

---

### Priority 4: Search by Strong's Number (原文研究)

**API**: `searchByStrongs(number, testament, 10, false)`

**功能**:
- 通过 Strong's Number 搜索经文
- 补充原文研究数据
- 支持常见关键字映射（如：愛 → G26/H157）

**关键字映射**:
```typescript
{
  "愛": [{ number: "G26", testament: "NT" }, { number: "H157", testament: "OT" }],
  "love": [{ number: "G26", testament: "NT" }, { number: "H157", testament: "OT" }],
  "信心": [{ number: "G4102", testament: "NT" }],
  "faith": [{ number: "G4102", testament: "NT" }],
  "禱告": [{ number: "G4336", testament: "NT" }, { number: "H6419", testament: "OT" }],
  // ... 更多映射
}
```

**输出格式**:
```
[Original Language Study - Strong's Number Search - 原文研究 (Strong's Number 搜尋)]

Strong's G26 (New Testament - 新約):
Found X occurrences

- 经文列表...

Strong's H157 (Old Testament - 舊約):
Found X occurrences

- 经文列表...
```

**对应 study_topic_deep Step**: Step 5 - 研究原文洞察

---

### Priority 5: Advanced Cross-Reference Analysis (三层次交叉引用分析)

**API**: `searchBible()` (多次调用)

**功能**:
- 三层次交叉引用分析
- Layer 1: 直接引用关系（从搜索结果提取关键字）
- Layer 2: 主题相关经文（识别主题）
- Layer 3: 对照经文（识别对照主题）

**实现步骤**:
1. 从 Priority 1 的搜索结果中提取关键字
2. 从查询关键字中识别主题
3. 识别对照主题
4. 分别搜索相关经文

**输出格式**:
```
[Advanced Cross-Reference Analysis - 進階交叉引用分析 (三層次)]

## Layer 1: 直接引用關係 (Direct References)

關鍵字: 关键字1
- 经文列表...

關鍵字: 关键字2
- 经文列表...

## Layer 2: 主題相關經文 (Thematic Connections)

主題: 主题1
- 经文列表...

主題: 主题2
- 经文列表...

## Layer 3: 對照經文 (Contrasting/Complementary Verses)

對照主題: 对照主题1
- 经文列表...

對照主題: 对照主题2
- 经文列表...
```

**对应功能**: advanced_cross_reference - 补充交叉引用

---

## 完整调用流程

### 查询示例：`什麼是愛？`

```
用户输入: "什麼是愛？"
  ↓
[1] detectBibleQuery() → { type: "search", keyword: "什麼是愛？" }
  ↓
[2] 处理 search 查询
  ↓
[3] 顺序调用 API:
  ├─ [3.1] Priority 1: searchBible("什麼是愛？", "unv", 15, false)
  │   └─ 返回 15 条经文
  │   └─ study_topic_deep Step 1 ✅
  │
  ├─ [3.2] Priority 2: getTopicStudy("什麼是愛？", "all", false, false)
  │   └─ 返回主题查经资料（Torrey & Naves）
  │   └─ study_topic_deep Step 2 ✅
  │
  ├─ [3.3] Priority 2 (Step 4): 兩約教導比較
  │   ├─ 从 [3.1] 结果过滤旧约 (book IDs 1-39)
  │   └─ 从 [3.1] 结果过滤新约 (book IDs 40-66)
  │   └─ study_topic_deep Step 4 ✅
  │
  ├─ [3.4] Priority 3: searchCommentary("什麼是愛？", undefined, false)
  │   └─ 返回注释搜索结果
  │   └─ study_topic_deep Step 3 ✅
  │
  ├─ [3.5] Priority 4: searchByStrongs()
  │   ├─ searchByStrongs("G26", "NT", 10, false) → 新约经文
  │   └─ searchByStrongs("H157", "OT", 10, false) → 旧约经文
  │   └─ study_topic_deep Step 5 ✅
  │
  └─ [3.6] Priority 5: advanced_cross_reference
      ├─ Layer 1: 从 [3.1] 提取关键字 → searchBible() × 3
      ├─ Layer 2: 识别主题「愛」 → searchBible() × 2
      └─ Layer 3: 识别对照主题「恨」 → searchBible() × 2
      └─ 补充交叉引用 ✅
  ↓
[4] 格式化所有结果并添加到 bibleContext
  ↓
[5] AI 生成回答（使用 study_topic_deep prompt 指导）
  └─ study_topic_deep Step 6: 綜合分析與應用 ✅
```

---

## API 调用统计

### 直接 API 调用

1. **searchBible**: 
   - Priority 1: 1 次（主要搜索）
   - Priority 5: 最多 7 次（Layer 1: 3次 + Layer 2: 2次 + Layer 3: 2次）
   - **总计**: 最多 8 次

2. **getTopicStudy**: 
   - Priority 2: 1 次
   - **总计**: 1 次

3. **searchCommentary**: 
   - Priority 3: 1 次
   - **总计**: 1 次

4. **searchByStrongs**: 
   - Priority 4: 最多 2 次（根据关键字映射）
   - **总计**: 最多 2 次

### 总 API 调用次数

- **最少**: 4 次（如果没有 Strong's 映射和 advanced_cross_reference）
- **最多**: 12 次（完整流程）

---

## 与 study_topic_deep 的对应关系

| study_topic_deep Step | API 调用阶段 | 状态 |
|----------------------|-------------|------|
| Step 1: 搜尋相關經文 | Priority 1: searchBible | ✅ |
| Step 2: 查詢主題查經資料 | Priority 2: getTopicStudy | ✅ |
| Step 3: 搜尋註釋討論 | Priority 3: searchCommentary | ✅ |
| Step 4: 比較兩約教導 | Priority 2 (Step 4): 兩約過濾 | ✅ |
| Step 5: 研究原文洞察 | Priority 4: searchByStrongs | ✅ |
| Step 6: 綜合分析與應用 | AI 生成（系统提示词） | ✅ |

**额外功能**:
- Priority 5: advanced_cross_reference（补充交叉引用）

---

## 总结

✅ **当前实现**:
- 5 个优先级阶段
- 覆盖 study_topic_deep 的所有 6 个步骤
- 额外提供 advanced_cross_reference 功能
- 最多 12 次 API 调用（完整流程）

✅ **优势**:
- 全面的数据收集
- 多层次分析
- 原文研究支持
- 交叉引用补充
