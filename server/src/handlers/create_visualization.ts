
import { db } from '../db';
import { visualizationsTable } from '../db/schema';
import { type CreateVisualizationInput, type Visualization } from '../schema';

export const createVisualization = async (input: CreateVisualizationInput): Promise<Visualization> => {
  try {
    const result = await db.insert(visualizationsTable)
      .values({
        analysis_id: input.analysis_id,
        chart_type: input.chart_type,
        config: input.config,
        data: input.data
      })
      .returning()
      .execute();

    // Convert unknown types to Record<string, any> for schema compatibility
    const visualization = result[0];
    return {
      ...visualization,
      config: visualization.config as Record<string, any>,
      data: visualization.data as Record<string, any>
    };
  } catch (error) {
    console.error('Visualization creation failed:', error);
    throw error;
  }
};
