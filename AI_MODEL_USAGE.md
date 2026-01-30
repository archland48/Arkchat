# AI Model 使用說明

## 使用的 AI Model

格式化後的 Bible 數據提供給 AI 時，使用的是 **AI Builder 的模型**，通過 OpenAI SDK 調用。

### 支持的模型

1. **grok-4-fast** (預設模型)
   - 快速響應
   - 支援流式輸出 (streaming)
   - 適合一般對話和 Bible study

2. **supermind-agent-v1**
   - 多工具代理模型
   - 支援網路搜索等功能
   - **不支援流式輸出**（會模擬流式）

### 模型選擇

用戶可以在 UI 中選擇模型：
- 通過 `ModelSelector` 組件選擇
- 每個對話可以選擇不同的模型
- 預設使用 `grok-4-fast`

---

## 調用流程

### 1. 模型選擇

**前端** (`components/ChatArea.tsx`):
```typescript
const selectedModel = conversation.model || "grok-4-fast";
// 發送到 API
body: JSON.stringify({
  model: selectedModel,  // "grok-4-fast" 或 "supermind-agent-v1"
  messages: updatedMessages
})
```

### 2. API 接收和驗證

**後端** (`app/api/chat/route.ts`):
```typescript
const { messages, model = "grok-4-fast" } = await req.json();

// 驗證模型
const validModels = ["grok-4-fast", "supermind-agent-v1"];
const selectedModel = validModels.includes(model) 
  ? model 
  : "grok-4-fast";  // 預設 fallback
```

### 3. OpenAI SDK 配置

```typescript
const openai = new OpenAI({
  baseURL: "https://space.ai-builders.com/backend/v1",  // AI Builder API
  apiKey: process.env.AI_BUILDER_TOKEN,
  defaultHeaders: {
    "Authorization": `Bearer ${process.env.AI_BUILDER_TOKEN}`,
  },
});
```

### 4. 實際調用

```typescript
const completion = await openai.chat.completions.create({
  model: selectedModel,           // "grok-4-fast" 或 "supermind-agent-v1"
  messages: enhancedMessages,     // 包含 Bible 上下文的消息
  stream: useStreaming,           // grok-4-fast: true, supermind-agent-v1: false
  temperature: 0.7,
});
```

---

## Bible 數據如何提供給 AI

### 數據流程

```
1. 用戶查詢: "約翰福音 3:16"
   ↓
2. 檢測 Bible 查詢
   ↓
3. 調用 FHL API 獲取數據:
   - 經文內容
   - 註釋
   - 原文分析
   ↓
4. 格式化數據為上下文:
   bibleContext = `
   [Bible Reference - 和合本]
   約翰福音 3:16
   神愛世人...
   
   [Bible Commentary]
   [CBOL註釋] ...
   
   [Original Language Analysis]
   Word: 愛, Strong's: G25 ...
   `
   ↓
5. 創建增強系統消息:
   systemMessage = {
     role: "system",
     content: `${bibleSystemPrompt}\n\n${bibleContext}`
   }
   ↓
6. 發送給 AI Model (grok-4-fast 或 supermind-agent-v1):
   messages = [
     systemMessage,      // 包含 Bible 上下文和提示詞
     ...userMessages     // 用戶的對話歷史
   ]
   ↓
7. AI Model 生成回答:
   - 使用提供的 Bible 數據
   - 遵循系統提示詞的要求
   - 包含：原文解釋、註釋、交叉引用、歷史背景、反思提示
```

---

## 模型特性

### grok-4-fast

**優點**:
- ✅ 快速響應
- ✅ 支援流式輸出（實時顯示）
- ✅ 適合 Bible study 任務

**使用場景**:
- 一般 Bible 查詢
- 經文解釋
- 快速回答

**流式輸出**:
```typescript
if (useStreaming) {
  // 真實流式輸出
  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || "";
    // 實時發送給前端
  }
}
```

### supermind-agent-v1

**優點**:
- ✅ 多工具代理能力
- ✅ 支援網路搜索
- ✅ 更強大的推理能力

**限制**:
- ❌ 不支援流式輸出
- ⚠️ 使用模擬流式（分塊發送）

**模擬流式**:
```typescript
if (!useStreaming) {
  // 獲取完整內容後分塊發送
  const content = completion.choices[0]?.message?.content || "";
  // 模擬流式：每 10 字符發送一次
  const chunkSize = 10;
  // ...
}
```

---

## 系統提示詞

當檢測到 Bible 查詢時，會使用增強系統提示詞：

```typescript
const bibleSystemPrompt = `You are an expert Bible study assistant...
[包含 5 個必需元素的詳細要求]
`;
```

**提示詞內容**:
1. 原文解釋要求
2. 經文註釋要求（必須註明出處）
3. 交叉引用要求（5-10 個相關經文）
4. 歷史背景要求
5. 反思提示要求（2-3 個問題）

---

## 完整示例

### 用戶查詢: "約翰福音 3:16"

**1. 前端發送**:
```typescript
POST /api/chat
{
  "model": "grok-4-fast",  // 用戶選擇的模型
  "messages": [
    { "role": "user", "content": "約翰福音 3:16" }
  ]
}
```

**2. 後端處理**:
```typescript
// 檢測查詢
const bibleQuery = detectBibleQuery("約翰福音 3:16");
// → { type: "verse", book: "約翰福音", chapter: 3, verse: "16" }

// 獲取數據
const verseData = await getBibleVerse(43, 3, "16");
const commentaryData = await getCommentary(43, 3, 16);
const wordData = await getWordAnalysis(43, 3, 16);

// 格式化
const bibleContext = formatBibleContext(verseData) +
                     formatCommentaryContext(commentaryData) +
                     formatWordAnalysisContext(wordData);

// 創建系統消息
const systemMessage = {
  role: "system",
  content: `${bibleSystemPrompt}\n\n${bibleContext}`
};

// 發送給 AI
const completion = await openai.chat.completions.create({
  model: "grok-4-fast",  // 使用用戶選擇的模型
  messages: [systemMessage, ...messages],
  stream: true,  // grok-4-fast 支援流式
  temperature: 0.7,
});
```

**3. AI 生成回答**:
- 使用 `grok-4-fast` 模型
- 基於提供的 Bible 數據
- 遵循系統提示詞要求
- 流式返回給前端

---

## 模型選擇建議

### 使用 grok-4-fast 如果：
- ✅ 需要快速響應
- ✅ 一般 Bible study 查詢
- ✅ 需要流式輸出體驗

### 使用 supermind-agent-v1 如果：
- ✅ 需要更深入的推理
- ✅ 需要網路搜索補充信息
- ✅ 複雜的 Bible 研究問題

---

## API 端點

**AI Builder API**:
- Base URL: `https://space.ai-builders.com/backend/v1`
- 認證: Bearer Token (`AI_BUILDER_TOKEN`)
- 模型: `grok-4-fast`, `supermind-agent-v1`

**FHL Bible API**:
- Base URL: `https://bible.fhl.net/json/`
- 無需認證
- 公開 API

---

## 總結

**使用的 AI Model**:
- **預設**: `grok-4-fast`
- **可選**: `supermind-agent-v1`
- **API**: AI Builder (`https://space.ai-builders.com/backend/v1`)

**Bible 數據提供方式**:
1. 通過系統消息 (`role: "system"`)
2. 包含格式化的 Bible 上下文
3. 加上詳細的系統提示詞
4. AI 根據這些數據生成回答

**模型選擇**:
- 用戶可以在 UI 中選擇
- 每個對話可以選擇不同模型
- 預設使用 `grok-4-fast`
