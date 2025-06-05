
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Cpu, Database, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Model, CreateModelInput } from '../../../server/src/schema';

interface ModelManagerProps {
  models: Model[];
  onModelCreated: () => void;
  onModelUpdated: () => void;
}

export function ModelManager({ models, onModelCreated, onModelUpdated }: ModelManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateModelInput>({
    name: '',
    description: null,
    model_type: 'traditional_ml',
    framework: '',
    file_path: '',
    file_size: 0,
    metadata: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await trpc.createModel.mutate(formData);
      setFormData({
        name: '',
        description: null,
        model_type: 'traditional_ml',
        framework: '',
        file_path: '',
        file_size: 0,
        metadata: null
      });
      setIsDialogOpen(false);
      onModelCreated();
    } catch (error) {
      console.error('Failed to create model:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (modelId: number, status: Model['status']) => {
    try {
      await trpc.updateModelStatus.mutate({ id: modelId, status });
      onModelUpdated();
    } catch (error) {
      console.error('Failed to update model status:', error);
    }
  };

  const getStatusIcon = (status: Model['status']) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'uploading': return <Upload className="h-4 w-4 text-blue-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: Model['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700 border-green-200';
      case 'uploading': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getTypeIcon = (type: Model['model_type']) => {
    return type === 'deep_learning' ? <Cpu className="h-4 w-4" /> : <Database className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Model Management</h2>
          <p className="text-slate-600">Upload and manage your AI models</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload Model
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload New Model</DialogTitle>
              <DialogDescription>
                Add a new AI model to your platform for analysis and interpretation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Model Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateModelInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Customer Churn Predictor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateModelInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Describe your model's purpose and functionality..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model_type">Model Type *</Label>
                  <Select 
                    value={formData.model_type || 'traditional_ml'} 
                    onValueChange={(value: 'traditional_ml' | 'deep_learning') =>
                      setFormData((prev: CreateModelInput) => ({ ...prev, model_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traditional_ml">Traditional ML</SelectItem>
                      <SelectItem value="deep_learning">Deep Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="framework">Framework *</Label>
                  <Input
                    id="framework"
                    value={formData.framework}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateModelInput) => ({ ...prev, framework: e.target.value }))
                    }
                    placeholder="e.g., scikit-learn, tensorflow"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file_path">File Path *</Label>
                  <Input
                    id="file_path"
                    value={formData.file_path}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateModelInput) => ({ ...prev, file_path: e.target.value }))
                    }
                    placeholder="/models/my_model.pkl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file_size">File Size (bytes) *</Label>
                  <Input
                    id="file_size"
                    type="number"
                    value={formData.file_size}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateModelInput) => ({ ...prev, file_size: parseInt(e.target.value) || 0 }))
                    }
                    placeholder="1024"
                    min="1"
                    required
                  />
                </div>
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
                  {isCreating ? 'Uploading...' : 'Upload Model'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {models.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No models uploaded yet</h3>
            <p className="text-slate-600 text-center mb-4">
              Get started by uploading your first AI model to begin analysis and interpretation.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Model
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {models.map((model: Model) => (
            <Card key={model.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {getTypeIcon(model.model_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {model.description || 'No description provided'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(model.status)}>
                      {getStatusIcon(model.status)}
                      {model.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {model.model_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 font-medium">Framework</p>
                    <p className="text-slate-900">{model.framework}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">File Size</p>
                    <p className="text-slate-900">{(model.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Created</p>
                    <p className="text-slate-900">{model.created_at.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Updated</p>
                    <p className="text-slate-900">{model.updated_at.toLocaleDateString()}</p>
                  </div>
                </div>
                {model.status === 'error' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Upload Error</p>
                      <p className="text-sm text-red-700">
                        There was an issue processing this model. 
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-red-700 underline ml-1"
                          onClick={() => handleStatusUpdate(model.id, 'processing')}
                        >
                          Try again
                        </Button>
                      </p>
                    </div>
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
