
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { modelsTable } from '../db/schema';
import { type CreateModelInput } from '../schema';
import { getModels } from '../handlers/get_models';

// Test model inputs
const testModel1: CreateModelInput = {
  name: 'Test Model 1',
  description: 'First test model',
  model_type: 'traditional_ml',
  framework: 'scikit-learn',
  file_path: '/models/test1.pkl',
  file_size: 1024,
  metadata: { version: '1.0' }
};

const testModel2: CreateModelInput = {
  name: 'Test Model 2',
  description: null,
  model_type: 'deep_learning',
  framework: 'tensorflow',
  file_path: '/models/test2.h5',
  file_size: 2048,
  metadata: null
};

describe('getModels', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no models exist', async () => {
    const result = await getModels();
    expect(result).toEqual([]);
  });

  it('should return all models', async () => {
    // Create test models
    await db.insert(modelsTable)
      .values([testModel1, testModel2])
      .execute();

    const result = await getModels();

    expect(result).toHaveLength(2);
    
    // Check first model
    const model1 = result.find(m => m.name === 'Test Model 1');
    expect(model1).toBeDefined();
    expect(model1!.description).toEqual('First test model');
    expect(model1!.model_type).toEqual('traditional_ml');
    expect(model1!.framework).toEqual('scikit-learn');
    expect(model1!.file_path).toEqual('/models/test1.pkl');
    expect(model1!.file_size).toEqual(1024);
    expect(model1!.status).toEqual('uploading'); // Default status
    expect(model1!.metadata).toEqual({ version: '1.0' });
    expect(model1!.id).toBeDefined();
    expect(model1!.created_at).toBeInstanceOf(Date);
    expect(model1!.updated_at).toBeInstanceOf(Date);

    // Check second model
    const model2 = result.find(m => m.name === 'Test Model 2');
    expect(model2).toBeDefined();
    expect(model2!.description).toBeNull();
    expect(model2!.model_type).toEqual('deep_learning');
    expect(model2!.framework).toEqual('tensorflow');
    expect(model2!.file_path).toEqual('/models/test2.h5');
    expect(model2!.file_size).toEqual(2048);
    expect(model2!.status).toEqual('uploading'); // Default status
    expect(model2!.metadata).toBeNull();
    expect(model2!.id).toBeDefined();
    expect(model2!.created_at).toBeInstanceOf(Date);
    expect(model2!.updated_at).toBeInstanceOf(Date);
  });

  it('should return models with different statuses', async () => {
    // Create models with different statuses
    await db.insert(modelsTable)
      .values([
        { ...testModel1, status: 'ready' },
        { ...testModel2, status: 'error' }
      ])
      .execute();

    const result = await getModels();

    expect(result).toHaveLength(2);
    
    const readyModel = result.find(m => m.status === 'ready');
    const errorModel = result.find(m => m.status === 'error');
    
    expect(readyModel).toBeDefined();
    expect(errorModel).toBeDefined();
    expect(readyModel!.name).toEqual('Test Model 1');
    expect(errorModel!.name).toEqual('Test Model 2');
  });
});
