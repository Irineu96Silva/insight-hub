import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemFile } from './entities/system-file.entity'; // Fixed import path
import { System } from './entities/system.entity';
// import * as fs from 'fs'; 
import * as path from 'path';
import { randomUUID } from 'crypto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class SystemFilesService {
  constructor(
    @InjectRepository(SystemFile)
    private filesRepository: Repository<SystemFile>,
    @InjectRepository(System)
    private systemsRepository: Repository<System>,
    private storageService: StorageService,
  ) {}

  async uploadFile(systemId: string, file: any, description?: string): Promise<SystemFile> {
    const system = await this.systemsRepository.findOne({ where: { id: systemId } });
    if (!system) throw new NotFoundException('System not found');

    const fileExt = path.extname(file.originalname);
    const storedFilename = `${systemId}-${randomUUID()}${fileExt}`;
    // Caminho relativo para o Storage
    const relativePath = path.join('systems', storedFilename);

    // Save file via Storage Service
    await this.storageService.save(relativePath, file.buffer);

    // Save metadata to DB
    const systemFile = this.filesRepository.create({
      system_id: systemId,
      filename: storedFilename, // Mantemos apenas o nome, o path base é responsabilidade do storage
      original_name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      description,
    });

    return this.filesRepository.save(systemFile);
  }

  async findAllBySystem(systemId: string): Promise<SystemFile[]> {
    return this.filesRepository.find({
      where: { system_id: systemId },
      order: { uploaded_at: 'DESC' },
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.filesRepository.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    // Remove from Storage
    const relativePath = path.join('systems', file.filename);
    await this.storageService.delete(relativePath);

    // Remove from DB
    await this.filesRepository.delete(fileId);
  }

  async findById(fileId: string): Promise<SystemFile> {
    const file = await this.filesRepository.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  getFilePath(filename: string): string {
    // Retorna path relativo. O consumidor deve resolver se precisar do absoluto (local) ou URL (R2).
    // Para compatibilidade local temporária:
    return path.join('systems', filename);
  }

  async readFileContent(filename: string): Promise<string> {
    const relativePath = path.join('systems', filename);
    const buffer = await this.storageService.read(relativePath);
    return buffer.toString('utf-8');
  }
}
