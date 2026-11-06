import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Calculator,
  FileSpreadsheet,
  Download,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'proyek' | 'lantai' | 'kalkulator' | 'rekap' | 'ai' | 'ekspor';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAI: () => void;
  onExportExcel: () => void;
  onOpenFloors: () => void;
  onOpenProjects: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAI,
  onExportExcel,
  onOpenFloors,
  onOpenProjects,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Beranda', icon: LayoutDashboard },
    { id: 'proyek' as NavTab, label: 'Proyek', icon: FolderKanban, action: onOpenProjects },
    { id: 'lantai' as NavTab, label: 'Lantai', icon: Layers, action: onOpenFloors },
    { id: 'kalkulator' as NavTab, label: 'Pekerjaan', icon: Calculator },
    { id: 'rekap' as NavTab, label: 'Hasil Volume', icon: FileSpreadsheet },
    { id: 'ai' as NavTab, label: 'Asisten AI', icon: ScanLine, action: onOpenAI },
    { id: 'ekspor' as NavTab, label: 'Ekspor Excel', icon: Download, action: onExportExcel },
  ];

  const handleNavClick = (item: (typeof navItems)[number]) => {
    onSelectTab(item.id);
    if (item.action) item.action();
    onCloseMobile();
  };

  const renderBrandIcon = () => (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#0071E3] to-[#005bb5] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
      <svg
        className="w-5 h-5 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M8 10h.01" />
        <path d="M16 10h.01" />
        <path d="M8 14h.01" />
        <path d="M16 14h.01" />
      </svg>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible w-64 <-> w-20) */}
      <aside
        className={`hidden md:flex flex-col justify-between apple-glass border-r border-black/[0.08] shrink-0 h-screen sticky top-0 transition-all duration-300 ease-out z-20 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Brand Header + Collapse Button */}
          <div
            className={`py-4 border-b border-black/[0.06] flex items-center ${
              isCollapsed ? 'px-3 justify-center flex-col gap-2' : 'px-5 justify-between gap-2'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {renderBrandIcon()}
              {!isCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-base font-semibold tracking-[-0.02em] text-slate-900 leading-tight truncate">
                    RuangEstimasi
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium truncate">AI Quantity Takeoff</p>
                </div>
              )}
            </div>

            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Buka Sidebar' : 'Ciutkan Sidebar'}
              aria-label={isCollapsed ? 'Buka Sidebar' : 'Ciutkan Sidebar'}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-black/[0.05] transition shrink-0 cursor-pointer apple-press"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items (macOS Sidebar Style) */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs transition-all cursor-pointer apple-press ${
                    isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#0071E3]/12 text-[#0071E3] font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04] font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#0071E3]' : 'text-slate-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate tracking-tight">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Collapse Toggle (Desktop) */}
        <div className="p-3 border-t border-black/[0.04]">
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Lebarkan Sidebar' : 'Ciutkan Sidebar'}
            className="w-full py-2 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] flex items-center justify-center gap-2 text-xs font-medium transition cursor-pointer apple-press"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="truncate">Ciutkan Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay & Sidebar */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
        />

        {/* Drawer Panel */}
        <aside
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl border-r border-slate-200 flex flex-col justify-between z-10 transform transition-transform duration-200 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {renderBrandIcon()}
                <div>
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    RuangEstimasi
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">AI Quantity Takeoff</p>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 m-3 border-t border-black/[0.06] text-xs text-slate-500 flex items-center justify-between">
            <span className="text-[11px]">RuangEstimasi v1.0</span>
            <span className="text-[11px] text-[#0071E3] font-medium">Quantity Takeoff</span>
          </div>
        </aside>
      </div>
    </>
  );
};

