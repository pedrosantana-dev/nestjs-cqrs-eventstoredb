import { EventStoreDBClient, FORWARDS, START } from '@eventstore/db-client';
import {
    Global,
    Inject,
    Logger,
    Module,
    OnApplicationBootstrap,
    Provider,
} from '@nestjs/common';

const EventStore: Provider = {
    provide: 'EVENT_STORE',
    useFactory: () =>
        EventStoreDBClient.connectionString(
            `esdb://admin:changeit@eventstoredb:2113?tls=false`,
        ),
};

@Global()
@Module({
    providers: [EventStore],
    exports: [EventStore],
})
export class EventStoreModule implements OnApplicationBootstrap {
    private readonly logger = new Logger(EventStoreModule.name);

    constructor(
        @Inject('EVENT_STORE') private readonly client: EventStoreDBClient,
    ) {}

    onApplicationBootstrap() {
        try {
            this.client.readAll({
                direction: FORWARDS,
                fromPosition: START,
                maxCount: 1,
            });

            this.logger.log('EventStoreDB connected');
        } catch (error) {
            this.logger.error(
                'EventStoreDB connection error: ' + error.message,
                error.stack,
            );
        }
    }
}
