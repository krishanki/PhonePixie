"use client";

import ChatInterface from "@/components/chat/ChatInterface";
import { Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="flex h-screen flex-col relative overflow-hidden">
      {/* Skip to main content link for keyboard navigation */}
      <a 
        href="#chat-main" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Skip to chat
      </a>

      {/* Aesthetic decorative elements - only render after mount to avoid hydration issues */}
      {mounted && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0 opacity-40" aria-hidden="true">
          {/* Subtle accent lines */}
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/20 dark:via-indigo-500/15 to-transparent"></div>
          <div className="absolute top-1/2 right-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/20 dark:via-purple-500/15 to-transparent"></div>
          <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400/20 dark:via-pink-500/15 to-transparent"></div>
          
          {/* Elegant circles */}
          <div className="absolute top-10 right-20 w-96 h-96 border border-indigo-400/15 dark:border-indigo-500/8 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 border border-purple-400/15 dark:border-purple-500/8 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-pink-400/12 dark:border-pink-500/6 rounded-full"></div>
        </div>
      )}
      
      {/* Clean & Readable Header - Responsive */}
      <header className="glass flex-shrink-0 z-50 border-b border-slate-200/60 dark:border-slate-700/60 backdrop-blur-2xl" role="banner">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-md opacity-60"></div>
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-2 sm:p-2.5 rounded-xl">
                  <Sparkles className="text-white" size={18} />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                  <span className="text-slate-800 dark:text-slate-100">Phone</span>
                  <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Pixie</span>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs font-normal flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  AI Shopping Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <ThemeToggle />
              <Link 
                href="/catalog"
                className="glass-dark px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 sm:gap-2 group"
              >
                <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors" />
                <p className="text-slate-800 dark:text-slate-200 text-[11px] sm:text-[13px] font-normal hidden xs:block">Browse Catalog</p>
                <p className="text-slate-800 dark:text-slate-200 text-[11px] sm:text-[13px] font-normal xs:hidden">Catalog</p>
              </Link>
              <div className="glass-dark px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full hidden md:block">
                <p className="text-slate-800 dark:text-slate-200 text-[11px] sm:text-[13px] font-normal">970+ Phones</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div id="chat-main" className="flex-1 flex flex-col min-h-0 relative z-10" role="main" aria-label="Chat conversation area">
        <ChatInterface />
      </div>
    </main>
  );
}

