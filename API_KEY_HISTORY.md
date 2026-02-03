# API Key 加载方式历史

## 📜 历史演变

### 阶段 1: 最初实现（硬编码）

**时间**: 项目初始创建时

**实现方式**:
```typescript
const openai = new OpenAI({
  baseURL: "https://space.ai-builders.com/backend/v1",
  apiKey: "sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587", // 硬编码
  defaultHeaders: {
    "Authorization": `Bearer sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587`,
  },
  timeout: API_TIMEOUT,
});
```

**特点**:
- ❌ API key 直接硬编码在源代码中
- ❌ Token 会被提交到 Git 仓库
- ❌ 安全性低
- ✅ 简单直接，不需要配置

### 阶段 2: 移除硬编码，只使用环境变量（commit 292585f）

**时间**: 当你要求"do not hardcode this key in the source code; load it from a .env file"

**实现方式**:
```typescript
const openai = new OpenAI({
  baseURL: "https://space.ai-builders.com/backend/v1",
  apiKey: process.env.AI_BUILDER_TOKEN, // 只从环境变量加载
  defaultHeaders: {
    "Authorization": `Bearer ${process.env.AI_BUILDER_TOKEN}`,
  },
  timeout: API_TIMEOUT,
});

export async function POST(req: NextRequest) {
  const apiToken = process.env.AI_BUILDER_TOKEN;
  if (!apiToken) {
    return new Response(
      JSON.stringify({ error: "API token not configured" }),
      { status: 500 }
    );
  }
  // ...
}
```

**特点**:
- ✅ 只从 `.env.local` 文件加载
- ✅ 如果环境变量不存在，返回错误
- ✅ 没有硬编码 fallback
- ✅ 更安全

**问题**:
- ⚠️ 如果环境变量未设置，应用无法工作
- ⚠️ 部署时需要确保环境变量正确配置

### 阶段 3: 当前实现（硬编码 + 环境变量 fallback）

**时间**: 现在（commit 1c5badc）

**实现方式**:
```typescript
// Hardcoded API key (also load from .env.local if available)
const HARDCODED_API_KEY = "sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587";
const API_KEY = process.env.AI_BUILDER_TOKEN || HARDCODED_API_KEY;

const openai = new OpenAI({
  baseURL: "https://space.ai-builders.com/backend/v1",
  apiKey: API_KEY,
  defaultHeaders: {
    "Authorization": `Bearer ${API_KEY}`,
  },
  timeout: API_TIMEOUT,
});

export async function POST(req: NextRequest) {
  const apiToken = process.env.AI_BUILDER_TOKEN || HARDCODED_API_KEY;
  const tokenSource = process.env.AI_BUILDER_TOKEN ? "env" : "hardcoded";
  // ...
}
```

**特点**:
- ✅ 优先使用 `.env.local` 中的环境变量
- ✅ 如果环境变量不存在，使用硬编码的 fallback
- ✅ 确保应用始终可以工作
- ⚠️ 硬编码的 token 在源代码中（安全性降低）

## 🔄 对比总结

| 阶段 | 硬编码 | 环境变量 | Fallback | 安全性 | 可用性 |
|------|--------|----------|----------|--------|--------|
| **阶段 1** | ✅ 是 | ❌ 否 | N/A | ❌ 低 | ✅ 高 |
| **阶段 2** | ❌ 否 | ✅ 是 | ❌ 否 | ✅ 高 | ⚠️ 需配置 |
| **阶段 3** | ✅ 是 | ✅ 是 | ✅ 是 | ⚠️ 中 | ✅ 高 |

## 📝 回答你的问题

**Q: 在你使用"do not hardcode this key in the source code; load it from a .env file"之前，是如何？**

**A: 阶段 1 - 完全硬编码**

在你说"do not hardcode"之前，代码是**完全硬编码**的：
- API key 直接写在源代码中
- 没有环境变量支持
- 没有 fallback 机制
- 如果环境变量不存在，**不会使用硬编码**（因为根本没有环境变量支持）

**Q: 也是如果环境变量不存在，使用硬编码的 API key？**

**A: 不是**

在阶段 1（最初实现）：
- ❌ **没有环境变量支持**
- ✅ **直接使用硬编码的 API key**
- ❌ **不存在"如果环境变量不存在"的情况**（因为根本没有检查环境变量）

在阶段 2（移除硬编码后）：
- ✅ **只使用环境变量**
- ❌ **如果环境变量不存在，返回错误**（不使用硬编码）

在阶段 3（当前）：
- ✅ **优先使用环境变量**
- ✅ **如果环境变量不存在，使用硬编码 fallback**

## 🎯 总结

1. **最初**: 完全硬编码，没有环境变量支持
2. **你要求移除硬编码后**: 只使用环境变量，没有 fallback
3. **现在**: 硬编码 + 环境变量，有 fallback
