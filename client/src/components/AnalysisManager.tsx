
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Play, Activity, TrendingUp, GitBranch, Shield, Zap, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Analysis, Model, Dataset, CreateAnalysisInput } from '../../../server/src/schema';

interface AnalysisManagerProps {
  analyses: Analysis[];
  models: Model[];
  datasets: Dataset[];
  onAnalysisCreated: () => void;
  onAnalysisUpdated: () => void;
}

export function AnalysisManager({ 
  analyses, 
  models, 
  datasets, 
  onAnalysisCreated, 
  onAnalysisUpdated 
}: AnalysisManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAnalysisInput>({
    name: '',
    model_id: 0,
    dataset_id: 0,
    analysis_type: 'feature_importance',
    parameters: null
  });

  const readyModels = models.filter((m: Model) => m.status === 'ready');
  const readyDatasets = datasets.filter((d: Dataset) => d.status === 'ready');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await trpc.createAnalysis.mutate(formData);
      setFormData({
        name: '',
        model_id: 0,
        dataset_id: 0,
        analysis_type: 'feature_importance',
        parameters: null
      });
      setIsDialogOpen(false);
      onAnalysisCreated();
    } catch (error) {
      console.error('Failed to create analysis:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (analysisId: number, status: Analysis['status']) => {
    try {
      await trpc.updateAnalysisStatus.mutate({ id: analysisId, status });
      onAnalysisUpdated();
    } catch (error) {
      console.error('Failed to update analysis status:', error);
    }
  };

  const getStatusIcon = (status: Analysis['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: Analysis['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'running': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getAnalysisIcon = (type: Analysis['analysis_type']) => {
    switch (type) {
      case 'feature_importance': return <TrendingUp className="h-4 w-4" />;
      case 'decision_path': return <GitBranch className="h-4 w-4" />;
      case 'bias_detection': return <Shield className="h-4 w-4" />;
      case 'input_output_relationship': return <Zap className="h-4 w-4" />;
    }
  };

  const getAnalysisDescription = (type: Analysis['analysis_type']) => {
    switch (type) {
      case 'feature_importance': return 'Identify which features most influence model predictions';
      case 'decision_path': return 'Trace the decision-making process of your model';
      case 'bias_detection': return 'Detect potential biases in model predictions';
      case 'input_output_relationship': return 'Understand how inputs relate to outputs';
    }
  };

  const getModelName = (modelId: number) => {
    const model = models.find((m: Model) => m.id === modelId);
    return model ? model.name : 'Unknown Model';
  };

  const getDatasetName = (datasetId: number) => {
    const dataset = datasets.find((d: Dataset) => d.id === datasetId);
    return dataset ? dataset.name : 'Unknown Dataset';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analysis Management</h2>
          <p className="text-slate-600">Run interpretability analyses on your models</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={readyModels.length === 0 || readyDatasets.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Analysis
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Run New Analysis</DialogTitle>
              <DialogDescription>
                Configure and run an interpretability analysis on your model.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Analysis Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateAnalysisInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Feature Importance Analysis - Q4 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="analysis_type">Analysis Type *</Label>
                <Select 
                  value={formData.analysis_type || 'feature_importance'} 
                  onValueChange={(value: Analysis['analysis_type']) =>
                    setFormData((prev: CreateAnalysisInput) => ({ ...prev, analysis_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature_importance">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Feature Importance
                      </div>
                    </SelectItem>
                    <SelectItem value="decision_path">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Decision Path
                      </div>
                    </SelectItem>
                    <SelectItem value="bias_detection">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Bias Detection
                      </div>
                    </SelectItem>
                    <SelectItem value="input_output_relationship">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Input-Output Relationship
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model_id">Model *</Label>
                  <Select 
                    value={formData.model_id > 0 ? formData.model_id.toString() : ''} 
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateAnalysisInput) => ({ ...prev, model_id: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {readyModels.map((model: Model) => (
                        <SelectItem key={model.id} value={model.id.toString()}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataset_id">Dataset *</Label>
                  <Select 
                    value={formData.dataset_id > 0 ? formData.dataset_id.toString() : ''} 
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateAnalysisInput) => ({ ...prev, dataset_id: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {readyDatasets.map((dataset: Dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id.toString()}>
                          {dataset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {readyModels.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    No ready models available. Please upload and process a model first.
                  </p>
                </div>
              )}

              {readyDatasets.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    No ready datasets available. Please upload and process a dataset first.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || readyModels.length === 0 || readyDatasets.length === 0}
                >
                  {isCreating ? 'Starting Analysis...' : 'Run Analysis'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {analyses.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No analyses run yet</h3>
            <p className="text-slate-600 text-center mb-4">
              Run your first analysis to gain insights into how your AI models make decisions.
            </p>
            {readyModels.length > 0 && readyDatasets.length > 0 ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Run Your First Analysis
                  </Button>
                </DialogTrigger>
              </Dialog>
            ) : (
              <p className="text-sm text-slate-500">
                Upload models and datasets first to run analyses
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {analyses.map((analysis: Analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {getAnalysisIcon(analysis.analysis_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{analysis.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {getAnalysisDescription(analysis.analysis_type)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(analysis.status)}>
                    {getStatusIcon(analysis.status)}
                    {analysis.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-slate-600 font-medium">Analysis Type</p>
                    <p className="text-slate-900 capitalize">
                      {analysis.analysis_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Model</p>
                    <p className="text-slate-900">{getModelName(analysis.model_id)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Dataset</p>
                    <p className="text-slate-900">{getDatasetName(analysis.dataset_id)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Created</p>
                    <p className="text-slate-900">{analysis.created_at.toLocaleDateString()}</p>
                  </div>
                </div>

                {analysis.status === 'failed' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Analysis Failed</p>
                      <p className="text-sm text-red-700">
                        There was an issue running this analysis.
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-red-700 underline ml-1"
                          onClick={() => handleStatusUpdate(analysis.id, 'pending')}
                        >
                          Try again
                        </Button>
                      </p>
                    </div>
                  </div>
                )}

                {analysis.status === 'running' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                    <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Analysis Running</p>
                      <p className="text-sm text-blue-700">
                        Your analysis is currently being processed. This may take a few minutes.
                      </p>
                    </div>
                  </div>
                )}

                {analysis.status === 'completed' && analysis.results && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">Analysis Completed</p>
                    <p className="text-sm text-green-700">
                      Results are ready for visualization. View them in the Visualization tab.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
