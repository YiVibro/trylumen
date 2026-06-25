import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DocumentPanel from '../components/Documents/DocumentPanel';
import ChatWindow from '../components/Chat/ChatWindow';
import SourcePreview from '../components/Sources/SourcePreview';
import { FileSearch, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, logoutUser } = useAuth();
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [activeSources, setActiveSources] = useState(null);

  return (
    <div className="h-screen w-screen bg-[#07080a] text-[#e2e8f0] flex flex-col overflow-hidden font-sans antialiased selection:bg-blue-500/30 selection:text-white">
      
      {/* Top Navbar */}
      <header className="bg-[#0c0d12] border-b border-[#1b1e28] px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="bg-blue-600/10 p-2 rounded-xl border border-blue-500/20 shadow-inner flex items-center justify-center">
            <FileSearch className="text-blue-500" size={18} />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-white font-semibold text-base tracking-tight">InsightStream</h1>
            <span className="bg-[#1b1e28] text-blue-400 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border border-[#272b3a]">
              RAG v1.5
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
            <span className="text-gray-600 select-none">id:</span>
            <span className="text-gray-300">{user?.email}</span>
          </div>
          <div className="h-4 w-px bg-[#1b1e28]" />
          <button
            onClick={logoutUser}
            className="flex items-center gap-2 text-gray-400 hover:text-[#ff4a4a] transition-colors text-xs font-medium"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Main 3-Panel Layout Container */}
      <div className="flex flex-1 overflow-hidden min-h-0 w-full relative">

        {/* Left — File System & Explorer */}
        <div className="w-72 shrink-0 border-r border-[#1b1e28] bg-[#0c0d12]/60 flex flex-col overflow-hidden h-full">
          <div className="h-10 px-4 border-b border-[#1b1e28] flex items-center shrink-0">
            <span className="text-[10px] font-mono font-bold tracking-wider text-gray-500 uppercase">Workspace Context</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DocumentPanel
              selectedDocs={selectedDocs}
              setSelectedDocs={setSelectedDocs}
            />
          </div>
        </div>

        {/* Middle — Conversational Stream Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#07080a] relative">
          <div className="h-10 px-6 border-b border-[#1b1e28] flex items-center shrink-0 bg-[#0c0d12]/20">
            <span className="text-xs font-mono text-gray-400">~/main_session_stream</span>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <ChatWindow
              selectedDocs={selectedDocs}
              setActiveSources={setActiveSources}
            />
          </div>
        </div>

        {/* Right — Document Source Inspector */}
        {/* {activeSources && (
          <div className="w-80 shrink-0 border-l border-[#1b1e28] bg-[#0c0d12]/60 flex flex-col overflow-hidden h-full shadow-2xl">
            <div className="h-10 px-4 border-b border-[#1b1e28] flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono font-bold tracking-wider text-gray-500 uppercase">Context Inspector</span>
              <button 
                onClick={() => setActiveSources(null)}
                className="text-gray-500 hover:text-white font-mono text-sm transition-colors px-1"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SourcePreview sources={activeSources} />
            </div>
          </div>
        )} */}
{/* Right — Source Preview Panel */}
{activeSources && (
  <div className="w-80 shrink-0 border-l border-[#1b1e28] bg-[#0c0d12]/60 flex flex-col overflow-hidden h-full shadow-2xl">
    {/* Pass down the state setter to clear activeSources and hide the component */}
    <SourcePreview 
      sources={activeSources} 
      onClose={() => setActiveSources(null)} 
    />
  </div>
)}
      </div>
    </div>
  );
}