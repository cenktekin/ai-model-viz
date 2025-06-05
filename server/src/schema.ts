
import { z } from 'zod';

// Model schema
export const modelSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  model_type: z.enum(['traditional_ml', 'deep_learning']),
  framework: z.string(), // e.g., 'scikit-learn', 'tensorflow', 'pytorch'
  file_path: z.string(),
  file_size: z.number(),
  status: z.enum(['uploading', 'processing', 'ready', 'error']),
  metadata: z.record(z.any()).nullable(), // JSON metadata about the model
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Model = z.infer<typeof modelSchema>;

// Dataset schema
export const datasetSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  file_type: z.enum(['csv', 'json']),
  file_path: z.string(),
  file_size: z.number(),
  columns: z.array(z.string()), // Column names
  row_count: z.number(),
  status: z.enum(['uploading', 'processing', 'ready', 'error']),
  metadata: z.record(z.any()).nullable(), // JSON metadata about the dataset
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Dataset = z.infer<typeof datasetSchema>;

// Analysis schema
export const analysisSchema = z.object({
  id: z.number(),
  name: z.string(),
  model_id: z.number(),
  dataset_id: z.number(),
  analysis_type: z.enum(['feature_importance', 'decision_path', 'bias_detection', 'input_output_relationship']),
  parameters: z.record(z.any()).nullable(), // Analysis-specific parameters
  results: z.record(z.any()).nullable(), // Analysis results
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Analysis = z.infer<typeof analysisSchema>;

// Visualization schema
export const visualizationSchema = z.object({
  id: z.number(),
  analysis_id: z.number(),
  chart_type: z.enum(['bar_chart', 'line_chart', 'scatter_plot', 'heatmap', 'decision_tree', 'confusion_matrix']),
  config: z.record(z.any()), // Chart configuration
  data: z.record(z.any()), // Chart data
  created_at: z.coerce.date()
});

export type Visualization = z.infer<typeof visualizationSchema>;

// Input schemas for creating entities
export const createModelInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  model_type: z.enum(['traditional_ml', 'deep_learning']),
  framework: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().positive(),
  metadata: z.record(z.any()).nullable()
});

export type CreateModelInput = z.infer<typeof createModelInputSchema>;

export const createDatasetInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  file_type: z.enum(['csv', 'json']),
  file_path: z.string().min(1),
  file_size: z.number().positive(),
  columns: z.array(z.string()),
  row_count: z.number().int().nonnegative(),
  metadata: z.record(z.any()).nullable()
});

export type CreateDatasetInput = z.infer<typeof createDatasetInputSchema>;

export const createAnalysisInputSchema = z.object({
  name: z.string().min(1),
  model_id: z.number().int().positive(),
  dataset_id: z.number().int().positive(),
  analysis_type: z.enum(['feature_importance', 'decision_path', 'bias_detection', 'input_output_relationship']),
  parameters: z.record(z.any()).nullable()
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisInputSchema>;

export const createVisualizationInputSchema = z.object({
  analysis_id: z.number().int().positive(),
  chart_type: z.enum(['bar_chart', 'line_chart', 'scatter_plot', 'heatmap', 'decision_tree', 'confusion_matrix']),
  config: z.record(z.any()),
  data: z.record(z.any())
});

export type CreateVisualizationInput = z.infer<typeof createVisualizationInputSchema>;

// Update schemas
export const updateModelStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['uploading', 'processing', 'ready', 'error']),
  metadata: z.record(z.any()).nullable().optional()
});

export type UpdateModelStatusInput = z.infer<typeof updateModelStatusSchema>;

export const updateDatasetStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['uploading', 'processing', 'ready', 'error']),
  metadata: z.record(z.any()).nullable().optional()
});

export type UpdateDatasetStatusInput = z.infer<typeof updateDatasetStatusSchema>;

export const updateAnalysisStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  results: z.record(z.any()).nullable().optional()
});

export type UpdateAnalysisStatusInput = z.infer<typeof updateAnalysisStatusSchema>;

// Query schemas
export const getAnalysesByModelSchema = z.object({
  model_id: z.number().int().positive()
});

export type GetAnalysesByModelInput = z.infer<typeof getAnalysesByModelSchema>;

export const getVisualizationsByAnalysisSchema = z.object({
  analysis_id: z.number().int().positive()
});

export type GetVisualizationsByAnalysisInput = z.infer<typeof getVisualizationsByAnalysisSchema>;
