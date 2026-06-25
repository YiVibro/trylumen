import { FileText, Hash, X } from 'lucide-react';

export default function SourcePreview({ sources, onClose }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[#0c0d12]/40">
        <div className="bg-[#11131c] p-3.5 rounded-2xl mb-4 border border-[#1b1e28] shadow-sm">
          <FileText size={24} className="text-gray-600" />
        </div>
        <p className="text-gray-400 text-xs font-medium tracking-tight">Inspector Empty</p>
        <p className="text-gray-600 text-[11px] max-w-xs mt-1 leading-relaxed">
          Source chunks will appear here when you click on a citation tag inside a response.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full bg-[#0c0d12]/40">
      
      {/* Header with Close Action Trigger */}
      <div className="flex items-center justify-between mb-4 border-b border-[#1b1e28] pb-3 shrink-0">
        <h2 className="text-white font-semibold text-xs flex items-center gap-2 uppercase font-mono tracking-wider text-gray-400">
          <FileText size={12} className="text-blue-500" />
          Sources Grounding
        </h2>
        
        {/* Modern Top Right Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white hover:bg-[#1b1e28] p-1 rounded-md transition-all duration-150"
            title="Close Inspector"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Scrollable list of source cards */}
      <div className="space-y-3 overflow-y-auto flex-1 min-h-0 custom-scrollbar pr-1">
        {sources.map((source, i) => (
          <div
            key={i}
            className="bg-[#0f111a] border border-[#1b1e28] rounded-xl p-3.5 shadow-sm hover:border-[#272b3a] transition-all duration-150 animate-fade-in"
          >
            {/* Source item sub-header */}
            <div className="flex items-start gap-2.5 mb-2.5">
              <div className="bg-blue-600/5 border border-blue-500/10 p-1.5 rounded-lg shrink-0">
                <FileText size={12} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-200 text-xs font-medium truncate" title={source.source}>
                  {source.source}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Hash size={9} className="text-gray-600" />
                  <span className="text-gray-500 font-mono text-[10px]">chunk-{source.chunk_index + 1}</span>
                </div>
              </div>
              <div className="shrink-0">
                <span className="bg-emerald-500/5 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/10 font-medium">
                  {Math.round(source.similarity * 100)}% match
                </span>
              </div>
            </div>

            {/* Chunk copy data */}
            <div className="bg-[#07080a] border border-[#1b1e28]/40 rounded-lg p-2.5">
              <p className="text-gray-400 font-sans text-xs leading-relaxed select-text line-clamp-6">
                {source.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}