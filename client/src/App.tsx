
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Database, BarChart3, Upload, FileText, Activity } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { ModelManager } from '@/components/ModelManager';
import { DatasetManager } from '@/components/DatasetManager';
import { AnalysisManager } from '@/components/AnalysisManager';
import { VisualizationDashboard } from '@/components/VisualizationDashboard';
import type { Model, Dataset, Analysis } from '../../server/src/schema';

function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [modelsData, datasetsData, analysesData] = await Promise.all([
        trpc.getModels.query(),
        trpc.getDatasets.query(),
        trpc.getAnalyses.query()
      ]);
      setModels(modelsData);
      setDatasets(datasetsData);
      setAnalyses(analysesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-600">Loading AI Platform...</p>
        </div>
      </div>
    );
  }

  const readyModels = models.filter((m: Model) => m.status === 'ready').length;
  const readyDatasets = datasets.filter((d: Dataset) => d.status === 'ready').length;
  const completedAnalyses = analyses.filter((a: Analysis) => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Model Interpretation Platform</h1>
              <p className="text-slate-600">Visualize, interpret, and understand your AI models</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="flex items-center p-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{readyModels}</div>
                  <p className="text-sm text-slate-600">Ready Models</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="flex items-center p-4">
                <div className="p-2 bg-green-100 rounded-lg mr-4">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{readyDatasets}</div>
                  <p className="text-sm text-slate-600">Ready Datasets</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="flex items-center p-4">
                <div className="p-2 bg-purple-100 rounded-lg mr-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{completedAnalyses}</div>
                  <p className="text-sm text-slate-600">Completed Analyses</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Tabs defaultValue="models" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100/50">
                <TabsTrigger value="models" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Models
                </TabsTrigger>
                <TabsTrigger value="datasets" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Datasets
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="visualization" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Visualization
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="models" className="mt-0">
                  <ModelManager 
                    models={models} 
                    onModelCreated={refreshData}
                    onModelUpdated={refreshData}
                  />
                </TabsContent>

                <TabsContent value="datasets" className="mt-0">
                  <DatasetManager 
                    datasets={datasets} 
                    onDatasetCreated={refreshData}
                    onDatasetUpdated={refreshData}
                  />
                </TabsContent>

                <TabsContent value="analysis" className="mt-0">
                  <AnalysisManager 
                    analyses={analyses}
                    models={models}
                    datasets={datasets}
                    onAnalysisCreated={refreshData}
                    onAnalysisUpdated={refreshData}
                  />
                </TabsContent>

                <TabsContent value="visualization" className="mt-0">
                  <VisualizationDashboard 
                    analyses={analyses}
                    models={models}
                    datasets={datasets}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
