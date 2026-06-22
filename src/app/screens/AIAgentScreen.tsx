import { useState, useRef, useEffect } from "react";
import { Send, Image, Mic, Trash2, Bot, User, TrendingUp, PiggyBank, AlertCircle } from "lucide-react";
import { aiAPI } from "../services/api";
import { toast } from "sonner";

interface Message {
  id: number;
  type: "ai" | "user";
  content: string;
  timestamp: string;
}

export function AIAgentScreen() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content: "👋 Hi! I'm your Finly AI assistant. I can help you with:",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    {
      id: 2,
      type: "ai",
      content: "• Analyzing your spending patterns\n• Setting budgets and goals\n• Scanning receipts and bills\n• Forecasting expenses\n• Financial advice and tips",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const suggestions = [
    { icon: TrendingUp, text: "Analyze my spending this month" },
    { icon: PiggyBank, text: "How can I save more?" },
    { icon: AlertCircle, text: "Budget optimization tips" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = {
      id: Date.now(),
      type: "user" as const,
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, userMsg]);
    const prompt = message;
    setMessage("");
    setIsLoading(true);

    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, type: "ai" as const, content: "Thinking...", timestamp: "" }]);

    try {
      const response = await aiAPI.chat(prompt);
      const aiContent = response?.reply || response?.message || response?.response || response?.answer
        || (typeof response === "string" ? response : "I couldn't generate a response. Please try again.");
      setMessages(prev => prev.map(m => m.id === typingId ? {
        ...m, content: aiContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === typingId ? {
        ...m, content: `Sorry, I encountered an error: ${err?.message || "Please try again later."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([{
      id: Date.now(), type: "ai" as const,
      content: "👋 Chat cleared! How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    toast.success("Chat cleared");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="px-5 py-4 bg-gradient-to-r from-[#D4A24C]/20 to-[#D4A24C]/20 border-b border-[#D4A24C]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4A24C]/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#D4A24C]" />
          </div>
          <div className="flex-1">
            <h3 className="text-ink font-semibold text-sm">AI Financial Coach</h3>
            <p className="text-xs text-ink/60">Powered by advanced AI • Always learning</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.type === "user" ? "flex-row-reverse" : ""}`}>
            {msg.type === "ai" ? (
              <div className="w-8 h-8 rounded-full bg-[#D4A24C]/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-[#D4A24C]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#D4A24C]/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[#D4A24C]" />
              </div>
            )}
            <div className={`flex-1 ${msg.type === "user" ? "flex flex-col items-end" : ""}`}>
              <div className={`px-4 py-3 rounded-2xl max-w-[85%] ${
                msg.type === "ai" ? "bg-[var(--surface)] border border-[var(--divider)]" : "bg-gradient-to-r from-[#D4A24C] to-[#D4A24C]"
              }`}>
                <p className="text-sm text-ink whitespace-pre-line">
                  {msg.content === "Thinking..." ? <span className="animate-pulse">Thinking...</span> : msg.content}
                </p>
              </div>
              {msg.timestamp && <p className="text-xs text-ink/40 mt-1 px-1">{msg.timestamp}</p>}
            </div>
          </div>
        ))}

        {messages.filter(m => m.type === "user").length === 0 && (
          <div className="space-y-2 pt-4">
            <p className="text-xs text-ink/50 px-1">Quick Suggestions:</p>
            {suggestions.map((s, i) => {
              const Icon = s.icon;
              return (
                <button key={i} onClick={() => setMessage(s.text)}
                  className="w-full flex items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--divider)] rounded-xl hover:border-[#D4A24C]/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#D4A24C]/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#D4A24C]" />
                  </div>
                  <span className="text-sm text-ink">{s.text}</span>
                </button>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-5 py-4 border-t border-[var(--divider)] bg-[var(--bg-deep)]">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => toast.info("Receipt scanning coming soon!")} className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] border border-ink/10 rounded-lg text-sm text-ink hover:border-[#D4A24C]/30 active:scale-95 transition-all">
            <Image className="w-4 h-4" /><span>Scan Receipt</span>
          </button>
          <button onClick={() => toast.info("Voice input coming soon!")} className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] border border-ink/10 rounded-lg text-sm text-ink hover:border-[#D4A24C]/30 active:scale-95 transition-all">
            <Mic className="w-4 h-4" /><span>Voice</span>
          </button>
          <button onClick={handleClear} className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] border border-ink/10 rounded-lg text-sm text-ink hover:border-[#EF4444]/30 active:scale-95 transition-all">
            <Trash2 className="w-4 h-4" /><span>Clear</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything about your finances..."
            className="flex-1 px-4 py-3 bg-[var(--surface)] border border-ink/10 rounded-xl text-ink placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none"
            disabled={isLoading} />
          <button onClick={handleSend} disabled={isLoading || !message.trim()}
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A24C] to-[#D4A24C] flex items-center justify-center shadow-lg shadow-[#D4A24C]/30 active:scale-95 transition-transform disabled:opacity-50">
            <Send className="w-5 h-5 text-ink" />
          </button>
        </div>
      </div>
    </div>
  );
}

