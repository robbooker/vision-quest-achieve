import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BigTenCard } from '@/components/bigten/BigTenCard';
import { useBigTen } from '@/hooks/useBigTen';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus } from 'lucide-react';

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

  // Split projects into active and completed
  const activeProjects = projects.filter((p) => !p.completed);
  const completedProjects = projects.filter((p) => p.completed);

  // Find next available position for new project
  const getNextPosition = () => {
    const usedPositions = activeProjects.map((p) => p.position);
    for (let i = 1; i <= 10; i++) {
      if (!usedPositions.includes(i)) return i;
    }
    return activeProjects.length + 1;
  };

  const handleCreateProject = (title: string, _position: number) => {
    if (activeProjects.length >= 10) return;
    createProject.mutate({ title, position: getNextPosition() });
  };

  const handleUpdateProject = (id: string, title?: string, target_date?: string | null, completed?: boolean) => {
    updateProject.mutate({ id, title, target_date, completed });
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

  const canAddMore = activeProjects.length < 10;

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">The Big 10</h1>
          <p className="text-muted-foreground mt-1">
            Your big-picture projects that move the needle in your life.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Active projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProjects.map((project) => (
                <BigTenCard
                  key={project.id}
                  project={project}
                  position={project.position}
                  onCreateProject={handleCreateProject}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  onCreateTask={handleCreateTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
              
              {/* Add new project card */}
              {canAddMore && (
                <Card
                  className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer min-h-[200px] flex items-center justify-center"
                  onClick={() => handleCreateProject('New Project', getNextPosition())}
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Plus className="h-8 w-8" />
                    <span className="text-sm font-medium">Add a Big 10 Project</span>
                  </div>
                </Card>
              )}
            </div>

            {/* Completed projects */}
            {completedProjects.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-muted-foreground">Completed</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedProjects.map((project) => (
                    <BigTenCard
                      key={project.id}
                      project={project}
                      position={project.position}
                      showAddButton={false}
                      onCreateProject={handleCreateProject}
                      onUpdateProject={handleUpdateProject}
                      onDeleteProject={handleDeleteProject}
                      onCreateTask={handleCreateTask}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
