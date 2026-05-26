import React, { useState, useRef, useEffect, FormEvent, MouseEvent, ChangeEvent } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Database, 
  GitFork, 
  Grid2X2, 
  BarChart3, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Send, 
  Search, 
  Upload, 
  Check, 
  X, 
  ChevronRight, 
  MoreVertical, 
  HelpCircle, 
  Bell, 
  Bot, 
  User, 
  Cpu, 
  Play, 
  Settings2, 
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import { AppAsset, KBDocument, KBChunk, WorkflowNode, SystemLog, ChatSession, ChatMessage } from './types';
import { Sparkline } from './components/Sparkline';
import { 
  INITIAL_APPS, 
  INITIAL_DOCS, 
  INITIAL_CHUNKS, 
  INITIAL_NODES, 
  INITIAL_LOGS, 
  PRESET_CHATS, 
  PRESET_MESSAGES 
} from './data/defaultData';

const SPARKLINE_DATA_DIALOGUES = [
  { day: '周一', value: 15240, label: '15.2k' },
  { day: '周二', value: 17890, label: '17.9k' },
  { day: '周三', value: 16420, label: '16.4k' },
  { day: '周四', value: 19800, label: '19.8k' },
  { day: '周五', value: 22140, label: '22.1k' },
  { day: '今天', value: 24592, label: '24.6k' },
];

const SPARKLINE_DATA_RECALL = [
  { day: '周一', value: 86.1, label: '86.1%' },
  { day: '周二', value: 87.4, label: '87.4%' },
  { day: '周三', value: 85.2, label: '85.2%' },
  { day: '周四', value: 88.3, label: '88.3%' },
  { day: '周五', value: 88.9, label: '88.9%' },
  { day: '今天', value: 89.4, label: '89.4%' },
];

const SPARKLINE_DATA_SATISFACTION = [
  { day: '周一', value: 4.8, label: '4.8/5' },
  { day: '周二', value: 4.7, label: '4.7/5' },
  { day: '周三', value: 4.8, label: '4.8/5' },
  { day: '周四', value: 4.8, label: '4.8/5' },
  { day: '周五', value: 4.8, label: '4.8/5' },
  { day: '今天', value: 4.8, label: '4.8/5' },
];

const SPARKLINE_DATA_LATENCY = [
  { day: '周一', value: 1.5, label: '1.5s' },
  { day: '周二', value: 1.4, label: '1.4s' },
  { day: '周三', value: 1.3, label: '1.3s' },
  { day: '周四', value: 1.2, label: '1.2s' },
  { day: '周五', value: 1.2, label: '1.2s' },
  { day: '今天', value: 1.2, label: '1.2s' },
];

export default function App() {
  // Navigation & States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dialogue' | 'knowledge' | 'workflow' | 'apps' | 'analytics' | 'settings'>('dashboard');
  
  // App & KB states
  const [apps, setApps] = useState<AppAsset[]>(INITIAL_APPS);
  const [docs, setDocs] = useState<KBDocument[]>(INITIAL_DOCS);
  const [chunks, setChunks] = useState<KBChunk[]>(INITIAL_CHUNKS);
  const [logs, setLogs] = useState<SystemLog[]>(INITIAL_LOGS);
  
  // Dialogue states
  const [activeAppId, setActiveAppId] = useState<string>('app_beauty');
  const [sessions, setSessions] = useState<Record<string, ChatSession[]>>(PRESET_CHATS);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('session_beauty_1');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(PRESET_MESSAGES);
  const [chatInput, setChatInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // KB Manager states
  const [selectedDocId, setSelectedDocId] = useState<string>('doc_1');
  const [kbSearchQuery, setKbSearchQuery] = useState<string>('');
  const [retrievedResults, setRetrievedResults] = useState<any[]>([]);
  const [isSearchingKb, setIsSearchingKb] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [editingChunkText, setEditingChunkText] = useState<string>('');

  // Workflow states
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_output');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas pan & zoom states
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [viewOffset, setViewOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Settings states
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [modelTestStatus, setModelTestStatus] = useState<Record<string, 'success' | 'failed' | 'testing'>>({
    'gpt-4o': 'success',
    'claude-3-5-sonnet': 'success',
    'llama-3-8b-instruct': 'failed'
  });
  const [newModelConfig, setNewModelConfig] = useState({
    provider: 'openai',
    modelId: '',
    apiKey: '',
    temperature: 0.7,
    topP: 1.0
  });

  // Automatically sync session active state when tab changes or activeAppId changes
  useEffect(() => {
    const list = sessions[activeAppId] || [];
    if (list.length > 0) {
      setSelectedSessionId(list[0].id);
    }
  }, [activeAppId]);

  // Create customized notification logs
  const addLog = (level: 'info' | 'warn' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const newLog: SystemLog = {
      id: `log_${Date.now()}`,
      time,
      level,
      message
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Switch chat session helper
  const handleAddNewSession = () => {
    const sessionNum = (sessions[activeAppId]?.length || 0) + 1;
    const newSessionId = `session_${activeAppId}_${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: `新对话 #${sessionNum}`,
      appId: activeAppId,
      updatedAt: '刚刚',
      tags: ['调试']
    };

    setSessions(prev => ({
      ...prev,
      [activeAppId]: [newSession, ...(prev[activeAppId] || [])]
    }));

    setMessages(prev => ({
      ...prev,
      [newSessionId]: [
        {
          id: `m_init_${Date.now()}`,
          sessionId: newSessionId,
          sender: 'system',
          text: `已创建独立调试会话。您可以输入化妆品的任何专业成分或业务问题进行测试。`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }));

    setSelectedSessionId(newSessionId);
    addLog('info', `用户创建了数字客服 [${apps.find(a => a.id === activeAppId)?.name}] 的新对话会话`);
  };

  // Execute interactive chat powered by real Express /api/chat route
  const handleSendQuery = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isGenerating) return;

    const query = chatInput;
    setChatInput('');

    const timeString = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sessionId: selectedSessionId,
      sender: 'user',
      text: query,
      time: timeString
    };

    // Append user message immediately
    const sessionMsgs = messages[selectedSessionId] || [];
    setMessages(prev => ({
      ...prev,
      [selectedSessionId]: [...sessionMsgs, userMsg]
    }));

    setIsGenerating(true);

    // Get current linked configuration
    const activeApp = apps.find(a => a.id === activeAppId);
    const linkedNode = nodes.find(n => n.type === 'ai_chat') || nodes[4];
    const systemPrompt = linkedNode?.config?.systemPrompt || '你是一个专业高效的 AI 智能客服。';
    const temperature = linkedNode?.config?.temperature ?? 0.4;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...sessionMsgs, userMsg],
          appId: activeAppId,
          systemPrompt,
          temperature
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sessionId: selectedSessionId,
        sender: 'assistant',
        text: data.text,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        metadata: data.metadata
      };

      setMessages(prev => ({
        ...prev,
        [selectedSessionId]: [...(prev[selectedSessionId] || []), aiMsg]
      }));

      addLog('info', `对话会话 [${selectedSessionId}] 收到成功的 AI 回答 (延迟: ${data.metadata?.latency || '0.5s'}, token数: ${data.metadata?.tokens || 0})`);
    } catch (err: any) {
      console.error('Failed to query backend chat API:', err);
      
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sessionId: selectedSessionId,
        sender: 'assistant',
        text: '⚠️ 抱歉，连接到 Stitch 智能处理后台时发生了一些故障。请确保服务运行正常并且已连接了数据库。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          latency: '1.2s',
          tokens: 0,
          model: 'Stitch Core (Offline Warning)'
        }
      };

      setMessages(prev => ({
        ...prev,
        [selectedSessionId]: [...(prev[selectedSessionId] || []), errorMsg]
      }));
      addLog('error', `向 AI 数字客服提问失败: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulated KB upload process
  const handleSimulateUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newDoc: KBDocument = {
              id: `doc_${Date.now()}`,
              name: file.name,
              type: file.name.split('.').pop()?.toUpperCase() as any || 'TXT',
              uploadTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
              status: 'done',
              chunkCount: Math.floor(25 + Math.random() * 80)
            };

            setDocs(prev => [newDoc, ...prev]);

            // Create simulated chunks
            const baseChunkId = `chunk_${Date.now()}`;
            const mockChunks: KBChunk[] = [
              {
                id: `${baseChunkId}_1`,
                docId: newDoc.id,
                docName: newDoc.name,
                chunkNumber: 1,
                wordCount: 140,
                text: `[解析段落 #1] 关于 [${file.name}] 的基本规范。产品开发部门表示：这批新的水乳产品设计不包含任何香料、任何重金属添加成分，通过国内三甲皮肤医院联合敏感度测试。`
              },
              {
                id: `${baseChunkId}_2`,
                docId: newDoc.id,
                docName: newDoc.name,
                chunkNumber: 2,
                wordCount: 185,
                text: `[解析段落 #2] 关于 [${file.name}] 的售后物流规则。若消费者在极速活动或普通期间内产生发错货或少发情况，客服必须在3小时内安排顺丰补发，并免费赠送一片敏感肌氨基酸面膜作为补偿。`
              }
            ];

            setChunks(prev => [...prev, ...mockChunks]);
            setSelectedDocId(newDoc.id);
            setIsUploading(false);
            addLog('info', `知识库新增文档 [${file.name}] 解析完毕，生成 ${newDoc.chunkCount} 个独立切片片段`);
          }, 300);
          return 100;
        }
        return p + 25;
      });
    }, 200);
  };

  // Simulated Quick Retrieval test
  const handleKbSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!kbSearchQuery.trim()) return;

    setIsSearchingKb(true);
    setTimeout(() => {
      const qLower = kbSearchQuery.toLowerCase();
      const results = chunks.map(chunk => {
        let score = 0.12 + Math.random() * 0.15;
        if (qLower.includes('氨基酸') && chunk.text.includes('氨基酸')) score += 0.68;
        if (qLower.includes('过敏') && chunk.text.includes('过敏')) score += 0.72;
        if (qLower.includes('玻色因') && chunk.text.includes('玻色因')) score += 0.75;
        if (qLower.includes('视黄醇') && chunk.text.includes('视黄醇')) score += 0.75;
        
        return {
          ...chunk,
          score: parseFloat(Math.min(score, 0.98).toFixed(2))
        };
      }).filter(r => r.score > 0.25).sort((a, b) => b.score - a.score);

      setRetrievedResults(results);
      setIsSearchingKb(false);
      addLog('info', `执行检索测试 [${kbSearchQuery}] 解析完成，共召回了 ${results.length} 个阈值相关的切片信息`);
    }, 450);
  };

  // Edit chunk text inplace
  const saveChunkText = () => {
    if (!selectedChunkId) return;
    setChunks(prev => prev.map(c => c.id === selectedChunkId ? { ...c, text: editingChunkText } : c));
    addLog('info', `管理员手动微调并保存了知识库片段 ID [${selectedChunkId}] 的语义文本`);
    setSelectedChunkId(null);
  };

  // Draggable Node interactions
  const handleNodeMouseDown = (e: MouseEvent, nodeId: string) => {
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // Calculate offset relative to canvas, accounting for view offset
      dragOffset.current = {
        x: e.clientX - rect.left - viewOffset.x - node.x,
        y: e.clientY - rect.top - viewOffset.y - node.y
      };
    }
    e.stopPropagation();
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (draggingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // Calculate relative coordinates inside the grid canvas bounds safely, accounting for view offset
      const newX = e.clientX - rect.left - viewOffset.x - dragOffset.current.x;
      const newY = e.clientY - rect.top - viewOffset.y - dragOffset.current.y;
      
      // Restrict drag boundaries (allow larger area for panned view)
      const boundedX = Math.max(-500, Math.min(newX, 2000));
      const boundedY = Math.max(-500, Math.min(newY, 1500));

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: boundedX, y: boundedY } : n));
    } else if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setViewOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingNodeId) {
      addLog('info', `调整了工作流节点 [${nodes.find(n => n.id === draggingNodeId)?.name}] 在画布上的位置坐标`);
      setDraggingNodeId(null);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
    // Only start panning if clicking on empty canvas (not on a node)
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest('svg')) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.3, Math.min(3, zoom + delta));
    setZoom(newZoom);
  };

  // Add new node template node
  const handleAddPaletteNode = (type: any, label: string) => {
    const ids = nodes.map(n => parseInt(n.id.split('_')[1])).filter(x => !isNaN(x));
    const nextVal = ids.length ? Math.max(...ids) + 1 : 1;
    const newNode: WorkflowNode = {
      id: `node_${nextVal}`,
      name: `新${label}_${nextVal}`,
      type,
      x: 150 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      config: {
        model: 'gemini-3.5-flash',
        systemPrompt: '设定通用系统提示词...',
        temperature: 0.5
      }
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    addLog('info', `添加了新节点 [${newNode.name}] 到可视化设计画布中`);
  };

  // Model key simulation save
  const handleSaveNewModel = (e: FormEvent) => {
    e.preventDefault();
    if (!newModelConfig.modelId) return;

    setModelTestStatus(prev => ({
      ...prev,
      [newModelConfig.modelId]: 'testing'
    }));

    setIsModelModalOpen(false);
    addLog('info', `开始测试新增加的模型 [${newModelConfig.modelId}] (${newModelConfig.provider}) 的 API 连通可用性`);

    setTimeout(() => {
      const isSuccess = newModelConfig.apiKey.length > 5;
      setModelTestStatus(prev => ({
        ...prev,
        [newModelConfig.modelId]: isSuccess ? 'success' : 'failed'
      }));

      addLog(isSuccess ? 'info' : 'error', `模型 [${newModelConfig.modelId}] 连通性测试完毕: ${isSuccess ? '✅ API 连接正常' : '❌ API Key 无效或超时限制'}`);
    }, 1500);
  };

  return (
    <div className="bg-surface text-on-background font-sans min-h-screen flex hover:outline-none antialiased">
      {/* Sidebar navigation */}
      <aside className="w-[260px] shrink-0 border-r border-outline-variant bg-surface-container-low flex flex-col fixed left-0 top-0 h-full z-40 transition-transform duration-200">
        <div className="px-6 py-6 border-b border-outline-variant h-20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">ST</div>
          <div className="flex flex-col">
            <span className="font-semibold text-primary tracking-wide text-md">AI Staff</span>
            <span className="text-xs text-on-surface-variant font-mono">Automation Unit</span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'dashboard' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <LayoutDashboard size={18} />
            <span>工作台首页</span>
          </button>

          <button 
            onClick={() => setActiveTab('dialogue')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'dialogue' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <MessageSquare size={18} />
            <span>对话管理 (调试)</span>
          </button>

          <button 
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'knowledge' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <Database size={18} />
            <span>知识库管理</span>
          </button>

          <button 
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'workflow' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <GitFork size={18} className="rotate-90" />
            <span>工作流编排 (DAG)</span>
          </button>

          <button 
            onClick={() => setActiveTab('apps')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'apps' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <Grid2X2 size={18} />
            <span>应用资产管理</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'analytics' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <BarChart3 size={18} />
            <span>运行数据看板</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'settings' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <Settings size={18} />
            <span>系统设置</span>
          </button>
        </nav>

        {/* User Account Bar */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">Admin Team</p>
              <p className="text-[10px] text-on-surface-variant font-mono truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col ml-[260px] min-w-0 min-h-screen">
        {/* Top Navbar Header */}
        <header className="h-20 border-b border-outline-variant px-8 flex items-center justify-between sticky top-0 bg-surface z-30 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-md font-semibold text-primary font-mono tracking-tight uppercase">AI Staff</h2>
            <div className="w-px h-5 bg-outline-variant"></div>
            <div className="bg-primary-container/25 text-primary text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 shadow-sm">
              <Sparkles size={12} className="animate-pulse" />
              <span>智能决策就绪 ({apps.filter(a => a.status === 'running').length}个数字员工运行中)</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant font-mono">
              <Clock size={12} />
              <span>当前系统时间: 2026-05-25 (UTC)</span>
            </span>

            <div className="flex items-center gap-2 border-l border-outline-variant pl-4">
              <button 
                className="p-2 hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-xl transition-all relative"
                onClick={() => addLog('info', '点击查看了通知，目前暂无新待办')}
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
              </button>
              <button 
                className="p-2 hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-xl transition-all"
                onClick={() => addLog('info', '系统常见帮助指南加载中... 请阅读文档页获取全部提示词高级用例')}
              >
                <HelpCircle size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Target Tab View Contents */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-on-surface">工作台首页概览</h1>
                  <p className="text-sm text-on-surface-variant mt-1">今天的数据检索命中良好，AI 决策单元处于健康就绪状态。</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-surface-container px-4 py-2.5 rounded-xl border border-outline-variant flex items-center gap-2 text-xs font-semibold text-on-surface">
                    <Clock size={14} /> 2026-05-25 今日数据
                  </div>
                  <button 
                    onClick={() => {
                      addLog('info', '后台正在打包美妆线与行政模块的运行周度数据底册报表...');
                      alert('已开始后台导出美妆大盘及知识抓取审计报表(Excel)，请查看日志面板。');
                    }}
                    className="bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1 shadow-sm"
                  >
                    导出报表
                  </button>
                </div>
              </div>

              {/* 4 Core Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col gap-4 shadow-sm relative group hover:border-primary transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-on-surface-variant">总对话提问量</span>
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                      <MessageSquare size={14} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-on-surface">24,592</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs text-success-beauty-green font-bold flex items-center gap-0.5">
                        <TrendingUp size={12} /> +12.5%
                      </span>
                      <span className="text-xs text-on-surface-variant">较昨日环比</span>
                    </div>
                  </div>
                  {/* High Fidelity Interactive Sparkline */}
                  <div className="mt-1 pt-1 border-t border-outline-variant/30">
                    <Sparkline 
                      data={SPARKLINE_DATA_DIALOGUES} 
                      color="#65558f" 
                      gradientId="sparkline-primary" 
                    />
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col gap-4 shadow-sm group hover:border-primary transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-on-surface-variant">知识库召回率</span>
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                      <Database size={14} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-on-surface">89.4%</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs text-success-beauty-green font-bold flex items-center gap-0.5">
                        <TrendingUp size={12} /> +2.1%
                      </span>
                      <span className="text-xs text-on-surface-variant">较昨日环比</span>
                    </div>
                  </div>
                  {/* High Fidelity Interactive Sparkline */}
                  <div className="mt-1 pt-1 border-t border-outline-variant/30">
                    <Sparkline 
                      data={SPARKLINE_DATA_RECALL} 
                      color="#625b71" 
                      gradientId="sparkline-secondary" 
                    />
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col gap-4 shadow-sm group hover:border-primary transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-on-surface-variant">用户评估满意度</span>
                    <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                      <Sparkles size={14} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-on-surface">4.8/5.0</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs text-on-surface-variant font-semibold flex items-center gap-0.5">
                        ― 0.0%
                      </span>
                      <span className="text-xs text-on-surface-variant">较昨日持平</span>
                    </div>
                  </div>
                  {/* High Fidelity Interactive Sparkline */}
                  <div className="mt-1 pt-1 border-t border-outline-variant/30">
                    <Sparkline 
                      data={SPARKLINE_DATA_SATISFACTION} 
                      color="#7d5260" 
                      gradientId="sparkline-tertiary" 
                    />
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col gap-4 shadow-sm group hover:border-primary transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-on-surface-variant">平均响应时长</span>
                    <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                      <Clock size={14} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-on-surface">1.2s</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs text-success-beauty-green font-bold flex items-center gap-0.5 font-mono">
                        ↓ 0.3s
                      </span>
                      <span className="text-xs text-on-surface-variant">响应时长优化达标</span>
                    </div>
                  </div>
                  {/* High Fidelity Interactive Sparkline */}
                  <div className="mt-1 pt-1 border-t border-outline-variant/30">
                    <Sparkline 
                      data={SPARKLINE_DATA_LATENCY} 
                      color="#ba1a1a" 
                      gradientId="sparkline-error" 
                    />
                  </div>
                </div>
              </div>

              {/* Middle Grid Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Apps catalog brief status */}
                <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-on-surface">最近主推或活动的数字员工</h3>
                    <span className="text-[10px] bg-primary-container/25 text-primary px-2 py-0.5 rounded font-bold font-mono">活跃数: 2</span>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    {apps.map(app => (
                      <div 
                        key={app.id}
                        onClick={() => {
                          setActiveAppId(app.id);
                          setActiveTab('dialogue');
                          addLog('info', `从仪表盘点击直接拉起应用调试: [${app.name}]`);
                        }}
                        className="flex items-center gap-4 p-3 rounded-xl border border-outline-variant bg-surface hover:border-primary transition-all cursor-pointer group"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${app.avatarType === 'beauty' ? 'bg-primary-container text-primary' : app.avatarType === 'shipping' ? 'bg-secondary-container text-secondary' : 'bg-tertiary-container text-tertiary'}`}>
                          <Bot size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors truncate">{app.name}</h4>
                          <span className="text-[10px] text-on-surface-variant font-mono">版本: v1.2.0 • 默认检索</span>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full ${app.status === 'running' ? 'bg-status-online shadow-[0_0_8px_rgba(76,175,80,0.4)]' : 'bg-outline-variant'}`}></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ High Frequency Bar Charts */}
                <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-sm text-on-surface">高频问题 TOP 排行榜 (美妆客服 / 内部政务热词)</h3>
                    <div className="flex bg-surface-container p-0.5 rounded-lg border border-outline-variant text-[11px] font-semibold text-on-surface-variant font-mono">
                      <span className="bg-surface text-on-surface px-3 py-1 rounded-md shadow-sm">本周</span>
                      <span className="px-3 py-1 text-on-surface-variant hover:text-on-surface cursor-pointer">本月</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    {[
                      { label: '温和纯净氨基酸与洁面安全性', count: 3421, pct: '92%' },
                      { label: '开封过敏特殊售后政策及流程', count: 2810, pct: '80%' },
                      { label: '玻色因10%黄金抗老复提打底', count: 1942, pct: '62%' },
                      { label: '顺丰大包闪电补寄赔付规定', count: 1205, pct: '42%' },
                      { label: '带薪福利休假与飞书报销冲销', count: 856, pct: '28%' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-28 text-right text-xs font-semibold text-on-surface-variant truncate">{item.label}</div>
                        <div className="flex-1 h-6 bg-surface-container rounded-lg overflow-hidden flex items-center relative border border-outline-variant/30">
                          <div 
                            className="bg-primary hover:bg-opacity-95 h-full rounded-r transition-all duration-500"
                            style={{ width: item.pct }}
                          ></div>
                          <span className="absolute left-3 text-[10px] font-bold text-white font-mono drop-shadow-md">{item.count} 次提问</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row Information */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* System running Logs */}
                <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-on-surface">系统运行与审计日志</h3>
                    <button 
                      onClick={() => addLog('info', '全面重新刷新拉取了一遍服务日志目录...')}
                      className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-all"
                    >
                      <RefreshCw size={14} className="animate-spin-slow hover:text-primary" />
                    </button>
                  </div>

                  <div className="border border-outline-variant/40 rounded-xl overflow-hidden flex-1 flex flex-col">
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-surface-container-low border-b border-outline-variant/70 text-xs font-bold text-on-surface-variant">
                      <div className="col-span-2 font-mono">时间</div>
                      <div className="col-span-2">日志级别</div>
                      <div className="col-span-8">日志详细事件描述</div>
                    </div>
                    
                    <div className="flex-1 max-h-[220px] overflow-y-auto">
                      {logs.map(log => (
                        <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-outline-variant/30 text-xs items-center hover:bg-surface-container transition-all">
                          <div className="col-span-2 font-mono text-on-surface-variant">{log.time}</div>
                          <div className="col-span-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${log.level === 'info' ? 'bg-primary-container/20 text-primary' : log.level === 'warn' ? 'bg-error-container/20 text-error' : 'bg-error text-on-error'}`}>
                              {log.level.toUpperCase()}
                            </span>
                          </div>
                          <div className="col-span-8 text-on-surface font-medium truncate">{log.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pie chart dialogue distribution */}
                <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-on-surface">业务场景提问占比</h3>
                  </div>

                  <div className="flex-1 flex items-center justify-center gap-8 py-2">
                    {/* SVG Pie Chart representation for absolute stability on React 19 */}
                    <div className="w-32 h-32 relative flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        {/* Circle segment 1: 60% (0 to 60) code primary */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#4f378a" strokeWidth="4" strokeDasharray="60 40" strokeDashoffset="0"></circle>
                        {/* Circle segment 2: 25% (60 to 85) code secondary */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#625b71" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-60"></circle>
                        {/* Circle segment 3: 15% (85 to 100) code tertiary */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#7d5260" strokeWidth="4" strokeDasharray="15 85" strokeDashoffset="-85"></circle>
                      </svg>
                      <div className="absolute inset-0 m-auto w-20 h-20 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center border border-outline-variant/45 shadow-inner">
                        <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">总提问</span>
                        <span className="text-md font-extrabold text-on-surface font-mono">24.5K</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 bg-surface p-4 rounded-xl border border-outline-variant/60">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded bg-primary"></div>
                        <span className="text-on-surface-variant font-medium w-24">外部客服咨询</span>
                        <span className="font-extrabold font-mono text-on-surface">60%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded bg-secondary"></div>
                        <span className="text-on-surface-variant font-medium w-24">内部行政问答</span>
                        <span className="font-extrabold font-mono text-on-surface">25%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded bg-tertiary"></div>
                        <span className="text-on-surface-variant font-medium w-24">IT/常规支持</span>
                        <span className="font-extrabold font-mono text-on-surface">15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIALOGUE PLAYGROUND */}
          {activeTab === 'dialogue' && (
            <div className="grid grid-cols-12 gap-8 h-[calc(100vh-180px)] min-h-[580px] animate-fadeIn">
              {/* Left Column: Preset sessions select & toggle App */}
              <div className="col-span-3 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">选择调试数字员工</label>
                  <select 
                    value={activeAppId}
                    onChange={(e) => setActiveAppId(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-xs font-semibold text-on-surface hover:border-primary transition-all focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {apps.map(app => (
                      <option key={app.id} value={app.id}>{app.name} {app.status === 'disabled' ? '(已停用)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full h-px bg-outline-variant"></div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">历史与调试会话</span>
                  <button 
                    onClick={handleAddNewSession}
                    className="p-1 hover:bg-surface-container text-primary rounded-lg border border-outline-variant transition-all hover:scale-105"
                    title="新对话"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {(sessions[activeAppId] || []).length === 0 ? (
                    <div className="text-center py-8 text-xs text-on-surface-variant font-medium italic">暂无测试会话。点加号新建。</div>
                  ) : (
                    (sessions[activeAppId] || []).map(sess => (
                      <div 
                        key={sess.id}
                        onClick={() => setSelectedSessionId(sess.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${selectedSessionId === sess.id ? 'bg-primary-container/15 border-primary text-primary font-medium' : 'bg-surface border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-on-surface'}`}
                      >
                        <h4 className="text-xs font-semibold truncate pr-4">{sess.title}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] font-mono opacity-80">{sess.updatedAt}</span>
                          <div className="flex gap-1.5">
                            {sess.tags?.map((t, i) => (
                              <span key={i} className="text-[9px] bg-surface-container border border-outline-variant/40 px-1.5 py-0.5 rounded text-on-surface-variant font-mono">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Middle Column: Chat view logs */}
              <div className="col-span-6 bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col shadow-sm overflow-hidden">
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-outline-variant bg-surface flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-online animate-pulse"></span>
                    <h3 className="font-bold text-sm text-on-surface">
                      调试: {apps.find(a => a.id === activeAppId)?.name || '员工'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => {
                      setMessages(prev => ({
                        ...prev,
                        [selectedSessionId]: [
                          {
                            id: `m_init_${Date.now()}`,
                            sessionId: selectedSessionId,
                            sender: 'system',
                            text: '上下文已清空。您可以开始新的调试会话。',
                            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                          }
                        ]
                      }));
                      addLog('info', `清空了会话 [${selectedSessionId}] 的历史上下文`);
                    }}
                    className="text-xs font-semibold text-primary hover:bg-primary-container/20 px-3 py-1.5 rounded-xl border border-outline-variant transition-all hover:scale-102 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> 清除上下文
                  </button>
                </div>

                {/* Messages body */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-surface">
                  {(messages[selectedSessionId] || []).map((msg) => {
                    if (msg.sender === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <span className="bg-surface-container px-3 py-1 rounded-xl text-[10px] text-on-surface-variant font-mono border border-outline-variant/40 shadow-inner flex items-center gap-1.5">
                            <Info size={11} /> {msg.text}
                          </span>
                        </div>
                      );
                    }

                    const isUser = msg.sender === 'user';
                    return (
                      <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-semibold text-xs shrink-0 ${isUser ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-primary border-outline-variant'}`}>
                          {isUser ? <User size={14} /> : <Bot size={14} />}
                        </div>

                        {/* Content bubble */}
                        <div className="space-y-1">
                          <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-container-low text-on-surface border border-outline-variant rounded-tl-none font-medium'}`}>
                            {msg.text}

                            {/* Reference highlights inside assistant view */}
                            {msg.metadata?.hits && msg.metadata.hits.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-outline-variant bg-surface-container-lowest/70 p-2.5 rounded-lg border border-outline-variant/50 text-[10px] text-on-surface-variant flex flex-col gap-1.5 font-sans">
                                <span className="font-bold flex items-center gap-1 text-primary">
                                  <FileText size={11} /> 命中的知识库片段参考:
                                </span>
                                {msg.metadata.hits.map((hit, i) => (
                                  <div key={i} className="bg-surface p-2 rounded border border-outline-variant/30 leading-normal">
                                    <span className="font-semibold text-[9px] font-mono text-primary truncate block mb-1">
                                      {hit.docName} #片段{hit.chunkNumber} (置信度: {(hit.score * 100).toFixed(0)}%)
                                    </span>
                                    <p className="italic line-clamp-2">" {hit.text} "</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className={`text-[9px] text-on-surface-variant font-mono px-1 flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <span>{msg.time}</span>
                            {msg.metadata?.latency && (
                              <span className="font-bold text-primary">延迟: {msg.metadata.latency}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing processing indicator */}
                  {isGenerating && (
                    <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                      <div className="w-8 h-8 rounded-full bg-surface-container-low text-primary border border-outline-variant flex items-center justify-center animate-spin-slow">
                        <Bot size={14} />
                      </div>
                      <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded-2xl rounded-tl-none flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat input box */}
                <form onSubmit={handleSendQuery} className="p-4 border-t border-outline-variant bg-surface-container-low flex flex-col gap-2">
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-2 flex items-center shadow-inner group focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="输入测试消息，Shift + Enter 换行... 可向数字客服提问成分、过敏或年假细节"
                      className="flex-1 bg-transparent px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || isGenerating}
                      className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono px-1">
                    <span>支持根据挂载知识库切片全链路检索推理</span>
                    <span>双击输入框触发快捷提问</span>
                  </div>
                </form>
              </div>

              {/* Right Column: Diagnostic analytics & active links */}
              <div className="col-span-3 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-4 shadow-sm h-full overflow-y-auto">
                <div>
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">性能调试与性能诊断</h3>
                  
                  {/* Miniature stats info metadata */}
                  {(() => {
                    const sessionMsgs = messages[selectedSessionId] || [];
                    const lastAiMsg = [...sessionMsgs].reverse().find(m => m.sender === 'assistant');
                    const meta = lastAiMsg?.metadata;

                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-surface border border-outline-variant/60 rounded-xl p-3">
                            <span className="text-[10px] text-on-surface-variant block leading-tight font-medium">总模型延时</span>
                            <span className="text-sm font-extrabold text-primary font-mono block mt-1">
                              {meta?.latency || '―'}
                            </span>
                          </div>
                          <div className="bg-surface border border-outline-variant/60 rounded-xl p-3">
                            <span className="text-[10px] text-on-surface-variant block leading-tight font-medium">Token 消耗统计</span>
                            <span className="text-sm font-extrabold text-on-surface block mt-1 font-mono">
                              {meta?.tokens || '―'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-surface border border-outline-variant/60 rounded-xl p-3.5 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant font-medium">使用模型:</span>
                            <span className="font-mono font-bold text-primary">{meta?.model || 'gemini-3.5-flash'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant font-medium">推理温度 (Temp):</span>
                            <span className="font-mono font-bold">0.4</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant font-medium">逻辑深度 (TopP):</span>
                            <span className="font-mono font-bold">0.95</span>
                          </div>
                        </div>

                        <div className="w-full h-px bg-outline-variant/60"></div>

                        {/* Recognized customer intent logs */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">大模型判定意图与实体</span>
                          <div className="flex flex-wrap gap-1.5">
                            {qLowerMatchesIntents(sessionMsgs) ? (
                              <>
                                <span className="bg-primary-container/20 text-primary px-2.5 py-1 rounded text-[10px] border border-primary/20 font-semibold">
                                  ● 售后/过敏红肿
                                </span>
                                <span className="bg-secondary-container/30 text-secondary px-2.5 py-1 rounded text-[10px] border border-secondary/20 font-semibold">
                                  ● 皮肤退换绿通
                                </span>
                              </>
                            ) : qLowerMatchesAdmin(sessionMsgs) ? (
                              <>
                                <span className="bg-tertiary-container/30 text-tertiary px-2.5 py-1 rounded text-[10px] border border-tertiary/20 font-semibold font-mono">
                                  ● HR行政/普通税票
                                </span>
                                <span className="bg-primary-container/20 text-primary px-2.5 py-1 rounded text-[10px] border border-primary/20 font-semibold font-mono">
                                  ● 冲账周期打款
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] italic text-on-surface-variant">暂无捕获实体，请输入并发送提问</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Fast simulated tester suggestions */}
                <div className="mt-auto bg-surface p-3.5 rounded-xl border border-outline-variant">
                  <span className="text-[10px] font-bold text-on-surface-variant block mb-2 uppercase tracking-wider">快捷测试提问</span>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setChatInput('这款洗面奶适合红肿过敏皮肤使用吗？')}
                      className="text-left text-[11px]  hover:text-primary leading-snug hover:underline truncate"
                    >
                      💡 适合敏感肌洗面奶吗？
                    </button>
                    <button 
                      onClick={() => setChatInput('我买的产品使用过敏怎么申请全额退款？')}
                      className="text-left text-[11px] hover:text-primary leading-snug hover:underline truncate"
                    >
                      💡 过敏极速退货绿色通道流程
                    </button>
                    <button 
                      onClick={() => setChatInput('Stitch 年假有多少天，车贴发票怎么开？')}
                      className="text-left text-[11px] hover:text-primary leading-snug hover:underline truncate"
                    >
                      💡 行政发票开头与报销周期
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KNOWLEDGE BASE */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
                    <span>知识库列表</span>
                    <ChevronRight size={12} />
                    <span className="text-on-surface font-bold">美容护肤产品知识库_V2</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-on-surface mt-2">美容护肤产品知识库_V2</h2>
                  <p className="text-xs text-on-surface-variant mt-1 leading-normal">存储并索引公司主打护肤品的成分解析手册、质检报告、日常过敏话术本、公司行政报销等多类内容。</p>
                </div>

                <div className="flex gap-4 scroll-m-1">
                  <div className="bg-surface-container px-4 py-2 border border-outline-variant rounded-xl min-w-[120px] text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">总挂载文档</span>
                    <span className="text-lg font-extrabold text-primary block mt-0.5 font-mono">{docs.length} 个</span>
                  </div>
                  <div className="bg-surface-container px-4 py-2 border border-outline-variant rounded-xl min-w-[120px] text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">已切分切片</span>
                    <span className="text-lg font-extrabold text-primary block mt-0.5 font-mono">
                      {docs.reduce((sum, d) => sum + d.chunkCount, 0) + chunks.length} 段
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload component trigger */}
              <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 items-center shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <label className="bg-primary text-on-primary hover:opacity-90 px-5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer relative shadow-sm transition-all hover:scale-102">
                    <Upload size={14} /> 上传文档资料
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.xlsx,.txt,.md"
                      onChange={handleSimulateUpload}
                      className="hidden" 
                    />
                  </label>
                  {isUploading && (
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                      <div className="w-24 bg-surface-container h-2.5 rounded-full overflow-hidden border border-outline-variant">
                        <div className="bg-primary h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-mono animate-pulse">解析入库中 {uploadProgress}%</span>
                    </div>
                  )}
                </div>

                {/* Quick semantic retrieval playground */}
                <form onSubmit={handleKbSearch} className="relative w-full md:w-[380px] flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={14} />
                    <input 
                      type="text"
                      value={kbSearchQuery}
                      onChange={(e) => setKbSearchQuery(e.target.value)}
                      placeholder="快速测试知识召回..."
                      className="w-full bg-surface border border-outline-variant rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-outline text-on-surface focus:border-primary"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSearchingKb || !kbSearchQuery.trim()}
                    className="bg-surface-container-high text-on-surface hover:bg-surface-container border border-outline-variant hover:border-primary px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
                  >
                    检索
                  </button>
                </form>
              </div>

              {/* Main Knowledge Base Panels split */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-380px)] min-h-[460px]">
                {/* Document List Panel */}
                <div className="xl:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col shadow-sm overflow-hidden h-full">
                  <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-surface-container-low border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <div className="col-span-5">文档名称</div>
                    <div className="col-span-2">类型</div>
                    <div className="col-span-3">上传时间</div>
                    <div className="col-span-2 text-right">已解切片</div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {docs.map(doc => (
                      <div 
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`grid grid-cols-12 gap-2 px-6 py-4 border-b border-outline-variant/40 items-center justify-between cursor-pointer transition-all group ${selectedDocId === doc.id ? 'bg-primary-container/10 border-l-4 border-primary' : 'hover:bg-surface-container/50'}`}
                      >
                        <div className="col-span-5 flex items-center gap-3">
                          <FileText size={16} className={selectedDocId === doc.id ? 'text-primary' : 'text-on-surface-variant'} />
                          <span className={`text-xs font-semibold truncate ${selectedDocId === doc.id ? 'text-primary font-bold' : 'text-on-surface'}`}>{doc.name}</span>
                        </div>
                        <div className="col-span-2 text-xs text-on-surface-variant font-mono">{doc.type}</div>
                        <div className="col-span-3 text-[11px] text-on-surface-variant font-mono">{doc.uploadTime}</div>
                        <div className="col-span-2 text-right text-xs font-bold text-on-surface font-mono">
                          {doc.status === 'done' ? (doc.chunkCount || chunks.filter(c => c.docId === doc.id).length || 142) : doc.status === 'parsing' ? '⌛中...' : '❌ 失败'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column details preview / Semantic Search Results */}
                <div className="xl:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col shadow-sm overflow-hidden h-full">
                  {retrievedResults.length > 0 && kbSearchQuery.trim() ? (
                    // Display Retrieval Results Mode
                    <div className="flex flex-col h-full bg-surface-container-low">
                      <div className="px-5 py-4 bg-surface border-b border-outline-variant flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-xs text-primary flex items-center gap-1">
                          <Sparkles size={14} /> 语义检索召回片段 ({retrievedResults.length})
                        </h3>
                        <button 
                          onClick={() => {
                            setKbSearchQuery('');
                            setRetrievedResults([]);
                          }}
                          className="p-1 hover:bg-surface-container rounded-lg text-on-surface-variant"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {retrievedResults.map((resItem, i) => (
                          <div key={i} className="bg-surface p-3 rounded-xl border border-primary/20 hover:border-primary transition-all shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold font-mono">
                                相似度评分: {(resItem.score * 100).toFixed(0)}%
                              </span>
                              <span className="text-[9px] text-on-surface-variant font-mono truncate max-w-[140px]">{resItem.docName}</span>
                            </div>
                            <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">"{resItem.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Display Chunking Preview of selected Doc Mode
                    <div className="flex flex-col h-full">
                      <div className="px-5 py-4 border-b border-outline-variant bg-surface flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Database size={15} className="text-primary" />
                          <h3 className="font-bold text-xs text-on-surface">切分与切片预览</h3>
                        </div>
                        <span className="text-[10px] text-primary bg-primary-container/20 px-2.5 py-0.5 rounded font-bold font-mono">Doc: {docs.find(d => d.id === selectedDocId)?.name.split('_')[0] || '默认'}</span>
                      </div>

                      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface">
                        {chunks.filter(c => c.docId === selectedDocId).length === 0 ? (
                          <div className="text-center py-12 text-xs italic text-on-surface-variant font-semibold">该文档目前处于暂未解析或解析失败模式。</div>
                        ) : (
                          chunks.filter(c => c.docId === selectedDocId).map(chk => (
                            <div 
                              key={chk.id}
                              onClick={() => {
                                setSelectedChunkId(chk.id);
                                setEditingChunkText(chk.text);
                              }}
                              className="border border-outline-variant hover:border-primary rounded-xl p-3.5 bg-surface-container-lowest cursor-pointer transition-all group shadow-sm hover:shadow"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-bold text-primary bg-primary-container/10 px-2.5 py-0.5 rounded">#片段 {chk.chunkNumber}</span>
                                <span className="text-[9px] text-on-surface-variant font-mono">{chk.wordCount || chk.text.length} 字符</span>
                              </div>
                              <p className="text-xs text-on-surface-variant group-hover:text-on-surface leading-relaxed line-clamp-3">"{chk.text}"</p>
                              <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] text-primary flex items-center gap-0.5 font-semibold"><Edit3 size={10} />微调内容</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable chunk modal */}
              {selectedChunkId && (
                <div className="fixed inset-0 bg-inverse-surface/40 z-50 flex items-center justify-center animate-fadeIn">
                  <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-lg flex flex-col max-h-[480px]">
                    <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                      <h3 className="font-bold text-sm text-on-surface">微调并精细修正训练切片</h3>
                      <button onClick={() => setSelectedChunkId(null)} className="text-on-surface-variant hover:text-on-surface"><X size={16} /></button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                      <textarea 
                        value={editingChunkText}
                        onChange={(e) => setEditingChunkText(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-xs font-medium leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-48"
                      />
                    </div>
                    <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3 rounded-b-2xl">
                      <button onClick={() => setSelectedChunkId(null)} className="bg-surface border border-outline-variant hover:bg-surface-container text-xs px-4 py-2 rounded-xl text-on-surface font-semibold">取消</button>
                      <button onClick={saveChunkText} className="bg-primary hover:opacity-90 text-on-primary text-xs px-5 py-2 rounded-xl font-semibold shadow-sm">保存入库</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WORKFLOW EDITOR (DAG CANVAS) */}
          {activeTab === 'workflow' && (
            <div className="flex flex-col h-[calc(100vh-180px)] min-h-[580px] border border-outline-variant rounded-2xl overflow-hidden shadow-sm animate-fadeIn">
              {/* Toolbar */}
              <div className="h-14 border-b border-outline-variant bg-surface-container-low px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <GitFork size={16} className="text-primary rotate-90" />
                  <span className="font-bold text-xs text-on-surface">前缀客服助手决策流 (v1.2.0)</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      addLog('info', '工作流校验成功，目前版本 v1.2.0 已成功构建为 CJS 端点');
                      alert('已发布新逻辑！目前正在同步该流至 [美妆售前客服] 。');
                    }}
                    className="bg-primary text-on-primary hover:opacity-90 px-4 py-1.5 rounded-xl text-[11px] font-bold shadow-sm transition-all"
                  >
                    发布工作流
                  </button>
                </div>
              </div>

              {/* Main working layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Drawer Palette of node helpers */}
                <aside className="w-[180px] bg-surface-container-low border-r border-outline-variant flex flex-col py-4 px-3 shrink-0 uppercase tracking-wide gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant block mb-2 font-mono">触发及出口</span>
                    <div className="space-y-2">
                      <div 
                        onClick={() => handleAddPaletteNode('start', '开始')}
                        className="bg-surface-container-lowest border border-outline-variant hover:border-primary p-2 rounded-lg cursor-pointer flex items-center gap-2 text-xs font-semibold select-none shadow-sm transition-all active:scale-95"
                      >
                        <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
                        <span>开始节点</span>
                      </div>
                      <div 
                        onClick={() => handleAddPaletteNode('reply', '回复')}
                        className="bg-surface-container-lowest border border-outline-variant hover:border-primary p-2 rounded-lg cursor-pointer flex items-center gap-2 text-xs font-semibold select-none shadow-sm transition-all active:scale-95"
                      >
                        <span className="w-2.5 h-2.5 bg-success-beauty-green rounded-full"></span>
                        <span>回复分支</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant block mb-2 font-mono">AI 核心处理</span>
                    <div className="space-y-2">
                      <div 
                        onClick={() => handleAddPaletteNode('ai_chat', '对话')}
                        className="bg-surface-container-lowest border border-outline-variant hover:border-primary p-2 rounded-lg cursor-pointer flex items-center gap-2 text-xs font-semibold select-none shadow-sm transition-all active:scale-95"
                      >
                        <Bot size={13} className="text-primary" />
                        <span>AI 对话</span>
                      </div>
                      <div 
                        onClick={() => handleAddPaletteNode('optimize', '优化')}
                        className="bg-surface-container-lowest border border-outline-variant hover:border-primary p-2 rounded-lg cursor-pointer flex items-center gap-2 text-xs font-semibold select-none shadow-sm transition-all active:scale-95"
                      >
                        <Sparkles size={13} className="text-secondary" />
                        <span>意图优化</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant block mb-2 font-mono">条件与逻辑</span>
                    <div className="space-y-2">
                      <div 
                        onClick={() => handleAddPaletteNode('condition', '判断')}
                        className="bg-surface-container-lowest border border-outline-variant hover:border-primary p-2 rounded-lg cursor-pointer flex items-center gap-2 text-xs font-semibold select-none shadow-sm transition-all active:scale-95"
                      >
                        <Settings2 size={13} className="text-tertiary" />
                        <span>条件分流</span>
                      </div>
                      <div 
                        onClick={() => handleAddPaletteNode('knowledge_search', '知识检索')}
                        className="bg-surface-container-lowest border border-outline-variant hover:border-primary p-2 rounded-lg cursor-pointer flex items-center gap-2 text-xs font-semibold select-none shadow-sm transition-all active:scale-95"
                      >
                        <Database size={13} className="text-status-online" />
                        <span>知识检索</span>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Center dot matrix canvas workspace */}
                <div 
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onWheel={handleCanvasWheel}
                  className={`flex-1 bg-surface-container-lowest relative overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
                  style={{ 
                    backgroundImage: 'radial-gradient(#cbc4d2 1.5px, transparent 1.5px)', 
                    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                    backgroundPosition: `${viewOffset.x}px ${viewOffset.y}px`
                  }}
                >
                  <div className="absolute top-3 left-4 bg-surface/80 text-[10px] font-mono border border-outline-variant text-on-surface-variant px-3 py-1 rounded-full shadow-sm z-20">
                    💡 提示: 拖拽节点移动位置，拖拽空白处平移画布，滚轮缩放视图。
                  </div>
                  <div className="absolute top-3 right-4 bg-surface/80 text-[10px] font-mono border border-outline-variant text-on-surface-variant px-3 py-1 rounded-full shadow-sm z-20">
                    🔍 {Math.round(zoom * 100)}%
                  </div>

                  {/* SVG background connections */}
                  <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7a7582" />
                      </marker>
                    </defs>

                    {/* Start -> Optimize */}
                    {(() => {
                      const start = nodes.find(n => n.id === 'node_start');
                      const opt = nodes.find(n => n.id === 'node_optimize');
                      if (start && opt) {
                        return (
                          <path 
                            d={`M ${start.x + 150} ${start.y + 35} C ${start.x + 220} ${start.y + 35}, ${opt.x - 70} ${opt.y + 35}, ${opt.x} ${opt.y + 35}`} 
                            fill="none" 
                            stroke="#7a7582" 
                            strokeWidth="2.5" 
                            strokeDasharray="4"
                            markerEnd="url(#arrow)"
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Optimize -> Condition */}
                    {(() => {
                      const opt = nodes.find(n => n.id === 'node_optimize');
                      const cond = nodes.find(n => n.id === 'node_condition');
                      if (opt && cond) {
                        return (
                          <path 
                            d={`M ${opt.x + 150} ${opt.y + 35} C ${opt.x + 230} ${opt.y + 35}, ${cond.x - 80} ${cond.y + 35}, ${cond.x} ${cond.y + 35}`} 
                            fill="none" 
                            stroke="#7a7582" 
                            strokeWidth="2.5" 
                            markerEnd="url(#arrow)"
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Condition (Product match) -> Retrieval */}
                    {(() => {
                      const cond = nodes.find(n => n.id === 'node_condition');
                      const ret = nodes.find(n => n.id === 'node_retrieval');
                      if (cond && ret) {
                        return (
                          <path 
                            d={`M ${cond.x + 150} ${cond.y + 25} C ${cond.x + 220} ${cond.y + 25}, ${ret.x - 70} ${ret.y + 35}, ${ret.x} ${ret.y + 35}`} 
                            fill="none" 
                            stroke="#4f378a" 
                            strokeWidth="2.5" 
                            markerEnd="url(#arrow)"
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Condition (No match) -> Fallback reply */}
                    {(() => {
                      const cond = nodes.find(n => n.id === 'node_condition');
                      const fall = nodes.find(n => n.id === 'node_fallback');
                      if (cond && fall) {
                        return (
                          <path 
                            d={`M ${cond.x + 150} ${cond.y + 60} C ${cond.x + 220} ${cond.y + 60}, ${fall.x - 70} ${fall.y + 35}, ${fall.x} ${fall.y + 35}`} 
                            fill="none" 
                            stroke="#7a7582" 
                            strokeWidth="2" 
                            markerEnd="url(#arrow)"
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Retrieval -> Output ai_chat */}
                    {(() => {
                      const ret = nodes.find(n => n.id === 'node_retrieval');
                      const out = nodes.find(n => n.id === 'node_output');
                      if (ret && out) {
                        return (
                          <path 
                            d={`M ${ret.x + 150} ${ret.y + 35} C ${ret.x + 230} ${ret.y + 35}, ${out.x - 80} ${out.y + 35}, ${out.x} ${out.y + 35}`} 
                            fill="none" 
                            stroke="#4f378a" 
                            strokeWidth="2.5" 
                            markerEnd="url(#arrow)"
                            className="stroke-primary"
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Dynamic connected lines for user generated customizable nodes */}
                    {nodes.filter(n => !['node_start', 'node_optimize', 'node_condition', 'node_retrieval', 'node_output', 'node_fallback'].includes(n.id)).map(node => (
                      <circle key={node.id} cx={node.x} cy={node.y} r="3" fill="#cbc4d2" />
                    ))}
                  </svg>

                  {/* Nodes list rendering */}
                  {nodes.map(node => {
                    const isSelected = selectedNodeId === node.id;
                    const isStart = node.type === 'start';
                    const isReply = node.type === 'reply';
                    const isChat = node.type === 'ai_chat';

                    return (
                      <div 
                        key={node.id}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{ 
                          left: node.x * zoom + viewOffset.x, 
                          top: node.y * zoom + viewOffset.y,
                          width: `${150 * zoom}px`,
                          transform: `scale(${zoom})`,
                          transformOrigin: '0 0'
                        }}
                        className={`absolute bg-surface-container-lowest border rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing select-none z-10 transition-shadow ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant'}`}
                      >
                        <div className={`px-3 py-2 border-b border-outline-variant rounded-t-xl text-[11px] font-extrabold flex items-center justify-between ${isStart ? 'bg-primary/10 text-primary' : isReply ? 'bg-success-beauty-green/10 text-success-beauty-green' : isChat ? 'bg-indigo-300/10 text-primary' : 'bg-surface-container-low text-on-surface'}`}>
                          <span className="truncate">{node.name}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-primary/20"></span>}
                        </div>
                        <div className="p-2.5 text-[10px] text-on-surface-variant font-medium leading-tight h-10 line-clamp-2">
                          {node.type === 'start' ? '监听全渠道用户咨询' : node.type === 'optimize' ? 'Gemini 补全输入参数' : node.type === 'condition' ? '匹配知识分支' : node.type === 'ai_chat' ? '模型回复生成器' : node.type === 'knowledge_search' ? '相似度数据库检索' : '执行特定业务应答'}
                        </div>

                        {/* Visual Node ports connection circles */}
                        {!isStart && (
                          <div className="absolute -left-1 text-primary top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-outline bg-surface-container-lowest"></div>
                        )}
                        <div className="absolute -right-1 text-primary top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-outline bg-surface-container-lowest"></div>
                      </div>
                    );
                  })}
                </div>

                {/* Right configuration sidebar */}
                {selectedNodeId && (
                  <aside className="w-[280px] bg-surface-container-high border-l border-outline-variant flex flex-col p-4 shadow-sm shrink-0">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Settings2 size={16} className="text-primary" />
                      <span className="font-bold text-xs text-on-surface uppercase tracking-wider">节点参数配置</span>
                    </div>

                    {nodes.find(n => n.id === selectedNodeId) ? (
                      (() => {
                        const node = nodes.find(n => n.id === selectedNodeId)!;
                        return (
                          <div className="space-y-4 flex-1 flex flex-col">
                            <div>
                              <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">节点名称</label>
                              <input 
                                type="text"
                                value={node.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNodes(prev => prev.map(n => n.id === node.id ? { ...n, name: val } : n));
                                }}
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary mt-1 shadow-inner focus:border-primary"
                              />
                            </div>

                            {['ai_chat', 'optimize'].includes(node.type) && (
                              <>
                                <div>
                                  <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">选择推理模型</label>
                                  <select 
                                    value={node.config.model || 'gemini-3.5-flash'}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, config: { ...n.config, model: val } } : n));
                                    }}
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary mt-1 focus:border-primary"
                                  >
                                    <option value="gemini-3.5-flash">Google gemini-3.5-flash</option>
                                    <option value="claude-3-5-sonnet">Anthropic claude-3-5</option>
                                    <option value="gpt-4o">OpenAI gpt-4o</option>
                                    <option value="llama-3-8b-instruct">Local Llama3 (Ollama)</option>
                                  </select>
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                  <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">系统指示设定 (System Prompt)</label>
                                  <textarea 
                                    value={node.config.systemPrompt || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, config: { ...n.config, systemPrompt: val } } : n));
                                    }}
                                    className="w-full flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs mt-1 leading-relaxed text-on-surface resize-none focus:outline-none focus:ring-1 focus:ring-primary shadow-inner focus:border-primary"
                                    placeholder="输入该节点的主提示词规章..."
                                  />
                                </div>

                                <div>
                                  <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                    <span>温度系数: {node.config.temperature ?? 0.4}</span>
                                    <span className="text-primary font-bold">严谨 ── 创意</span>
                                  </div>
                                  <input 
                                    type="range"
                                    min="0"
                                    max="1.0"
                                    step="0.05"
                                    value={node.config.temperature ?? 0.4}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, config: { ...n.config, temperature: val } } : n));
                                    }}
                                    className="w-full bg-outline-variant h-1 cursor-pointer rounded-full accent-primary mt-2"
                                  />
                                </div>
                              </>
                            )}

                            {!['ai_chat', 'optimize'].includes(node.type) && (
                              <div className="bg-surface p-3.5 rounded-xl border border-outline-variant/70 text-xs text-on-surface-variant font-medium leading-relaxed">
                                💡 该类型的中间流程或数据决策参数将通过父节点工作流集中定义组装。
                                <div className="text-[10px] mt-2 bg-surface-container font-mono p-2 rounded">
                                  映射端点: {node.config.extra || '常规策略'}
                                </div>
                              </div>
                            )}

                            <button 
                              onClick={() => {
                                setNodes(prev => prev.filter(n => n.id !== node.id));
                                setSelectedNodeId('');
                                addLog('warn', `管理员在工作流画布中删除了节点 [${node.name}]`);
                              }}
                              className="text-xs text-error font-medium hover:bg-error-container/20 border border-error-container/40 p-2.5 rounded-xl text-center flex items-center justify-center gap-1 transition-all mt-auto"
                            >
                              <Trash2 size={12} /> 擦除并删除节点
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-xs italic text-on-surface-variant font-bold">请点击选中画布中节点查看</span>
                    )}
                  </aside>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: APPLICATION ASSETS CATALOG */}
          {activeTab === 'apps' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-on-surface">应用资产管理</h1>
                <p className="text-sm text-on-surface-variant mt-1">管理并启用多轮智能客服和行政客服的底层逻辑挂载，设定外服渠道和微信渠道。</p>
              </div>

              {/* Bento grid style apps */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {apps.map(app => {
                  const wfName = app.workflowId === 'wf_beauty' ? '售前咨询意图分发_v2.4' : app.workflowId === 'wf_refund' ? '标准退换货SOP_v1.0' : 'HR&行政工单分发_v0.5';
                  const docName = app.appId === 'app_admin' ? '员工手册与报销规范.md' : '2023秋季护肤品手册 / 敏感肌话术';

                  return (
                    <div 
                      key={app.id}
                      className={`relative bg-surface-container-lowest border rounded-2xl p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-all group ${app.status === 'disabled' ? 'opacity-75 grayscale-[30%]' : 'border-outline-variant hover:border-primary'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative ${app.avatarType === 'beauty' ? 'bg-primary-container text-primary' : app.avatarType === 'shipping' ? 'bg-secondary-container text-secondary' : 'bg-tertiary-container text-tertiary'}`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-25 rounded-xl"></div>
                            <Bot size={22} className="relative z-10" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{app.name}</h3>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] text-on-surface-variant font-mono">{app.type === 'external' ? '外部接待' : '企业内部'}</span>
                              <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                                <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'running' ? 'bg-status-online shadow-[0_0_8px_rgba(76,175,80,0.5)]' : 'bg-outline-variant'}`}></span>
                                {app.status === 'running' ? '运行中' : '已停用'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Slide animation toggle controller */}
                        <div 
                          onClick={() => {
                            setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: a.status === 'running' ? 'disabled' : 'running' } : a));
                            addLog(app.status === 'running' ? 'warn' : 'info', `${app.status === 'running' ? '停用' : '启用'}了应用资产: [${app.name}]`);
                          }}
                          className={`w-12 h-6 rounded-full p-0.5 cursor-pointer relative transition-all ${app.status === 'running' ? 'bg-primary' : 'bg-outline-variant'}`}
                        >
                          <div className={`w-5 h-5 bg-surface-container-lowest rounded-full transition-all flex items-center justify-center shadow-md ${app.status === 'running' ? 'translate-x-6' : 'translate-x-0'}`}>
                            {app.status === 'running' ? <Check size={10} className="text-primary font-bold" /> : <div className="w-1.5 h-1.5 bg-outline rounded-full"></div>}
                          </div>
                        </div>
                      </div>

                      {/* Display mount details */}
                      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5 space-y-3 flex-1">
                        <div className="flex items-start gap-2.5">
                          <GitFork size={13} className="text-on-surface-variant mt-0.5 rotate-90" />
                          <div>
                            <span className="text-[10px] font-bold text-on-surface-variant block">关联核心工作流</span>
                            <span className="text-xs text-on-surface block mt-0.5 truncate w-44">{wfName}</span>
                          </div>
                        </div>
                        <div className="w-full h-px bg-outline-variant/40"></div>
                        <div className="flex items-start gap-2.5">
                          <Database size={13} className="text-on-surface-variant mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-on-surface-variant block">已挂载商品知识库 ({app.knowledgeBaseIds.length})</span>
                            <span className="text-xs text-on-surface block mt-0.5 truncate w-44">{docName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Channels list bottom */}
                      <div className="flex justify-between items-center shrink-0">
                        <div>
                          <span className="text-[10px] text-on-surface-variant font-medium block mb-1">已发布渠道</span>
                          <div className="flex gap-1">
                            {app.channels.includes('web') && <span className="text-[9px] bg-primary-container/15 text-primary border border-primary/20 rounded px-2 py-0.5 font-bold">Web 插件</span>}
                            {app.channels.includes('wechat') && <span className="text-[9px] bg-secondary-container/20 text-secondary border border-secondary/20 rounded px-2 py-0.5 font-bold">微信客服</span>}
                            {app.channels.includes('api') && <span className="text-[9px] bg-tertiary-container/20 text-tertiary border border-tertiary/20 rounded px-2 py-0.5 font-bold">External API</span>}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setActiveAppId(app.id);
                              setActiveTab('dialogue');
                              addLog('info', `启动对该应用 [${app.name}] 的实时对话调试`);
                            }}
                            className="bg-surface border border-outline-variant hover:border-primary text-xs px-3.5 py-1.5 rounded-lg text-primary font-semibold transition-all hover:scale-102"
                          >
                            调试
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Create custom app mockup */}
                <div 
                  onClick={() => {
                    const nextId = `app_${Date.now()}`;
                    const customApp: AppAsset = {
                      id: nextId,
                      name: `自定义美妆客服秘书_${apps.length + 1}`,
                      type: 'external',
                      avatarType: 'it',
                      status: 'running',
                      workflowId: 'wf_beauty',
                      knowledgeBaseIds: ['kb_beauty'],
                      channels: ['web']
                    };
                    setApps([...apps, customApp]);
                    addLog('info', `新增了智能数字客服资产: [${customApp.name}]`);
                    alert(`新应用 [${customApp.name}] 已成功创建入库！`);
                  }}
                  className="bg-dashed-surface border-2 border-dashed border-outline-variant/70 hover:border-primary rounded-2xl flex flex-col justify-center items-center p-8 text-center transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center text-on-surface-variant group-hover:text-primary border border-outline-variant/60 group-hover:border-primary transition-all">
                    <Plus size={20} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors block mt-3">新建数字员工应用</span>
                  <p className="text-[10px] text-on-surface-variant mt-1 max-w-[180px]">定制专有 Cosmetics 场景、指定知识文件并在飞书或企微一键下发。</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DATA ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-on-surface">对话量及命中率数据监控</h1>
                <p className="text-sm text-on-surface-variant mt-1">展示大语言模型执行 Cosmetics 精准语义召回、错漏、客服拦截大盘走势图。</p>
              </div>

              {/* Day trends charts using animated pure vector SVGs to avoid recharts version conflict */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-xs text-on-surface mb-6 uppercase tracking-wider block">近一周系统对话量趋势</h3>
                  <div className="h-64 relative w-full flex items-end">
                    {/* Visual columns line representing weekly data */}
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      <line x1="20" y1="180" x2="380" y2="180" stroke="#cbc4d2" strokeWidth="1" />
                      <line x1="20" y1="30" x2="380" y2="30" stroke="#cbc4d2" strokeWidth="0.5" strokeDasharray="4" />
                      <line x1="20" y1="100" x2="380" y2="100" stroke="#cbc4d2" strokeWidth="0.5" strokeDasharray="4" />
                      
                      {/* Trend area pathway */}
                      <path d="M 40 160 L 90 120 L 140 140 L 190 90 L 240 70 L 290 50 L 340 38" fill="none" stroke="#4f37a8" strokeWidth="3" />
                      
                      {/* Interactive dot plotters */}
                      <circle cx="40" cy="160" r="4" fill="#4f378a" />
                      <circle cx="90" cy="120" r="4" fill="#4f378a" />
                      <circle cx="140" cy="140" r="4" fill="#4f378a" />
                      <circle cx="190" cy="90" r="4" fill="#4f378a" />
                      <circle cx="240" cy="70" r="4" fill="#4f378a" />
                      <circle cx="290" cy="50" r="4" fill="#4f378a" />
                      <circle cx="340" cy="38" r="4" fill="#4f378a" />

                      <text x="40" y="195" fontSize="9" fill="#7a7582" textAnchor="middle" fontFamily="mono">周一</text>
                      <text x="90" y="195" fontSize="9" fill="#7a7582" textAnchor="middle" fontFamily="mono">周二</text>
                      <text x="140" y="195" fontSize="9" fill="#7a7582" textAnchor="middle" fontFamily="mono">周三</text>
                      <text x="190" y="195" fontSize="9" fill="#7a7582" textAnchor="middle" fontFamily="mono">周四</text>
                      <text x="240" y="195" fontSize="9" fill="#7a7582" textAnchor="middle" fontFamily="mono">周五</text>
                      <text x="290" y="195" fontSize="9" fill="#7a7582" textAnchor="middle" fontFamily="mono">周六</text>
                      <text x="340" y="195" fontSize="9" fill="#7a7582" textAnchor="middle" fontFamily="mono">周日</text>
                    </svg>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-xs text-on-surface mb-6 uppercase tracking-wider block">知识库精准匹配率 / 无法命中拦截率</h3>
                  <div className="h-64 relative w-full">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      <line x1="20" y1="180" x2="380" y2="180" stroke="#cbc4d2" strokeWidth="1" />
                      
                      {/* Area Bars 1 */}
                      <rect x="50" y="40" width="30" height="140" fill="#2E7D32" opacity="0.8" rx="2" />
                      <rect x="90" y="150" width="30" height="30" fill="#ba1a1a" opacity="0.8" rx="2" />

                      {/* Area Bars 2 */}
                      <rect x="170" y="30" width="30" height="150" fill="#2E7D32" opacity="0.8" rx="2" />
                      <rect x="210" y="160" width="30" height="20" fill="#ba1a1a" opacity="0.8" rx="2" />

                      {/* Area Bars 3 */}
                      <rect x="290" y="20" width="30" height="160" fill="#2E7D32" opacity="0.8" rx="2" />
                      <rect x="330" y="170" width="30" height="10" fill="#ba1a1a" opacity="0.8" rx="2" />

                      <text x="85" y="195" fontSize="10" fill="#1c1b21" textAnchor="middle" fontWeight="bold">5.11-5.17</text>
                      <text x="205" y="195" fontSize="10" fill="#1c1b21" textAnchor="middle" fontWeight="bold">5.18-5.24</text>
                      <text x="325" y="195" fontSize="10" fill="#1c1b21" textAnchor="middle" fontWeight="bold">今日匹配走势</text>

                      {/* legends */}
                      <rect x="20" y="10" width="10" height="10" fill="#2E7D32" rx="1" />
                      <text x="35" y="18" fontSize="9" fill="#1c1b21">精准语义召回答复</text>
                      <rect x="140" y="10" width="10" height="10" fill="#ba1a1a" rx="1" />
                      <text x="155" y="18" fontSize="9" fill="#1c1b21">无命中转接人工</text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-on-surface">系统设置与接入模型管理</h1>
                  <p className="text-sm text-on-surface-variant mt-1">Stitch 为企业原生提供多个大型对话模型支持。可在任意 AI 工作流节点分别指定。</p>
                </div>
                <button 
                  onClick={() => setIsModelModalOpen(true)}
                  className="bg-primary text-on-primary hover:opacity-90 px-4 py-2 rounded-xl text-xs font-semibold hover:scale-102 transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus size={14} /> 添加第三方模型
                </button>
              </div>

              {/* Models grid catalog */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-2 px-6 py-3.5 bg-surface-container-low border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <div className="col-span-5">模型代号 / 专属平台提供商</div>
                  <div className="col-span-3">节点状态</div>
                  <div className="col-span-2">默认温度</div>
                  <div className="col-span-2 text-right">后台操作</div>
                </div>

                <div className="divide-y divide-outline-variant/30">
                  {[
                    { id: 'gemini-3.5-flash', name: 'gemini-3.5-flash', provider: 'Google AI Studio', temp: '0.4', active: 'success' },
                    { id: 'gpt-4o', name: 'gpt-4o', provider: 'OpenAI (企业配额)', temp: '0.7', active: 'success' },
                    { id: 'claude-3-5-sonnet', name: 'claude-3-5-sonnet', provider: 'Anthropic Proxy', temp: '0.5', active: 'success' },
                    { id: 'llama-3-8b-instruct', name: 'llama-3-8b-instruct', provider: 'Local (Ollama 节点:3000)', temp: '0.8', active: 'failed' }
                  ].map(model => (
                    <div key={model.id} className="grid grid-cols-12 gap-2 px-6 py-4 items-center justify-between hover:bg-surface-container/30 transition-all">
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface border border-outline-variant flex items-center justify-center text-primary">
                          <Cpu size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-on-surface">{model.name}</span>
                          <span className="text-[10px] text-on-surface-variant mt-0.5">{model.provider}</span>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${modelTestStatus[model.id] === 'success' || model.active === 'success' ? 'bg-status-online shadow-[0_0_8px_rgba(76,175,80,0.5)]' : modelTestStatus[model.id] === 'testing' ? 'bg-primary animate-ping' : 'bg-error shadow-[0_0_8px_rgba(186,26,26,0.5)]'}`}></span>
                        <span className="text-xs font-semibold text-on-surface">
                          {modelTestStatus[model.id] === 'success' || model.active === 'success' ? 'API 连通完美' : modelTestStatus[model.id] === 'testing' ? '正在测试连通性...' : '连接失败/不可用'}
                        </span>
                      </div>

                      <div className="col-span-2 text-xs font-bold text-on-surface-variant font-mono">{model.temp}</div>

                      <div className="col-span-2 text-right">
                        <button 
                          onClick={() => {
                            if (modelTestStatus[model.id] === 'testing') return;
                            const nid = model.id;
                            setModelTestStatus(prev => ({ ...prev, [nid]: 'testing' }));
                            addLog('info', `正在重试检测 [${nid}] 是否已接通...`);
                            setTimeout(() => {
                              setModelTestStatus(prev => ({ ...prev, [nid]: 'success' }));
                              addLog('info', `模型 [${nid}] 连接复测成功！已完成绑定。`);
                            }, 1200);
                          }}
                          className="bg-surface border border-outline-variant hover:border-primary text-xs font-semibold text-primary px-3 py-1.5 rounded-xl hover:scale-102 transition-all shadow-sm"
                        >
                          {modelTestStatus[model.id] === 'failed' || model.active === 'failed' ? '重新连接' : '测试'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Slide Modal: Add New Model */}
      {isModelModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 z-50 flex items-center justify-center animate-fadeIn">
          <form 
            onSubmit={handleSaveNewModel}
            className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-lg flex flex-col overflow-hidden max-h-[580px]"
          >
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-bold text-sm text-on-surface">添加新对接模型 API Key</h3>
              <button 
                type="button" 
                onClick={() => setIsModelModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">模型平台商 (Provider)</label>
                <select 
                  value={newModelConfig.provider}
                  onChange={(e) => setNewModelConfig(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="openai">OpenAI (SaaS)</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="ollama">Ollama (Local LLM)</option>
                  <option value="custom">自研自定义 API 端点 4</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">模型标识 (Model ID)</label>
                <input 
                  type="text"
                  required
                  placeholder="例如: gpt-4o, claude-3-opus"
                  value={newModelConfig.modelId}
                  onChange={(e) => setNewModelConfig(prev => ({ ...prev, modelId: e.target.value }))}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">API Key 凭证</label>
                <input 
                  type="password"
                  required
                  placeholder="请输入您的 sk-... 凭证字符"
                  value={newModelConfig.apiKey}
                  onChange={(e) => setNewModelConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block">默认温度 (Temp)</label>
                  <input 
                    type="number"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={newModelConfig.temperature}
                    onChange={(e) => setNewModelConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block">逻辑厚度 (Top P)</label>
                  <input 
                    type="number"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={newModelConfig.topP}
                    onChange={(e) => setNewModelConfig(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => setIsModelModalOpen(false)}
                className="bg-surface border border-outline-variant hover:bg-surface-container text-xs px-4 py-2 rounded-xl text-on-surface font-semibold"
              >
                取消
              </button>
              <button 
                type="submit"
                className="bg-primary hover:opacity-90 text-on-primary text-xs px-5 py-2 rounded-xl font-semibold shadow-sm flex items-center gap-1"
              >
                保存并验证
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Helper diagnostics functions to display active customer intents
function qLowerMatchesIntents(sessionMsgs: ChatMessage[]): boolean {
  return sessionMsgs.some(m => {
    const text = m.text.toLowerCase();
    return text.includes('过敏') || text.includes('退款') || text.includes('洗面奶');
  });
}

function qLowerMatchesAdmin(sessionMsgs: ChatMessage[]): boolean {
  return sessionMsgs.some(m => {
    const text = m.text.toLowerCase();
    return text.includes('报销') || text.includes('车费') || text.includes('发票') || text.includes('年假');
  });
}
