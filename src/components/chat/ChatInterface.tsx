"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Message } from "@/types/chat";
import { Mobile } from "@/types/mobile";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import SuggestionCard from "./SuggestionCard";
import ComparisonBar from "../comparison/ComparisonBar";
import { Sparkles, Zap, TrendingUp, MessageCircle } from "lucide-react";
import { useComparison } from "@/contexts/ComparisonContext";

export default function ChatInterface() {
  const { comparisonPhones } = useComparison();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Welcome to PhonePixie! I'm your AI-powered mobile shopping assistant. I can help you:\n\n✨ Find perfect phones based on your budget\n🔍 Compare different models in detail\n📚 Explain technical features and specs\n💡 Recommend phones for your specific needs\n\nTry asking me something like:",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickSuggestions = [
    { 
      icon: <TrendingUp size={16} />, 
      text: "Best camera phone under ₹30k?", 
      category: "Popular",
      description: "Find phones with excellent camera quality within your budget. I'll show you devices with high MP counts, OIS, and great low-light performance.",
      examples: [
        "Best camera phone under ₹25k",
        "Phone with 50MP camera under ₹35k",
        "Budget phone with good night mode"
      ],
      phoneNames: ["OnePlus Nord 3", "Samsung Galaxy A54", "Google Pixel 7a"]
    },
    { 
      icon: <Zap size={16} />, 
      text: "Compare Pixel 8a vs OnePlus 12R", 
      category: "Compare",
      description: "Get a detailed side-by-side comparison of specifications, features, and prices. I'll highlight the strengths and trade-offs of each device.",
      examples: [
        "Compare iPhone 13 vs Samsung S21",
        "OnePlus 11 vs Xiaomi 13 comparison",
        "Which is better: Pixel 8a or Nothing Phone 2?"
      ],
      phoneNames: ["Google Pixel 8a", "OnePlus 12R", "Samsung Galaxy S23"]
    },
    { 
      icon: <MessageCircle size={16} />, 
      text: "What is OIS?", 
      category: "Learn",
      description: "Learn about mobile phone technology and features. I'll explain technical terms in simple language with real-world examples.",
      examples: [
        "What is refresh rate?",
        "Explain processor cores",
        "Difference between RAM and storage"
      ],
      phoneNames: []
    },
    { 
      icon: <Sparkles size={16} />, 
      text: "Show me Samsung phones under ₹25k", 
      category: "Search",
      description: "Search by brand, features, or budget. I'll find phones that match your exact requirements and explain why each is recommended.",
      examples: [
        "5G phones under ₹20k",
        "Gaming phones with 120Hz display",
        "Xiaomi phones with fast charging"
      ],
      phoneNames: ["Samsung Galaxy M34", "Samsung Galaxy A24", "Samsung Galaxy F54"]
    },
  ];

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCompare = useCallback(async (phones: Mobile[]) => {
    // Create a user message for display
    const phoneNames = phones.map(p => p.model).join(" vs ");
    const displayMessage = `Compare ${phoneNames}`;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Call the compare API directly with the phone data
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: displayMessage,
          comparePhones: phones // Pass the actual phone objects
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        phones: data.phones,
        type: data.type,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error comparing these phones. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        phones: data.phones,
        additionalPhones: data.additionalPhones,
        type: data.type,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <div className={`flex flex-col h-full relative ${comparisonPhones.length > 0 ? 'pb-20 sm:pb-24' : ''}`}>
      {/* Messages Area with Enhanced Spacing - Responsive */}
      <div 
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6 relative scrollbar-thin min-h-0"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat messages"
      >
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-4">
          {messages.map((message, index) => (
            <div key={message.id} className="fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <MessageBubble message={message} />
            </div>
          ))}
          
          {/* Quick Suggestions - Responsive */}
          {showSuggestions && messages.length === 1 && (
            <div className="slide-up space-y-3 sm:space-y-5 mt-2" style={{ animationDelay: "0.3s" }}>
              <div className="text-center space-y-2">
                <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-[15px] font-medium px-2">Quick suggestions to get started:</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-normal px-2">Click cards to use • Expand for more details and research links</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {quickSuggestions.map((suggestion, idx) => (
                  <SuggestionCard
                    key={idx}
                    icon={suggestion.icon}
                    text={suggestion.text}
                    category={suggestion.category}
                    description={suggestion.description}
                    examples={suggestion.examples}
                    phoneNames={suggestion.phoneNames}
                    onSelect={(text) => {
                      setInput(text);
                      setShowSuggestions(false);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {loading && (
            <div className="flex justify-start slide-up">
              <div className="glass-dark rounded-2xl p-3 sm:p-5 shadow-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex space-x-1.5 sm:space-x-2">
                    <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-gradient-to-r from-pink-400 to-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-[15px] font-normal">Pixie is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => sendMessage()}
        disabled={loading}
        inputRef={inputRef}
      />

      {/* Comparison Bar */}
      <ComparisonBar onCompare={handleCompare} />
    </div>
  );
}


