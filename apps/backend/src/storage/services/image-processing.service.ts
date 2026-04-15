import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { Readable } from 'stream';

export interface WebPOptions {
  width?: number;
  height?: number;
  quality?: number;
}

@Injectable()
export class ImageProcessingService {
  async toWebP(input: Buffer | Readable, opts?: WebPOptions): Promise<Buffer> {
    const pipeline = sharp(await this.toBuffer(input));

    if (opts?.width || opts?.height) {
      pipeline.resize(opts.width, opts.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    return pipeline.webp({ quality: opts?.quality ?? 80 }).toBuffer();
  }

  async getMetadata(input: Buffer | Readable): Promise<sharp.Metadata> {
    return sharp(await this.toBuffer(input)).metadata();
  }

  private async toBuffer(input: Buffer | Readable): Promise<Buffer> {
    if (Buffer.isBuffer(input)) return input;

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      input.on('data', (chunk: Buffer) => chunks.push(chunk));
      input.on('end', () => resolve(Buffer.concat(chunks)));
      input.on('error', reject);
    });
  }
}
