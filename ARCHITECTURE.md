# Arkchat Bible Study - Architecture 架構說明

## 當前實現 (Current Implementation)

### 方式：直接調用 FHL API

```
User → Next.js Chat API → FHL Bible API (https://bible.fhl.net/json/)
```

**優點**：
- ✅ 簡單直接，無需額外進程
- ✅ 快速響應
- ✅ 易於維護

**功能**：
- 經文查詢 (`qb.php`)
- 章節閱讀
- 關鍵字搜尋 (`search.php`)
- 字彙分析 (`qp.php`)

**代碼位置**：
- `lib/fhl-api.ts` - FHL API 客戶端
- `app/api/bible/route.ts` - Bible API 路由
- `app/api/chat/route.ts` - 集成了 Bible 查詢檢測

---

## 替代方案 (Alternative Approach)

### 方式：通過 fhl-bible MCP Server

```
User → Next.js Chat API → fhl-bible MCP Server (HTTP) → FHL Bible API
```

**優點**：
- ✅ 可使用 MCP Server 的 27 個工具函數
- ✅ 支援更多功能：Strong's、註釋、次經、使徒教父、文章搜尋
- ✅ 統一的 MCP 協議接口

**需要**：
- 啟動 MCP Server HTTP 服務（端口 8081）
- 創建 MCP 客戶端
- 更新 API 路由

**MCP Server 功能**：
- 27 個工具函數（Tools）
- 7 種資源類型（Resources）
- 19 個提示範本（Prompts）

---

## 比較

| 特性 | 直接 FHL API | MCP Server |
|------|-------------|------------|
| 實現複雜度 | ⭐ 簡單 | ⭐⭐⭐ 複雜 |
| 功能完整性 | ⭐⭐ 基本功能 | ⭐⭐⭐⭐⭐ 完整功能 |
| 性能 | ⭐⭐⭐⭐⭐ 快速 | ⭐⭐⭐⭐ 較快 |
| 維護成本 | ⭐⭐ 低 | ⭐⭐⭐ 中等 |
| 擴展性 | ⭐⭐ 有限 | ⭐⭐⭐⭐⭐ 高 |

---

## 建議

### 使用直接 FHL API 如果：
- ✅ 只需要基本的經文查詢和搜尋功能
- ✅ 希望保持簡單的架構
- ✅ 不需要 Strong's、註釋等高級功能

### 使用 MCP Server 如果：
- ✅ 需要完整的 Bible 研究功能
- ✅ 需要 Strong's 原文字典
- ✅ 需要註釋書和主題查經
- ✅ 需要次經和使徒教父文獻
- ✅ 需要文章搜尋功能

---

## 如何切換到 MCP Server 方式

如果需要切換，可以：

1. **啟動 MCP Server**：
```bash
cd FHL_MCP_SERVER
source venv/bin/activate
python -m fhl_bible_mcp.http_server
# 或設置環境變量 TRANSPORT=http PORT=8081
```

2. **創建 MCP 客戶端**：
```typescript
// lib/mcp-client.ts
// 調用 MCP Server 的 HTTP 接口
```

3. **更新 API 路由**：
```typescript
// app/api/chat/route.ts
// 使用 MCP 客戶端代替直接 FHL API 調用
```

---

## 當前狀態

✅ **已實現**：直接調用 FHL API 方式
- 經文查詢 ✅
- 章節閱讀 ✅
- 關鍵字搜尋 ✅
- AI 增強回答 ✅

❌ **未實現**：MCP Server 方式
- 需要時可以添加
