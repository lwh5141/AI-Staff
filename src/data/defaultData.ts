import { AppAsset, KBDocument, KBChunk, WorkflowNode, SystemLog, ChatSession, ChatMessage } from '../types';

export const INITIAL_APPS: AppAsset[] = [
  {
    id: 'app_beauty',
    name: '美妆售前客服',
    type: 'external',
    avatarType: 'beauty',
    status: 'running',
    workflowId: 'wf_beauty',
    knowledgeBaseIds: ['kb_beauty'],
    channels: ['web', 'wechat']
  },
  {
    id: 'app_shipping',
    name: '售后退换货助手',
    type: 'external',
    avatarType: 'shipping',
    status: 'running',
    workflowId: 'wf_refund',
    knowledgeBaseIds: ['kb_beauty'],
    channels: ['wechat']
  },
  {
    id: 'app_admin',
    name: '内部行政助手',
    type: 'internal',
    avatarType: 'admin',
    status: 'disabled',
    workflowId: 'wf_admin',
    knowledgeBaseIds: ['kb_admin'],
    channels: ['api']
  }
];

export const INITIAL_DOCS: KBDocument[] = [
  {
    id: 'doc_1',
    name: '抗老精华系列_成分解析_2023Q4.pdf',
    type: 'PDF',
    uploadTime: '2026-05-24 14:30',
    status: 'done',
    chunkCount: 142
  },
  {
    id: 'doc_2',
    name: '敏感肌护理FAQ_客服话术本.docx',
    type: 'DOCX',
    uploadTime: '2026-05-24 09:15',
    status: 'done',
    chunkCount: 89
  },
  {
    id: 'doc_3',
    name: '2023大促专案_价格与赠品策略.xlsx',
    type: 'XLSX',
    uploadTime: '2026-05-25 08:00',
    status: 'parsing',
    chunkCount: 0
  },
  {
    id: 'doc_4',
    name: '已下架老产品_历史档案_损坏.pdf',
    type: 'PDF',
    uploadTime: '2026-05-22 11:10',
    status: 'failed',
    chunkCount: 0
  }
];

export const INITIAL_CHUNKS: KBChunk[] = [
  {
    id: 'chunk_1_1',
    docId: 'doc_1',
    docName: '抗老精华系列_成分解析_2023Q4.pdf',
    chunkNumber: 1,
    wordCount: 256,
    text: '核心成分解析：玻色因 (Pro-Xylane)。本系列抗老成分采用高浓度 10% 玻色因，能够促进粘多糖（GAGs）的合成，进而增加胶原蛋白的产生，使皮肤更加紧致饱满。建议在使用本品前，先使用爽肤水做好基础保湿，并轻拍至吸收。'
  },
  {
    id: 'chunk_1_2',
    docId: 'doc_1',
    docName: '抗老精华系列_成分解析_2023Q4.pdf',
    chunkNumber: 2,
    wordCount: 189,
    text: '适用人群与安全规程：适合25岁以上有抗老需求、皮肤出现细纹及松弛的熟龄肌、熟龄敏感肌人群。孕妇及哺乳期妇女请遵医嘱。我们的视黄醇衍生物经过温和度配方改良，但敏感肌初次使用仍建议在耳后进行24小时测试。'
  },
  {
    id: 'chunk_1_3',
    docId: 'doc_1',
    docName: '抗老精华系列_成分解析_2023Q4.pdf',
    chunkNumber: 3,
    wordCount: 312,
    text: '搭配建议：为达到最佳抗老淡纹效果，强烈推荐与同系列[高能视黄醇充盈面霜]搭配打底使用。由于夜间是新陈代谢及细胞修护的黄金时段，可在夜间护肤适当增加用量，并配合自下而上的向上提升按摩手法，锁定饱满细嫩。'
  },
  {
    id: 'chunk_2_1',
    docId: 'doc_2',
    docName: '敏感肌护理FAQ_客服话术本.docx',
    chunkNumber: 1,
    wordCount: 198,
    text: '敏感肌常见Q&A：洗面奶是否温和？我们的[氨基酸透亮洁面乳]采用100%纯氨基酸表面活性剂，不含皂基、不含酒精、零化学香精，pH值在5.5-6.0之间，绝不伤害皮脂膜，极度适合重度敏感肌和屏障受损肌肤使用。'
  },
  {
    id: 'chunk_2_2',
    docId: 'doc_2',
    docName: '敏感肌护理FAQ_客服话术本.docx',
    chunkNumber: 2,
    wordCount: 215,
    text: '过敏退换货特殊售后保障：若用户声称使用产品后产生严重过敏性红肿、瘙痒，客服人员需保持情绪温和与关心。要求客户提供过敏部位的清晰相片，以及二级及以上医院开具的过敏性皮肤诊断凭证。一经核实提供特殊绿色通道全额退款，即使开封使用也支持。'
  }
];

export const INITIAL_NODES: WorkflowNode[] = [
  {
    id: 'node_start',
    name: '用户输入开始',
    type: 'start',
    x: 40,
    y: 160,
    config: { systemPrompt: '默认输入源' }
  },
  {
    id: 'node_optimize',
    name: '意图识别与补全',
    type: 'optimize',
    x: 280,
    y: 160,
    config: { model: 'gemini-3.5-flash', temperature: 0.2 }
  },
  {
    id: 'node_condition',
    name: '场景分流器',
    type: 'condition',
    x: 540,
    y: 130,
    config: { extra: '条件分支: 1.产品咨询 -> 商品知识库  2.退款投诉 -> 售后SOP' }
  },
  {
    id: 'node_retrieval',
    name: '商品库检索',
    type: 'knowledge_search',
    x: 800,
    y: 70,
    config: { extra: 'Top-K: 3 | 相似度阈值: 0.75' }
  },
  {
    id: 'node_output',
    name: '导购回复生成',
    type: 'ai_chat',
    x: 1060,
    y: 70,
    config: {
      model: 'gemini-3.5-flash',
      systemPrompt: '你是Stitch自研美妆品牌的黄金导购顾问。请基于检索出的商品成分材料给予周到热心、充满亲切和同理心的专业答疑，凸显无皂基、纯净无添加以及多糖紧致等优势。',
      temperature: 0.4
    }
  },
  {
    id: 'node_fallback',
    name: '转接人工客服',
    type: 'reply',
    x: 800,
    y: 320,
    config: { extra: '触发客服工单并回切常规IM客服队列' }
  }
];

export const INITIAL_LOGS: SystemLog[] = [
  {
    id: 'log_1',
    time: '08:21:15',
    level: 'info',
    message: '知识库 [美容护肤产品知识库_V2] 全量嵌入式索引分析构建完毕，用时 12.4s。'
  },
  {
    id: 'log_2',
    time: '08:15:02',
    level: 'warn',
    message: '工作流 [标准退换货SOP_v1.0] 环节 [调用ERP系统] 外部API响应延迟过高 (2410ms)。'
  },
  {
    id: 'log_3',
    time: '08:12:44',
    level: 'info',
    message: '管理员 Admin User 凭证安全验证成功，通过 Chrome 登录 SaaS 后台终端。'
  },
  {
    id: 'log_4',
    time: '07:50:10',
    level: 'info',
    message: '应用 [美妆售前客服_v2.4] 新版热补丁发布，挂载 2 个核心数据库。'
  }
];

export const PRESET_CHATS: Record<string, ChatSession[]> = {
  app_beauty: [
    { id: 'session_beauty_1', title: '关于敏感肌洗面奶的适宜性咨询', appId: 'app_beauty', updatedAt: '10:42', tags: ['咨询', '洁面'] },
    { id: 'session_beauty_2', title: '玻色因抗老系列的使用顺序', appId: 'app_beauty', updatedAt: '昨天', tags: ['成分', '抗老'] }
  ],
  app_shipping: [
    { id: 'session_ship_1', title: '换货时效及发票修改政策', appId: 'app_shipping', updatedAt: '15:24', tags: ['售后', '物流'] },
    { id: 'session_ship_2', title: '收到洗面奶后过敏退款咨询', appId: 'app_shipping', updatedAt: '昨天', tags: ['过敏', '退款'] }
  ],
  app_admin: [
    { id: 'session_adm_1', title: '最新带薪年假天数与飞书ERP冲账须知', appId: 'app_admin', updatedAt: '2026-05-24', tags: ['行政', '流程'] }
  ]
};

export const PRESET_MESSAGES: Record<string, ChatMessage[]> = {
  session_beauty_1: [
    {
      id: 'm1',
      sessionId: 'session_beauty_1',
      sender: 'system',
      text: '已挂载系统预设：美妆数字客服 v2.4 (引擎: gemini-3.5-flash)',
      time: '10:41'
    },
    {
      id: 'm2',
      sessionId: 'session_beauty_1',
      sender: 'user',
      text: '这款氨基酸洗面奶适合敏感肌吗？我的面部经常容易过敏发红。',
      time: '10:41'
    },
    {
      id: 'm3',
      sessionId: 'session_beauty_1',
      sender: 'assistant',
      text: '您好！完全不用担心，这款「氨基酸透亮洁面乳」极度适合敏感肌以及屏障受损肌肤使用哦。🌸\n\n它是专门为娇嫩受损肌研发的，核心特点如下：\n- **100% 纯氨基酸表活**：无皂基清洁，在提供温和洁净力的同时，不带走皮脂膜水分。\n- **极简无添加安全配方**：零皂基、零防腐、零酒精、零香精，pH值稳定在 5.5—6.0 的皮脂亲和段度，不会引发任何发红和紧绷。\n\n我们更额外为您保驾护航：如果因为肤质特殊出现不适应或致红发生，提供凭证照片即可通过绿色通道享受开封也能全退的全款服务。您完全可以放心试用！',
      time: '10:42',
      metadata: {
        latency: '0.94s',
        tokens: 382,
        model: 'gemini-3.5-flash',
        hits: [
          {
            docName: '敏感肌护理FAQ_客服话术本.docx',
            chunkNumber: 1,
            score: 0.94,
            text: '我们的[氨基酸透亮洁面乳]采用100%纯氨基酸表面活性剂，不含皂基、不含酒精、零化学香精，pH值在5.5-6.0之间，极度适合重度敏感肌和屏障受损使用。'
          }
        ]
      }
    }
  ],
  session_ship_1: [
    {
      id: 'ms1',
      sessionId: 'session_ship_1',
      sender: 'system',
      text: '已挂载系统预设：售后退换货助手 (引擎: gemini-3.5-flash)',
      time: '15:22'
    },
    {
      id: 'ms2',
      sessionId: 'session_ship_1',
      sender: 'user',
      text: '我想了解一下过敏退货的极速通道怎么走？',
      time: '15:23'
    },
    {
      id: 'ms3',
      sessionId: 'session_ship_1',
      sender: 'assistant',
      text: '得知宝贝让您的肌肤产生不适，倍感歉意。Stitch 始终把您的肤质体验与安全关怀放在首位！\n\n针对使用后过敏的尊贵用户，我们特设「极速无忧绿色售后通道」：\n\n1. **极速通道流程**：请您协助在会话窗、或售后申请后台上传一张**红肿瘙痒部位的清晰照片**，并附上**二级及以上医院开具的红肿或皮炎类过敏诊断建议书**。\n2. **退款政策承诺**：资料一经核实，我们会立刻安排专员，为您执行**开封使用商品也可全额退款**的极速返还打款。\n\n您现在手头有相关的图片或纸质证明照片吗？您可以发送给我，我现在就协助帮您申报！',
      time: '15:24',
      metadata: {
        latency: '0.85s',
        tokens: 410,
        model: 'gemini-3.5-flash',
        hits: [
          {
            docName: '敏感肌护理FAQ_客服话术本.docx',
            chunkNumber: 2,
            score: 0.89,
            text: '要求客户提供过敏部位的清晰相片，以及二级及以上医院开具的过敏性皮肤诊断凭证。一经核实提供特殊绿色通道全额退款，即使开封使用也支持。'
          }
        ]
      }
    }
  ],
  session_adm_1: [
    {
      id: 'ma1',
      sessionId: 'session_adm_1',
      sender: 'system',
      text: '已挂载系统预设：内部行政助手 (引擎: gemini-3.5-flash)',
      time: '昨天'
    },
    {
      id: 'ma2',
      sessionId: 'session_adm_1',
      sender: 'user',
      text: '我的发票应该怎么抬头？日常车费如何报销？',
      time: '昨天'
    },
    {
      id: 'ma3',
      sessionId: 'session_adm_1',
      sender: 'assistant',
      text: '各位 Stitch 同仁好！为您查询到最新的报销及抬头规章指导：\n\n1. **发票抬头**：请务必确保发票信息准确：\n   - **企业全称**：Stitch 智妆美容科技有限公司\n   - **项目科目**：日常交通费（或相应的办公办公采购科目）\n2. **报销执行流程**：\n   - 请将符合财政部要求的**增值税电子普通发票/专票原件**，上传到您的飞书 ERP「费用报销单」系统中。\n   - 审批流过审通过后，财务部门一般固定在 **每周二、周五** 统一发起银企打款冲销。如有急招请跟各部门行政助理沟通。',
      time: '昨天',
      metadata: {
        latency: '0.78s',
        tokens: 310,
        model: 'gemini-3.5-flash',
        hits: [
          {
            docName: '员工手册与报销规范.md',
            chunkNumber: 1,
            score: 0.95,
            text: '发票抬头必须为“Stitch 智妆美容科技有限公司”，报销周期为每周二和周五统一打款。'
          }
        ]
      }
    }
  ]
};
