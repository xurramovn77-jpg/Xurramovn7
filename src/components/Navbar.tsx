import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Lock, LogOut, Menu, Search, Settings, ShieldCheck, User, UserPen, X } from 'lucide-react';
import type { AuthTab, NexplayModules, NexplayUser, ProfileTabKey, ViewName } from '../types/nexplay';
import { isOwnerUser, isSafeMedia } from '../utils/nexplayLogic';

interface NavbarProps {
  activeView: ViewName;
  currentUser: NexplayUser | null;
  modules: NexplayModules;
  onNavigate: (view: ViewName) => void;
  onOpenAuth: (tab: AuthTab) => void;
  onOpenProfileTab: (tab: ProfileTabKey) => void;
  onOpenSearch: () => void;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{ view: ViewName; label: string; moduleKey?: keyof NexplayModules }> = [
  { view: 'home', label: 'Bosh sahifa' },
  { view: 'catalog', label: 'Katalog', moduleKey: 'catalog' },
  { view: 'categories', label: 'Kategoriyalar', moduleKey: 'categories' },
  { view: 'tournaments', label: 'Turnirlar', moduleKey: 'tournaments' },
  { view: 'rankings', label: 'Reyting', moduleKey: 'rankings' },
  { view: 'community', label: 'Hamjamiyat', moduleKey: 'community' },
  { view: 'achievements', label: 'Yutuqlar', moduleKey: 'achievements' },
  { view: 'premium', label: 'Premium', moduleKey: 'premium' },
  { view: 'multiplayer', label: 'Multiplayer', moduleKey: 'multiplayer' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  currentUser,
  modules,
  onNavigate,
  onOpenAuth,
  onOpenProfileTab,
  onOpenSearch,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const visibleLinks = NAV_ITEMS.filter((item) => !item.moduleKey || modules[item.moduleKey]);
  const owner = isOwnerUser(currentUser);
  const displayName =
    currentUser?.displayName || currentUser?.firstName || currentUser?.username || 'Foydalanuvchi';
  const initials = displayName.trim().charAt(0).toUpperCase() || 'U';
  const hasAvatar = Boolean(currentUser?.avatarData && isSafeMedia(currentUser.avatarData));

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleNavClick = (view: ViewName) => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    onNavigate(view);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#050811]/88 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 sm:gap-2.5 shrink-0 group cursor-pointer focus:outline-none"
        >
          <div
            className="nx-header-logo-wrap w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-heading font-extrabold text-[11px] sm:text-xs text-white transition-transform duration-200 group-hover:scale-105"
            style={{
              background:
                'linear-gradient(var(--rgb-grad-deg, 135deg), var(--rgb-primary), var(--rgb-secondary))',
              boxShadow: '0 8px 20px -6px rgba(var(--rgb-r), var(--rgb-g), var(--rgb-b), 0.55)',
            }}
          >
            NX
          </div>
          <span className="font-heading font-extrabold tracking-tight text-sm sm:text-lg text-white">
            NEXPLAY
          </span>
        </button>

        {/* Center: Clean Horizontal Navigation */}
        <nav
          aria-label="Asosiy navigatsiya"
          className="hidden lg:flex items-center gap-0.5 xl:gap-1 overflow-x-auto no-scrollbar"
        >
          {visibleLinks.map((item) => {
            const isActive =
              activeView === item.view ||
              (item.view === 'catalog' && (activeView === 'game-details' || activeView === 'player'));
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNavClick(item.view)}
                className={`relative px-2 xl:px-2.5 py-2 rounded-lg text-[12px] xl:text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/[0.06]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute inset-x-2 xl:inset-x-3 -bottom-[1px] h-[2px] rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, var(--rgb-primary), var(--rgb-secondary))',
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Global Search + Auth Actions or Avatar Profile Menu */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <button
            type="button"
            id="btn-open-search"
            aria-label="Global qidiruv ( / )"
            title="Qidiruv ( / )"
            onClick={onOpenSearch}
            className="w-8 h-8 sm:w-auto sm:h-9 sm:px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.16] text-slate-300 hover:text-white inline-flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-cyan-300" />
            <kbd className="hidden sm:inline-flex nx-kbd">/</kbd>
          </button>

          {!currentUser ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                id="btn-open-login"
                onClick={() => onOpenAuth('login')}
                className="nx-btn-secondary px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs whitespace-nowrap cursor-pointer"
              >
                Kirish
              </button>
              <button
                type="button"
                id="btn-open-register"
                onClick={() => onOpenAuth('register')}
                className="nx-btn-primary px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs whitespace-nowrap cursor-pointer"
              >
                Ro'yxatdan o'tish
              </button>
            </div>
          ) : (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                id="user-menu-trigger"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] transition-colors cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{
                    background: hasAvatar
                      ? 'transparent'
                      : 'linear-gradient(135deg, var(--rgb-primary), var(--rgb-secondary))',
                  }}
                >
                  {hasAvatar ? (
                    <img
                      src={currentUser.avatarData}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-white max-w-[110px] truncate">
                  {displayName}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div
                  role="menu"
                  aria-label="Foydalanuvchi menyusi"
                  className="absolute right-0 mt-2 w-60 rounded-2xl nx-elevated p-2 z-50"
                >
                  <div className="px-3 py-2.5 border-b border-white/[0.08] mb-1">
                    <div className="text-xs font-semibold text-white truncate">{displayName}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      @{currentUser.username} {owner ? '· OWNER' : ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenProfileTab('overview');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.06] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Profilim</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenProfileTab('edit');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.06] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <UserPen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Profilni tahrirlash</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenProfileTab('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.06] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Akkaunt sozlamalari</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenProfileTab('security');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.06] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Xavfsizlik</span>
                  </button>

                  {owner && (
                    <button
                      type="button"
                      role="menuitem"
                      id="menu-admin-link"
                      onClick={() => handleNavClick('admin')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 transition-colors text-left mt-1 border-t border-white/[0.06] pt-2.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Boshqaruv paneli</span>
                    </button>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    id="menu-logout-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left mt-1 border-t border-white/[0.06] pt-2.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Tizimdan chiqish</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            id="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-slate-200 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#060a14]/96 px-4 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {visibleLinks.map((item) => {
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavClick(item.view)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.09] text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            {owner && (
              <button
                type="button"
                onClick={() => handleNavClick('admin')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-cyan-500/20 text-cyan-200'
                    : 'text-cyan-300 hover:bg-cyan-500/10'
                }`}
              >
                Boshqaruv paneli
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
