
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { modelsTable } from '../db/schema';
import { type CreateModelInput } from '../schema';
import { createModel } from '../handlers/create_model';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateModelInput = {
  name: 'Test ML Model',
  description: 'A test machine learning model',
  model_type: 'traditional_ml',
  framework: 'scikit-learn',
  file_path: '/models/test_model.pkl',
  file_size: 1024000,
  metadata: { accuracy: 0.95, version: '1.0' }
};

describe('createModel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a model', async () => {
    const result = await createModel(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test ML Model');
    expect(result.description).toEqual(testInput.description);
    expect(result.model_type).toEqual('traditional_ml');
    expect(result.framework).toEqual('scikit-learn');
    expect(result.file_path).toEqual('/models/test_model.pkl');
    expect(result.file_size).toEqual(1024000);
    expect(result.metadata).toEqual({ accuracy: 0.95, version: '1.0' });
    expect(result.status).toEqual('uploading'); // Default status
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save model to database', async () => {
    const result = await createModel(testInput);

    // Query using proper drizzle syntax
    const models = await db.select()
      .from(modelsTable)
      .where(eq(modelsTable.id, result.id))
      .execute();

    expect(models).toHaveLength(1);
    expect(models[0].name).toEqual('Test ML Model');
    expect(models[0].description).toEqual(testInput.description);
    expect(models[0].model_type).toEqual('traditional_ml');
    expect(models[0].framework).toEqual('scikit-learn');
    expect(models[0].file_path).toEqual('/models/test_model.pkl');
    expect(models[0].file_size).toEqual(1024000);
    expect(models[0].metadata).toEqual({ accuracy: 0.95, version: '1.0' });
    expect(models[0].status).toEqual('uploading');
    expect(models[0].created_at).toBeInstanceOf(Date);
    expect(models[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create model with deep learning type', async () => {
    const deepLearningInput: CreateModelInput = {
      name: 'Neural Network Model',
      description: null,
      model_type: 'deep_learning',
      framework: 'tensorflow',
      file_path: '/models/neural_net.h5',
      file_size: 5000000,
      metadata: null
    };

    const result = await createModel(deepLearningInput);

    expect(result.name).toEqual('Neural Network Model');
    expect(result.description).toBeNull();
    expect(result.model_type).toEqual('deep_learning');
    expect(result.framework).toEqual('tensorflow');
    expect(result.file_path).toEqual('/models/neural_net.h5');
    expect(result.file_size).toEqual(5000000);
    expect(result.metadata).toBeNull();
    expect(result.status).toEqual('uploading');
  });

  it('should create model with pytorch framework', async () => {
    const pytorchInput: CreateModelInput = {
      name: 'PyTorch Model',
      description: 'A PyTorch based model',
      model_type: 'deep_learning',
      framework: 'pytorch',
      file_path: '/models/pytorch_model.pth',
      file_size: 2500000,
      metadata: { epochs: 100, batch_size: 32 }
    };

    const result = await createModel(pytorchInput);

    expect(result.framework).toEqual('pytorch');
    expect(result.model_type).toEqual('deep_learning');
    expect(result.metadata).toEqual({ epochs: 100, batch_size: 32 });
    expect(result.file_size).toEqual(2500000);
  });
});
