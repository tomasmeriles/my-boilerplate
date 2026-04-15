import { Inject, Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { Cached } from '../../common/cache/decorators/cached.decorator';
import { CacheHost } from '../../common/cache/services/cache-host.service';
import { ConfigService } from '../../config/services/config.service';
import { S3_CLIENT } from '../constants/storage.constants';
import { UploadOptions } from '../interfaces/storage.interface';

@Injectable()
export class StorageService {
  @Inject(CacheHost) protected readonly _cacheHost!: CacheHost;

  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {}

  private get bucket(): string {
    return this.config.get('S3_BUCKET');
  }

  async upload(
    key: string,
    body: Buffer | Readable,
    options?: UploadOptions,
  ): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
      }),
    );
  }

  async download(key: string) {
    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return response.Body;
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    await this._cacheHost.invalidate(`storage:presigned:${key}`);
  }

  @Cached<[string, number?]>({
    key: (key: string) => `storage:presigned:${key}`,
    ttl: (_: string, expiresInSeconds?: number) =>
      (expiresInSeconds ?? 3600) - 60,
  })
  async getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  /**
   * Returns a permanent public URL for the given key.
   * Only valid if the object (or bucket) has public-read access configured.
   *
   * Resolution order:
   *   1. S3_PUBLIC_BASE_URL set -> `${S3_PUBLIC_BASE_URL}/${key}` (CDN / custom domain)
   *   2. S3_ENDPOINT set        -> `${S3_ENDPOINT}/${bucket}/${key}` (MinIO path-style)
   *   3. Otherwise              -> AWS virtual-hosted style URL
   */
  getPublicUrl(key: string): string {
    const publicBase = this.config.get('S3_PUBLIC_BASE_URL');
    if (publicBase) {
      return `${publicBase}/${key}`;
    }

    const endpoint = this.config.get('S3_ENDPOINT');
    if (endpoint) {
      return `${endpoint}/${this.bucket}/${key}`;
    }

    const region = this.config.get('S3_REGION');
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
