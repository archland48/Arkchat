# 如何查看日志

## 快速开始

### 方法 1: 使用脚本（推荐）

```bash
cd /Users/apple/Downloads/demo/Arkchat

# 加载环境变量
source .env.local
export AI_BUILDER_TOKEN

# 查看构建日志
./view-logs.sh build

# 查看应用日志（运行时日志，包括你的调试日志）
./view-logs.sh app

# 查看所有日志
./view-logs.sh all
```

### 方法 2: 使用 curl 命令

#### 查看构建日志

```bash
curl "https://space.ai-builders.com/backend/v1/deployments/arkchat/logs?log_type=build" \
  -H "Authorization: Bearer $AI_BUILDER_TOKEN"
```

#### 查看应用日志（运行时日志）

```bash
curl "https://space.ai-builders.com/backend/v1/deployments/arkchat/logs?log_type=app" \
  -H "Authorization: Bearer $AI_BUILDER_TOKEN"
```

### 方法 3: 使用浏览器（如果平台支持）

访问部署平台的管理界面（如果有的话）。

## 日志类型说明

### 1. Build Logs（构建日志）

显示部署和构建过程：
- Docker 构建过程
- npm install 输出
- Next.js 构建输出
- 构建错误（如果有）

**何时查看：**
- 部署失败时
- 想了解构建过程
- 检查构建是否成功

### 2. App Logs（应用日志）

显示运行时日志，包括：
- ✅ **你的调试日志**（`console.log` 输出）
- ✅ **API 请求日志**
- ✅ **错误日志**
- ✅ **性能日志**（`[Xms]` 时间戳）

**何时查看：**
- 调试 504 错误
- 查看 API 调用时间
- 检查 Bible query 检测结果
- 查看错误详情

## 查看特定日志

### 查看性能日志（时间戳）

```bash
./view-logs.sh app | grep '\[.*ms\]'
```

输出示例：
```
[5ms] Request received: { model: 'grok-4-fast', bibleModeEnabled: false }
[12ms] Bible query detection: { detected: 'verse', book: '馬可福音', chapter: 4 }
[8234ms] Verse data fetched: { recordCount: 12, fetchTime: 8234 }
[15234ms] Making AI API request: { model: 'grok-4-fast', streaming: true }
```

### 查看 Bible Query 相关日志

```bash
./view-logs.sh app | grep -i 'bible\|verse\|chapter'
```

### 查看错误日志

```bash
./view-logs.sh app | grep -i 'error\|timeout\|failed'
```

### 查看 504 错误相关日志

```bash
./view-logs.sh app | grep -E '504|timeout|timed out'
```

## 调试 504 错误的步骤

1. **触发错误**：在应用中输入 "馬可福音四章30-41節"

2. **立即查看日志**：
   ```bash
   ./view-logs.sh app | tail -100
   ```

3. **查找关键信息**：
   - `[Xms] Request received` - 请求开始时间
   - `[Xms] Bible query detection` - 检测结果和时间
   - `[Xms] Verse data fetched` - 经文获取时间
   - `[Xms] Making AI API request` - AI API 调用时间
   - `[Xms] Chat API error` - 错误发生时间

4. **分析瓶颈**：
   - 如果 `Verse data fetched` > 8000ms → FHL API 超时
   - 如果 `Making AI API request` 到 `Chat API error` > 25000ms → AI API 超时
   - 如果总时间 > 60000ms → 网关超时

## 实时监控日志（如果支持）

如果平台支持实时日志流：

```bash
# 持续监控应用日志
watch -n 2 './view-logs.sh app | tail -50'
```

或者使用 `tail -f` 模拟（如果 API 支持流式输出）：

```bash
# 注意：这需要 API 支持流式输出
curl -N "https://space.ai-builders.com/backend/v1/deployments/arkchat/logs?log_type=app&stream=true" \
  -H "Authorization: Bearer $AI_BUILDER_TOKEN"
```

## 日志格式说明

### 性能日志格式

```
[时间戳ms] 操作名称: { 详细信息 }
```

示例：
```
[5ms] Request received: { model: 'grok-4-fast', bibleModeEnabled: false, messageLength: 15 }
[12ms] Bible query detection: { detected: 'verse', book: '馬可福音', chapter: 4, verse: '30-41' }
[8234ms] Verse data fetched: { recordCount: 12, fetchTime: 8234 }
```

### 错误日志格式

```
[总时间ms] Chat API error: Error message
Error details: { message, status, type, isTimeout, isUnauthorized, totalTime }
```

## 常见问题

### Q: 日志为空或没有输出？

**A:** 可能的原因：
1. 应用还没有运行（检查部署状态）
2. 还没有触发任何请求
3. API token 无效

**解决：**
```bash
# 检查部署状态
./check-deployment.sh

# 检查 token
echo $AI_BUILDER_TOKEN
```

### Q: 如何查看历史日志？

**A:** 日志通常只保留最近一段时间。如果需要历史日志：
1. 检查平台是否有日志导出功能
2. 考虑添加日志存储（如数据库或文件）

### Q: 日志太多，如何过滤？

**A:** 使用 grep 过滤：

```bash
# 只看错误
./view-logs.sh app | grep -i error

# 只看特定时间范围（需要日志包含时间戳）
./view-logs.sh app | grep '2026-01-30'

# 只看特定功能
./view-logs.sh app | grep 'Bible query'
```

## 示例：调试 504 错误

```bash
# 1. 触发错误（在浏览器中输入查询）

# 2. 立即查看日志
./view-logs.sh app | tail -100

# 3. 查找关键信息
./view-logs.sh app | grep -E '\[.*ms\].*Request received|Bible query|Verse data|AI API|error'

# 4. 分析结果
# 如果看到：
# [8234ms] Verse data fetched: { fetchTime: 8234 }
# → FHL API 调用耗时 8.2 秒，接近 8 秒超时限制
#
# 如果看到：
# [35000ms] Chat API error: Request timed out
# → 总处理时间超过 25 秒，AI API 超时
```

## 提示

1. **日志会实时更新**：每次请求后查看日志，可以看到最新的调试信息

2. **时间戳很重要**：关注 `[Xms]` 时间戳，找出最慢的步骤

3. **过滤是关键**：使用 `grep` 过滤出你需要的信息

4. **保存日志**：如果需要，可以将日志保存到文件：
   ```bash
   ./view-logs.sh app > logs_$(date +%Y%m%d_%H%M%S).txt
   ```
