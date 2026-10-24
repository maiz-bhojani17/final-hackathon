import React from 'react';

const statusStyles = {
  // Attendance
  present: {
    badge: 'bg-[#477A57]/10 text-[#477A57] border-[#477A57]/25 dark:bg-[#5E9E72]/15 dark:text-[#88C49C] dark:border-[#5E9E72]/30',
    dot: 'bg-[#477A57] dark:bg-[#5E9E72]'
  },
  late: {
    badge: 'bg-[#A87535]/10 text-[#A87535] border-[#A87535]/25 dark:bg-[#C68E48]/15 dark:text-[#E2B376] dark:border-[#C68E48]/30',
    dot: 'bg-[#A87535] dark:bg-[#C68E48]'
  },
  half_day: {
    badge: 'bg-[#626F47]/10 text-[#626F47] border-[#626F47]/25 dark:bg-[#B4BE83]/15 dark:text-[#D1DBA5] dark:border-[#B4BE83]/30',
    dot: 'bg-[#626F47] dark:bg-[#B4BE83]'
  },
  absent: {
    badge: 'bg-[#B64D45]/10 text-[#B64D45] border-[#B64D45]/25 dark:bg-[#D2635B]/15 dark:text-[#ECA39D] dark:border-[#D2635B]/30',
    dot: 'bg-[#B64D45] dark:bg-[#D2635B]'
  },
  on_leave: {
    badge: 'bg-[#597C91]/10 text-[#597C91] border-[#597C91]/25 dark:bg-[#6F96AE]/15 dark:text-[#A7C5D8] dark:border-[#6F96AE]/30',
    dot: 'bg-[#597C91] dark:bg-[#6F96AE]'
  },
  missing_checkout: {
    badge: 'bg-[#A87535]/10 text-[#A87535] border-[#A87535]/25 dark:bg-[#C68E48]/15 dark:text-[#E2B376] dark:border-[#C68E48]/30',
    dot: 'bg-[#A87535] dark:bg-[#C68E48]'
  },
  holiday_weekend: {
    badge: 'bg-[#EDEFE6] text-[#697064] border-[#E1E4D9] dark:bg-[#293229] dark:text-[#B1B9AC] dark:border-[#384238]',
    dot: 'bg-[#858A80]'
  },

  // Leaves
  pending: {
    badge: 'bg-[#A87535]/10 text-[#A87535] border-[#A87535]/25 dark:bg-[#C68E48]/15 dark:text-[#E2B376] dark:border-[#C68E48]/30',
    dot: 'bg-[#A87535] dark:bg-[#C68E48]'
  },
  approved: {
    badge: 'bg-[#477A57]/10 text-[#477A57] border-[#477A57]/25 dark:bg-[#5E9E72]/15 dark:text-[#88C49C] dark:border-[#5E9E72]/30',
    dot: 'bg-[#477A57] dark:bg-[#5E9E72]'
  },
  rejected: {
    badge: 'bg-[#B64D45]/10 text-[#B64D45] border-[#B64D45]/25 dark:bg-[#D2635B]/15 dark:text-[#ECA39D] dark:border-[#D2635B]/30',
    dot: 'bg-[#B64D45] dark:bg-[#D2635B]'
  },
  cancelled: {
    badge: 'bg-[#EDEFE6] text-[#697064] border-[#E1E4D9] dark:bg-[#293229] dark:text-[#B1B9AC] dark:border-[#384238]',
    dot: 'bg-[#858A80]'
  },

  // Employee status
  active: {
    badge: 'bg-[#477A57]/10 text-[#477A57] border-[#477A57]/25 dark:bg-[#5E9E72]/15 dark:text-[#88C49C] dark:border-[#5E9E72]/30',
    dot: 'bg-[#477A57] dark:bg-[#5E9E72]'
  },
  probation: {
    badge: 'bg-[#597C91]/10 text-[#597C91] border-[#597C91]/25 dark:bg-[#6F96AE]/15 dark:text-[#A7C5D8] dark:border-[#6F96AE]/30',
    dot: 'bg-[#597C91] dark:bg-[#6F96AE]'
  },
  resigned: {
    badge: 'bg-[#EDEFE6] text-[#697064] border-[#E1E4D9] dark:bg-[#293229] dark:text-[#B1B9AC] dark:border-[#384238]',
    dot: 'bg-[#858A80]'
  },
  terminated: {
    badge: 'bg-[#B64D45]/10 text-[#B64D45] border-[#B64D45]/25 dark:bg-[#D2635B]/15 dark:text-[#ECA39D] dark:border-[#D2635B]/30',
    dot: 'bg-[#B64D45] dark:bg-[#D2635B]'
  },

  // Payroll
  draft: {
    badge: 'bg-[#A87535]/10 text-[#A87535] border-[#A87535]/25 dark:bg-[#C68E48]/15 dark:text-[#E2B376] dark:border-[#C68E48]/30',
    dot: 'bg-[#A87535] dark:bg-[#C68E48]'
  },
  finalized: {
    badge: 'bg-[#477A57]/10 text-[#477A57] border-[#477A57]/25 dark:bg-[#5E9E72]/15 dark:text-[#88C49C] dark:border-[#5E9E72]/30',
    dot: 'bg-[#477A57] dark:bg-[#5E9E72]'
  }
};

const StatusBadge = ({ status, className = '' }) => {
  const normStatus = (status || '').toLowerCase().replace(' ', '_');
  const config = statusStyles[normStatus] || {
    badge: 'bg-[#EDEFE6] text-[#697064] border-[#E1E4D9] dark:bg-[#293229] dark:text-[#B1B9AC] dark:border-[#384238]',
    dot: 'bg-[#858A80]'
  };
  const label = (status || 'unknown').replace('_', ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium capitalize border ${config.badge} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
