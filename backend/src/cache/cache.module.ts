import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { HttpCacheInterceptor } from './cache.decorators';
import cache from './cache';

@Global()
@Module({
  providers: [HttpCacheInterceptor],
  exports: [HttpCacheInterceptor],
})
export class CacheModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await cache.close();
  }
}
