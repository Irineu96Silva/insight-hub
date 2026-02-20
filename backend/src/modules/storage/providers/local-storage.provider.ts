import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, FileMetadata } from '../storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads'); // Diretório base

  constructor() {
    this.ensureUploadDirExists();
  }

  // ... (existing methods)

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private resolvePath(relativePath: string): string {
    // Evitar Path Traversal básico
    const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.uploadDir, safePath);
  }

  async save(relativePath: string, content: Buffer | string, mimeType?: string): Promise<string> {
    const fullPath = this.resolvePath(relativePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
    this.logger.log(`Arquivo salvo localmente em: ${fullPath}`);
    return fullPath; // Em local, retornamos o path absoluto ou relativo
  }

  async read(relativePath: string): Promise<Buffer> {
    const fullPath = this.resolvePath(relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Arquivo não encontrado: ${relativePath}`);
    }
    return fs.readFileSync(fullPath);
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(relativePath);
    return fs.existsSync(fullPath);
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = this.resolvePath(relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  async getUrl(relativePath: string): Promise<string> {
    // Em local, não temos URL pública fácil sem servir estáticos.
    // Retornamos um file:// ou o path relativo para uso interno.
    return `file://${this.resolvePath(relativePath)}`;
  }

  async list(relativePath: string): Promise<FileMetadata[]> {
    const fullPath = this.resolvePath(relativePath);
    if (!fs.existsSync(fullPath)) {
        return [];
    }
    
    const files = fs.readdirSync(fullPath);
    return files.map(file => {
        const filePath = path.join(fullPath, file);
        const stats = fs.statSync(filePath);
        return {
            name: file,
            size: stats.size,
            lastModified: stats.birthtime,
            path: path.join(relativePath, file)
        };
    });
  }
}
