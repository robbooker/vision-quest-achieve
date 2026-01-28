import { useParams, Link } from "react-router-dom";
import { usePublicListByToken } from "@/hooks/useListShares";
import { ListItemComponent } from "@/components/lists/ListItem";
import { FileText, Loader2, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import gpLogo from "@/assets/gp-logo.png";

function LoginInviteBanner() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={gpLogo} alt="Groovy Planning" className="h-10 w-auto" />
        </Link>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Want to collaborate on this note?
          </span>
          <Button asChild size="sm">
            <Link to="/auth">
              <LogIn className="h-4 w-4 mr-2" />
              Sign in to collaborate
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function PublicListContent({ token }: { token: string | undefined }) {
  const { data, isLoading, error } = usePublicListByToken(token);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="p-4 rounded-full bg-muted inline-block mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Note not found</h1>
          <p className="text-muted-foreground">
            This note may have been deleted or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const { list, items } = data;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{list.title}</h1>
              {list.description && (
                <p className="text-sm text-muted-foreground">{list.description}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              This note is empty.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <ListItemComponent
                  key={item.id}
                  item={{
                    ...item,
                    contributor_id: (item as any).contributor_id || null,
                    contributor_name: (item as any).contributor_name || null,
                  }}
                  onToggle={() => {}}
                  onDelete={() => {}}
                  onUpdate={() => {}}
                  readOnly
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Shared via Groovy Planning
      </p>
    </div>
  );
}

export default function PublicListView() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If user is logged in, show full DashboardLayout with GP menu
  if (user) {
    return (
      <DashboardLayout>
        <PublicListContent token={token} />
      </DashboardLayout>
    );
  }

  // If not logged in, show login invitation banner
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LoginInviteBanner />
      <main className="flex-1">
        <PublicListContent token={token} />
      </main>
    </div>
  );
}
