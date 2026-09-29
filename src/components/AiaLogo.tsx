import React from 'react';

interface Props {
  variant?: 'full' | 'compact' | 'badge' | 'sidebar';
  className?: string;
}

export const AiaLogo: React.FC<Props> = ({ variant = 'full', className = '' }) => {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center select-none ${className}`}>
        {/* Red block with white text */}
        <div className="bg-[#e11d2a] !text-white px-2.5 py-1 rounded-l-md font-extrabold tracking-tighter text-xs sm:text-sm flex items-center shadow-sm">
          <span className="!text-white font-black">AIA</span>
        </div>
        {/* Green block with agro icon */}
        <div className="bg-[#1ea844] !text-white px-2 py-1 rounded-r-md font-bold text-[10px] flex items-center gap-1 shadow-sm">
          <span className="!text-white">AL ATLAS</span>
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center overflow-hidden rounded-md border border-slate-700/60 shadow-sm ${className}`}>
        <span className="bg-[#e11d2a] !text-white text-[11px] font-black px-2 py-0.5 tracking-wide">
          AGRO INDUSTRIELLE
        </span>
        <span className="bg-[#1ea844] !text-white text-[11px] font-black px-2 py-0.5">
          AL ATLAS
        </span>
      </div>
    );
  }

  // Sidebar-tailored variant: strictly constrained to fit inside w-72 without horizontal overflow
  if (variant === 'sidebar') {
    return (
      <div className={`flex flex-col items-start select-none w-full max-w-full overflow-hidden ${className}`}>
        {/* Top Banner: Red Main Block + Green Stepped Block with Livestock Silhouettes */}
        <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden border border-black/10 dark:border-white/10 w-full max-w-[240px]">
          {/* Red Main Block */}
          <div className="bg-[#e11d2a] !text-white px-2.5 py-1.5 flex-1 flex items-center justify-center font-black tracking-tight text-[11px] uppercase shadow-inner truncate">
            <span className="!text-white font-black truncate">AL ATLAS AIA</span>
          </div>

          {/* Green Animal Section */}
          <div className="bg-[#1ea844] px-2 py-1 flex items-center justify-center relative !text-white shadow-inner shrink-0">
            {/* SVG Silhouette of Chicken, Sheep, Cow */}
            <svg className="h-5 w-auto fill-white text-white" viewBox="0 0 100 40">
              <path d="M5,35 Q7,28 11,26 Q13,24 11,22 Q12,20 15,22 Q17,25 15,35 Z" fill="#ffffff" />
              <polygon points="15,22 18,23 15,24" fill="#ffffff" />
              <path d="M25,35 L26,30 Q27,24 33,22 Q37,21 42,22 L45,18 L48,22 Q50,26 49,30 L50,35 L46,35 L45,30 L32,30 L31,35 Z" fill="#ffffff" />
              <path d="M55,35 L57,28 Q60,18 70,16 Q78,15 85,16 L92,8 L96,12 L92,18 Q93,24 92,28 L94,35 L89,35 L88,27 L65,27 L63,35 Z" fill="#ffffff" />
              <polygon points="92,8 96,6 94,11" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* Subtitle Line */}
        <div className="mt-1 text-[8.5px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate max-w-full">
          ALIMENTS DE BÉTAIL ET VOLAILLE
        </div>
      </div>
    );
  }

  // Full Brand Logo replicating the uploaded visual identity with responsive sizing
  return (
    <div className={`flex flex-col items-start select-none max-w-full overflow-hidden ${className}`}>
      {/* Top Banner: Red Main Block + Green Stepped Block with Livestock Silhouettes */}
      <div className="flex items-stretch shadow-md rounded-sm overflow-hidden border border-black/10 max-w-full">
        {/* Red Main Block */}
        <div className="bg-[#e11d2a] !text-white px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center font-black tracking-tight text-[11px] sm:text-sm uppercase shadow-inner truncate">
          <span className="!text-white font-black truncate">AGRO INDUSTRIELLE AL ATLAS</span>
        </div>

        {/* Stepped Transition / Green Animal Section */}
        <div className="bg-[#1ea844] px-2 sm:px-3 py-1 flex items-center justify-center relative !text-white shadow-inner shrink-0">
          <svg className="h-5 sm:h-7 w-auto fill-white text-white" viewBox="0 0 100 40">
            <path d="M5,35 Q7,28 11,26 Q13,24 11,22 Q12,20 15,22 Q17,25 15,35 Z" fill="#ffffff" />
            <polygon points="15,22 18,23 15,24" fill="#ffffff" />
            <path d="M25,35 L26,30 Q27,24 33,22 Q37,21 42,22 L45,18 L48,22 Q50,26 49,30 L50,35 L46,35 L45,30 L32,30 L31,35 Z" fill="#ffffff" />
            <path d="M55,35 L57,28 Q60,18 70,16 Q78,15 85,16 L92,8 L96,12 L92,18 Q93,24 92,28 L94,35 L89,35 L88,27 L65,27 L63,35 Z" fill="#ffffff" />
            <polygon points="92,8 96,6 94,11" fill="#ffffff" />
          </svg>
        </div>
      </div>

      {/* Subtitle Line in clean dark/slate style */}
      <div className="mt-1 text-[8.5px] sm:text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-300 uppercase truncate max-w-full">
        ALIMENTS DE BÉTAIL ET VOLAILLE
      </div>
    </div>
  );
};
