
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createModelInputSchema,
  createDatasetInputSchema,
  createAnalysisInputSchema,
  createVisualizationInputSchema,
  updateModelStatusSchema,
  updateDatasetStatusSchema,
  updateAnalysisStatusSchema,
  getAnalysesByModelSchema,
  getVisualizationsByAnalysisSchema
} from './schema';

// Import handlers
import { createModel } from './handlers/create_model';
import { getModels } from './handlers/get_models';
import { getModelById } from './handlers/get_model_by_id';
import { updateModelStatus } from './handlers/update_model_status';
import { createDataset } from './handlers/create_dataset';
import { getDatasets } from './handlers/get_datasets';
import { getDatasetById } from './handlers/get_dataset_by_id';
import { updateDatasetStatus } from './handlers/update_dataset_status';
import { createAnalysis } from './handlers/create_analysis';
import { getAnalyses } from './handlers/get_analyses';
import { getAnalysisById } from './handlers/get_analysis_by_id';
import { getAnalysesByModel } from './handlers/get_analyses_by_model';
import { updateAnalysisStatus } from './handlers/update_analysis_status';
import { createVisualization } from './handlers/create_visualization';
import { getVisualizationsByAnalysis } from './handlers/get_visualizations_by_analysis';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Model routes
  createModel: publicProcedure
    .input(createModelInputSchema)
    .mutation(({ input }) => createModel(input)),
  
  getModels: publicProcedure
    .query(() => getModels()),
  
  getModelById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => getModelById(input.id)),
  
  updateModelStatus: publicProcedure
    .input(updateModelStatusSchema)
    .mutation(({ input }) => updateModelStatus(input)),

  // Dataset routes
  createDataset: publicProcedure
    .input(createDatasetInputSchema)
    .mutation(({ input }) => createDataset(input)),
  
  getDatasets: publicProcedure
    .query(() => getDatasets()),
  
  getDatasetById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => getDatasetById(input.id)),
  
  updateDatasetStatus: publicProcedure
    .input(updateDatasetStatusSchema)
    .mutation(({ input }) => updateDatasetStatus(input)),

  // Analysis routes
  createAnalysis: publicProcedure
    .input(createAnalysisInputSchema)
    .mutation(({ input }) => createAnalysis(input)),
  
  getAnalyses: publicProcedure
    .query(() => getAnalyses()),
  
  getAnalysisById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => getAnalysisById(input.id)),
  
  getAnalysesByModel: publicProcedure
    .input(getAnalysesByModelSchema)
    .query(({ input }) => getAnalysesByModel(input)),
  
  updateAnalysisStatus: publicProcedure
    .input(updateAnalysisStatusSchema)
    .mutation(({ input }) => updateAnalysisStatus(input)),

  // Visualization routes
  createVisualization: publicProcedure
    .input(createVisualizationInputSchema)
    .mutation(({ input }) => createVisualization(input)),
  
  getVisualizationsByAnalysis: publicProcedure
    .input(getVisualizationsByAnalysisSchema)
    .query(({ input }) => getVisualizationsByAnalysis(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`AI Model Interpretation Platform TRPC server listening at port: ${port}`);
}

start();
