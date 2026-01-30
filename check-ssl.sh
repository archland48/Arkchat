#!/bin/bash
echo "=== 检查 SSL 证书状态 ==="
echo ""
echo "检查证书配置..."
openssl s_client -connect arkchat.ai-builders.space:443 -servername arkchat.ai-builders.space < /dev/null 2>&1 | grep -E "(subject|issuer|CN=|DNS:)" | head -10
echo ""
echo "如果看到 'DNS:*.ai-builders.space' 或 'DNS:arkchat.ai-builders.space'，说明证书已正确配置"
echo ""
echo "检查应用是否运行（跳过 SSL 验证）..."
curl -k -s https://arkchat.ai-builders.space/ | head -3
