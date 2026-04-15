import React, { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle, Smile, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";

interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "seller";
  timestamp: Date;
}

interface InlineChatProps {
  sellerName: string;
  sellerAvatar?: string;
  adTitle: string;
  isOpen: boolean;
  onToggle: () => void;
}

const QUICK_MESSAGES = [
  "Ainda está disponível?",
  "Aceita troca?",
  "Qual o menor preço?",
  "Pode entregar?",
  "Tem defeito?",
];

export function InlineChat({
  sellerName,
  sellerAvatar,
  adTitle,
  isOpen,
  onToggle,
}: InlineChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: `Olá! Pergunte sobre "${adTitle}"`,
      sender: "seller",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "me",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // Simulate seller typing
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Obrigado pelo interesse! Vou responder em breve.",
          sender: "seller",
          timestamp: new Date(),
        },
      ]);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="mt-4 rounded-2xl border bg-card overflow-hidden"
        >
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-secondary/50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                {sellerAvatar ? (
                  <img
                    src={sellerAvatar}
                    alt={sellerName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-primary">
                    {sellerName[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold">{sellerName}</p>
                <p className="text-[10px] text-success flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Online agora
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggle}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="h-64 overflow-y-auto p-3 space-y-2 scrollbar-hide"
          >
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex",
                  msg.sender === "me" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed",
                    msg.sender === "me"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  )}
                >
                  {msg.text}
                  <p
                    className={cn(
                      "text-[9px] mt-1 opacity-60",
                      msg.sender === "me"
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {msg.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}

            {typing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick replies */}
          <div className="px-3 pb-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
              {QUICK_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  onClick={() => sendMessage(msg)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 pb-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Smile className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Digite sua mensagem..."
              className="h-9 text-xs rounded-xl bg-secondary border-0"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 rounded-xl"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
