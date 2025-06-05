
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
import { Upload, Database, Table, FileText, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Dataset, CreateDatasetInput } from '../../../server/src/schema';

interface DatasetManagerProps {
  datasets: Dataset[];
  onDatasetCreated: () => void;
  onDatasetUpdated: () => void;
}

export function DatasetManager({ datasets, onDatasetCreated, onDatasetUpdated }: DatasetManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [columnsInput, setColumnsInput] = useState('');
  const [formData, setFormData] = useState<CreateDatasetInput>({
    name: '',
    description: null,
    file_type: 'csv',
    file_path: '',
    file_size: 0,
    columns: [],
    row_count: 0,
    metadata: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const columns = columnsInput.split(',').map((col: string) => col.trim()).filter((col: string) => col);
      await trpc.createDataset.mutate({
        ...formData,
        columns
      });
      setFormData({
        name: '',
        description: null,
        file_type: 'csv',
        file_path: '',
        file_size: 0,
        columns: [],
        row_count: 0,
        metadata: null
      });
      setColumnsInput('');
      setIsDialogOpen(false);
      onDatasetCreated();
    } catch (error) {
      console.error('Failed to create dataset:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (datasetId: number, status: Dataset['status']) => {
    try {
      await trpc.updateDatasetStatus.mutate({ id: datasetId, status });
      onDatasetUpdated();
    } catch (error) {
      console.error('Failed to update dataset status:', error);
    }
  };

  const getStatusIcon = (status: Dataset['status']) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'uploading': return <Upload className="h-4 w-4 text-blue-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: Dataset['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700 border-green-200';
      case 'uploading': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getFileTypeIcon = (type: Dataset['file_type']) => {
    return type === 'csv' ? <Table className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dataset Management</h2>
          <p className="text-slate-600">Upload and manage your datasets for model analysis</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload Dataset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload New Dataset</DialogTitle>
              <DialogDescription>
                Add a new dataset to use for model analysis and interpretation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dataset Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateDatasetInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Customer Data 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateDatasetInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Describe your dataset..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file_type">File Type *</Label>
                  <Select 
                    value={formData.file_type || 'csv'} 
                    onValueChange={(value: 'csv' | 'json') =>
                      setFormData((prev: CreateDatasetInput) => ({ ...prev, file_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="row_count">Row Count *</Label>
                  <Input
                    id="row_count"
                    type="number"
                    value={formData.row_count}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDatasetInput) => ({ ...prev, row_count: parseInt(e.target.value) || 0 }))
                    }
                    placeholder="1000"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="columns">Columns *</Label>
                <Input
                  id="columns"
                  value={columnsInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColumnsInput(e.target.value)}
                  placeholder="age, income, gender, product_preference"
                  required
                />
                <p className="text-xs text-slate-500">Separate column names with commas</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file_path">File Path *</Label>
                  <Input
                    id="file_path"
                    value={formData.file_path}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDatasetInput) => ({ ...prev, file_path: e.target.value }))
                    }
                    placeholder="/data/dataset.csv"
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
                      setFormData((prev: CreateDatasetInput) => ({ ...prev, file_size: parseInt(e.target.value) || 0 }))
                    }
                    placeholder="2048"
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
                  {isCreating ? 'Uploading...' : 'Upload Dataset'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {datasets.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No datasets uploaded yet</h3>
            <p className="text-slate-600 text-center mb-4">
              Upload your first dataset to start analyzing your models with real data.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Dataset
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {datasets.map((dataset: Dataset) => (
            <Card key={dataset.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {getFileTypeIcon(dataset.file_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dataset.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {dataset.description || 'No description provided'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(dataset.status)}>
                      {getStatusIcon(dataset.status)}
                      {dataset.status}
                    </Badge>
                    <Badge variant="outline" className="uppercase">
                      {dataset.file_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-slate-600 font-medium">Rows</p>
                    <p className="text-slate-900">{dataset.row_count.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Columns</p>
                    <p className="text-slate-900">{dataset.columns.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">File Size</p>
                    <p className="text-slate-900">{(dataset.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Created</p>
                    <p className="text-slate-900">{dataset.created_at.toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-slate-600 font-medium text-sm mb-2">Columns:</p>
                  <div className="flex flex-wrap gap-1">
                    {dataset.columns.slice(0, 8).map((column: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {column}
                      </Badge>
                    ))}
                    {dataset.columns.length > 8 && (
                      <Badge variant="secondary" className="text-xs">
                        +{dataset.columns.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>

                {dataset.status === 'error' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Upload Error</p>
                      <p className="text-sm text-red-700">
                        There was an issue processing this dataset.
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-red-700 underline ml-1"
                          onClick={() => handleStatusUpdate(dataset.id, 'processing')}
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
