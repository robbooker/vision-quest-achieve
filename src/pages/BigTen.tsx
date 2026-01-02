import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BigTenCard } from '@/components/bigten/BigTenCard';
import { useBigTen } from '@/hooks/useBigTen';
import { Skeleton } from '@/components/ui/skeleton';

export default function BigTen() {
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

  // Create an array of 10 slots
  const slots = Array.from({ length: 10 }, (_, i) => {
    const position = i + 1;
    return projects.find((p) => p.position === position) || null;
  });

  const handleCreateProject = (title: string, position: number) => {
    createProject.mutate({ title, position });
  };

  const handleUpdateProject = (id: string, title?: string, target_date?: string | null) => {
    updateProject.mutate({ id, title, target_date });
  };

  const handleDeleteProject = (id: string) => {
    deleteProject.mutate(id);
  };

  const handleCreateTask = (project_id: string, title: string, position: number) => {
    createTask.mutate({ project_id, title, position });
  };

  const handleUpdateTask = (id: string, title?: string, completed?: boolean) => {
    updateTask.mutate({ id, title, completed });
  };

  const handleDeleteTask = (id: string) => {
    deleteTask.mutate(id);
  };

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">The Big 10</h1>
          <p className="text-muted-foreground mt-1">
            Your 10 big-picture projects that move the needle in your life.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((project, i) => (
              <BigTenCard
                key={project?.id || `slot-${i + 1}`}
                project={project || undefined}
                position={i + 1}
                onCreateProject={handleCreateProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
