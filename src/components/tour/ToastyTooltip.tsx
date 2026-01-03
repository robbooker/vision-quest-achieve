import { TooltipRenderProps } from "react-joyride";
import { Toasty, ToastyExpression } from "./Toasty";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ToastyTooltipProps extends TooltipRenderProps {
  isTerminal?: boolean;
}

export function ToastyTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
  isLastStep,
  isTerminal = false,
}: ToastyTooltipProps) {
  // Determine Toasty's expression based on step
  const getExpression = (): ToastyExpression => {
    if (index === 0) return "wave";
    if (isLastStep) return "celebrate";
    if (step.data?.expression) return step.data.expression as ToastyExpression;
    return "happy";
  };

  return (
    <div
      {...tooltipProps}
      className={`
        relative max-w-sm rounded-xl p-4 shadow-xl border-2
        ${isTerminal 
          ? "bg-black border-orange-500/50 text-orange-100" 
          : "bg-amber-50 border-amber-300 text-amber-950"
        }
      `}
    >
      {/* Close button */}
      <button
        {...closeProps}
        className={`
          absolute top-2 right-2 p-1 rounded-full transition-colors
          ${isTerminal 
            ? "hover:bg-orange-500/20 text-orange-400" 
            : "hover:bg-amber-200 text-amber-700"
          }
        `}
      >
        <X className="h-4 w-4" />
      </button>

      {/* Toasty and content */}
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <Toasty expression={getExpression()} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          {step.title && (
            <h3 className={`font-bold text-sm mb-1 ${isTerminal ? "text-orange-300" : "text-amber-800"}`}>
              {step.title}
            </h3>
          )}
          <div className={`text-sm leading-relaxed ${isTerminal ? "text-orange-100" : "text-amber-900"}`}>
            {step.content}
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-200/50">
        <div className={`text-xs ${isTerminal ? "text-orange-500" : "text-amber-600"}`}>
          Step {index + 1} of {size}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <Button
              {...backProps}
              variant="ghost"
              size="sm"
              className={isTerminal ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/20" : "text-amber-700 hover:bg-amber-100"}
            >
              Back
            </Button>
          )}
          {continuous && (
            <Button
              {...primaryProps}
              size="sm"
              className={
                isTerminal 
                  ? "bg-orange-500 hover:bg-orange-600 text-black" 
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }
            >
              {isLastStep ? "Let's Go!" : "Next"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
