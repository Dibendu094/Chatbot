import React, { useEffect, useState } from 'react';
import { X, Monitor, Moon, Sun, Check } from 'lucide-react';
import { useTheme } from 'next-themes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCENT_COLORS = [
  { name: 'Violet', value: '124 58 237', css: 'bg-violet-600' },
  { name: 'Blue', value: '37 99 235', css: 'bg-blue-600' },
  { name: 'Green', value: '22 163 74', css: 'bg-green-600' },
  { name: 'Orange', value: '234 88 12', css: 'bg-orange-600' },
  { name: 'Pink', value: '219 39 119', css: 'bg-pink-600' },
  { name: 'Red', value: '220 38 38', css: 'bg-red-600' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('General');
  
  // Accent color state management (rudimentary via document style injection for now)
  const [currentAccent, setCurrentAccent] = useState('124 58 237'); // Default violet

  useEffect(() => {
    setMounted(true);
    // Attempt to read current accent from root
    const root = document.documentElement;
    const val = getComputedStyle(root).getPropertyValue('--accent').trim();
    if(val) setCurrentAccent(val);
  }, []);

  const handleAccentChange = (colorValue: string) => {
    setCurrentAccent(colorValue);
    document.documentElement.style.setProperty('--accent', colorValue);
    // Also update generic tailwind colors if they were using the variable directly, 
    // but since we are using specific utility classes, we might need a dynamic style block or js-in-css.
    // Ideally we'd use a Context for this, but direct DOM manipulation is fastest for this "wow" factor now.
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[rgb(var(--background))] border border-[rgb(var(--border-color))] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-[rgb(var(--sidebar-bg))] border-b md:border-b-0 md:border-r border-[rgb(var(--border-color))] p-4 flex flex-col gap-2">
          <h2 className="text-lg font-bold px-2 py-4 text-[rgb(var(--foreground))]">Settings</h2>
          {['General', 'Appearance', 'Data Controls', 'Builder Profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-[rgb(var(--border-color))] text-[rgb(var(--foreground))]'
                  : 'text-[rgb(var(--sidebar-fg))] hover:bg-[rgb(var(--border-color))]/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-color))]">
            <h3 className="font-semibold text-[rgb(var(--foreground))]">{activeTab}</h3>
            <button onClick={onClose} className="text-[rgb(var(--sidebar-fg))] hover:text-[rgb(var(--foreground))]">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'Appearance' ? (
              <div className="space-y-8">
                {/* Theme Section */}
                <div>
                    <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-4">Theme</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <button 
                            onClick={() => setTheme('system')}
                            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10' : 'border-[rgb(var(--border-color))] hover:border-[rgb(var(--sidebar-fg))]'}`}
                        >
                           <Monitor size={24} className={theme === 'system' ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--sidebar-fg))]'} />
                           <span className="text-sm">System</span>
                        </button>
                        <button 
                            onClick={() => setTheme('light')}
                            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10' : 'border-[rgb(var(--border-color))] hover:border-[rgb(var(--sidebar-fg))]'}`}
                        >
                           <Sun size={24} className={theme === 'light' ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--sidebar-fg))]'} />
                           <span className="text-sm">Light</span>
                        </button>
                        <button 
                            onClick={() => setTheme('dark')}
                            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10' : 'border-[rgb(var(--border-color))] hover:border-[rgb(var(--sidebar-fg))]'}`}
                        >
                           <Moon size={24} className={theme === 'dark' ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--sidebar-fg))]'} />
                           <span className="text-sm">Dark</span>
                        </button>
                    </div>
                </div>

                {/* Color Section */}
                <div>
                   <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-4">Accent Color</h4>
                   <div className="flex flex-wrap gap-4">
                      {ACCENT_COLORS.map((color) => (
                           <button
                             key={color.name}
                             onClick={() => handleAccentChange(color.value)}
                             className={`w-12 h-12 rounded-full ${color.css} flex items-center justify-center hover:scale-110 transition-transform ring-offset-2 ring-offset-[rgb(var(--background))] ${currentAccent === color.value ? 'ring-2 ring-[rgb(var(--sidebar-fg))]' : ''}`}
                             title={color.name}
                           >
                              {currentAccent === color.value && <Check size={20} className="text-white drop-shadow-md" />}
                           </button>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
                <div className="text-[rgb(var(--sidebar-fg))] text-center py-10">
                    <p>Settings for {activeTab} are coming soon.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
