import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Agent, Category } from '../types';
import Navbar from '../components/Navbar';
import AgentCard from '../components/AgentCard';
import defaultAgentsRaw from '../data/default-agents.json';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  
  // Statically defined categories
  const categories: Category[] = [
    { id: 'plan', name: 'plan', sortOrder: 1 },
    { id: 'do', name: 'do', sortOrder: 2 },
    { id: 'check', name: 'check', sortOrder: 3 },
    { id: 'act', name: 'act', sortOrder: 4 },
  ];

  const [agents, setAgents] = useState<Agent[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal State for CRUD (Admins only)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentUrl, setAgentUrl] = useState('');
  const [agentDesc, setAgentDesc] = useState('');
  const [agentCat, setAgentCat] = useState('plan');

  // File Import status
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

  // 2. Fetch Favorites for User (Stored per-user email)
  useEffect(() => {
    if (!user) return;
    const favKey = `favorites_${user.email}`;
    const savedFavs = localStorage.getItem(favKey);
    setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
  }, [user]);

  // Handle Favorites toggle
  const toggleFavorite = (agentId: string) => {
    if (!user) return;
    const favKey = `favorites_${user.email}`;
    let updated: string[] = [];

    if (favorites.includes(agentId)) {
      updated = favorites.filter((id) => id !== agentId);
    } else {
      updated = [...favorites, agentId];
    }
    setFavorites(updated);
    localStorage.setItem(favKey, JSON.stringify(updated));
  };

  // CRUD Operations
  const openAddModal = () => {
    setEditingAgent(null);
    setAgentName('');
    setAgentUrl('');
    setAgentDesc('');
    setAgentCat(categories[0]?.id || 'plan');
    setIsModalOpen(true);
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentName(agent.name);
    setAgentUrl(agent.url);
    setAgentDesc(agent.description);
    setAgentCat(agent.categoryId);
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
      setIsModalOpen(false);
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
                id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
    
    // Fuzzy text filtering
    if (search.trim()) {
      const queryStr = search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.name.toLowerCase().includes(queryStr) || a.description.toLowerCase().includes(queryStr)
      );
    }

    // Favorites filter
    if (showOnlyFavorites) {
      filtered = filtered.filter((a) => favorites.includes(a.id));
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Controls Panel */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 mb-8 rounded-2xl glass-panel shadow-premium border border-slate-200/50 dark:border-slate-800/30">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search agents by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all text-sm"
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
                className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Sort toggler */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all shadow-sm"
            >
              <span>Sort: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
            </button>

            {/* Category tabs */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
            >
              <option value="all">All Categories</option>
              <option value="plan">🧠 Plan</option>
              <option value="do">⚙️ Do</option>
              <option value="check">🔍 Check</option>
              <option value="act">🚀 Act</option>
            </select>

            {/* Favorites filter switcher */}
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all shadow-sm ${
                showOnlyFavorites 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-current' : 'stroke-current'}`} viewBox="0 0 24 24" fill={showOnlyFavorites ? 'currentColor' : 'none'} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
              <span>Favorites Only</span>
            </button>
          </div>
        </div>

        {/* Categories Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories
            .filter((c) => selectedCategory === 'all' || c.id === selectedCategory)
            .map((cat) => {
              const filteredList = getFilteredAgents(cat.id);
              
              // Define category header style mappings dynamically
              let headerStyle = 'bg-plan-gradientStart';
              let borderStyle = 'border-indigo-100 dark:border-indigo-900/30';
              let pillIcon = '🧠';
              if (cat.id === 'plan') {
                headerStyle = 'bg-gradient-to-r from-plan-gradientStart to-plan-gradientEnd';
                borderStyle = 'border-blue-100 dark:border-blue-900/30';
                pillIcon = '🧠';
              } else if (cat.id === 'do') {
                headerStyle = 'bg-gradient-to-r from-do-gradientStart to-do-gradientEnd';
                borderStyle = 'border-emerald-100 dark:border-emerald-900/30';
                pillIcon = '⚙️';
              } else if (cat.id === 'check') {
                headerStyle = 'bg-gradient-to-r from-check-gradientStart to-check-gradientEnd';
                borderStyle = 'border-amber-100 dark:border-amber-900/30';
                pillIcon = '🔍';
              } else if (cat.id === 'act') {
                headerStyle = 'bg-gradient-to-r from-act-gradientStart to-act-gradientEnd';
                borderStyle = 'border-red-100 dark:border-red-900/30';
                pillIcon = '🚀';
              }

              return (
                <div 
                  key={cat.id} 
                  className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-premium border ${borderStyle} overflow-hidden transition-all duration-200 hover:shadow-premium-hover`}
                >
                  {/* Category Header */}
                  <div className={`px-5 py-4 text-white font-bold text-sm tracking-wide flex items-center gap-2 ${headerStyle}`}>
                    <span className="text-lg">{pillIcon}</span>
                    <span className="capitalize">{cat.name}</span>
                    <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                      {filteredList.length}
                    </span>
                  </div>

                  {/* Agents List Container */}
                  <div className="p-4 flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[60vh]">
                    {filteredList.length === 0 ? (
                      <div className="text-slate-400 dark:text-slate-500 italic text-xs py-4 text-center">
                        No agents available
                      </div>
                    ) : (
                      filteredList.map((agent) => (
                        <AgentCard
                          key={agent.id}
                          agent={agent}
                          isFavorite={favorites.includes(agent.id)}
                          onToggleFavorite={() => toggleFavorite(agent.id)}
                          isAdmin={isAdmin}
                          onEdit={() => openEditModal(agent)}
                          onDelete={() => handleDeleteAgent(agent.id)}
                        />
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
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all outline-none z-40"
          title="Manage Agents"
        >
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Admin Operations Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {editingAgent ? 'Edit Custom GPT' : 'Add Custom GPT'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={agentCat}
                  onChange={(e) => setAgentCat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
                >
                  <option value="plan">Plan</option>
                  <option value="do">Do</option>
                  <option value="check">Check</option>
                  <option value="act">Act</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="GPT Name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://chatgpt.com/g/g-..."
                  value={agentUrl}
                  onChange={(e) => setAgentUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  placeholder="Enter a description of what this AI Agent helper does..."
                  value={agentDesc}
                  onChange={(e) => setAgentDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
                >
                  Save Agent
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition-all border border-slate-200/20"
                >
                  Cancel
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-4 pt-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Registry Backups & Portability</h4>
                
                {importStatus && (
                  <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-700 dark:text-indigo-300 rounded-lg">
                    {importStatus}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold"
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
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                  >
                    Import JSON
                  </button>

                  <button
                    type="button"
                    onClick={handleEmbedAndSaveHTML}
                    className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    💾 Embed & Save Standalone File
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
