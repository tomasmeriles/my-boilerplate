import { Global, Module } from '@nestjs/common';
import { configSchema } from './schemas/config.schema';
import { ConfigService } from './services/config.service';

function validateConfig() {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${missing}`);
  }

  return result.data;
}

@Global()
@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useFactory: validateConfig,
    },
    {
      provide: ConfigService,
      useFactory: (config) => new ConfigService(config),
      inject: ['APP_CONFIG'],
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule {}
