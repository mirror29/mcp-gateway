# MCP Gateway - 专属MCP网关服务器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue)](https://www.typescriptlang.org/)

一个统一管理和调用多个MCP (Model Context Protocol) 服务的网关服务器。支持八字算命、天气查询等多种MCP服务，提供统一的REST API接口。

## ✨ 功能特性

- 🚀 **统一网关**: 统一管理和路由所有MCP服务请求
- 🔧 **热插拔**: 支持动态注册和注销MCP服务
- 📊 **服务监控**: 实时监控服务状态和性能指标
- 🛡️ **安全认证**: 支持API密钥认证和访问控制
- 🚦 **限流保护**: 内置请求限流，防止滥用
- 📝 **详细日志**: 完整的请求日志和错误追踪
- 🐳 **容器化**: 支持Docker部署，开箱即用
- 🔄 **负载均衡**: 支持多种负载均衡策略
- 🏥 **健康检查**: 自动检测服务健康状态

## 🚀 快速开始

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd mcp-gateway
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **验证服务**
```bash
curl http://localhost:3000/health
```

### Docker 部署

1. **使用 Docker Compose（推荐）**
```bash
docker-compose up -d
```

2. **使用 Docker 命令**
```bash
# 构建镜像
docker build -t mcp-gateway .

# 运行容器
docker run -d \
  --name mcp-gateway \
  -p 3000:3000 \
  -e API_KEY=your-api-key \
  mcp-gateway
```

## 📚 API 文档

### 基础端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api` | GET | API信息 |
| `/api/mcp/status` | GET | 获取所有服务状态 |
| `/api/mcp/servers` | GET | 获取服务列表 |
| `/api/mcp/servers/:serverName/tools` | GET | 获取服务工具列表 |

### 执行MCP工具

```http
POST /api/mcp/:serverName/:toolName
Content-Type: application/json
X-API-Key: your-api-key
X-API-Secret: your-api-secret

{
  "birthDate": "1990-01-01T08:00:00Z",
  "gender": "male",
  "calendarType": "solar"
}
```

### 八字算命服务示例

#### 1. 获取详细八字分析
```bash
curl -X POST http://localhost:3000/api/mcp/bazi/getBaziDetail \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key" \
  -d '{
    "birthDate": "1990-01-01T08:00:00Z",
    "gender": "male",
    "calendarType": "solar"
  }'
```

#### 2. 获取运势分析
```bash
curl -X POST http://localhost:3000/api/mcp/bazi/getBaziFortune \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key" \
  -d '{
    "birthDate": "1990-01-01T08:00:00Z",
    "gender": "male",
    "calendarType": "solar",
    "targetType": "today"
  }'
```

#### 3. 获取配对分析
```bash
curl -X POST http://localhost:3000/api/mcp/bazi/getCompatibility \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key" \
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
  }'
```

## 🔧 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 | 必填 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `development` | 否 |
| `PORT` | 服务端口 | `3000` | 否 |
| `HOST` | 绑定地址 | `0.0.0.0` | 否 |
| `API_KEY` | API密钥 | - | 否（开发环境） |
| `API_SECRET` | API密钥 | - | 否（开发环境） |
| `RATE_LIMIT_WINDOW_MS` | 限流窗口时间 | `900000` | 否 |
| `RATE_LIMIT_MAX_REQUESTS` | 限流请求数 | `100` | 否 |
| `LOG_LEVEL` | 日志级别 | `info` | 否 |

## 🏗️ 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   n8n 工作流    │───▶│   MCP Gateway   │───▶│   八字算命服务   │
└─────────────────┘    │   (统一网关)     │    └─────────────────┘
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   其他MCP服务    │
                       │  (天气/日历...)  │
                       └─────────────────┘
```

### 核心组件

- **MCPGateway**: 主网关，负责请求路由和中间件处理
- **ServerRegistry**: 服务注册中心，管理所有MCP服务
- **LoadBalancer**: 负载均衡器，支持多种策略
- **BaziServer**: 八字算命服务实现
- **中间件**: 认证、日志、限流、错误处理等

## 🚀 部署指南

### Railway 部署（推荐）

1. **连接 GitHub 仓库**
   - 登录 [Railway](https://railway.app)
   - 点击 "New Project" → "Deploy from GitHub repo"
   - 选择你的仓库

2. **配置环境变量**
   ```
   NODE_ENV=production
   PORT=3000
   API_KEY=your-production-api-key
   API_SECRET=your-production-api-secret
   ```

3. **部署完成**
   - Railway 会自动构建和部署
   - 获得一个类似 `https://your-app.railway.app` 的域名

### Render 部署

1. **创建 Web Service**
   - 登录 [Render](https://render.com)
   - 点击 "New" → "Web Service"
   - 连接 GitHub 仓库

2. **配置构建和启动命令**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **设置环境变量**
   和 Railway 类似配置必要的环境变量

### 云服务器部署

1. **准备服务器**
   ```bash
   # 安装 Docker 和 Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. **部署应用**
   ```bash
   git clone <repository-url>
   cd mcp-gateway
   docker-compose up -d
   ```

3. **配置反向代理（Nginx）**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 🔌 在 n8n 中使用

1. **创建 HTTP Request 节点**
   - Method: `POST`
   - URL: `https://your-domain.com/api/mcp/bazi/getBaziDetail`
   - Headers:
     - `Content-Type`: `application/json`
     - `X-API-Key`: `your-api-key`

2. **配置请求体**
   ```json
   {
     "birthDate": "{{$json.birthDate}}",
     "gender": "{{$json.gender}}",
     "calendarType": "solar"
   }
   ```

3. **处理响应数据**
   - 响应会包含 `data` 字段，包含完整的八字分析结果

## 📊 监控和日志

### 查看服务状态
```bash
curl http://localhost:3000/api/mcp/status
```

### 查看日志
```bash
# Docker 日志
docker logs mcp-gateway -f

# 开发环境日志
npm run dev
```

### 健康检查
```bash
curl http://localhost:3000/health
```

## 🛠️ 开发指南

### 添加新的MCP服务

1. **创建服务类**
```typescript
// src/servers/YourServer.ts
import { IMCPServer } from '@/types';

export class YourServer implements IMCPServer {
  name = 'your-service';
  version = '1.0.0';
  tools = ['tool1', 'tool2'];

  async executeTool(toolName: string, params: any): Promise<any> {
    // 实现你的工具逻辑
  }

  getStatus(): ServerStatus {
    // 返回服务状态
  }

  async healthCheck(): Promise<boolean> {
    // 健康检查逻辑
  }
}
```

2. **注册服务**
```typescript
// src/app.ts
gateway.registerServer('your-service', new YourServer());
```

### 自定义中间件

```typescript
// src/middleware/yourMiddleware.ts
export const yourMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 你的中间件逻辑
  next();
};
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🙏 致谢

- [cantian-ai/bazi-mcp](https://github.com/cantian-ai/bazi-mcp) - 八字算命计算逻辑
- [n8n](https://n8n.io/) - 工作流自动化平台
- [Express.js](https://expressjs.com/) - Web 框架

## 📞 支持

如有问题或建议，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)

---

**🌟 如果这个项目对你有帮助，请给个 Star！**