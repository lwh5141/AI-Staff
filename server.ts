import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client to avoid crashes on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Cosmetics/Company Knowledge Base for search retrieval matching
const mockKnowledgeBase = [
  {
    docName: '抗老精华系列_成分解析_2023Q4.pdf',
    chunkNumber: 1,
    text: '核心成分解析：玻色因 (Pro-Xylane)。本系列抗老成分采用高浓度 10% 玻色因，能够促进粘多糖（GAGs）的合成，进而增加胶原蛋白的产生，使皮肤更加紧致饱满。建议在使用本品前，先使用爽肤水做好基础保湿，并轻拍至吸收。',
    keywords: ['玻色因', 'Pro-Xylane', '抗老', '成分', '紧致']
  },
  {
    docName: '抗老精华系列_成分解析_2023Q4.pdf',
    chunkNumber: 2,
    text: '适用人群与安全规程：适合25岁以上有抗老需求、皮肤出现细纹及松弛的熟龄肌、熟龄敏感肌人群。孕妇及哺乳期妇女请遵医嘱。我们的视黄醇衍生物经过温和度配方改良，但敏感肌初次使用仍建议在耳后进行24小时测试。',
    keywords: ['适用人群', '敏感肌', '安全', '视黄醇', '孕妇']
  },
  {
    docName: '敏感肌护理FAQ_客服话术本.docx',
    chunkNumber: 1,
    text: '敏感肌常见Q&A：洗面奶是否温和？我们的[氨基酸透亮洁面乳]采用100%纯氨基酸表面活性剂，不含皂基、不含酒精、零化学香精，pH值在5.5-6.0之间，绝不伤害皮脂膜，极度适合重度敏感肌和屏障受损肌肤使用。',
    keywords: ['温和', '洗面奶', '氨基酸', '敏感肌', '洁面', '屏障']
  },
  {
    docName: '敏感肌护理FAQ_客服话术本.docx',
    chunkNumber: 2,
    text: '过敏退换货特殊售后保障：若用户声称使用产品后产生严重过敏性红肿、瘙痒，客服人员需保持情绪温和与关心。要求客户提供过敏部位的清晰相片，以及二级及以上医院开具的过敏性皮肤诊断凭证。一经核实提供特殊绿色通道全额退款，即使开封使用也支持。',
    keywords: ['退款', '过敏', '退换货', '售后', '照片', '医院']
  },
  {
    docName: '员工手册与报销规范.md',
    chunkNumber: 1,
    text: '企业内部报销流程：日常差旅与办公物品采购，需提前在飞书ERP发起审批。报销单填写时必须附带增值税电子普通发票（或专用发票），发票抬头必须为“Stitch 智妆美容科技有限公司”，报销周期为每周二和周五统一打款。',
    keywords: ['报销', '流程', '发发票', '打款', 'Stitch', '日常']
  },
  {
    docName: '员工手册与报销规范.md',
    chunkNumber: 2,
    text: '年假及福利制度：Stitch 公司全员共享每年 10 天起步的带薪年假，在职每满一年额外增加 1 天。请假前需提前在管理端发起，提前至少三天通知部门Leader，以便做好客服坐席的班次排编与行政替补工作。',
    keywords: ['年假', '请假', '福利', '在职', '假期']
  }
];

// Simple retrieval function mapping scores based on keyword matching
function retrieveDocs(query: string): any[] {
  const normQuery = query.toLowerCase();
  const results = mockKnowledgeBase.map(item => {
    let score = 0.05; // base score
    let matchCount = 0;
    item.keywords.forEach(kw => {
      if (normQuery.includes(kw.toLowerCase())) {
        matchCount++;
      }
    });
    if (matchCount > 0) {
      score = Math.min(0.65 + (matchCount / (item.keywords.length + 2)) * 0.35, 0.98);
    }
    return { ...item, score };
  });

  // Filter those that match and sort descending
  return results
    .filter(r => r.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

// API endpoint for Chat
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  const { messages, appId, systemPrompt, temperature } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array.' });
  }

  const latestUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.text || '';
  
  // Perform Retrieval testing
  const matchedChunks = retrieveDocs(latestUserMsg);
  
  // Format matching references into system prompt
  let extraContext = '';
  if (matchedChunks.length > 0) {
    extraContext = '\n[检索到的已命中知识库切片内容，请根据这些内容精准应答]:\n' + 
      matchedChunks.map((c, i) => `【信息源 #${i+1}】(来自 ${c.docName} | 相似度: ${(c.score * 100).toFixed(1)}%)\n${c.text}`).join('\n\n') + '\n';
  }

  const combinedSystemInstruction = (systemPrompt || '你是一个专业高效的 AI 智能客服助手。') + 
    `\n\n${extraContext}\n如果用户询问的内容在参考信息中未命中，请温和、诚实地作答，绝不捏造虚假的产品价格、优惠或制度细节。`;

  const client = getGeminiClient();
  const executionLatency = ((Date.now() - startTime) / 1000).toFixed(2);

  if (!client) {
    // Elegant Offline Mode when API Key is missing or default
    console.log('Gemini API context loaded in mock/educational mode (Missing or Default API Key)');
    
    // Simulate smart beauty assistant response offline
    let simulatedAnswer = '';
    const qLower = latestUserMsg.toLowerCase();
    
    if (qLower.includes('洗面奶') || qLower.includes('敏感肌')) {
      simulatedAnswer = `您好！根据我们的**抗老与敏感肌知识库资料**，我们的「氨基酸透亮洁面乳」极度适合敏感肌使用哦。🌸\n\n它采用 **100% 纯天然氨基酸表面活性剂**，配方温和且绝不含皂基和酒精成分。pH值保持在 5.5—6.0 的黄金健康区间，完全能呵护您的面部屏障！\n\n另外，我们还有贴心的过敏无忧保障：如有意外过敏，提供清晰过敏红肿照片及医院诊断证明，我们提供特批退款，即使拆封了也能全额返还，请您放心购买！`;
    } else if (qLower.includes('退') || qLower.includes('过敏') || qLower.includes('换货')) {
      simulatedAnswer = `得知产品给您带来过敏体验我们深表歉意！针对过敏，我们一向提供超越常规 policy 的特殊绿色通道：\n\n1. 请问您是否方便将**红肿瘙痒部位**拍一张清晰照片，并附上**医务凭证/诊断书**？\n2. 只要核查情况属实，即使您已对精华或面霜进行开封、使用，Stitch 依然为您提供**极速全额退款**办理。\n\n您现在可以在这里上传您的诊断照片吗？我立即为您安排专员审批。`;
    } else if (qLower.includes('报销') || qLower.includes('年假') || qLower.includes('请假')) {
      simulatedAnswer = `您好，Stitch 内部行政助手为您核查：\n\n* **发票与报销流程**：请在飞书ERP上发起报销单，发票抬头务必为「**Stitch 智妆美容科技有限公司**」，发票上请附带增值税电子标签，财务部门将在每周二/周五统一打款。\n* **年假规定**：我们提供起步 10 天的入职全薪带薪年假，在职每满 1 年增加 1 天。请休假需提前 3 天告知组长，以便安排值班。`;
    } else {
      simulatedAnswer = `您好！我是 Stitch 智能 AI 数字团队。很高兴为您服务。关于您提到的“${latestUserMsg}”，由于目前系统处于设计原型调试模式，这是一个智能回复：\n\n请放心，一旦工作流配置和数据挂载激活，我将能随时基于您的知识文档提供精确解答。有任何美妆、退换、或者日常差旅问题，欢迎随时咨询我！`;
    }

    const estimatedTokens = Math.ceil((simulatedAnswer.length + combinedSystemInstruction.length) * 1.4);
    
    // Return mock response beautifully to match high-fidelity diagnostic panel
    return res.json({
      text: simulatedAnswer,
      metadata: {
        latency: `${(0.4 + Math.random() * 0.3).toFixed(2)}s`,
        tokens: estimatedTokens,
        model: 'gemini-3.5-flash (模拟调试级)',
        hits: matchedChunks.map(c => ({
          docName: c.docName,
          chunkNumber: c.chunkNumber,
          score: c.score,
          text: c.text
        }))
      }
    });
  }

  try {
    // Real Gemini Query!
    const chatInstance = client.chats.create({
      model: 'gemini-3.5-flash',
      config: {
        systemInstruction: combinedSystemInstruction,
        temperature: temperature ?? 0.4
      }
    });

    // Format chat messages correctly for GoogleGenAI SDK
    // Let's take only the last few messages to keep payload size optimal
    const contextHistory = messages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Send latest message
    const geminiRes = await chatInstance.sendMessage({
      message: latestUserMsg
    });

    const responseText = geminiRes.text || '暂无返回。';
    const finalLatency = ((Date.now() - startTime) / 1000).toFixed(2);
    const calculatedTokens = Math.ceil((responseText.length + combinedSystemInstruction.length) * 1.5);

    return res.json({
      text: responseText,
      metadata: {
        latency: `${finalLatency}s`,
        tokens: calculatedTokens,
        model: 'gemini-3.5-flash',
        hits: matchedChunks.map(c => ({
          docName: c.docName,
          chunkNumber: c.chunkNumber,
          score: c.score,
          text: c.text
        }))
      }
    });

  } catch (err: any) {
    console.error('Gemini API call failed:', err);
    return res.status(500).json({
      error: 'Gemini API call failed',
      details: err.message,
      metadata: {
        latency: executionLatency,
        tokens: 0,
        model: 'gemini-3.5-flash (Error Fallback)'
      }
    });
  }
});

// Serve static assets in production mode, mount Vite middleware in development
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Static Asset Serve
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Stitch AI Team] Server running successfully at http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to spin up Stitch AI Server:', err);
});
