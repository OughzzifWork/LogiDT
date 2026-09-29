import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  variant?: 'header' | 'sidebar' | 'compact';
  className?: string;
}

export const ThemeToggleButton: React.FC<Props> = ({ variant = 'header', className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'sidebar') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={`w-full py-2.5 px-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition active:scale-[0.98] cursor-pointer ${
          isDark
            ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm'
        } ${className}`}
        title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#e11d2a]" />
          )}
          <span>{isDark ? 'Mode Clair' : 'Mode Sombre'}</span>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
          isDark ? 'bg-slate-900 text-amber-400 border border-amber-400/20' : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  // Header / default button
  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl transition flex items-center justify-center active:scale-95 cursor-pointer ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700/70 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm'
      } ${className}`}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label="Basculer le thème clair / sombre"
    >
      {isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4 text-[#e11d2a]" />
      )}
    </button>
  );
};
