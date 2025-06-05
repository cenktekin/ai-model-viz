
import { db } from '../db';
import { visualizationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetVisualizationsByAnalysisInput, type Visualization } from '../schema';

export const getVisualizationsByAnalysis = async (input: GetVisualizationsByAnalysisInput): Promise<Visualization[]> => {
  try {
    const results = await db.select()
      .from(visualizationsTable)
      .where(eq(visualizationsTable.analysis_id, input.analysis_id))
      .execute();

    return results.map(visualization => ({
      ...visualization,
      config: visualization.config as Record<string, any>,
      data: visualization.data as Record<string, any>,
      created_at: new Date(visualization.created_at)
    }));
  } catch (error) {
    console.error('Get visualizations by analysis failed:', error);
    throw error;
  }
};
