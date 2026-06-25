import { useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-[#0c0d12] border border-[#1b1e28] rounded-2xl focus-within:border-blue-500/40 transition-all duration-150 shadow-2xl backdrop-blur-md">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Query dataset context..."
        rows={1}
        className="flex-1 bg-transparent text-gray-200 text-sm py-2 px-3 focus:outline-none transition resize-none placeholder-gray-600 disabled:opacity-50 font-sans min-w-0 max-h-32"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-10 text-white p-2.5 rounded-xl transition-all duration-150 shrink-0 shadow-md flex items-center justify-center disabled:hover:bg-blue-600"
        title="Execute Operation"
      >
        <ArrowUp size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}