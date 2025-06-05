
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { modelsTable } from '../db/schema';
import { type CreateModelInput, type UpdateModelStatusInput } from '../schema';
import { updateModelStatus } from '../handlers/update_model_status';
import { eq } from 'drizzle-orm';

// Create a test model first
const createTestModel = async (): Promise<number> => {
  const testModelInput: CreateModelInput = {
    name: 'Test Model',
    description: 'A model for testing',
    model_type: 'traditional_ml',
    framework: 'scikit-learn',
    file_path: '/models/test_model.pkl',
    file_size: 1024,
    metadata: { version: '1.0' }
  };

  const result = await db.insert(modelsTable)
    .values({
      ...testModelInput,
      status: 'uploading'
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateModelStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update model status', async () => {
    const modelId = await createTestModel();

    const updateInput: UpdateModelStatusInput = {
      id: modelId,
      status: 'ready'
    };

    const result = await updateModelStatus(updateInput);

    expect(result.id).toEqual(modelId);
    expect(result.status).toEqual('ready');
    expect(result.name).toEqual('Test Model');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update model status with metadata', async () => {
    const modelId = await createTestModel();

    const updateInput: UpdateModelStatusInput = {
      id: modelId,
      status: 'error',
      metadata: { error_message: 'Failed to process model', retry_count: 3 }
    };

    const result = await updateModelStatus(updateInput);

    expect(result.id).toEqual(modelId);
    expect(result.status).toEqual('error');
    expect(result.metadata).toEqual({ error_message: 'Failed to process model', retry_count: 3 });
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    const modelId = await createTestModel();

    const updateInput: UpdateModelStatusInput = {
      id: modelId,
      status: 'processing',
      metadata: { progress: 50 }
    };

    await updateModelStatus(updateInput);

    // Verify the update was saved
    const models = await db.select()
      .from(modelsTable)
      .where(eq(modelsTable.id, modelId))
      .execute();

    expect(models).toHaveLength(1);
    expect(models[0].status).toEqual('processing');
    expect(models[0].metadata).toEqual({ progress: 50 });
    expect(models[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent model', async () => {
    const updateInput: UpdateModelStatusInput = {
      id: 99999,
      status: 'ready'
    };

    await expect(updateModelStatus(updateInput)).rejects.toThrow(/Model with id 99999 not found/i);
  });

  it('should update status without changing existing metadata when metadata not provided', async () => {
    const modelId = await createTestModel();

    // First update with metadata
    await updateModelStatus({
      id: modelId,
      status: 'processing',
      metadata: { step: 'preprocessing' }
    });

    // Second update without metadata
    const result = await updateModelStatus({
      id: modelId,
      status: 'ready'
    });

    expect(result.status).toEqual('ready');
    expect(result.metadata).toEqual({ step: 'preprocessing' }); // Should keep existing metadata
  });
});
