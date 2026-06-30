import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { QuickTaskList } from '@/components/dashboard/QuickTaskList';
import { BigTenCard } from '@/components/bigten/BigTenCard';
import { BigTenEmptyState } from '@/components/bigten/BigTenEmptyState';
import { useBigTen, BigTenCategory } from '@/hooks/useBigTen';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  } = useBigTen();

  const activeProjects = projects.filter((p) => !p.completed);

  const handleCreateProject = (category: BigTenCategory) => {
    const usedPositions = projects.map((p) => p.position);
    let position = projects.length + 1;
    for (let i = 1; i <= 20; i++) {
      if (!usedPositions.includes(i)) { position = i; break; }
    }
    const title = category === 'opportunity' ? 'New Opportunity' : 'New Challenge';
    createProject.mutate({ title, position, category });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Quick links to other previously-on-dashboard features */}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/today">Today</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/sprints">Sprints</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/big-ten">Big 10</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/tasks">Tasks</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/primed">P.R.I.M.E.D.</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/reports">Reports</Link>
          </Button>
        </div>

        {/* Two-column layout: Big 10 on the left, Daily Tasks on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Big 10 section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">The Big 10</h2>
                <p className="text-sm text-muted-foreground">Your top opportunities and challenges.</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/big-ten">
                  Open <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[180px] w-full" />
                ))}
              </div>
            ) : activeProjects.length === 0 ? (
              <BigTenEmptyState onAddProject={handleCreateProject} />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeProjects.map((project) => (
                  <BigTenCard
                    key={project.id}
                    project={project}
                    position={project.position}
                    onCreateProject={() => handleCreateProject(project.category || 'opportunity')}
                    onUpdateProject={(id, title, target_date, completed, category, pillar) =>
                      updateProject.mutate({ id, title, target_date, completed, category, pillar })
                    }
                    onDeleteProject={(id) => deleteProject.mutate(id)}
                    onCreateTask={(project_id, title, position) => createTask.mutate({ project_id, title, position })}
                    onUpdateTask={(id, title, completed) => updateTask.mutate({ id, title, completed })}
                    onDeleteTask={(id) => deleteTask.mutate(id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Daily Tasks section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Daily Tasks</h2>
                <p className="text-sm text-muted-foreground">Quick wins for today.</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/tasks">
                  Open <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <QuickTaskList />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

