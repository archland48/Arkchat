# 快速调试 504 错误

## 🚨 立即诊断

看到 504 错误后，立即运行：

```bash
cd /Users/apple/Downloads/demo/Arkchat

# 加载环境变量
source .env.local
export AI_BUILDER_TOKEN

# 运行诊断脚本
./debug-504.sh
```

这个脚本会：
1. ✅ 检查部署状态
2. 📝 显示最近的日志（最后 50 行）
3. 🔍 搜索超时/错误模式
4. ⏱️ 显示关键时间戳

## 📊 查看详细日志

### 方法 1: 使用脚本

```bash
# 查看应用日志
./view-logs.sh app

# 只看错误和超时
./view-logs.sh app | grep -E '504|timeout|timed out|error'
```

### 方法 2: 直接 curl

```bash
# 查看所有应用日志
curl "https://space.ai-builders.com/backend/v1/deployments/arkchat/logs?log_type=app" \
  -H "Authorization: Bearer $AI_BUILDER_TOKEN"
```

## 🔍 关键信息查找

### 1. 查找性能瓶颈

在日志中查找 `[Xms]` 时间戳：

```bash
./view-logs.sh app | grep '\[.*ms\]'
```

**关键时间戳：**
- `[Xms] Request received` - 请求开始
- `[Xms] Bible query detection` - 检测时间（应该 < 10ms）
- `[Xms] Verse data fetched` - 经文获取时间（应该 < 8000ms）
- `[Xms] Making AI API request` - AI API 调用时间
- `[Xms] Chat API error` - 错误发生时间

### 2. 查找超时错误

```bash
./view-logs.sh app | grep -i 'timeout\|timed out'
```

### 3. 查找 Bible Query 检测结果

```bash
./view-logs.sh app | grep -i 'bible query detection'
```

应该看到类似：
```
[12ms] Bible query detection: { detected: 'verse', book: '馬可福音', chapter: 4, verse: '30-41' }
```

## 🎯 常见问题诊断

### 问题 1: Verse fetch 超时 (> 8000ms)

**症状：**
```
[8500ms] Verse data fetched: { fetchTime: 8500 }
```

**原因：** FHL API 响应慢

**解决：**
- 检查 FHL API 是否可用
- 考虑增加超时时间（如果网关允许）
- 或跳过 word analysis/commentary 以减少调用

### 问题 2: AI API 超时 (> 25000ms)

**症状：**
```
[30000ms] Chat API error: Request timed out
```

**原因：** AI Builder API 响应慢或 Bible context 太长

**解决：**
- 简化 Bible context
- 减少不必要的 API 调用
- 检查 AI Builder API 状态

### 问题 3: 网关超时 (> 60000ms)

**症状：**
```
504 Gateway Timeout
```

**原因：** 总处理时间超过网关限制（通常 30-60 秒）

**解决：**
- 优化整体流程
- 减少 API 调用
- 并行化更多操作

### 问题 4: Bible Query 检测失败

**症状：**
```
[12ms] Bible query detection: { detected: null }
```

**原因：** 查询格式不匹配

**解决：**
- 检查是否支持中文数字格式（"四章"）
- 确认正则表达式是否正确

## 📝 日志示例

### 正常流程日志

```
[5ms] Request received: { model: 'grok-4-fast', bibleModeEnabled: false, messageLength: 15 }
[12ms] Bible query detection: { detected: 'verse', book: '馬可福音', chapter: 4, verse: '30-41' }
[8234ms] Verse data fetched: { recordCount: 12, fetchTime: 8234 }
[15234ms] Making AI API request: { model: 'grok-4-fast', streaming: true }
```

### 超时错误日志

```
[5ms] Request received: { model: 'grok-4-fast', bibleModeEnabled: false }
[12ms] Bible query detection: { detected: 'verse', book: '馬可福音', chapter: 4, verse: '30-41' }
[8500ms] Verse data fetched: { recordCount: 12, fetchTime: 8500 }
[35000ms] Chat API error: Request timed out
[35000ms] Error details: { isTimeout: true, totalTime: 35000 }
```

## 🛠️ 下一步操作

1. **运行诊断脚本**：
   ```bash
   ./debug-504.sh
   ```

2. **查看详细日志**：
   ```bash
   ./view-logs.sh app | tail -100
   ```

3. **分析瓶颈**：
   - 找出最慢的步骤
   - 检查是否超时
   - 确认 Bible query 检测是否正确

4. **根据结果优化**：
   - 如果 FHL API 慢 → 增加超时或跳过某些调用
   - 如果 AI API 慢 → 简化 context
   - 如果总时间太长 → 优化整体流程

## 💡 提示

- **日志是实时的**：每次请求后立即查看，可以看到最新的调试信息
- **时间戳很重要**：关注 `[Xms]` 找出瓶颈
- **保存日志**：如果需要，保存到文件：
  ```bash
  ./view-logs.sh app > logs_$(date +%Y%m%d_%H%M%S).txt
  ```
