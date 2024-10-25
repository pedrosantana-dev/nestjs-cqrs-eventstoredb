import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StorageController } from './storage.controller';
import {
    DisableStorageUnitHandler,
    EnableStorageUnitHandler,
    RegisterStorageUnitHandler,
    StorageDisabledEventHandler,
    StorageEnabledEventHandler,
    StorageRegisteredEventHandler,
} from 'src/storage/storage.aggregate';
import { EventStoreDBClient, streamNameFilter } from '@eventstore/db-client';

@Module({
    imports: [CqrsModule],
    controllers: [StorageController],
    providers: [
        RegisterStorageUnitHandler,
        EnableStorageUnitHandler,
        DisableStorageUnitHandler,
        StorageRegisteredEventHandler,
        StorageEnabledEventHandler,
        StorageDisabledEventHandler,
    ],
})
export class StorageModule implements OnModuleInit {
    constructor(
        @Inject('EVENT_STORE') private readonly eventStore: EventStoreDBClient,
    ) {}

    onModuleInit() {
        this.startBackgroundSubscription();
    }

    private startBackgroundSubscription() {
        (async (): Promise<void> => {
            await this.subscribeToAllStorageEVents();
        })();
    }

    private async subscribeToAllStorageEVents() {
        const subscription = this.eventStore.subscribeToAll({
            filter: streamNameFilter({ prefixes: ['storage-unit-stream-'] }),
        });

        for await (const resolvedEvent of subscription) {
            console.log(
                `Received event: ${resolvedEvent.event?.revision}@${resolvedEvent.event?.streamId}`,
            );
            const data: any = resolvedEvent.event.data;
            console.log('data:', data);
        }
    }
}
