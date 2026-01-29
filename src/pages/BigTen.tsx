import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BigTenCard } from '@/components/bigten/BigTenCard';
import { BigTenEmptyState } from '@/components/bigten/BigTenEmptyState';
import { useBigTen, BigTenCategory } from '@/hooks/useBigTen';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Plus, Rocket, Mountain } from 'lucide-react';

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

  // Split projects by category and completion status
  const activeProjects = projects.filter((p) => !p.completed);
  const completedProjects = projects.filter((p) => p.completed);
  
  const opportunities = activeProjects.filter((p) => p.category === 'opportunity');
  const challenges = activeProjects.filter((p) => p.category === 'challenge');
  const uncategorized = activeProjects.filter((p) => !p.category);

  // Find next available position for new project
  const getNextPosition = () => {
    const usedPositions = activeProjects.map((p) => p.position);
    for (let i = 1; i <= 10; i++) {
      if (!usedPositions.includes(i)) return i;
    }
    return activeProjects.length + 1;
  };

  const handleCreateProject = (category: BigTenCategory) => {
    if (activeProjects.length >= 10) return;
    const title = category === 'opportunity' ? 'New Opportunity' : 'New Challenge';
    createProject.mutate({ title, position: getNextPosition(), category });
  };

  const handleUpdateProject = (
    id: string, 
    title?: string, 
    target_date?: string | null, 
    completed?: boolean,
    category?: BigTenCategory | null,
    pillar?: string | null
  ) => {
    updateProject.mutate({ id, title, target_date, completed, category, pillar });
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

  const canAddOpportunity = opportunities.length < 5 && activeProjects.length < 10;
  const canAddChallenge = challenges.length < 5 && activeProjects.length < 10;
  const hasNoProjects = projects.length === 0;

  const renderProjectSection = (
    sectionProjects: typeof projects,
    category: BigTenCategory,
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    canAdd: boolean
  ) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionProjects.map((project) => (
          <BigTenCard
            key={project.id}
            project={project}
            position={project.position}
            onCreateProject={() => handleCreateProject(category)}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        ))}
        
        {canAdd && (
          <Card
            className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer min-h-[200px] flex items-center justify-center"
            onClick={() => handleCreateProject(category)}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">
                Add {category === 'opportunity' ? 'Opportunity' : 'Challenge'}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">The Big 10</h1>
          <p className="text-muted-foreground mt-1">
            Identify your 5 biggest opportunities and 5 biggest challenges. These are the projects that deserve your focused attention.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
            ))}
          </div>
        ) : hasNoProjects ? (
          <BigTenEmptyState onAddProject={handleCreateProject} />
        ) : (
          <>
            {/* Uncategorized projects (for migration from old data) */}
            {uncategorized.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-muted-foreground">Uncategorized</h2>
                  <p className="text-sm text-muted-foreground">
                    These projects need to be categorized as opportunities or challenges.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uncategorized.map((project) => (
                    <BigTenCard
                      key={project.id}
                      project={project}
                      position={project.position}
                      showCategoryPicker
                      onCreateProject={() => {}}
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

            {/* Opportunities section */}
            {renderProjectSection(
              opportunities,
              'opportunity',
              <Rocket className="h-5 w-5 text-primary" />,
              'Opportunities',
              'What could transform your life if you pursue it?',
              canAddOpportunity
            )}

            {/* Challenges section */}
            {renderProjectSection(
              challenges,
              'challenge',
              <Mountain className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
              'Challenges',
              'What obstacles are blocking your progress?',
              canAddChallenge
            )}

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
                      onCreateProject={() => {}}
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
