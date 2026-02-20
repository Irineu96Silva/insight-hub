
import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, FileMetadata } from '../storage.interface';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; // Optional: for signed URLs if needed

@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor() {
    // Inicializa o cliente S3 compatível com R2
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    
    this.bucketName = process.env.R2_BUCKET_NAME || 'insighthub-files';
    this.publicUrl = process.env.R2_PUBLIC_URL || ''; // URL pública do bucket se houver

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.warn('R2/S3 credentials not found in environment variables (R2_ACCOUNT_ID, etc). Storage might fail.');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  async save(relativePath: string, content: Buffer | string, mimeType?: string): Promise<string> {
    this.logger.log(`Saving to R2 (S3 API): ${relativePath}`);
    
    const body = Buffer.isBuffer(content) ? content : Buffer.from(content);

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: relativePath,
      Body: body,
      ContentType: mimeType || 'application/octet-stream',
    }));
    
    return relativePath;
  }

  async read(relativePath: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: relativePath,
      }));

      if (!response.Body) {
        throw new Error('Empty body');
      }

      // Converte stream para Buffer
      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch (error) {
      this.logger.error(`Error reading file ${relativePath}: ${error.message}`);
      throw new Error(`File not found or access denied: ${relativePath}`);
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: relativePath,
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  async delete(relativePath: string): Promise<void> {
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: relativePath,
    }));
  }

  async getUrl(relativePath: string): Promise<string> {
     // Se tivermos um domínio público configurado
     if (this.publicUrl) {
       return `${this.publicUrl}/${relativePath}`;
     }
     // Fallback: retorna o path, ou poderíamos gerar uma Signed URL
     return `/files/${relativePath}`; 
  }

  async list(relativePath: string): Promise<FileMetadata[]> {
    const prefix = relativePath === '.' ? '' : 
                   relativePath.endsWith('/') ? relativePath : `${relativePath}/`;
    
    const response = await this.s3Client.send(new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    }));
    
    return (response.Contents || []).map((obj) => ({
        name: obj.Key?.replace(prefix, '') || '', 
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        path: obj.Key || ''
    }));
  }
}
