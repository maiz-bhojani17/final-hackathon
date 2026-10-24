import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading records...', className = 'py-12' }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-[#697064] dark:text-[#B1B9AC] ${className}`}>
      <Loader2 className="w-7 h-7 animate-spin text-[#29372D] dark:text-[#A3B18A] mb-2.5" />
      <p className="text-xs font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
