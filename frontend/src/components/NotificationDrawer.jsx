import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Info, Calendar, DollarSign, Megaphone } from 'lucide-react';
import api from '../api/client';

const NotificationDrawer = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/comms/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/comms/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/comms/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'leave': return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'payroll': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'announcement': return <Megaphone className="w-4 h-4 text-sky-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#171C18]/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-[#1B211C] h-full shadow-2xl flex flex-col border-l border-[#E1E4D9] dark:border-[#384238] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E1E4D9] dark:border-[#384238] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#29372D] dark:text-[#A3B18A]" />
            <h3 className="font-semibold text-[#252A24] dark:text-[#EEF1E9]">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#626F47] dark:text-[#A3B18A] hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#858A80] hover:text-[#252A24] dark:text-[#929D8D] dark:hover:text-[#EEF1E9]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E1E4D9] dark:divide-[#384238] p-2 space-y-1">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#858A80] dark:text-[#929D8D]">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#858A80] dark:text-[#929D8D]">No notifications yet.</div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id}
                className={`p-3.5 rounded-xl transition-colors ${item.read ? 'opacity-70 hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C]' : 'bg-[#EDEFE6] dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] font-medium'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#293229] border border-[#E1E4D9] dark:border-[#384238] mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] truncate">{item.title}</p>
                      <span className="text-[10px] text-[#858A80] dark:text-[#929D8D]">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#697064] dark:text-[#B1B9AC] mt-1 leading-relaxed">{item.message}</p>
                    {!item.read && (
                      <button
                        onClick={() => handleMarkAsRead(item._id)}
                        className="mt-2 text-[11px] text-[#477A57] dark:text-[#5E9E72] inline-flex items-center gap-1 font-semibold hover:underline"
                      >
                        <Check className="w-3 h-3" /> Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
