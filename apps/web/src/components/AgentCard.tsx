import React, { useState, useEffect } from 'react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isAdmin: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  density: 'compact' | 'comfortable';
  viewMode: 'kanban' | 'list';
}

interface AgentMetrics {
  runs: string;
  rating: string;
  lastUsed: string;
}

// Generate stable, deterministic metrics based on the agent's unique ID/name
export function getAgentMetrics(agentId: string): AgentMetrics {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = agentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const runs = (hash % 150) * 100 + 100; // 100 to 15,000
  const rating = 4.0 + (hash % 11) / 10; // 4.0 to 5.0
  const lastUsedHours = (hash % 72) + 1; // 1 to 72 hours ago

  return {
    runs: runs >= 1000 ? `${(runs / 1000).toFixed(1)}k` : `${runs}`,
    rating: rating.toFixed(1),
    lastUsed: lastUsedHours < 24 ? `${lastUsedHours}h ago` : `${Math.floor(lastUsedHours / 24)}d ago`
  };
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isFavorite,
  onToggleFavorite,
  isAdmin,
  onEdit,
  onDelete,
  density,
  viewMode
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const metrics = getAgentMetrics(agent.id);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.dropdown-trigger-${agent.id}`)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [menuOpen, agent.id]);

  // Handle keyboard events on the overflow menu trigger
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMenuOpen(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigating to url if clicking controls inside the card
    const target = e.target as HTMLElement;
    if (target.closest('.action-btn')) {
      e.preventDefault();
    }
  };

  // -------------------------------------------------------------
  // 1. KANBAN CARD VIEW (Comfortable and Compact)
  // -------------------------------------------------------------
  if (viewMode === 'kanban') {
    if (density === 'comfortable') {
      return (
        <>
          <div 
            onClick={handleCardClick}
            className={`relative dropdown-trigger-${agent.id} w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-5 hover:border-indigo-500/30 hover:shadow-premium-hover transition-all duration-200 flex flex-col justify-between h-full group`}
          >
            {/* Top Row: Title & Action Group */}
            <div className="flex justify-between items-start gap-3 mb-2">
              <a 
                href={agent.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none rounded-lg"
              >
                <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-snug line-clamp-3">
                  {agent.name}
                </h3>
              </a>
              
              <div className="flex items-center gap-1 shrink-0">
                {/* Favorite Toggle (Target: 44x44px for accessibility) */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
                  className="action-btn w-8 h-8 md:w-11 md:h-11 flex items-center justify-center text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none"
                  title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <svg 
                    className={`w-5 h-5 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'stroke-current'}`} 
                    viewBox="0 0 24 24" 
                    fill={isFavorite ? 'currentColor' : 'none'} 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                </button>

                {/* Overflow Trigger (Target: 44x44px for accessibility) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
                    onKeyDown={handleKeyDown}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className="action-btn w-8 h-8 md:w-11 md:h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none"
                    title="Actions Menu"
                  >
                    <span className="font-bold text-lg leading-none -mt-1">⋯</span>
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1.5 animate-fadeIn"
                      role="menu"
                    >
                      <a
                        href={agent.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        role="menuitem"
                      >
                        Launch Agent
                      </a>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setMenuOpen(false); setShowMobileDrawer(true); }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        role="menuitem"
                      >
                        View Details
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setMenuOpen(false); if (onEdit) onEdit(); }}
                            className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800/60"
                            role="menuitem"
                          >
                            Edit Agent
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setMenuOpen(false); if (onDelete) onDelete(); }}
                            className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            role="menuitem"
                          >
                            Delete Agent
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description Preview */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
              {agent.description || 'No description provided.'}
            </p>

            {/* Metrics Row */}
            <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-4">
              <span className="flex items-center gap-0.5 text-amber-500" aria-label={`Rating: ${metrics.rating} stars`}>
                ★ {metrics.rating}
              </span>
              <span>•</span>
              <span aria-label={`${metrics.runs} runs`}>{metrics.runs} runs</span>
              <span>•</span>
              <span aria-label={`Last used ${metrics.lastUsed}`}>{metrics.lastUsed}</span>
            </div>

            {/* Tags / Metadata Chips */}
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                {agent.categoryId}
              </span>
              <span 
                className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-[10px] font-bold truncate max-w-[120px]" 
                title={`Created by ${agent.createdBy}`}
              >
                {agent.createdBy.split('@')[0]}
              </span>
            </div>
          </div>
        </>
      );
    } else {
      // COMPACT KANBAN CARD
      return (
        <div 
          onClick={handleCardClick}
          className={`relative dropdown-trigger-${agent.id} w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30 rounded-xl p-3 hover:border-indigo-500/20 hover:shadow-sm transition-all duration-200 flex flex-col justify-between group`}
        >
          <div className="flex justify-between items-start gap-2 mb-1">
            <a 
              href={agent.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none rounded"
            >
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-snug line-clamp-2">
                {agent.name}
              </h3>
            </a>
            
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
                className="action-btn w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <svg 
                  className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'stroke-current'}`} 
                  viewBox="0 0 24 24" 
                  fill={isFavorite ? 'currentColor' : 'none'} 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
                  onKeyDown={handleKeyDown}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="action-btn w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
                  title="Actions Menu"
                >
                  <span className="font-bold text-sm leading-none -mt-0.5">⋯</span>
                </button>

                {menuOpen && (
                  <div 
                    className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-30 py-1 animate-fadeIn"
                    role="menu"
                  >
                    <a
                      href={agent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      role="menuitem"
                    >
                      Launch
                    </a>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setMenuOpen(false); setShowMobileDrawer(true); }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      role="menuitem"
                    >
                      Details
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setMenuOpen(false); if (onEdit) onEdit(); }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800/60"
                          role="menuitem"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setMenuOpen(false); if (onDelete) onDelete(); }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          role="menuitem"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5 line-clamp-1 leading-normal">
            {agent.description || 'No description.'}
          </p>

          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-50 dark:border-slate-800/40">
            <span className="flex items-center gap-0.5 text-amber-500">★ {metrics.rating}</span>
            <span>{metrics.runs}</span>
          </div>
        </div>
      );
    }
  }

  // -------------------------------------------------------------
  // 2. LIST VIEW ROW (Comfortable and Compact)
  // -------------------------------------------------------------
  return (
    <>
      <div 
        onClick={handleCardClick}
        className={`relative dropdown-trigger-${agent.id} w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl hover:border-indigo-500/30 hover:shadow-premium-hover transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 group ${
          density === 'comfortable' ? 'p-4 md:px-5 md:py-4' : 'p-2.5 md:px-4 md:py-2.5'
        }`}
      >
        {/* Left segment: Favorite and Title/Description */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Favorite Button (Target: 44x44px for accessibility) */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
            className={`action-btn flex items-center justify-center text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none shrink-0 ${
              density === 'comfortable' ? 'w-11 h-11' : 'w-8 h-8'
            }`}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <svg 
              className={`w-5 h-5 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'stroke-current'}`} 
              viewBox="0 0 24 24" 
              fill={isFavorite ? 'currentColor' : 'none'} 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </button>

          {/* Text Container */}
          <div className="min-w-0 flex-1">
            <a 
              href={agent.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none rounded-lg inline-block max-w-full"
            >
              <h3 className={`font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-snug line-clamp-2 ${
                density === 'comfortable' ? 'text-[15px]' : 'text-sm'
              }`}>
                {agent.name}
              </h3>
            </a>
            {density === 'comfortable' && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-normal mt-0.5">
                {agent.description || 'No description provided.'}
              </p>
            )}
          </div>
        </div>

        {/* Right segment: Metadata, Metrics, Creator, Menu */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 md:gap-6 shrink-0 text-xs text-slate-500 dark:text-slate-400">
          
          {/* Category Chip */}
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
            {agent.categoryId}
          </span>

          {/* Usage Metrics */}
          <div className="flex items-center gap-3 shrink-0 text-[11px] font-semibold">
            <span className="flex items-center gap-1 text-amber-500" aria-label={`Rating: ${metrics.rating}`}>
              ★ {metrics.rating}
            </span>
            <span>•</span>
            <span>{metrics.runs} runs</span>
            {density === 'comfortable' && (
              <>
                <span>•</span>
                <span className="hidden sm:inline">Used {metrics.lastUsed}</span>
              </>
            )}
          </div>

          {/* Creator Badge (Comfortable Only) */}
          {density === 'comfortable' && (
            <span 
              className="hidden sm:inline px-2 py-1 rounded bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-[10px] font-bold max-w-[100px] truncate" 
              title={`Created by ${agent.createdBy}`}
            >
              {agent.createdBy.split('@')[0]}
            </span>
          )}

          {/* Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
              onKeyDown={handleKeyDown}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={`action-btn flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none ${
                density === 'comfortable' ? 'w-11 h-11' : 'w-8 h-8'
              }`}
              title="Actions Menu"
            >
              <span className="font-bold text-lg leading-none -mt-1">⋯</span>
            </button>

            {menuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1.5 animate-fadeIn"
                role="menu"
              >
                <a
                  href={agent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  role="menuitem"
                >
                  Launch Agent
                </a>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setMenuOpen(false); setShowMobileDrawer(true); }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  role="menuitem"
                >
                  View Details
                </button>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setMenuOpen(false); if (onEdit) onEdit(); }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800/60"
                      role="menuitem"
                    >
                      Edit Agent
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setMenuOpen(false); if (onDelete) onDelete(); }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      role="menuitem"
                    >
                      Delete Agent
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Detail Modal Bottom Sheet */}
        {showMobileDrawer && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-end justify-center animate-fadeIn md:hidden">
            <div className="absolute inset-0" onClick={() => setShowMobileDrawer(false)}></div>
            
            <div className="relative w-full max-h-[50vh] bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl border-t border-slate-200/50 dark:border-slate-800/50 p-6 space-y-4 z-10 animate-slideUp overflow-y-auto">
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto -mt-2 mb-4"></div>

              <div className="flex justify-between items-start">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white pr-4 leading-tight">
                  {agent.name}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowMobileDrawer(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 leading-none"
                >
                  &times;
                </button>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {agent.description || 'No description provided.'}
              </p>

              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold">
                  Category: {agent.categoryId}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                  Created by: {agent.createdBy}
                </span>
              </div>

              <div className="pt-2">
                <a
                  href={agent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md"
                >
                  Launch Agent
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AgentCard;
