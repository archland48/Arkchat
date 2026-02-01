# 504 超时错误修复

## 问题描述

部署的应用 `https://arkchat.ai-builders.space` 出现 504 Gateway Timeout 错误。

## 问题原因

1. **API 请求超时**：Bible API 调用过多且串行执行，导致总时间超过平台限制（通常 30-60 秒）
2. **没有超时设置**：OpenAI 客户端和 Bible API 调用都没有设置超时限制
3. **串行执行**：多个 Bible API 调用按顺序执行，而不是并行

## 解决方案

### 1. 添加超时配置

```typescript
// API timeout configuration (in milliseconds)
const API_TIMEOUT = 25000; // 25 seconds for AI Builder API
const BIBLE_API_TIMEOUT = 8000; // 8 seconds for Bible API calls

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}
```

### 2. 优化 OpenAI 客户端

```typescript
const openai = new OpenAI({
  baseURL: "https://space.ai-builders.com/backend/v1",
  apiKey: process.env.AI_BUILDER_TOKEN,
  defaultHeaders: {
    "Authorization": `Bearer ${process.env.AI_BUILDER_TOKEN}`,
  },
  timeout: API_TIMEOUT, // 添加超时设置
});
```

### 3. 并行化 Bible API 调用

**之前（串行）**：
```typescript
const wordData = await getWordAnalysis(...);
const commentaryData = await getCommentary(...);
```

**现在（并行）**：
```typescript
const [wordData, commentaryData] = await Promise.allSettled([
  withTimeout(getWordAnalysis(...), BIBLE_API_TIMEOUT, "Word analysis timed out"),
  withTimeout(getCommentary(...), BIBLE_API_TIMEOUT, "Commentary fetch timed out")
]);
```

### 4. 为所有 Bible API 调用添加超时

- `searchBible()` - 8 秒超时
- `getBibleVerse()` - 8 秒超时
- `getBibleChapter()` - 8 秒超时
- `getWordAnalysis()` - 8 秒超时
- `getCommentary()` - 8 秒超时
- `getTopicStudy()` - 8 秒超时
- `searchCommentary()` - 8 秒超时
- `lookupStrongs()` - 8 秒超时

### 5. 改进错误处理

```typescript
catch (error: any) {
  const isTimeout = errorMessage.includes("timed out");
  const statusCode = isTimeout ? 504 : (error.status || 500);
  
  return new Response(
    JSON.stringify({
      error: isTimeout 
        ? "Request timed out. Please try again with a simpler query or disable Bible mode."
        : errorMessage,
    }),
    { status: statusCode }
  );
}
```

## 优化效果

1. **减少总执行时间**：通过并行化，Bible API 调用时间从串行的 30+ 秒减少到并行的 8-10 秒
2. **防止无限等待**：所有 API 调用都有超时保护，避免长时间挂起
3. **更好的错误提示**：超时错误会返回明确的错误信息，指导用户操作

## 测试建议

1. **简单查询**：测试普通对话（非 Bible 查询）
2. **经文查询**：测试 "約翰福音 3:16"
3. **章节查询**：测试 "創世記 1"
4. **关键词搜索**：测试 "search for 愛"
5. **Bible Mode**：测试启用 Bible Mode 的查询

## 后续优化建议

如果仍然出现超时问题，可以考虑：

1. **减少 Bible API 调用数量**：只获取最必要的数据
2. **增加缓存**：缓存常用的 Bible 查询结果
3. **异步处理**：将复杂的 Bible 查询改为后台任务
4. **简化系统提示**：减少 system message 的长度

## 部署

代码已更新，需要重新部署：

```bash
git add .
git commit -m "Fix 504 timeout: Add timeout config and parallelize Bible API calls"
git push origin main
```

部署平台会自动拉取最新代码并重新部署。
