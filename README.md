<div align="center">
  <h1>AI Staff</h1>
  <p>基于 RAG 检索模型、条件判定和 DAG 流程编排的 AI 数字员工系统</p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Express-4-000000?logo=express" alt="Express" />
  </p>
</div>

## 项目简介

AI Staff 是一个企业级 AI 数字员工管理系统，整合美妆智能客服及企业日常行政场景，实现人机协同闭环。系统基于 RAG（检索增强生成）技术，支持知识库管理、工作流编排（DAG）、对话调试和运行数据看板等功能。

## 核心功能

### 1. 工作台首页
- 系统运行状态概览
- 对话数据统计（总提问量、知识库召回率、平均响应延迟）
- 热门问题排行
- 系统运行日志

### 2. 对话管理（调试）
- 多应用对话管理
- 实时对话调试
- 知识库检索结果展示
- 模型响应分析

### 3. 知识库管理
- 文档上传与解析（PDF、DOCX、XLSX）
- 文本分块管理
- 知识库挂载与关联

### 4. 工作流编排（DAG）
- 可视化节点拖拽编排
- 画布平移与缩放
- 多种节点类型：开始节点、AI 对话、条件分流、知识检索、回复分支
- 节点参数配置

### 5. 应用资产管理
- 数字员工应用管理
- 渠道配置（Web、微信、API）
- 工作流与知识库关联

### 6. 运行数据看板
- 对话数据统计
- 知识库召回率分析
- 系统性能监控

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **样式方案**: Tailwind CSS 4
- **后端服务**: Express + tsx
- **AI 能力**: Google Gemini API
- **图标库**: Lucide React
- **动画库**: Motion

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置环境变量

1. 复制环境变量示例文件：
```bash
cp .env.example .env.local
```

2. 在 `.env.local` 中设置你的 Gemini API Key：
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 项目结构

```
ai-数字员工-stitch/
├── src/
│   ├── components/       # 公共组件
│   │   └── Sparkline.tsx
│   ├── data/            # 初始数据
│   │   └── defaultData.ts
│   ├── App.tsx          # 主应用组件
│   ├── main.tsx         # 入口文件
│   ├── types.ts         # TypeScript 类型定义
│   └── index.css        # 全局样式
├── server.ts            # Express 服务器
├── index.html           # HTML 模板
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript 配置
├── vite.config.ts       # Vite 配置
└── README.md            # 项目说明
```

## 工作流节点类型

| 节点类型 | 说明 |
|---------|------|
| 开始节点 | 监听全渠道用户咨询 |
| AI 对话 | 模型回复生成器 |
| 意图识别与补全 | Gemini 补全输入参数 |
| 条件分流 | 匹配知识分支 |
| 知识检索 | 相似度数据库检索 |
| 回复分支 | 执行特定业务应答 |

## 快捷键与操作

- **拖拽节点**: 鼠标按住节点移动
- **平移画布**: 鼠标按住空白处拖拽
- **缩放视图**: 鼠标滚轮上下滚动

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License
