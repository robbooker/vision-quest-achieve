import { Link } from 'react-router-dom';
import { AppVersion } from './AppVersion';

export function Footer() {
  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          © {new Date().getFullYear()} Groovy Planning
          <span className="text-muted-foreground/50">•</span>
          <AppVersion showBuildTime={false} />
        </p>
        <div className="flex items-center gap-4">
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
