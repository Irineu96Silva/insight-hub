
import { AsyncLocalStorage } from 'async_hooks';

export interface WorkerEnv {
  STORAGE_BUCKET?: any; // R2Bucket type
  DATABASE_URL?: string;
  [key: string]: any;
}

export const workerContext = new AsyncLocalStorage<WorkerEnv>();

export function getWorkerEnv(): WorkerEnv {
  return workerContext.getStore() || {};
}
