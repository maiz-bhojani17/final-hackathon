import React, { useState } from 'react';
import { Menu, Sun, Moon, Bell, Sparkles, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationDrawer from './NotificationDrawer';

const Navbar = ({ onToggleSidebar, onOpenAi }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'hr':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b border-[#E1E4D9] dark:border-[#384238] bg-[#F5F3EB]/95 dark:bg-[#171C18]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-colors duration-150">
        {/* Left: Mobile hamburger & breadcrumb branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-[#697064] hover:text-[#252A24] dark:text-[#B1B9AC] dark:hover:text-[#EEF1E9] hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C]"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#252A24] dark:text-[#EEF1E9] tracking-tight">
              HCM Lite
            </span>
            <span className="text-[#D5D9CB] dark:text-[#384238]">/</span>
            <span className="text-[#697064] dark:text-[#B1B9AC] capitalize">
              {user?.role} Portal
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* AI Assistant Button */}
          <button
            onClick={onOpenAi}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EDEFE6] hover:bg-[#E1E7D8] dark:bg-[#222922] dark:hover:bg-[#293229] text-[#29372D] dark:text-[#DCE8D2] border border-[#E1E4D9] dark:border-[#384238] text-xs font-medium transition-colors"
            title="Ask AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#626F47] dark:text-[#A3B18A]" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-[#697064] dark:text-[#B1B9AC] hover:text-[#252A24] dark:hover:text-[#EEF1E9] hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C] transition-colors"
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#A87535]" /> : <Moon className="w-4 h-4 text-[#626F47]" />}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-1.5 rounded-lg text-[#697064] dark:text-[#B1B9AC] hover:text-[#252A24] dark:hover:text-[#EEF1E9] hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C] transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#477A57] ring-2 ring-[#F5F3EB] dark:ring-[#171C18]" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C] transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-[#29372D] text-[#F5F3EB] dark:bg-[#A3B18A] dark:text-[#171C18] flex items-center justify-center font-bold text-xs uppercase shadow-none">
                {user?.employee?.firstName?.[0] || user?.email?.[0] || 'U'}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-[#222922] shadow-dropdown border border-[#E1E4D9] dark:border-[#384238] py-1 z-40">
                <div className="px-3.5 py-2 border-b border-[#E1E4D9] dark:border-[#384238]">
                  <p className="text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] truncate">
                    {user?.employee?.fullName || user?.email}
                  </p>
                  <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] truncate">{user?.email}</p>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#B64D45] dark:text-[#D2635B] hover:bg-[#B64D45]/10 dark:hover:bg-[#B64D45]/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};

export default Navbar;
