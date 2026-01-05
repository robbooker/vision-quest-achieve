import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToastSound } from "@/hooks/useToastSound";

interface TourHelpButtonProps {
  onClick: () => void;
  isTerminal?: boolean;
}

export function TourHelpButton({ onClick, isTerminal = false }: TourHelpButtonProps) {
  const { playToastPop } = useToastSound();

  const handleClick = () => {
    playToastPop();
    onClick();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className={
              isTerminal 
                ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/20" 
                : "text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            }
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Take a tour with Toasty 🍞</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
