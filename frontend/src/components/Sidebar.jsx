import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  PlaneTakeoff,
  Banknote,
  Settings,
  ShieldAlert,
  UserCheck,
  Megaphone,
  User,
  Clock,
  Building2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_MENUS = {
  admin: [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'Company Settings', to: '/admin/settings', icon: Settings },
    { label: 'Organization Setup', to: '/admin/org', icon: Building2 },
    { label: 'User & HR Access', to: '/admin/users', icon: UserCheck },
    { label: 'Payroll Finalization', to: '/admin/payroll', icon: Banknote },
    { label: 'Audit Trail', to: '/admin/audit', icon: ShieldAlert },
    { label: 'Announcements', to: '/announcements', icon: Megaphone }
  ],
  hr: [
    { label: 'HR Dashboard', to: '/hr', icon: LayoutDashboard },
    { label: 'Employee Directory', to: '/hr/employees', icon: Users },
    { label: 'Daily Attendance', to: '/hr/attendance', icon: CalendarCheck },
    { label: 'Attendance Requests', to: '/hr/corrections', icon: Clock },
    { label: 'Leave Approvals', to: '/hr/leaves', icon: PlaneTakeoff },
    { label: 'Payroll Processing', to: '/hr/payroll', icon: Banknote },
    { label: 'Announcements', to: '/announcements', icon: Megaphone }
  ],
  employee: [
    { label: 'Overview', to: '/employee', icon: LayoutDashboard },
    { label: 'Attendance Clock', to: '/employee/attendance', icon: CalendarCheck },
    { label: 'My Leaves', to: '/employee/leaves', icon: PlaneTakeoff },
    { label: 'Payslips', to: '/employee/payslips', icon: Banknote },
    { label: 'Profile', to: '/employee/profile', icon: User },
    { label: 'Announcements', to: '/announcements', icon: Megaphone }
  ]
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const menuItems = NAV_MENUS[user?.role] || NAV_MENUS.employee;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#171C18]/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-60 bg-white dark:bg-[#1B211C] border-r border-[#E1E4D9] dark:border-[#384238] flex flex-col transition-all duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Workspace Brand / Header */}
        <div className="h-14 px-4 border-b border-[#E1E4D9] dark:border-[#384238] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#29372D] text-[#F5F3EB] dark:bg-[#A3B18A] dark:text-[#171C18] flex items-center justify-center font-bold text-xs tracking-tight shadow-none">
              H
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9] tracking-tight block truncate">
                HCM Lite
              </span>
              <span className="text-[10px] text-[#858A80] dark:text-[#929D8D] capitalize block leading-none">
                {user?.role} Workspace
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          <div className="px-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#858A80] dark:text-[#929D8D]">
              Menu
            </span>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin' || item.to === '/hr' || item.to === '/employee'}
                onClick={() => onClose()}
                className={({ isActive }) => `
                  flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${isActive
                    ? 'bg-[#E1E7D8] dark:bg-[#303C30] text-[#29372D] dark:text-[#DCE8D2] font-semibold'
                    : 'text-[#697064] dark:text-[#B1B9AC] hover:text-[#252A24] dark:hover:text-[#EEF1E9] hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C]'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#29372D] dark:text-[#A3B18A]' : 'text-[#858A80] dark:text-[#929D8D]'}`} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout in Footer */}
        <div className="p-2.5 border-t border-[#E1E4D9] dark:border-[#384238]">
          <div className="p-2 rounded-xl bg-[#EDEFE6] dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#29372D] text-[#F5F3EB] dark:bg-[#303A30] dark:text-[#A3B18A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user?.employee?.firstName?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#252A24] dark:text-[#EEF1E9] truncate leading-tight">
                  {user?.employee?.fullName || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-[#858A80] dark:text-[#929D8D] truncate capitalize">{user?.role}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-[#858A80] hover:text-[#B64D45] dark:text-[#929D8D] dark:hover:text-[#D2635B] rounded-lg hover:bg-white dark:hover:bg-[#293229] transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
