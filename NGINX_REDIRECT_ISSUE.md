# Nginx 重定向问题报告

## 问题描述

访问 `https://arkchat.ai-builders.space/` 时，nginx 返回 301 重定向到 `https://www.superlinear.academy/ai-builders`。

## 问题分析

### 当前行为
```bash
$ curl -k -I https://arkchat.ai-builders.space/
HTTP/2 301 
location: https://www.superlinear.academy/ai-builders
server: nginx/1.18.0 (Ubuntu)
```

### 根本原因

1. **SSL 证书问题**：证书的 Subject 是 `ai-builders.com`，不包含子域名 `arkchat.ai-builders.space`
2. **Nginx 配置**：当 SSL 证书验证失败时，nginx 配置了默认重定向到 `https://www.superlinear.academy/ai-builders`
3. **请求未到达应用**：由于重定向发生在 nginx 层面，请求根本没有到达 Next.js 应用

### 影响

- ✅ 应用部署成功（状态：HEALTHY）
- ✅ 应用代码正常（Docker 构建成功）
- ❌ 无法通过 `https://arkchat.ai-builders.space/` 访问应用
- ❌ 所有请求都被重定向到 `https://www.superlinear.academy/ai-builders`

## 解决方案

### 需要平台管理员处理

这个问题需要 AI Builders 平台管理员修复：

1. **修复 SSL 证书配置**
   - 为 `arkchat.ai-builders.space` 配置正确的 SSL 证书
   - 或配置通配符证书 `*.ai-builders.space`

2. **修复 Nginx 配置**
   - 移除或修改 SSL 证书验证失败时的默认重定向
   - 确保请求能够正确路由到应用容器

### 联系信息

- **服务名称**：`arkchat`
- **部署时间**：2026-01-15 15:17:41
- **问题**：
  - SSL 证书不包含子域名
  - Nginx 重定向配置问题
  - 请求无法到达应用

## 验证步骤

修复后，应该能够：

1. 访问 `https://arkchat.ai-builders.space/` 而不被重定向
2. 看到 Next.js 应用的响应（不是 nginx 的 301）
3. API 路由 `/api/chat` 正常工作

## 临时测试方法

由于请求无法到达应用，目前无法通过浏览器或正常方式测试应用功能。

需要等待平台管理员修复基础设施配置问题。
