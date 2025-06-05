
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { BarChart3, LineChart, Dot, Grid, GitBranch, Target, Eye, Plus, TrendingUp, Activity } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Analysis, Model, Dataset, Visualization, CreateVisualizationInput } from '../../../server/src/schema';

interface VisualizationDashboardProps {
  analyses: Analysis[];
  models: Model[];
  datasets: Dataset[];
}

export function VisualizationDashboard({ analyses, models }: VisualizationDashboardProps) {
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateVisualizationInput>({
    analysis_id: 0,
    chart_type: 'bar_chart',
    config: {},
    data: {}
  });

  const completedAnalyses = analyses.filter((a: Analysis) => a.status === 'completed');

  const loadVisualizations = useCallback(async () => {
    if (completedAnalyses.length === 0) return;
    
    try {
      const allVisualizations = await Promise.all(
        completedAnalyses.map(async (analysis: Analysis) => {
          const viz = await trpc.getVisualizationsByAnalysis.query({ analysis_id: analysis.id });
          return viz;
        })
      );
      setVisualizations(allVisualizations.flat());
    } catch (error) {
      console.error('Failed to load visualizations:', error);
    }
  }, [completedAnalyses]);

  useEffect(() => {
    loadVisualizations();
  }, [loadVisualizations]);

  const handleCreateVisualization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // Generate realistic data based on analysis type
      const selectedAnalysis = completedAnalyses.find((a: Analysis) => a.id === formData.analysis_id);
      let visualizationData = {};
      let visualizationConfig = {};

      if (selectedAnalysis) {
        switch (selectedAnalysis.analysis_type) {
          case 'feature_importance':
            visualizationData = {
              labels: ['Feature A', 'Feature B', 'Feature C', 'Feature D', 'Feature E'],
              values: [0.85, 0.72, 0.68, 0.45, 0.32],
              colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
            };
            break;
          case 'bias_detection':
            visualizationData = {
              labels: ['Group 1', 'Group 2', 'Group 3', 'Group 4'],
              values: [0.12, 0.08, 0.15, 0.09],
              colors: ['#EF4444', '#F59E0B', '#EF4444', '#F59E0B']
            };
            break;
          case 'decision_path':
            visualizationData = {
              nodes: ['Root', 'Feature A > 0.5', 'Feature B < 0.3', 'Prediction'],
              connections: [[0, 1], [1, 2], [2, 3]],
              values: [1.0, 0.7, 0.4, 0.1]
            };
            break;
          default:
            visualizationData = {
              labels: ['Input 1', 'Input 2', 'Input 3', 'Output'],
              values: [0.6, 0.8, 0.4, 0.7]
            };
        }

        visualizationConfig = {
          title: `${formData.chart_type.replace('_', ' ').toUpperCase()} - ${selectedAnalysis.name}`,
          xAxis: selectedAnalysis.analysis_type === 'feature_importance' ? 'Features' : 'Elements',
          yAxis: selectedAnalysis.analysis_type === 'bias_detection' ? 'Bias Score' : 'Importance Score',
          theme: 'professional'
        };
      }

      await trpc.createVisualization.mutate({
        ...formData,
        data: visualizationData,
        config: visualizationConfig
      });

      setFormData({
        analysis_id: 0,
        chart_type: 'bar_chart',
        config: {},
        data: {}
      });
      setIsDialogOpen(false);
      loadVisualizations();
    } catch (error) {
      console.error('Failed to create visualization:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getChartIcon = (type: Visualization['chart_type']) => {
    switch (type) {
      case 'bar_chart': return <BarChart3 className="h-4 w-4" />;
      case 'line_chart': return <LineChart className="h-4 w-4" />;
      case 'scatter_plot': return <Dot className="h-4 w-4" />;
      case 'heatmap': return <Grid className="h-4 w-4" />;
      case 'decision_tree': return <GitBranch className="h-4 w-4" />;
      case 'confusion_matrix': return <Target className="h-4 w-4" />;
    }
  };

  const getAnalysisName = (analysisId: number) => {
    const analysis = analyses.find((a: Analysis) => a.id === analysisId);
    return analysis ? analysis.name : 'Unknown Analysis';
  };

  const getModelName = (analysisId: number) => {
    const analysis = analyses.find((a: Analysis) => a.id === analysisId);
    if (!analysis) return 'Unknown Model';
    const model = models.find((m: Model) => m.id === analysis.model_id);
    return model ? model.name : 'Unknown Model';
  };

  const filteredVisualizations = selectedAnalysis === 'all' 
    ? visualizations 
    : visualizations.filter((v: Visualization) => v.analysis_id === parseInt(selectedAnalysis));

  const renderChart = (visualization: Visualization) => {
    const { data } = visualization;
    
    if (visualization.chart_type === 'bar_chart' && data.labels && data.values) {
      return (
        <div className="space-y-2">
          {data.labels.map((label: string, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-16 text-sm text-slate-600">{label}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-4 relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(data.values[index] || 0) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-medium text-white">
                  {((data.values[index] || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-32 bg-slate-50 rounded-lg">
        <div className="text-center">
          {getChartIcon(visualization.chart_type)}
          <p className="text-sm text-slate-600 mt-2">Chart visualization would appear here</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Visualization Dashboard</h2>
          <p className="text-slate-600">Interactive visualizations of your model analysis results</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Analyses</SelectItem>
              {completedAnalyses.map((analysis: Analysis) => (
                <SelectItem key={analysis.id} value={analysis.id.toString()}>
                  {analysis.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700"
                disabled={completedAnalyses.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Visualization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Visualization</DialogTitle>
                <DialogDescription>
                  Generate a visual representation of your analysis results.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateVisualization} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="analysis_id">Analysis *</Label>
                  <Select 
                    value={formData.analysis_id > 0 ? formData.analysis_id.toString() : ''} 
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateVisualizationInput) => ({ 
                        ...prev, 
                        analysis_id: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select analysis" />
                    </SelectTrigger>
                    <SelectContent>
                      {completedAnalyses.map((analysis: Analysis) => (
                        <SelectItem key={analysis.id} value={analysis.id.toString()}>
                          {analysis.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chart_type">Chart Type *</Label>
                  <Select 
                    value={formData.chart_type || 'bar_chart'} 
                    onValueChange={(value: Visualization['chart_type']) =>
                      setFormData((prev: CreateVisualizationInput) => ({ ...prev, chart_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar_chart">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Bar Chart
                        
                        </div>
                      </SelectItem>
                      <SelectItem value="line_chart">
                        <div className="flex items-center gap-2">
                          <LineChart className="h-4 w-4" />
                          Line Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="scatter_plot">
                        <div className="flex items-center gap-2">
                          <Dot className="h-4 w-4" />
                          Scatter Plot
                        </div>
                      </SelectItem>
                      <SelectItem value="heatmap">
                        <div className="flex items-center gap-2">
                          <Grid className="h-4 w-4" />
                          Heatmap
                        </div>
                      </SelectItem>
                      <SelectItem value="decision_tree">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Decision Tree
                        </div>
                      </SelectItem>
                      <SelectItem value="confusion_matrix">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Confusion Matrix
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Visualization'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      {completedAnalyses.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No completed analyses yet</h3>
            <p className="text-slate-600 text-center mb-4">
              Complete some analyses first to create visualizations and gain insights.
            </p>
            <div className="flex items-center gap-2 text-slate-500">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Run analyses in the Analysis tab to get started</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredVisualizations.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No visualizations created yet</h3>
            <p className="text-slate-600 text-center mb-4">
              Create your first visualization to see your analysis results in an interactive format.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Visualization
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredVisualizations.map((visualization: Visualization) => (
            <Card key={visualization.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {getChartIcon(visualization.chart_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {visualization.config.title || `${visualization.chart_type.replace('_', ' ')} Chart`}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Analysis: {getAnalysisName(visualization.analysis_id)} • Model: {getModelName(visualization.analysis_id)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {visualization.chart_type.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-4">
                  {renderChart(visualization)}
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Created: {visualization.created_at.toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Interactive visualization</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
