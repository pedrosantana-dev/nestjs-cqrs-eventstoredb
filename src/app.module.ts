import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventStoreModule } from './event-store/event-store.module';

@Module({
    imports: [EventStoreModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
