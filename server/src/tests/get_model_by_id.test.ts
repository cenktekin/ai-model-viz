
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { modelsTable } from '../db/schema';
import { type CreateModelInput } from '../schema';
import { getModelById } from '../handlers/get_model_by_id';

const testModelInput: CreateModelInput = {
  name: 'Test Model',
  description: 'A model for testing',
  model_type: 'traditional_ml',
  framework: 'scikit-learn',
  file_path: '/models/test_model.pkl',
  file_size: 1024,
  metadata: { accuracy: 0.95, features: ['age', 'income'] }
};

describe('getModelById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return model when found', async () => {
    // Create a test model
    const insertResult = await db.insert(modelsTable)
      .values({
        ...testModelInput,
        status: 'uploading'
      })
      .returning()
      .execute();

    const createdModel = insertResult[0];

    // Get the model by ID
    const result = await getModelById(createdModel.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdModel.id);
    expect(result!.name).toEqual('Test Model');
    expect(result!.description).toEqual('A model for testing');
    expect(result!.model_type).toEqual('traditional_ml');
    expect(result!.framework).toEqual('scikit-learn');
    expect(result!.file_path).toEqual('/models/test_model.pkl');
    expect(result!.file_size).toEqual(1024);
    expect(result!.status).toEqual('uploading');
    expect(result!.metadata).toEqual({ accuracy: 0.95, features: ['age', 'income'] });
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when model not found', async () => {
    const result = await getModelById(999);
    expect(result).toBeNull();
  });

  it('should handle model with null metadata', async () => {
    // Create a model with null metadata
    const insertResult = await db.insert(modelsTable)
      .values({
        ...testModelInput,
        metadata: null,
        status: 'ready'
      })
      .returning()
      .execute();

    const createdModel = insertResult[0];

    const result = await getModelById(createdModel.id);

    expect(result).not.toBeNull();
    expect(result!.metadata).toBeNull();
    expect(result!.status).toEqual('ready');
  });

  it('should handle model with null description', async () => {
    // Create a model with null description
    const insertResult = await db.insert(modelsTable)
      .values({
        ...testModelInput,
        description: null,
        status: 'processing'
      })
      .returning()
      .execute();

    const createdModel = insertResult[0];

    const result = await getModelById(createdModel.id);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.status).toEqual('processing');
  });
});
