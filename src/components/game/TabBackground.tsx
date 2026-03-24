import { ReactNode } from 'react';
import LightPillar from '../ui/LightPillar';

interface TabBackgroundProps {
  children: ReactNode;
}

export const TabBackground = ({ children }: TabBackgroundProps) => {
  return (
    <div className="relative w-full h-full min-h-[calc(100vh-200px)] overflow-hidden rounded-xl bg-black/20 border border-white/5 shadow-2xl backdrop-blur-md">
      {/* Content Layer */}
      <div className="relative z-10 w-full h-full p-4 sm:p-6 opacity-100">
        {children}
      </div>
    </div>
  );
};
