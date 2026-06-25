import { Terminal, Cpu } from 'lucide-react';

export default function MessageBubble({ message, onSourceClick }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 w-full min-w-0 ${isUser ? 'flex-row-reverse' : 'justify-start'}`}>
      
      {/* Avatar Icons */}
      <div className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-mono shadow-sm
        ${isUser 
          ? 'bg-[#152033] border-blue-500/30 text-blue-400' 
          : 'bg-[#11131a] border-[#1b1e28] text-emerald-400'
        }`}
      >
        {isUser ? <Terminal size={12} /> : <Cpu size={12} />}
      </div>

      {/* Structural Message Bubble Code Panels */}
      <div className={`max-w-[85%] min-w-0 flex flex-col`}>
        {/* Author Label Headers */}
        <span className="text-[10px] font-mono text-gray-500 mb-1 tracking-wider px-0.5">
          {isUser ? 'USER_PROMPT' : 'SYSTEM_SYNTHESIS'}
        </span>

        {/* Text Container */}
        <div className={`rounded-xl px-4 py-3 border shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words min-w-0
          ${isUser
            ? 'bg-[#111622]/40 text-gray-100 border-blue-500/20 rounded-tr-sm'
            : 'bg-[#0f111a] text-gray-200 border-[#1b1e28] rounded-tl-sm'
          }`}
        >
          <p className="font-sans antialiased select-text">{message.content}</p>

          {/* Context Citation Nodes */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#1b1e28] select-none">
              {message.sources.map((source, i) => (
                <button
                  key={i}
                  onClick={() => onSourceClick && onSourceClick(message.sources)}
                  className="bg-[#151824] hover:bg-[#1d2233] border border-[#272b3a] hover:border-blue-500/40 text-blue-400 font-mono text-[10px] px-2.5 py-0.5 rounded-md transition-all duration-150 flex items-center gap-1"
                >
                  <span className="text-gray-500 font-sans">#</span> 
                  <span>{source.source}</span>
                  <span className="text-gray-600 select-none">•</span>
                  <span className="text-gray-400">ch-{source.chunk_index + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}