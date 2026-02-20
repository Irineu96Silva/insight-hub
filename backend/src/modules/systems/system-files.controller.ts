
import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SystemFilesService } from './system-files.service';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('system-files')
@Controller('systems')
export class SystemFilesController {
  constructor(private readonly filesService: SystemFilesService) {}

  @Post(':id/files')
  @ApiOperation({ summary: 'Upload file to system' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        description: {
          type: 'string',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') systemId: string,
    @UploadedFile() file: any,
    @Body('description') description?: string,
  ) {
    return this.filesService.uploadFile(systemId, file, description);
  }

  @Get(':id/files')
  @ApiOperation({ summary: 'List files of a system' })
  async listFiles(@Param('id') systemId: string) {
    return this.filesService.findAllBySystem(systemId);
  }

  @Delete('files/:fileId')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('fileId') fileId: string) {
    return this.filesService.deleteFile(fileId);
  }

  @Get('files/:fileId/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(@Param('fileId') fileId: string, @Res() res: Response) {
    const file = await this.filesService.findById(fileId);
    const filePath = this.filesService.getFilePath(file.filename);
    
    res.download(filePath, file.original_name);
  }
}
