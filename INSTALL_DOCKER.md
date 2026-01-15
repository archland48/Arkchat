# Docker 安装指南

## macOS 安装 Docker

### 方法 1: 使用 Homebrew（推荐）

```bash
brew install --cask docker
```

安装完成后，打开 Docker Desktop 应用程序。

### 方法 2: 手动下载安装

1. 访问 Docker Desktop for Mac: https://www.docker.com/products/docker-desktop
2. 下载适合你 Mac 的版本（Intel 或 Apple Silicon）
3. 打开下载的 `.dmg` 文件
4. 将 Docker 拖到 Applications 文件夹
5. 打开 Docker Desktop 应用程序
6. 等待 Docker 启动完成（菜单栏会显示 Docker 图标）

## 验证安装

安装完成后，运行：

```bash
docker --version
docker ps
```

如果命令成功执行，说明 Docker 已正确安装。

## 测试 Docker 构建

安装 Docker 后，运行：

```bash
cd /Users/apple/Downloads/demo/Arkchat
./test-docker.sh
```

或者手动测试：

```bash
# 构建镜像
docker build -t arkchat:test .

# 运行容器
docker run -d -p 3000:3000 -e PORT=3000 arkchat:test

# 测试应用
curl http://localhost:3000

# 查看日志
docker logs $(docker ps -q --filter ancestor=arkchat:test)

# 停止容器
docker stop $(docker ps -q --filter ancestor=arkchat:test)
docker rm $(docker ps -q --filter ancestor=arkchat:test)
```

## 注意事项

- Docker Desktop 需要至少 4GB RAM
- 首次启动可能需要几分钟
- 确保 Docker Desktop 正在运行（菜单栏有 Docker 图标）
