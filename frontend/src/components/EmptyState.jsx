import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data to display.',
  action = null,
  className = 'py-16'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${className}`}>
      <div className="w-14 h-14 rounded-xl bg-[#EDEFE6] dark:bg-[#293229] border border-[#E1E4D9] dark:border-[#384238] flex items-center justify-center text-[#858A80] dark:text-[#929D8D] mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">{title}</h3>
      <p className="text-xs text-[#697064] dark:text-[#B1B9AC] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
