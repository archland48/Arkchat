# GitHub 仓库设置指南

## 步骤 1: 登录 GitHub CLI

GitHub CLI 已找到，位置：`/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin/gh`

### 方法 1: 使用浏览器登录（推荐）

```bash
cd /Users/apple/Downloads/demo/Arkchat
export PATH="/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:$PATH"
gh auth login --web
```

这会打开浏览器，按照提示完成登录。

### 方法 2: 使用 Token 登录

1. 创建 Personal Access Token:
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择 `repo` 权限
   - 复制生成的 token

2. 使用 Token 登录:
   ```bash
   export PATH="/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:$PATH"
   export GH_TOKEN=your_token_here
   ```

## 步骤 2: 创建仓库并推送代码

登录后，运行：

```bash
cd /Users/apple/Downloads/demo/Arkchat
./create-github-repo.sh
```

或者手动执行：

```bash
export PATH="/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:$PATH"
gh repo create Arkchat --public --source=. --remote=origin --push
```

## 步骤 3: 永久添加 GitHub CLI 到 PATH（可选）

要永久添加 GitHub CLI 到 PATH，运行：

```bash
echo 'export PATH="/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## 步骤 4: 部署应用

创建仓库后，运行：

```bash
export REPO_URL=https://github.com/archland48/Arkchat
export AI_BUILDER_TOKEN=sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587
node deploy.js
```

应用将部署到: **https://arkchat.ai-builders.space**
