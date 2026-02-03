# Bible Mode + Supermind 504 错误解决方案

## 🔍 问题分析总结

### 关键发现

1. **FHL API 返回空数据**
   - 日志显示：`recordCount: 0`
   - 但直接测试 FHL API (`bid=41&chap=4`) 返回正常（25 条记录）
   - **可能原因**：过滤逻辑问题，或 `getBibleChapter` 返回格式不对

2. **超时时间不足**
   - 当前超时：70 秒
   - 实际超时：71.4 秒
   - **问题**：即使没有 Bible context，`supermind-agent-v1` 仍需要 > 70 秒

3. **组合问题**
   - Bible Mode + Supermind + FHL API 空数据 = 超时
   - 没有 Bible context 时，AI 需要更多时间从知识库搜索

## 💡 解决方案（按优先级）

### 方案 1: 修复 FHL API 数据获取 ⭐⭐⭐⭐⭐（最高优先级）

**问题定位**：
- `getBibleChapter` 可能返回的数据格式与预期不符
- 过滤逻辑可能有问题（`record_count` vs `recordCount`）

**实施步骤**：

1. **检查数据格式**
   ```typescript
   console.log(`[${Date.now() - startTime}ms] Chapter data structure:`, {
     record_count: chapterData?.record_count,
     recordCount: chapterData?.recordCount,
     recordLength: chapterData?.record?.length,
     hasRecord: !!chapterData?.record
   });
   ```

2. **修复过滤逻辑**
   ```typescript
   if (chapterData?.record && chapterData.record.length > 0) {
     const filtered = chapterData.record.filter((v: any) => {
       const verseNum = parseInt(v.sec);
       return verseNum >= startVerse && verseNum <= endVerse;
     });
     
     verseData = {
       ...chapterData,
       record: filtered,
       record_count: filtered.length  // 确保使用正确的字段名
     };
   } else {
     // Fallback: 尝试直接获取单个 verse
     console.log(`[${Date.now() - startTime}ms] Chapter data empty, trying single verse fetch`);
     verseData = await getBibleVerse(bookId, bibleQuery.chapter, startVerse.toString(), "unv", true, false);
   }
   ```

3. **添加重试机制**
   ```typescript
   let verseData;
   let retries = 0;
   const MAX_RETRIES = 2;
   
   while (retries <= MAX_RETRIES) {
     try {
       const chapterData = await getBibleChapter(bookId, bibleQuery.chapter, "unv", false);
       if (chapterData?.record && chapterData.record.length > 0) {
         // 成功获取数据，进行过滤
         break;
       }
       retries++;
       if (retries <= MAX_RETRIES) {
         await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒
       }
     } catch (error) {
       retries++;
     }
   }
   ```

**优点**：
- ✅ 解决根本问题（确保获取 Bible context）
- ✅ 提供数据给 AI，减少处理时间
- ✅ 提高可靠性

**缺点**：
- ❌ 需要调试和测试
- ❌ 可能增加代码复杂度

---

### 方案 2: 增加超时时间到 90-100 秒 ⭐⭐⭐⭐

**实施**：
```typescript
// 根据模型和模式动态调整超时
const getApiTimeout = (model: string, bibleMode: boolean) => {
  if (model === "supermind-agent-v1") {
    return bibleMode ? 100000 : 70000; // Bible mode: 100s, normal: 70s
  }
  return 25000; // grok-4-fast: 25s
};

const API_TIMEOUT = getApiTimeout(selectedModel, bibleModeEnabled);
```

**优点**：
- ✅ 简单直接
- ✅ 给 supermind 模型足够时间
- ✅ 根据场景动态调整

**缺点**：
- ❌ 可能超过网关超时限制（通常 60-90 秒）
- ❌ 用户体验差（等待时间长）
- ❌ 治标不治本

**适用场景**：
- 配合方案 1 使用
- 临时解决方案

---

### 方案 3: FHL API 失败时的降级处理 ⭐⭐⭐⭐

**实施**：
```typescript
if (bibleModeEnabled && (!verseData || verseData.record_count === 0)) {
  // FHL API 失败，提供用户选择
  if (selectedModel === "supermind-agent-v1") {
    // 建议切换到更快的模型
    console.log(`[${Date.now() - startTime}ms] FHL API failed, supermind may timeout. Consider using grok-4-fast.`);
    // 或者自动切换（需要用户确认）
    // selectedModel = "grok-4-fast";
    // useStreaming = true;
  }
  
  // 或者返回友好的错误信息
  if (!verseData || verseData.record_count === 0) {
    return new Response(
      JSON.stringify({
        error: "Unable to fetch Bible data. Please try again or use grok-4-fast model for faster response.",
        suggestion: "Try using grok-4-fast model or check your Bible reference format."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

**优点**：
- ✅ 避免超时
- ✅ 提供清晰的错误信息
- ✅ 引导用户使用更合适的模型

**缺点**：
- ❌ 可能中断用户体验
- ❌ 不解决 FHL API 的根本问题

**适用场景**：
- 作为 fallback 机制
- 配合方案 1 使用

---

### 方案 4: 优化系统提示（减少处理时间）⭐⭐⭐

**实施**：
```typescript
// 简化 Bible Mode 的系统提示
const systemMessage = bibleContext ? {
  role: "system",
  content: `You are a Bible study assistant. Use the provided Bible context to answer questions.

Bible Context:
${bibleContext}

Instructions:
1. Answer based on the Bible context provided
2. If context is missing, use your knowledge base
3. Keep responses concise and focused
4. Cite verse references when possible`
} : null;
```

**优点**：
- ✅ 减少 AI 处理时间
- ✅ 简化指令，提高效率
- ✅ 不需要改变架构

**缺点**：
- ❌ 可能影响回答质量
- ❌ 需要测试和调整

**适用场景**：
- 配合其他方案使用
- 长期优化

---

### 方案 5: 异步处理 Bible Context（长期方案）⭐⭐

**实施**：
1. 立即开始 AI API 调用（不等待 Bible context）
2. 后台获取 Bible context
3. 如果 Bible context 到达，更新响应

**优点**：
- ✅ 快速响应
- ✅ 避免超时
- ✅ 用户体验好

**缺点**：
- ❌ 实现复杂
- ❌ 需要重构
- ❌ 可能不符合用户期望

**适用场景**：
- 长期优化方案
- 需要架构重构

---

## 🎯 推荐实施顺序

### 立即实施（今天）

1. **方案 1：修复 FHL API 数据获取**
   - 添加详细的日志
   - 修复过滤逻辑
   - 添加 fallback 机制

2. **方案 2：增加超时到 90 秒**
   - 动态调整超时时间
   - 根据模型和模式调整

### 短期优化（本周）

3. **方案 3：FHL API 失败时的降级**
   - 添加友好的错误信息
   - 提供模型切换建议

4. **方案 4：优化系统提示**
   - 简化 Bible Mode 提示
   - 减少不必要的指令

### 长期优化（未来）

5. **方案 5：异步处理**
   - 架构重构
   - 实现流式更新

---

## 📊 方案对比

| 方案 | 实施难度 | 效果 | 用户体验 | 优先级 |
|------|---------|------|---------|--------|
| 1. 修复 FHL API | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 优秀 | ⭐⭐⭐⭐⭐ 优秀 | ⭐⭐⭐⭐⭐ |
| 2. 增加超时 | ⭐ 简单 | ⭐⭐⭐ 良好 | ⭐⭐ 中等 | ⭐⭐⭐⭐ |
| 3. 降级处理 | ⭐⭐ 简单 | ⭐⭐⭐ 良好 | ⭐⭐⭐ 良好 | ⭐⭐⭐⭐ |
| 4. 优化提示 | ⭐⭐ 简单 | ⭐⭐⭐ 良好 | ⭐⭐⭐ 良好 | ⭐⭐⭐ |
| 5. 异步处理 | ⭐⭐⭐⭐⭐ 复杂 | ⭐⭐⭐⭐⭐ 优秀 | ⭐⭐⭐⭐⭐ 优秀 | ⭐⭐ |

---

## 🔧 具体代码修改建议

### 1. 修复 FHL API 数据获取

```typescript
// 在 app/api/chat/route.ts 中修改

if (bibleQuery.verse && bibleQuery.verse.includes('-')) {
  console.log(`[${Date.now() - startTime}ms] Verse range detected, fetching entire chapter`);
  
  const chapterData = await withTimeout(
    getBibleChapter(bookId, bibleQuery.chapter, "unv", false),
    BIBLE_API_TIMEOUT,
    "Chapter fetch timed out"
  );
  
  // 添加详细的日志
  console.log(`[${Date.now() - startTime}ms] Chapter data received:`, {
    record_count: chapterData?.record_count,
    recordCount: chapterData?.recordCount,
    recordLength: chapterData?.record?.length,
    hasRecord: !!chapterData?.record,
    firstVerse: chapterData?.record?.[0]?.sec
  });
  
  const [startVerse, endVerse] = bibleQuery.verse.split('-').map(v => parseInt(v.trim()));
  
  if (chapterData?.record && chapterData.record.length > 0) {
    const filtered = chapterData.record.filter((v: any) => {
      const verseNum = parseInt(v.sec);
      return verseNum >= startVerse && verseNum <= endVerse;
    });
    
    verseData = {
      ...chapterData,
      record: filtered,
      record_count: filtered.length  // 确保字段名正确
    };
    
    console.log(`[${Date.now() - startTime}ms] Filtered verses: ${filtered.length} verses (${startVerse}-${endVerse})`);
  } else {
    // Fallback: 尝试获取单个 verse
    console.log(`[${Date.now() - startTime}ms] Chapter data empty, trying single verse fetch`);
    verseData = await withTimeout(
      getBibleVerse(bookId, bibleQuery.chapter, startVerse.toString(), "unv", true, false),
      BIBLE_API_TIMEOUT,
      "Verse fetch timed out"
    );
  }
}
```

### 2. 动态超时时间

```typescript
// 在 app/api/chat/route.ts 顶部添加

const getApiTimeout = (model: string, bibleMode: boolean): number => {
  if (model === "supermind-agent-v1") {
    return bibleMode ? 100000 : 70000; // Bible mode: 100s, normal: 70s
  }
  return 25000; // grok-4-fast: 25s
};

// 在 POST 函数中使用
const API_TIMEOUT = getApiTimeout(selectedModel, bibleModeEnabled);
```

### 3. FHL API 失败时的处理

```typescript
// 在获取 verseData 后添加检查

if (bibleModeEnabled && (!verseData || (verseData.record_count === 0 && verseData.recordCount === 0))) {
  console.warn(`[${Date.now() - startTime}ms] FHL API returned empty data for Bible query`);
  
  if (selectedModel === "supermind-agent-v1") {
    // 可以选择返回错误或继续（让 AI 使用知识库）
    console.log(`[${Date.now() - startTime}ms] Continuing without Bible context - AI will use knowledge base`);
    // 或者返回错误：
    // return new Response(
    //   JSON.stringify({
    //     error: "Unable to fetch Bible data. Please try again or use grok-4-fast model.",
    //     suggestion: "The supermind model may timeout without Bible context. Consider using grok-4-fast for faster response."
    //   }),
    //   { status: 500 }
    // );
  }
}
```

---

## 📝 测试计划

1. **测试 FHL API 数据获取**
   - 测试 verse range: "馬可福音4:30-41"
   - 验证 `record_count` 是否正确
   - 检查过滤逻辑

2. **测试超时时间**
   - 使用 supermind + Bible mode
   - 验证 90-100 秒超时是否足够
   - 检查网关是否支持

3. **测试降级机制**
   - 模拟 FHL API 失败
   - 验证错误信息
   - 检查用户体验

---

## 🎯 预期效果

实施后：
- ✅ FHL API 正确返回 Bible context
- ✅ 超时时间足够（90-100 秒）
- ✅ 504 错误大幅减少或消失
- ✅ 用户体验改善（有实际数据，响应更快）
