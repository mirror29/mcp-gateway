#!/bin/bash

# MCP Gateway API 测试脚本

BASE_URL="http://localhost:3000"
API_KEY="dev-api-key"

echo "🚀 开始测试 MCP Gateway API"
echo "📍 服务器地址: $BASE_URL"
echo ""

# 测试健康检查
echo "1️⃣ 测试健康检查"
echo "GET /health"
curl -s "$BASE_URL/health" | jq .
echo ""
echo ""

# 测试API信息
echo "2️⃣ 测试API信息"
echo "GET /api"
curl -s "$BASE_URL/api" | jq .
echo ""
echo ""

# 测试服务状态
echo "3️⃣ 测试服务状态"
echo "GET /api/mcp/status"
curl -s "$BASE_URL/api/mcp/status" | jq .
echo ""
echo ""

# 测试服务列表
echo "4️⃣ 测试服务列表"
echo "GET /api/mcp/servers"
curl -s "$BASE_URL/api/mcp/servers" | jq .
echo ""
echo ""

# 测试八字服务工具列表
echo "5️⃣ 测试八字服务工具列表"
echo "GET /api/mcp/servers/bazi/tools"
curl -s "$BASE_URL/api/mcp/servers/bazi/tools" | jq .
echo ""
echo ""

# 测试八字计算
echo "6️⃣ 测试八字详细计算"
echo "POST /api/mcp/bazi/getBaziDetail"
curl -s -X POST "$BASE_URL/api/mcp/bazi/getBaziDetail" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "birthDate": "1990-01-01T08:00:00Z",
    "gender": "male",
    "calendarType": "solar"
  }' | jq .
echo ""
echo ""

# 测试运势分析
echo "7️⃣ 测试运势分析"
echo "POST /api/mcp/bazi/getBaziFortune"
curl -s -X POST "$BASE_URL/api/mcp/bazi/getBaziFortune" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "birthDate": "1990-01-01T08:00:00Z",
    "gender": "male",
    "calendarType": "solar",
    "targetType": "today"
  }' | jq .
echo ""
echo ""

# 测试配对分析
echo "8️⃣ 测试配对分析"
echo "POST /api/mcp/bazi/getCompatibility"
curl -s -X POST "$BASE_URL/api/mcp/bazi/getCompatibility" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "person1": {
      "birthDate": "1990-01-01T08:00:00Z",
      "gender": "male",
      "calendarType": "solar"
    },
    "person2": {
      "birthDate": "1992-05-15T14:30:00Z",
      "gender": "female",
      "calendarType": "solar"
    },
    "analysisType": "love"
  }' | jq .
echo ""
echo ""

# 测试幸运信息
echo "9️⃣ 测试幸运信息"
echo "POST /api/mcp/bazi/getLuckyInfo"
curl -s -X POST "$BASE_URL/api/mcp/bazi/getLuckyInfo" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "birthDate": "1990-01-01T08:00:00Z",
    "gender": "male",
    "calendarType": "solar"
  }' | jq .
echo ""
echo ""

# 测试错误处理
echo "🔟 测试错误处理（无效参数）"
echo "POST /api/mcp/bazi/getBaziDetail"
curl -s -X POST "$BASE_URL/api/mcp/bazi/getBaziDetail" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "birthDate": "invalid-date",
    "gender": "invalid-gender",
    "calendarType": "solar"
  }' | jq .
echo ""
echo ""

echo "✅ API 测试完成！"
echo ""
echo "💡 提示："
echo "- 确保服务器正在运行 (npm run dev)"
echo "- 确保安装了 jq 命令用于 JSON 格式化"
echo "- 可以修改 BASE_URL 变量测试不同的环境"