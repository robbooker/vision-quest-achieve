import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ArenaTypingIndicatorProps {
  ai: 'claude' | 'gemini';
}

const aiConfig = {
  claude: {
    name: 'Claude',
    bgClass: 'bg-purple-500/10 border-purple-500/30',
    dotClass: 'bg-purple-400',
  },
  gemini: {
    name: 'Gemini',
    bgClass: 'bg-blue-500/10 border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
};

export function ArenaTypingIndicator({ ai }: ArenaTypingIndicatorProps) {
  const config = aiConfig[ai];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border',
        config.bgClass
      )}
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn('w-2 h-2 rounded-full', config.dotClass)}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {config.name} is thinking...
      </span>
    </motion.div>
  );
}
