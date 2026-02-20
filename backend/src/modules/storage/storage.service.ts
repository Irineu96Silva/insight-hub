import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, FileMetadata } from './storage.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';

@Injectable()
export class StorageService {
  private provider: StorageProvider;
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly localProvider: LocalStorageProvider,
    private readonly r2Provider: R2StorageProvider,
  ) {
    // Lógica de seleção de Provider
    const useR2 = process.env.STORAGE_DRIVER === 'r2';
    
    if (useR2) {
      this.provider = this.r2Provider;
      this.logger.log('Usando R2 Storage Provider (Cloudflare)');
    } else {
      this.provider = this.localProvider;
      this.logger.log('Usando Local Storage Provider (Disk)');
    }
  }

  async save(path: string, content: Buffer | string, mimeType?: string): Promise<string> {
    return this.provider.save(path, content, mimeType);
  }

  async read(path: string): Promise<Buffer> {
    return this.provider.read(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.provider.exists(path);
  }

  async delete(path: string): Promise<void> {
    return this.provider.delete(path);
  }

  async getUrl(path: string): Promise<string> {
    return this.provider.getUrl(path);
  }

  async list(path: string): Promise<FileMetadata[]> {
    return this.provider.list(path);
  }
}
