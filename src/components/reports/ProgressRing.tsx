import { useEffect, useState, useRef } from 'react';

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function ProgressRing({ 
  value, 
  max, 
  size = 80, 
  strokeWidth = 8,
  className = '',
  label
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const hasAnimated = useRef(false);
  const elementRef = useRef<SVGSVGElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = max > 0 ? Math.min((animatedValue / max) * 100, 100) : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          // Animate the value
          const startTime = Date.now();
          const duration = 1500;
          
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            setAnimatedValue(easeOutQuart * value);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setAnimatedValue(value);
            }
          };
          
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [value]);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg
        ref={elementRef}
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="text-xl font-bold">{Math.round(percentage)}%</span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
