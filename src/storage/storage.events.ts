import { IEvent } from '@nestjs/cqrs';

export abstract class StorageEvent implements IEvent {
    constructor(
        public readonly aggregateId: string,
        public readonly capacity: string,
        public readonly isNew: boolean,
    ) {}
}

export class StorageRegisteredEvent extends StorageEvent {}
export class StorageDisabledEvent extends StorageEvent {}
export class StorageEnabledEvent extends StorageEvent {}
