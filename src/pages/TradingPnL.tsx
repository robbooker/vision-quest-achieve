import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PnLSummaryCards } from '@/components/trading/PnLSummaryCards';
import { PnLChart } from '@/components/trading/PnLChart';
import { PnLEditTable } from '@/components/trading/PnLEditTable';
import { usePnLHistory, usePnLStats } from '@/hooks/useTradingPnL';

type DateRange = '30d' | 'ytd' | 'all';
type ChartView = 'cumulative' | 'daily';

const TradingPnL = () => {
  const [range, setRange] = useState<DateRange>('30d');
  const [chartView, setChartView] = useState<ChartView>('cumulative');
  
  const { data: history = [], refetch } = usePnLHistory(range);
  const stats = usePnLStats(range);

  return (
    <DashboardLayout>
      <Helmet>
        <title>Trading P&L | Goal Pilot</title>
        <meta name="description" content="Track and analyze your daily trading profit and loss" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/today">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Trading P&L
              </h1>
              <p className="text-muted-foreground">
                Track and analyze your daily trading performance
              </p>
            </div>
          </div>
        </div>

        {/* Range Tabs */}
        <Tabs value={range} onValueChange={(v) => setRange(v as DateRange)}>
          <TabsList>
            <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
            <TabsTrigger value="ytd">Year to Date</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={range} className="space-y-6 mt-6">
            {/* Summary Cards */}
            <PnLSummaryCards stats={stats} />

            {/* Chart */}
            <PnLChart 
              data={history} 
              view={chartView} 
              onViewChange={setChartView} 
            />

            {/* Edit Table - only show on 30d view */}
            {range === '30d' && (
              <PnLEditTable onRefresh={() => refetch()} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TradingPnL;
