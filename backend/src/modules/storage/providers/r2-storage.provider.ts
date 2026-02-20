
import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, FileMetadata } from '../storage.interface';
import { getWorkerEnv } from '../../../worker-context';

@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);

  private getBucket() {
    const env = getWorkerEnv();
    const bucket = env.STORAGE_BUCKET;
    if (!bucket) {
      this.logger.error('R2 Bucket binding (STORAGE_BUCKET) not found in Worker Environment.');
      throw new Error('R2 Bucket not configured');
    }
    return bucket;
  }

  async save(relativePath: string, content: Buffer | string, mimeType?: string): Promise<string> {
    const bucket = this.getBucket();
    this.logger.log(`Saving to R2: ${relativePath}`);
    
    await bucket.put(relativePath, content, {
      httpMetadata: { contentType: mimeType },
    });
    
    return relativePath;
  }

  async read(relativePath: string): Promise<Buffer> {
    const bucket = this.getBucket();
    const object = await bucket.get(relativePath);

    if (!object) {
      throw new Error(`File not found in R2: ${relativePath}`);
    }

    const arrayBuffer = await object.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async exists(relativePath: string): Promise<boolean> {
    const bucket = this.getBucket();
    const object = await bucket.head(relativePath);
    return object !== null;
  }

  async delete(relativePath: string): Promise<void> {
    const bucket = this.getBucket();
    await bucket.delete(relativePath);
  }

  async getUrl(relativePath: string): Promise<string> {
     // Se o bucket for público ou estiver atrás de um worker que serve arquivos:
     // Por enquanto retornamos o key, ou uma URL relativa se tivermos um endpoint de proxy.
     // Se tivermos um domínio customizado para o R2, usamos aqui.
     // Placeholder:
     return `/files/${relativePath}`; 
  }

  async list(relativePath: string): Promise<FileMetadata[]> {
    const bucket = this.getBucket();
    // R2 list aceita prefix. 
    // Se relativePath for '.', listamos root. Se for 'reports', listamos 'reports/'.
    const prefix = relativePath === '.' ? '' : 
                   relativePath.endsWith('/') ? relativePath : `${relativePath}/`;
    
    const listed = await bucket.list({ prefix });
    
    return listed.objects.map((obj: any) => ({
        name: obj.key.replace(prefix, ''), // Nome do arquivo sem o prefixo
        size: obj.size,
        lastModified: obj.uploaded,
        path: obj.key
    }));
  }
}
