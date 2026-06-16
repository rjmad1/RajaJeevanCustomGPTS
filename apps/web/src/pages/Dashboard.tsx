import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Agent, Category } from '../types';
import Navbar from '../components/Navbar';
import defaultAgentsRaw from '../data/default-agents.json';
import { addAuditLog } from '../utils/auditLogger';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  
  // Statically defined categories matching original HTML
  const categories: Category[] = [
    { id: 'plan', name: 'plan', sortOrder: 1 },
    { id: 'do', name: 'do', sortOrder: 2 },
    { id: 'check', name: 'check', sortOrder: 3 },
    { id: 'act', name: 'act', sortOrder: 4 },
  ];

  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Tooltip State
  const [activeTooltip, setActiveTooltip] = useState<{
    agent: Agent;
    x: number;
    y: number;
  } | null>(null);

  // Modal State for CRUD (FAB triggered, Admins only)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentUrl, setAgentUrl] = useState('');
  const [agentDesc, setAgentDesc] = useState('');
  const [agentCat, setAgentCat] = useState('plan');

  // Backup status
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  // 1. Reconstruct and merge agents from JSON & LocalStorage
  const loadRegistry = () => {
    // Flatten default agents from JSON file
    const flattenedDefaults: Agent[] = defaultAgentsRaw.flatMap((group: any) => {
      const catId = group.category;
      const list = group.agents || [];
      return list.map((item: any) => {
        const safeName = item.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const agentId = `${catId}_${safeName}`;
        return {
          id: agentId,
          name: item.name,
          url: item.url,
          description: item.desc || '',
          categoryId: catId,
          createdBy: 'system'
        };
      });
    });

    // Load custom additions/overrides and deletions from localStorage
    const customAgentsStr = localStorage.getItem('custom_agents');
    const customAgents: Agent[] = customAgentsStr ? JSON.parse(customAgentsStr) : [];

    const deletedIdsStr = localStorage.getItem('deleted_agents');
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

    // Filter defaults (remove deleted and anything overridden by custom edits)
    const activeDefaults = flattenedDefaults.filter(
      (a) => !deletedIds.includes(a.id) && !customAgents.some((c) => c.id === a.id)
    );

    // Merge active defaults and custom agents
    const merged = [...activeDefaults, ...customAgents];
    setAgents(merged);
  };

  useEffect(() => {
    loadRegistry();
  }, []);

  // CRUD Operations
  const openAddModal = () => {
    setEditingAgent(null);
    setAgentName('');
    setAgentUrl('');
    setAgentDesc('');
    setAgentCat('plan');
    setIsModalOpen(true);
  };

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim() || !agentUrl.trim()) return;

    try {
      const customAgentsStr = localStorage.getItem('custom_agents');
      const customAgents: Agent[] = customAgentsStr ? JSON.parse(customAgentsStr) : [];

      if (editingAgent) {
        // Edit agent (if editing a default agent, it becomes a custom override)
        const updatedAgent: Agent = {
          ...editingAgent,
          name: agentName.trim(),
          url: agentUrl.trim(),
          description: agentDesc.trim(),
          categoryId: agentCat,
          updatedAt: new Date().toISOString()
        };

        const existingIdx = customAgents.findIndex((c) => c.id === editingAgent.id);
        if (existingIdx > -1) {
          customAgents[existingIdx] = updatedAgent;
        } else {
          customAgents.push(updatedAgent);
        }
      } else {
        // Create new custom agent
        const newAgent: Agent = {
          id: `custom_${Date.now()}`,
          name: agentName.trim(),
          url: agentUrl.trim(),
          description: agentDesc.trim(),
          categoryId: agentCat,
          createdBy: user?.email || 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        customAgents.push(newAgent);
      }

      localStorage.setItem('custom_agents', JSON.stringify(customAgents));
      loadRegistry();
      
      // Clean form states
      setEditingAgent(null);
      setAgentName('');
      setAgentUrl('');
      setAgentDesc('');
      setAgentCat('plan');
    } catch (err) {
      console.error("Error saving agent:", err);
      alert("Failed to save agent.");
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;
    try {
      const customAgentsStr = localStorage.getItem('custom_agents');
      let customAgents: Agent[] = customAgentsStr ? JSON.parse(customAgentsStr) : [];

      // If it exists in custom agents, delete it
      if (customAgents.some((c) => c.id === agentId)) {
        customAgents = customAgents.filter((c) => c.id !== agentId);
        localStorage.setItem('custom_agents', JSON.stringify(customAgents));
      } else {
        // Otherwise, it is a default agent, add to deletions blacklist
        const deletedIdsStr = localStorage.getItem('deleted_agents');
        const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
        if (!deletedIds.includes(agentId)) {
          deletedIds.push(agentId);
          localStorage.setItem('deleted_agents', JSON.stringify(deletedIds));
        }
      }
      
      // If we are currently editing the deleted agent, clean the form
      if (editingAgent?.id === agentId) {
        setEditingAgent(null);
        setAgentName('');
        setAgentUrl('');
        setAgentDesc('');
      }

      loadRegistry();
    } catch (err) {
      console.error("Error deleting agent:", err);
    }
  };

  // Client-side export to JSON
  const handleExportJSON = () => {
    const columns = ['plan', 'do', 'check', 'act'];
    const exportArray = columns.map((catId) => {
      return agents
        .filter((a) => a.categoryId === catId)
        .map((a) => ({
          name: a.name,
          url: a.url,
          desc: a.description
        }));
    });

    const blob = new Blob([JSON.stringify(exportArray, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "custom_gpt_backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Client-side import from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportStatus('Reading backup file...');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed) || parsed.length !== 4) {
          throw new Error("Invalid backup format. Must be a 4-column JSON array.");
        }

        setImportStatus('Merging registry... Please wait.');
        const categoriesMap = ['plan', 'do', 'check', 'act'];
        
        const customAgentsStr = localStorage.getItem('custom_agents');
        const customAgents: Agent[] = customAgentsStr ? JSON.parse(customAgentsStr) : [];

        for (let catIndex = 0; catIndex < 4; catIndex++) {
          const catId = categoriesMap[catIndex];
          const list = parsed[catIndex] || [];
          
          for (const item of list) {
            // Avoid duplicates
            const existsInMerged = agents.some(
              (a) => a.name.toLowerCase() === item.name.toLowerCase() && a.categoryId === catId
            );
            if (!existsInMerged) {
              const newAgent: Agent = {
                id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                name: item.name,
                url: item.url,
                description: item.desc || '',
                categoryId: catId,
                createdBy: user?.email || 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              customAgents.push(newAgent);
            }
          }
        }
        
        localStorage.setItem('custom_agents', JSON.stringify(customAgents));
        loadRegistry();
        
        setImportStatus('Import completed successfully!');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err: any) {
        console.error(err);
        setImportStatus(`Import failed: ${err.message}`);
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Self-Contained Portable HTML Export
  const handleEmbedAndSaveHTML = () => {
    const columns = ['plan', 'do', 'check', 'act'];
    const exportArray = columns.map((catId) => {
      return agents
        .filter((a) => a.categoryId === catId)
        .map((a) => ({
          name: a.name,
          url: a.url,
          desc: a.description
        }));
    });

    const registryString = JSON.stringify(exportArray, null, 2);

    const selfContainedHTML = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CustomGPT Hub - Shared Portable Copy</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f4f6fb;color:#1f2937;line-height:1.5;min-height:100vh}
  .header{text-align:center;padding:1.125rem;font-size:1.25rem;font-weight:700;background:linear-gradient(135deg,#4f7dcf 0%,#6c5ce7 100%);color:#fff;letter-spacing:.02em;position:sticky;top:0;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,.12)}
  .controls{display:flex;justify-content:center;padding:.75rem 1rem;position:sticky;top:3.5rem;z-index:40;background:#f4f6fb}
  .search{width:100%;max-width:26rem;padding:.625rem .875rem;border:1px solid #cfd8ea;border-radius:.5rem;font-size:.9375rem;background:#fff}
  .grid-container{padding:1rem 2rem}
  .grid{display:grid;grid-template-columns:1fr;gap:.75rem}
  @media(min-width:640px){.grid{grid-template-columns:repeat(2,1fr)}}
  @media(min-width:1024px){.grid{grid-template-columns:repeat(4,1fr)}}
  .column-card{background:#fff;border-radius:.75rem;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden;transition:box-shadow .2s}
  .column-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.1)}
  .column-header{padding:.75rem 1rem;font-weight:700;font-size:.9375rem;color:#fff;display:flex;align-items:center;gap:.5rem}
  .column-header.plan{background:linear-gradient(135deg,#4f7dcf,#3b6fc4)}
  .column-header.do{background:linear-gradient(135deg,#10b981,#059669)}
  .column-header.check{background:linear-gradient(135deg,#f59e0b,#d97706)}
  .column-header.act{background:linear-gradient(135deg,#ef4444,#dc2626)}
  .column-body{padding:.75rem 1rem;min-height:3rem}
  .column-body a{display:flex;align-items:center;color:#2b59c3;text-decoration:none;padding:.5rem .625rem;border-radius:.375rem;font-size:.875rem;font-weight:500;transition:background .15s,color .15s}
  .column-body a:hover{background:#eef2ff;color:#1e40af}
  .column-body .empty-state{color:#9ca3af;font-size:.8125rem;font-style:italic;padding:.5rem .625rem}
  .tooltip{position:fixed;max-width:20rem;background:#111827;color:#fff;padding:1rem;border-radius:.625rem;font-size:.8125rem;line-height:1.55;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .15s;z-index:999}
  .tooltip h4{margin:0 0 .375rem 0;font-size:.875rem;font-weight:600}
</style>
</head>
<body>
<div class="header">CustomGPTs / AI Agents Hub (Portable)</div>
<div class="controls">
  <input id="search" class="search" type="search" placeholder="Search agents..." oninput="render()">
</div>
<div class="grid-container">
  <div class="grid">
    <div class="column-card"><div class="column-header plan">🧠 Plan</div><div class="column-body" id="plan"></div></div>
    <div class="column-card"><div class="column-header do">⚙️ Do</div><div class="column-body" id="do"></div></div>
    <div class="column-card"><div class="column-header check">🔍 Check</div><div class="column-body" id="check"></div></div>
    <div class="column-card"><div class="column-header act">🚀 Act</div><div class="column-body" id="act"></div></div>
  </div>
</div>
<div class="tooltip" id="tooltip"></div>
<script>
  let registry = ${registryString};
  
  function render() {
    const search = document.getElementById("search").value.toLowerCase();
    const cells = ["plan", "do", "check", "act"];
    cells.forEach((id, c) => {
      const el = document.getElementById(id);
      el.innerHTML = "";
      const filtered = registry[c].filter(g => g.name.toLowerCase().includes(search));
      if (filtered.length === 0) {
        el.innerHTML = '<div class="empty-state">No matches</div>';
        return;
      }
      filtered.forEach(g => {
        const a = document.createElement("a");
        a.href = g.url;
        a.target = "_blank";
        a.textContent = g.name;
        a.onmousemove = (e) => {
          const t = document.getElementById("tooltip");
          t.innerHTML = "<h4>" + g.name + "</h4>" + (g.desc || "");
          t.style.left = (e.clientX + 15) + "px";
          t.style.top = (e.clientY + 15) + "px";
          t.style.opacity = 1;
        };
        a.onmouseleave = () => { document.getElementById("tooltip").style.opacity = 0; };
        el.appendChild(a);
      });
    });
  }
  window.onload = render;
</script>
</body></html>`;

    const blob = new Blob([selfContainedHTML], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "custom_gpt_portable.html";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Filtered & Sorted agents list
  const getFilteredAgents = (categoryId: string) => {
    let filtered = agents.filter((a) => a.categoryId === categoryId);
    
    // Search filter
    if (search.trim()) {
      const queryStr = search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.name.toLowerCase().includes(queryStr) || a.description.toLowerCase().includes(queryStr)
      );
    }

    // Sort order
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

    return filtered;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-950 transition-colors duration-200 pb-16">
      <Navbar />

      {/* Main Container mirroring the original HTML sizing */}
      <main className="w-full max-w-[97%] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Simple Controls (Mirroring original controls with only Search and A-Z sort button) */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center p-4 mb-8 rounded-2xl glass-panel shadow-sm border border-slate-200/50 dark:border-slate-800/30">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all text-sm"
            />
            <svg
              className="absolute left-3.5 top-3 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 h-[38px] flex items-center justify-center gap-1"
          >
            <span>Sort:</span>
            <span className="uppercase">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
          </button>
        </div>

        {/* Directory Grid matching original media query spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const filteredList = getFilteredAgents(cat.id);
            
            // Define header background and icons
            let headerStyle = 'bg-gradient-to-r from-plan-gradientStart to-plan-gradientEnd';
            let pillIcon = '🧠';
            if (cat.id === 'plan') {
              headerStyle = 'bg-gradient-to-r from-plan-gradientStart to-plan-gradientEnd';
              pillIcon = '🧠';
            } else if (cat.id === 'do') {
              headerStyle = 'bg-gradient-to-r from-do-gradientStart to-do-gradientEnd';
              pillIcon = '⚙️';
            } else if (cat.id === 'check') {
              headerStyle = 'bg-gradient-to-r from-check-gradientStart to-check-gradientEnd';
              pillIcon = '🔍';
            } else if (cat.id === 'act') {
              headerStyle = 'bg-gradient-to-r from-act-gradientStart to-act-gradientEnd';
              pillIcon = '🚀';
            }

            return (
              <div 
                key={cat.id} 
                className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/30 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Column Header */}
                <div className={`px-4 py-3.5 text-white font-bold text-sm flex items-center gap-2 ${headerStyle}`}>
                  <span className="text-base">{pillIcon}</span>
                  <span className="capitalize">{cat.name}</span>
                  <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                    {filteredList.length}
                  </span>
                </div>

                {/* Column Body listing simple links with hover tooltips */}
                <div className="p-3 flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[70vh] min-h-[150px]">
                  {filteredList.length === 0 ? (
                    <div className="text-slate-400 dark:text-slate-500 italic text-xs py-4 text-center">
                      No matches
                    </div>
                  ) : (
                    filteredList.map((agent) => (
                      <div key={agent.id} className="relative group/link w-full">
                        <a
                          href={agent.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-slate-800/40 transition-colors w-full truncate focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                          onMouseMove={(e) => {
                            setActiveTooltip({
                              agent,
                              x: e.clientX,
                              y: e.clientY
                            });
                          }}
                          onMouseLeave={() => {
                            setActiveTooltip(null);
                          }}
                          onClick={() => {
                            const userEmail = user?.email || 'unknown_user';
                            addAuditLog(
                              'click_gpt',
                              userEmail,
                              `Clicked and launched CustomGPT: "${agent.name}"`,
                              { gptId: agent.id, gptName: agent.name }
                            );
                          }}
                        >
                          <span className="shrink-0 text-slate-400 group-hover/link:text-indigo-500 transition-colors">🔗</span>
                          <span className="truncate">{agent.name}</span>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Action Button (FAB) for Admin CRUD */}
      {isAdmin && (
        <button
          onClick={openAddModal}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 z-40"
          title="Manage Agents"
        >
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Admin Operations Modal (Housed all CRUD and Portability in one Clean sheet) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {editingAgent ? 'Edit Custom GPT' : 'Manage Custom GPTs'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingAgent(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh] space-y-4">
              
              {/* 1. Scrollable List of GPTs for Editing / Deletion */}
              {!editingAgent && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Active Registry ({agents.length})</h4>
                  <div className="max-h-[220px] overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-xl p-2.5 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20">
                    {agents.length === 0 ? (
                      <div className="text-xs text-slate-400 italic text-center py-4">No agents available</div>
                    ) : (
                      agents.map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-slate-900 rounded-lg border-b border-slate-100 dark:border-slate-800/30 last:border-b-0 gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{agent.name}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">{agent.categoryId}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAgent(agent);
                                setAgentName(agent.name);
                                setAgentUrl(agent.url);
                                setAgentDesc(agent.description);
                                setAgentCat(agent.categoryId);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-400 rounded text-[10px] font-bold transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded text-[10px] font-bold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 2. Add / Edit form */}
              <form onSubmit={handleSaveAgent} className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {editingAgent ? 'Edit Agent Form' : 'Add New Agent'}
                </h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={agentCat}
                    onChange={(e) => setAgentCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs transition-all focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="plan">Plan</option>
                    <option value="do">Do</option>
                    <option value="check">Check</option>
                    <option value="act">Act</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="GPT Name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs transition-all focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://chatgpt.com/g/g-..."
                    value={agentUrl}
                    onChange={(e) => setAgentUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs transition-all focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    placeholder="Enter a description..."
                    value={agentDesc}
                    onChange={(e) => setAgentDesc(e.target.value)}
                    rows={2.5}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs transition-all resize-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    Save Agent
                  </button>
                  {editingAgent && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAgent(null);
                        setAgentName('');
                        setAgentUrl('');
                        setAgentDesc('');
                        setAgentCat('plan');
                      }}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all border border-slate-200/20 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              {/* 3. Portability Backups */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 my-4 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Backups & Portability</h4>
                
                {importStatus && (
                  <div className="mb-3 p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-700 dark:text-indigo-300 rounded-lg">
                    {importStatus}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                  >
                    Export JSON
                  </button>

                  <input
                    type="file"
                    id="importFile"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportJSON}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('importFile')?.click()}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                  >
                    Import JSON
                  </button>

                  <button
                    type="button"
                    onClick={handleEmbedAndSaveHTML}
                    className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    💾 Embed & Save Standalone File
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Global Viewport-Anchored Tooltip to prevent overflow/clipping */}
      {activeTooltip && (
        <div 
          style={{
            position: 'fixed',
            left: activeTooltip.x > window.innerWidth / 2 ? undefined : `${activeTooltip.x + 15}px`,
            right: activeTooltip.x > window.innerWidth / 2 ? `${window.innerWidth - activeTooltip.x + 15}px` : undefined,
            top: activeTooltip.y > window.innerHeight / 2 ? undefined : `${activeTooltip.y + 15}px`,
            bottom: activeTooltip.y > window.innerHeight / 2 ? `${window.innerHeight - activeTooltip.y + 15}px` : undefined,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="w-72 p-4 bg-slate-950/95 dark:bg-slate-900/95 text-white rounded-xl shadow-xl border border-slate-800/40 text-xs leading-relaxed pointer-events-none animate-fadeIn"
        >
          <h4 className="font-bold text-slate-100 mb-1.5 border-b border-slate-800 pb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            {activeTooltip.agent.name}
          </h4>
          <p className="text-slate-300 font-medium">
            {activeTooltip.agent.description || 'No description provided.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
