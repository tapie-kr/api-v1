import { AssetRepository } from '@/asset/asset.repository'
import { FileType } from '@/asset/types/fileType'
import {
  Cache,
  CACHE_MANAGER,
  CacheInterceptor,
  CacheTTL,
} from '@nestjs/cache-manager'
import { Inject, Injectable, UseInterceptors } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client as MinioClient } from 'minio'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
@UseInterceptors(CacheInterceptor)
export class AssetService {
  private readonly minioClient: MinioClient;
  private readonly PRESIGNED_URL_EXPIRY = 2 * 60 * 60;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly assetRepository: AssetRepository) {
    // Cloudflare R2 지원: pathStyle 옵션 추가 (R2는 path-style URL 사용)
    let endPoint = this.configService.get('MINIO_URL');
    
    // MinIO 클라이언트는 프로토콜을 포함하지 않은 호스트명만 필요
    // https://example.com -> example.com
    if (endPoint) {
      endPoint = endPoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
    
    const isR2 = endPoint?.includes('r2.cloudflarestorage.com') || endPoint?.includes('r2.dev');
    
    this.minioClient = new MinioClient({
      endPoint:  endPoint,
      useSSL:    true,
      accessKey: this.configService.get('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get('MINIO_SECRET_KEY'),
      // R2의 경우 pathStyle을 true로 설정 (선택사항, R2는 둘 다 지원)
      ...(isR2 && { pathStyle: true }),
    });
  }
  generateFilename(originalName: string): string {
    const extension = originalName.split('.').pop();

    return `${uuidv4()}.${extension}`;
  }
  @CacheTTL(1800)
  async getPresignedUrl(uuid: string) {
    const asset = await this.assetRepository.getAsset(uuid);
    const presignedUrl = await this.minioClient.presignedUrl('GET', this.configService.get('MINIO_BUCKET_NAME'), asset.path, this.PRESIGNED_URL_EXPIRY);

    return {
      asset, presignedUrl,
    };
  }
  async uploadFile(file: File, fileName: string, type: FileType, assetName?: string) {
    const url = await this.uploadFileToMinio(file, fileName, type);

    return this.assetRepository.createAsset(url, assetName);
  }
  async uploadFileToMinio(file: File, fileName: string, type: FileType) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = type ? `${type}/${fileName}` : fileName;
    const BUCKET_NAME = this.configService.get('MINIO_BUCKET_NAME');

    await this.minioClient.putObject(BUCKET_NAME, path, buffer, file.size);

    return path;
  }
  buildPublicUrl(path: string) {
    return `${this.configService.get('MINIO_PUBLIC_URL')}/${path}`;
  }
}
