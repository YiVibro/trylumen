import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { sendMessage } from '../../services/api';
import { Sparkles } from 'lucide-react';

export default function ChatWindow({ selectedDocs, setActiveSources }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (query) => {
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data } = await sendMessage(query, selectedDocs,messages);
      const aiMessage = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'System Pipeline Error: Execution aborted during processing.',
        sources: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden justify-between bg-[#07080a]">

      {/* Messages Viewport Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8 min-h-0">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          
          {messages.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center px-4 font-sans select-none">
              <div className="bg-blue-600/5 border border-blue-500/10 p-3.5 rounded-2xl mb-4 text-blue-500 shadow-sm animate-pulse">
                <Sparkles size={24} />
              </div>
              <p className="text-white font-medium text-sm tracking-tight">System Terminal Ready</p>
              <p className="text-gray-500 text-xs max-w-xs mt-1.5 leading-relaxed">
                Mount local document sets from your explorer directory to begin context aggregation.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                onSourceClick={setActiveSources}
              />
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-4 items-start animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-[#11131c] border border-blue-500/20 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-blue-400 text-xs font-mono animate-spin">⧗</span>
              </div>
              <div className="bg-[#0f111a] border border-[#1b1e28] rounded-xl rounded-tl-sm px-4 py-3 shadow-md max-w-[85%]">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Action Panel */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-[#07080a] via-[#07080a] to-transparent shrink-0">
        <div className="max-w-3xl mx-auto w-full">
          <ChatInput onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </div>
  );
}