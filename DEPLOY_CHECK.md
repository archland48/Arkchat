# 部署检查清单

## 当前状态

根据 git status，以下文件**尚未提交**：

### 修改的文件 (Modified)
- ✅ `app/api/chat/route.ts` - 已集成 Bible prompts
- ✅ `components/ChatArea.tsx` - 已添加 Bible Study tab
- ✅ `components/ChatInput.tsx` - 已更新

### 新文件 (Untracked)
- ✅ `components/ChatTabs.tsx` - **Bible Study 按钮组件** ⭐
- ✅ `components/BibleStudyPanel.tsx` - Bible Study 面板
- ✅ `components/BibleQuickActions.tsx` - 快捷操作
- ✅ `lib/bible-prompts.ts` - Prompt 策略系统
- ✅ `lib/bible-utils.ts` - Bible 查询检测
- ✅ `lib/fhl-api.ts` - FHL API 客户端
- ✅ `app/api/bible/route.ts` - Bible API 路由

### 文档文件 (可选)
- `ADVANCED_CROSS_REFERENCE.md`
- `AI_MODEL_USAGE.md`
- `FHL_PROMPTS_INTEGRATION.md`
- 等等...

---

## 部署步骤

### 1. 提交代码到 Git

```bash
cd /Users/apple/Downloads/demo/Arkchat

# 添加所有新文件和修改
git add .

# 提交更改
git commit -m "Add Bible Study toggle button and FHL Bible integration"

# 查看提交状态
git status
```

### 2. 推送到 GitHub

```bash
# 检查远程仓库
git remote -v

# 推送到 GitHub
git push origin main
```

如果遇到权限问题，使用：

```bash
# 使用 GitHub Token
export GITHUB_TOKEN=your_token_here
./push-with-token.sh

# 或使用 GitHub CLI
gh auth login
git push origin main
```

### 3. 部署到生产环境

```bash
# 设置环境变量
export REPO_URL=https://github.com/archland48/Arkchat
export AI_BUILDER_TOKEN=sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587

# 执行部署
node deploy.js
```

### 4. 检查部署状态

```bash
# 检查部署状态
curl https://space.ai-builders.com/backend/v1/deployments/arkchat \
  -H "Authorization: Bearer sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587"

# 查看构建日志
curl https://space.ai-builders.com/backend/v1/deployments/arkchat/logs?log_type=build \
  -H "Authorization: Bearer sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587"
```

---

## 验证部署

部署成功后，访问：**https://arkchat.ai-builders.space/**

### 检查 Bible Study 按钮

1. ✅ 打开网站
2. ✅ 查看 header 下方是否有 "Chat" 标签和 "Bible Study" 按钮
3. ✅ 点击 "Bible Study" 按钮，应该：
   - 按钮变为蓝色（开启状态）
   - 显示绿色脉冲点
   - 显示 "Bible 查詢模式已開啟" 提示条
4. ✅ 再次点击，应该：
   - 按钮恢复灰色（关闭状态）
   - 提示条消失

### 测试 Bible 查询功能

1. ✅ 开启 Bible Study 模式
2. ✅ 输入 "約翰福音 3:16"
3. ✅ 应该返回包含原文解釋、註釋、交叉引用等的完整回答

---

## 故障排除

### 如果看不到 Bible Study 按钮

1. **清除浏览器缓存**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **检查浏览器控制台**
   - 按 `F12` 打开开发者工具
   - 查看 Console 是否有错误
   - 查看 Network 标签确认文件已加载

3. **检查构建是否成功**
   ```bash
   # 查看构建日志
   curl https://space.ai-builders.com/backend/v1/deployments/arkchat/logs?log_type=build \
     -H "Authorization: Bearer sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587"
   ```

4. **确认文件已推送**
   ```bash
   # 检查 GitHub 仓库
   # 访问: https://github.com/archland48/Arkchat
   # 确认 components/ChatTabs.tsx 存在
   ```

### 如果部署失败

1. **检查代码是否有语法错误**
   ```bash
   npm run lint
   ```

2. **本地测试构建**
   ```bash
   npm run build
   ```

3. **检查环境变量**
   - 确认 `AI_BUILDER_TOKEN` 正确
   - 确认 `REPO_URL` 正确

---

## 快速部署命令

```bash
# 一键部署脚本
cd /Users/apple/Downloads/demo/Arkchat
git add .
git commit -m "Add Bible Study toggle button"
git push origin main
export REPO_URL=https://github.com/archland48/Arkchat
export AI_BUILDER_TOKEN=sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587
node deploy.js
```

---

## 部署后验证清单

- [ ] 代码已推送到 GitHub
- [ ] 部署任务已创建
- [ ] 构建成功完成
- [ ] 网站可以访问
- [ ] Bible Study 按钮可见
- [ ] 按钮可以点击切换
- [ ] Bible 查询功能正常
