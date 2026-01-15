# 推送代码并部署指南

## 当前状态

✅ **部署已提交** - 部署任务已创建，但需要先推送代码到 GitHub  
❌ **仓库为空** - GitHub 仓库还没有代码，需要先推送

## 步骤 1: 推送代码到 GitHub

### 方法 1: 使用 GitHub Token（推荐）

1. **创建 GitHub Personal Access Token**:
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择 `repo` 权限
   - 复制生成的 token

2. **使用 Token 推送代码**:
   ```bash
   cd /Users/apple/Downloads/demo/Arkchat
   export GITHUB_TOKEN=your_token_here
   ./push-with-token.sh
   ```

### 方法 2: 使用 GitHub CLI

```bash
cd /Users/apple/Downloads/demo/Arkchat
export PATH="/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:$PATH"
gh auth login --web
git push -u origin main
```

### 方法 3: 手动推送（如果已配置 SSH）

```bash
cd /Users/apple/Downloads/demo/Arkchat
git push -u origin main
```

## 步骤 2: 重新部署

推送代码后，部署平台会自动检测到新代码并重新部署。你也可以手动触发：

```bash
export REPO_URL=https://github.com/archland48/Arkchat
export AI_BUILDER_TOKEN=sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587
node deploy.js
```

## 检查部署状态

```bash
curl https://space.ai-builders.com/backend/v1/deployments/arkchat \
  -H "Authorization: Bearer sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587"
```

## 查看部署日志

```bash
curl https://space.ai-builders.com/backend/v1/deployments/arkchat/logs?log_type=build \
  -H "Authorization: Bearer sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587"
```

## 应用地址

部署成功后，应用将在以下地址可用：
**https://arkchat.ai-builders.space**
