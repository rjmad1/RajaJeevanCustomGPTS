import React, { useState } from 'react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isAdmin: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isFavorite,
  onToggleFavorite,
  isAdmin,
  onEdit,
  onDelete
}) => {
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking target action buttons, prevent default redirection
    const target = e.target as HTMLElement;
    if (target.closest('.action-btn')) {
      e.preventDefault();
      return;
    }
  };

  return (
    <>
      <div className="relative group/card w-full">
        {/* Main Agent Link Card */}
        <a
          href={agent.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCardClick}
          className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-900/60 dark:hover:bg-indigo-950/20 border border-slate-200/50 dark:border-slate-800/40 rounded-xl transition-all duration-200 group text-slate-800 dark:text-slate-200 text-sm font-semibold hover:border-indigo-500/30"
        >
          <span className="flex-1 truncate pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            {agent.name}
          </span>

          {/* Action Triggers */}
          <div className="flex items-center gap-1">
            {/* Info Trigger (opens mobile bottom sheet / drawer) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowMobileDrawer(true);
              }}
              className="action-btn p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title="View Description"
            >
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Favorite Star Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite();
              }}
              className="action-btn p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <svg 
                className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'stroke-current'}`} 
                viewBox="0 0 24 24" 
                fill={isFavorite ? 'currentColor' : 'none'} 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </button>

            {/* Admin actions (Edit / Delete) */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onEdit) onEdit();
                  }}
                  className="action-btn p-1.5 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onDelete) onDelete();
                  }}
                  className="action-btn p-1.5 text-red-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </a>

        {/* Desktop Tooltip (CSS only, triggers on group hover) */}
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-xl opacity-0 scale-95 pointer-events-none group-hover/card:md:opacity-100 group-hover/card:md:scale-100 transition-all duration-150 shadow-xl border border-slate-800/40 text-xs leading-relaxed">
          <h4 className="font-bold text-slate-100 mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            {agent.name}
          </h4>
          <p className="text-slate-300 font-medium">
            {agent.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Mobile Drawer (Bottom sheet) */}
      {showMobileDrawer && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-end justify-center animate-fadeIn md:hidden">
          {/* Overlay click back */}
          <div className="absolute inset-0" onClick={() => setShowMobileDrawer(false)}></div>
          
          <div className="relative w-full max-h-[50vh] bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl border-t border-slate-200/50 dark:border-slate-800/50 p-6 space-y-4 z-10 animate-slideUp overflow-y-auto">
            {/* Grab handle */}
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
    </>
  );
};

export default AgentCard;
