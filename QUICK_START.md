# 快速开始 - 创建 GitHub 仓库

## 方法 1: 使用 GitHub CLI (推荐)

如果你已经安装了 GitHub CLI，请先确保它在 PATH 中：

```bash
# 检查 GitHub CLI
which gh

# 如果找不到，尝试添加到 PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

# 登录 GitHub CLI (如果还没登录)
gh auth login

# 创建并推送仓库
cd /Users/apple/Downloads/demo/Arkchat
gh repo create Arkchat --public --source=. --remote=origin --push
```

## 方法 2: 手动创建 (最简单)

1. **访问 GitHub 创建页面**: https://github.com/new

2. **填写信息**:
   - Repository name: `Arkchat`
   - Description: `A modern ChatGPT clone built with Next.js`
   - 选择 **Public**
   - **不要**勾选任何初始化选项（README, .gitignore, license）

3. **点击 "Create repository"**

4. **推送代码**:
   ```bash
   cd /Users/apple/Downloads/demo/Arkchat
   git push -u origin main
   ```

## 方法 3: 使用 GitHub API (需要 Personal Access Token)

1. **创建 Personal Access Token**:
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择 `repo` 权限
   - 复制生成的 token

2. **运行脚本**:
   ```bash
   cd /Users/apple/Downloads/demo/Arkchat
   export GITHUB_TOKEN=your_token_here
   ./create-repo.sh
   ```

## 部署

创建仓库后，运行：

```bash
export REPO_URL=https://github.com/archland48/Arkchat
export AI_BUILDER_TOKEN=sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587
node deploy.js
```

应用将部署到: **https://arkchat.ai-builders.space**
