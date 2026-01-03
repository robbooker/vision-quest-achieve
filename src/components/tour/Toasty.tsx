import { cn } from "@/lib/utils";

export type ToastyExpression = "happy" | "wave" | "thinking" | "celebrate";

interface ToastyProps {
  expression?: ToastyExpression;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Toasty({ expression = "happy", size = "md", className }: ToastyProps) {
  const sizeClasses = {
    sm: "w-12 h-14",
    md: "w-16 h-20",
    lg: "w-20 h-24",
  };

  const getFace = () => {
    switch (expression) {
      case "wave":
        return (
          <>
            {/* Eyes */}
            <circle cx="18" cy="28" r="2.5" fill="#4A3728" />
            <circle cx="30" cy="28" r="2.5" fill="#4A3728" />
            {/* Smile */}
            <path d="M20 36 Q24 42 28 36" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Waving arm */}
            <ellipse cx="40" cy="18" rx="4" ry="6" fill="#D4A574" stroke="#C4956A" strokeWidth="1" transform="rotate(-30 40 18)" />
          </>
        );
      case "thinking":
        return (
          <>
            {/* Eyes - one raised */}
            <circle cx="18" cy="28" r="2.5" fill="#4A3728" />
            <circle cx="30" cy="26" r="2.5" fill="#4A3728" />
            {/* Thinking mouth */}
            <path d="M20 38 Q24 36 28 38" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Hand on chin */}
            <ellipse cx="34" cy="42" rx="3" ry="4" fill="#D4A574" stroke="#C4956A" strokeWidth="1" />
          </>
        );
      case "celebrate":
        return (
          <>
            {/* Happy eyes - closed crescents */}
            <path d="M15 28 Q18 24 21 28" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M27 28 Q30 24 33 28" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Big smile */}
            <path d="M18 36 Q24 44 30 36" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Both arms up */}
            <ellipse cx="8" cy="16" rx="4" ry="6" fill="#D4A574" stroke="#C4956A" strokeWidth="1" transform="rotate(-45 8 16)" />
            <ellipse cx="40" cy="16" rx="4" ry="6" fill="#D4A574" stroke="#C4956A" strokeWidth="1" transform="rotate(45 40 16)" />
            {/* Confetti */}
            <circle cx="6" cy="8" r="2" fill="#F59E0B" />
            <circle cx="42" cy="10" r="2" fill="#10B981" />
            <circle cx="24" cy="4" r="1.5" fill="#EC4899" />
          </>
        );
      case "happy":
      default:
        return (
          <>
            {/* Eyes */}
            <circle cx="18" cy="28" r="2.5" fill="#4A3728" />
            <circle cx="30" cy="28" r="2.5" fill="#4A3728" />
            {/* Smile */}
            <path d="M18 36 Q24 42 30 36" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <div className={cn("relative inline-block", sizeClasses[size], className)}>
      <svg viewBox="0 0 48 56" className="w-full h-full drop-shadow-md">
        {/* Toast body - bread shape with rounded top */}
        <defs>
          <linearGradient id="toastGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8C89E" />
            <stop offset="50%" stopColor="#D4A574" />
            <stop offset="100%" stopColor="#C4956A" />
          </linearGradient>
          <linearGradient id="butterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
        </defs>
        
        {/* Bread body */}
        <path 
          d="M6 16 Q6 6 24 6 Q42 6 42 16 L42 52 Q42 54 40 54 L8 54 Q6 54 6 52 Z" 
          fill="url(#toastGradient)"
          stroke="#B8845A"
          strokeWidth="1"
        />
        
        {/* Crust edge detail */}
        <path 
          d="M8 16 Q8 8 24 8 Q40 8 40 16" 
          stroke="#A67548"
          strokeWidth="1"
          fill="none"
        />
        
        {/* Butter pat on top */}
        <rect 
          x="16" 
          y="10" 
          width="16" 
          height="8" 
          rx="2" 
          fill="url(#butterGradient)"
          stroke="#EAB308"
          strokeWidth="0.5"
        />
        
        {/* Face based on expression */}
        {getFace()}
        
        {/* Grain texture dots */}
        <circle cx="12" cy="45" r="1" fill="#B8845A" opacity="0.4" />
        <circle cx="36" cy="48" r="1" fill="#B8845A" opacity="0.4" />
        <circle cx="20" cy="50" r="0.8" fill="#B8845A" opacity="0.3" />
        <circle cx="32" cy="46" r="0.8" fill="#B8845A" opacity="0.3" />
      </svg>
    </div>
  );
}
