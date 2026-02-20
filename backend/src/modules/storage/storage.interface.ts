export interface FileMetadata {
  name: string;
  size: number;
  lastModified: Date;
  path: string;
}

export interface StorageProvider {
  /**
   * Salva um arquivo no storage.
   * @param path Caminho relativo (ex: 'systems/file.txt')
   * @param content Buffer ou string do conteúdo
   * @param mimeType Tipo MIME (opcional)
   */
  save(path: string, content: Buffer | string, mimeType?: string): Promise<string>;

  /**
   * Lê um arquivo do storage.
   * @param path Caminho relativo
   */
  read(path: string): Promise<Buffer>;

  /**
   * Verifica se um arquivo existe.
   * @param path Caminho relativo
   */
  exists(path: string): Promise<boolean>;

  /**
   * Remove um arquivo.
   * @param path Caminho relativo
   */
  delete(path: string): Promise<void>;

  /**
   * Retorna a URL pública (se houver).
   * @param path Caminho relativo
   */
  getUrl(path: string): Promise<string>;

  /**
   * Lista arquivos em um diretório.
   * @param path Caminho relativo do diretório
   */
  list(path: string): Promise<FileMetadata[]>;
}
