# RAG项目启动指南（重启后继续用）

## 当前进度
- ✅ 垂直领域确定：美妆洗护电商智能客服
- ✅ 评测集设计完成：51题，存放在 `RAG评测集_美妆洗护电商客服.md`
- ✅ 知识库文档准备完成：10篇文档在 `rag_knowledge_base/` 目录
- ✅ Docker Desktop 已安装（需要重启系统后生效）

## 重启后的操作步骤

### 1. 启动 Docker Desktop
- 重启系统后，Docker Desktop 会自动启动（或手动打开）
- 等待右下角托盘图标显示绿色/运行中

### 2. 验证 Docker 可用
打开命令行，运行：
```bash
docker --version
docker ps
```
如果能看到版本号和容器列表（即使是空的），说明 Docker 已就绪。

### 3. 启动 MaxKB
运行以下命令（一行）：
```bash
docker run -d --name=maxkb --restart=always -p 8080:8080 -v F:/maxkb/data:/var/lib/postgresql/data -v F:/maxkb/app:/opt/maxkb/app/data cr2.fit2cloud.com/1panel/maxkb
```

等待 2-3 分钟让容器完全启动。

### 4. 访问 MaxKB
浏览器打开：http://localhost:8080

首次访问会要求设置管理员账号密码。

### 5. 配置模型供应商
- 登录后进入"模型管理"
- 添加模型供应商（推荐 DeepSeek，成本低）
- 填入 API Key

### 6. 导入知识库
- 创建知识库："美妆洗护客服知识库"
- 批量上传 `rag_knowledge_base/` 下的 10 篇文档
- 等待向量化完成

### 7. 创建应用并测试
- 创建应用，关联知识库
- 用评测集里的问题测试
- 记录指标到评测记录表

## 回到 Claude 继续
重启后回到 Claude，直接说：
> "Docker 启动好了，继续 RAG 项目"

我会从第 3 步开始帮你操作。

## 关键文件位置
- 评测集：`F:\claude_study\RAG评测集_美妆洗护电商客服.md`
- 知识库文档：`F:\claude_study\rag_knowledge_base\`
- 本指南：`F:\claude_study\RAG项目启动指南.md`
