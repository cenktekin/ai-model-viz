
import { serial, text, pgTable, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const modelTypeEnum = pgEnum('model_type', ['traditional_ml', 'deep_learning']);
export const modelStatusEnum = pgEnum('model_status', ['uploading', 'processing', 'ready', 'error']);
export const fileTypeEnum = pgEnum('file_type', ['csv', 'json']);
export const datasetStatusEnum = pgEnum('dataset_status', ['uploading', 'processing', 'ready', 'error']);
export const analysisTypeEnum = pgEnum('analysis_type', ['feature_importance', 'decision_path', 'bias_detection', 'input_output_relationship']);
export const analysisStatusEnum = pgEnum('analysis_status', ['pending', 'running', 'completed', 'failed']);
export const chartTypeEnum = pgEnum('chart_type', ['bar_chart', 'line_chart', 'scatter_plot', 'heatmap', 'decision_tree', 'confusion_matrix']);

// Models table
export const modelsTable = pgTable('models', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  model_type: modelTypeEnum('model_type').notNull(),
  framework: text('framework').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  status: modelStatusEnum('status').notNull().default('uploading'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Datasets table
export const datasetsTable = pgTable('datasets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  file_type: fileTypeEnum('file_type').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  columns: jsonb('columns').notNull(), // Array of column names
  row_count: integer('row_count').notNull(),
  status: datasetStatusEnum('status').notNull().default('uploading'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Analyses table
export const analysesTable = pgTable('analyses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  model_id: integer('model_id').notNull(),
  dataset_id: integer('dataset_id').notNull(),
  analysis_type: analysisTypeEnum('analysis_type').notNull(),
  parameters: jsonb('parameters'),
  results: jsonb('results'),
  status: analysisStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Visualizations table
export const visualizationsTable = pgTable('visualizations', {
  id: serial('id').primaryKey(),
  analysis_id: integer('analysis_id').notNull(),
  chart_type: chartTypeEnum('chart_type').notNull(),
  config: jsonb('config').notNull(),
  data: jsonb('data').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const modelsRelations = relations(modelsTable, ({ many }) => ({
  analyses: many(analysesTable)
}));

export const datasetsRelations = relations(datasetsTable, ({ many }) => ({
  analyses: many(analysesTable)
}));

export const analysesRelations = relations(analysesTable, ({ one, many }) => ({
  model: one(modelsTable, {
    fields: [analysesTable.model_id],
    references: [modelsTable.id]
  }),
  dataset: one(datasetsTable, {
    fields: [analysesTable.dataset_id],
    references: [datasetsTable.id]
  }),
  visualizations: many(visualizationsTable)
}));

export const visualizationsRelations = relations(visualizationsTable, ({ one }) => ({
  analysis: one(analysesTable, {
    fields: [visualizationsTable.analysis_id],
    references: [analysesTable.id]
  })
}));

// Export all tables for relation queries
export const tables = {
  models: modelsTable,
  datasets: datasetsTable,
  analyses: analysesTable,
  visualizations: visualizationsTable
};

// TypeScript types for the table schemas
export type Model = typeof modelsTable.$inferSelect;
export type NewModel = typeof modelsTable.$inferInsert;
export type Dataset = typeof datasetsTable.$inferSelect;
export type NewDataset = typeof datasetsTable.$inferInsert;
export type Analysis = typeof analysesTable.$inferSelect;
export type NewAnalysis = typeof analysesTable.$inferInsert;
export type Visualization = typeof visualizationsTable.$inferSelect;
export type NewVisualization = typeof visualizationsTable.$inferInsert;
