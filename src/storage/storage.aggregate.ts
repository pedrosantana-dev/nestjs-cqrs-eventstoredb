import {
    AggregateRoot,
    CommandHandler,
    EventPublisher,
    EventsHandler,
    ICommandHandler,
    IEventHandler,
} from '@nestjs/cqrs';
import {
    StorageDisabledEvent,
    StorageEnabledEvent,
    StorageRegisteredEvent,
} from './storage.events';
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';
import { client as eventStore } from '../event-store/event-store';
import { Inject } from '@nestjs/common';
import {
    DisableStorageUnitCommand,
    EnableStorageUnitCommand,
    RegisterStorageUnitCommand,
} from './storage.commands';

export class StorageAggregate extends AggregateRoot {
    private id: string;
    private capacity: string;
    disabled: boolean = false;

    constructor() {
        super();
    }

    registerStorage(aggregateId: string, capacity: string) {
        this.apply(new StorageRegisteredEvent(aggregateId, capacity, true));
    }

    enableStorage() {
        if (this.disabled) {
            this.apply(new StorageEnabledEvent(this.id, this.capacity, true));
        }
    }

    disableStorage() {
        if (!this.disabled) {
            this.apply(new StorageDisabledEvent(this.id, this.capacity, true));
        }
    }

    applyStorageRegisteredEventToAggregate(event: StorageRegisteredEvent) {
        this.id = event.aggregateId;
        this.capacity = event.capacity;
        this.disabled = false;
    }

    applyStorageDisabledEventToAggregate() {
        this.disabled = true;
    }

    applyStorageEnabledEventToAggregate() {
        this.disabled = false;
    }

    static async loadAggregate(aggregateId: string): Promise<StorageAggregate> {
        const events = eventStore.readStream(
            `storage-unit-stream-${aggregateId}`,
        );
        const aggregate = new StorageAggregate();

        for await (const event of events) {
            const data: any = event.event.data;
            try {
                switch (event.event.type) {
                    case 'StorageUnitCreated':
                        aggregate.applyStorageRegisteredEventToAggregate({
                            aggregateId: data.id,
                            capacity: data.capacity,
                            isNew: true,
                        });
                        break;
                    case 'StorageUnitEnabled':
                        aggregate.applyStorageEnabledEventToAggregate();
                        break;
                    case 'StorageUnitDisabled':
                        aggregate.applyStorageDisabledEventToAggregate();
                        break;
                    default:
                        console.log(
                            'Could not process event: ' + event.event.type,
                        );
                        break;
                }
            } catch (error) {
                console.log('Could not process event: ' + error.message);
            }
        }
        return aggregate;
    }
}

@CommandHandler(RegisterStorageUnitCommand)
export class RegisterStorageUnitHandler
    implements ICommandHandler<RegisterStorageUnitCommand>
{
    constructor(private readonly publish: EventPublisher) {}

    async execute(command: RegisterStorageUnitCommand): Promise<void> {
        const aggregate = this.publish.mergeObjectContext(
            new StorageAggregate(),
        );
        aggregate.registerStorage(command.aggregateId, command.capacity);
        aggregate.commit();
    }
}

@CommandHandler(DisableStorageUnitCommand)
export class DisableStorageUnitHandler
    implements ICommandHandler<DisableStorageUnitCommand>
{
    constructor(private readonly publish: EventPublisher) {}

    async execute(command: DisableStorageUnitCommand): Promise<void> {
        const aggregate = this.publish.mergeObjectContext(
            await StorageAggregate.loadAggregate(command.aggregateId),
        );
        if (!aggregate.disabled) {
            aggregate.disableStorage();
            aggregate.commit();
        }
    }
}

@CommandHandler(EnableStorageUnitCommand)
export class EnableStorageUnitHandler
    implements ICommandHandler<EnableStorageUnitCommand>
{
    constructor(private readonly publish: EventPublisher) {}

    async execute(command: EnableStorageUnitCommand): Promise<void> {
        const aggregate = this.publish.mergeObjectContext(
            await StorageAggregate.loadAggregate(command.aggregateId),
        );
        if (aggregate.disabled) {
            aggregate.enableStorage();
            aggregate.commit();
        }
    }
}

@EventsHandler(StorageRegisteredEvent)
export class StorageRegisteredEventHandler
    implements IEventHandler<StorageRegisteredEvent>
{
    constructor(
        @Inject('EVENT_STORE') private readonly eventStore: EventStoreDBClient,
    ) {}

    async handle(event: StorageRegisteredEvent): Promise<void> {
        if (event.isNew) {
            const eventData = jsonEvent({
                type: 'StorageUnitCreated',
                data: {
                    id: event.aggregateId,
                    capacity: event.capacity,
                },
            });

            await this.eventStore.appendToStream(
                `storage-unit-stream-${event.aggregateId}`,
                [eventData],
            );
        }
    }
}

@EventsHandler(StorageDisabledEvent)
export class StorageDisabledEventHandler
    implements IEventHandler<StorageDisabledEvent>
{
    constructor(
        @Inject('EVENT_STORE') private readonly eventStore: EventStoreDBClient,
    ) {}

    async handle(event: StorageDisabledEvent): Promise<void> {
        if (event.isNew) {
            const eventData = jsonEvent({
                type: 'StorageUnitDisabled',
                data: {
                    id: event.aggregateId,
                    capacity: event.capacity,
                },
            });

            await this.eventStore.appendToStream(
                `storage-unit-stream-${event.aggregateId}`,
                [eventData],
            );
        }
    }
}

@EventsHandler(StorageEnabledEvent)
export class StorageEnabledEventHandler
    implements IEventHandler<StorageEnabledEvent>
{
    constructor(
        @Inject('EVENT_STORE') private readonly eventStore: EventStoreDBClient,
    ) {}

    async handle(event: StorageEnabledEvent): Promise<void> {
        if (event.isNew) {
            const eventData = jsonEvent({
                type: 'StorageUnitEnabled',
                data: {
                    id: event.aggregateId,
                    capacity: event.capacity,
                },
            });

            await this.eventStore.appendToStream(
                `storage-unit-stream-${event.aggregateId}`,
                [eventData],
            );
        }
    }
}
