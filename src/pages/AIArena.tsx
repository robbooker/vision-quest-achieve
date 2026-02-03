import { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArenaMessage } from '@/components/arena/ArenaMessage';
import { ArenaTypingIndicator } from '@/components/arena/ArenaTypingIndicator';
import { ArenaControls } from '@/components/arena/ArenaControls';
import { ArenaHistory } from '@/components/arena/ArenaHistory';
import { useAIArena } from '@/hooks/useAIArena';
import { Sparkles, Zap } from 'lucide-react';

export default function AIArena() {
  const {
    messages,
    isRunning,
    isPaused,
    currentTurn,
    typingAI,
    streamingContent,
    topic,
    currentConversationId,
    conversations,
    conversationsLoading,
    startDebate,
    stopDebate,
    pauseDebate,
    resumeDebate,
    sendHostMessage,
    loadConversation,
    continueConversation,
  } = useAIArena();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <AdminTabs />
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Arena</h1>
              <p className="text-muted-foreground">
                Watch Claude and Gemini debate about your life data
              </p>
            </div>
          </div>

          {isRunning && (
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Live Debate
              </Badge>
              <Badge variant="secondary">
                Topic: {topic}
              </Badge>
              <Badge 
                variant="outline"
                className={currentTurn === 'claude' ? 'border-purple-500 text-purple-500' : 'border-blue-500 text-blue-500'}
              >
                {currentTurn === 'claude' ? '🟣 Claude' : '🔵 Gemini'}'s turn
              </Badge>
              {isPaused && (
                <Badge variant="destructive">Paused</Badge>
              )}
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">
          {/* History Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <ArenaHistory
              conversations={conversations || []}
              isLoading={conversationsLoading}
              onSelect={loadConversation}
            />
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex flex-col gap-4 h-full">
            {/* Messages Area */}
            <div className="flex-1 border-2 rounded-lg bg-card overflow-hidden">
              <ScrollArea className="h-full" ref={scrollRef}>
                <div className="p-4 space-y-4">
                  {messages.length === 0 && !isRunning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-64 text-center"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center text-2xl">
                          🟣
                        </div>
                        <span className="text-2xl font-bold text-muted-foreground">VS</span>
                        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl">
                          🔵
                        </div>
                      </div>
                      <p className="text-muted-foreground max-w-md">
                        Start a debate to watch Claude and Gemini analyze your personal data and 
                        have an autonomous conversation about your life patterns, goals, and progress.
                      </p>
                    </motion.div>
                  )}

                  {messages.map((msg) => (
                    <ArenaMessage
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                    />
                  ))}

                  {/* Streaming message */}
                  {typingAI && streamingContent && (
                    <ArenaMessage
                      role={typingAI}
                      content={streamingContent}
                      isStreaming
                    />
                  )}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {typingAI && !streamingContent && (
                      <ArenaTypingIndicator ai={typingAI} />
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>

            {/* Controls */}
            <ArenaControls
              isRunning={isRunning}
              isPaused={isPaused}
              hasLoadedConversation={!isRunning && !!currentConversationId && messages.length > 0}
              loadedTopic={topic}
              onStart={startDebate}
              onStop={stopDebate}
              onPause={pauseDebate}
              onResume={resumeDebate}
              onSendMessage={sendHostMessage}
              onContinue={continueConversation}
            />
          </div>
        </div>

        {/* Mobile History (below main content on small screens) */}
        <div className="lg:hidden mt-6">
          <ArenaHistory
            conversations={conversations || []}
            isLoading={conversationsLoading}
            onSelect={loadConversation}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
