import { useEffect } from "react";

export function CursorTrail() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let rafId: number | null = null;
    let pending = false;

    const onMouseMove = (e: MouseEvent) => {
      if (pending) return;
      pending = true;
      rafId = requestAnimationFrame(() => {
        pending = false;
        const dot = document.createElement("div");
        dot.style.cssText = `
          position:fixed;
          left:${e.clientX}px;
          top:${e.clientY}px;
          width:8px;height:8px;
          border-radius:50%;
          background:hsl(var(--primary)/0.7);
          pointer-events:none;
          z-index:9999;
          transform:translate(-50%,-50%) scale(1);
          opacity:0.8;
          transition:all 600ms ease-out;
        `;
        document.body.appendChild(dot);
        requestAnimationFrame(() => {
          dot.style.opacity = "0";
          dot.style.transform = "translate(-50%,-50%) scale(0)";
        });
        setTimeout(() => dot.remove(), 650);
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
