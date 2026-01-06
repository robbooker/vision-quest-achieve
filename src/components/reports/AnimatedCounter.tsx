import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function AnimatedCounter({ 
  value, 
  duration = 1500, 
  suffix = '', 
  prefix = '',
  decimals = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          startAnimation();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  const startAnimation = () => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(easeOutQuart * value);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString();

  return (
    <span ref={elementRef}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
