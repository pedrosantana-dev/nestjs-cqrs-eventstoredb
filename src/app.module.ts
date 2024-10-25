import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventStoreModule } from './event-store/event-store.module';
import { StorageModule } from './api/storage.module';

@Module({
    imports: [EventStoreModule, StorageModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
