import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AiChatModal from './AiChatModal';
import ChangePasswordModal from '../pages/ChangePasswordModal';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const { forceChangePasswordOpen } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F3EB] dark:bg-[#171C18] text-[#252A24] dark:text-[#EEF1E9] transition-colors duration-150">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-60 flex flex-col min-h-screen">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenAi={() => setAiModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global AI Chat Modal */}
      <AiChatModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />

      {/* Forced Password Change Modal */}
      <ChangePasswordModal isOpen={forceChangePasswordOpen} />
    </div>
  );
};

export default Layout;
