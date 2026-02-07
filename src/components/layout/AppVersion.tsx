import { format } from 'date-fns';
import { toast } from 'sonner';

interface AppVersionProps {
  showBuildTime?: boolean;
  className?: string;
}

export function AppVersion({ showBuildTime = true, className = '' }: AppVersionProps) {
  const version = __APP_VERSION__;
  const buildTime = new Date(__BUILD_TIME__);

  const copyVersion = () => {
    const versionString = `v${version} (${__BUILD_TIME__})`;
    navigator.clipboard.writeText(versionString);
    toast.success('Version copied to clipboard');
  };

  return (
    <button
      onClick={copyVersion}
      className={`text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`}
      title="Click to copy version info"
    >
      v{version}
      {showBuildTime && ` • Built ${format(buildTime, 'MMM d, yyyy')}`}
    </button>
  );
}
