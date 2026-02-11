import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import type { ArenaRole } from '@/hooks/useAIArena';

interface ArenaMessageProps {
  role: ArenaRole;
  content: string;
  isStreaming?: boolean;
}

const roleConfig = {
  claude: {
    name: 'Claude',
    bgClass: 'bg-purple-500/10 border-purple-500/30',
    avatarClass: 'bg-gradient-to-br from-purple-500 to-purple-700',
    textClass: 'text-purple-400',
  },
  gemini: {
    name: 'Gemini',
    bgClass: 'bg-blue-500/10 border-blue-500/30',
    avatarClass: 'bg-gradient-to-br from-blue-500 to-blue-700',
    textClass: 'text-blue-400',
  },
  host: {
    name: 'You',
    bgClass: 'bg-green-500/10 border-green-500/30',
    avatarClass: 'bg-gradient-to-br from-green-500 to-green-700',
    textClass: 'text-green-400',
  },
};

export function ArenaMessage({ role, content, isStreaming }: ArenaMessageProps) {
  const config = roleConfig[role];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 p-4 rounded-lg border',
        config.bgClass
      )}
    >
      {/* Avatar */}
      <motion.div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
          config.avatarClass
        )}
        animate={isStreaming ? { 
          boxShadow: ['0 0 0 0 rgba(147, 51, 234, 0)', '0 0 20px 4px rgba(147, 51, 234, 0.4)', '0 0 0 0 rgba(147, 51, 234, 0)']
        } : {}}
        transition={isStreaming ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {role === 'claude' && '🟣'}
        {role === 'gemini' && '🔵'}
        {role === 'host' && '👤'}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn('font-semibold text-sm mb-1', config.textClass)}>
          {config.name}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
        </div>
        {isStreaming && (
          <motion.span
            className="inline-block w-2 h-4 bg-current ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}
