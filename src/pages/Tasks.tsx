import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { QuickTaskList } from '@/components/dashboard/QuickTaskList';

const Tasks = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <QuickTaskList />
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
