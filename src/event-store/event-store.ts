import { EventStoreDBClient } from '@eventstore/db-client';

const client = EventStoreDBClient.connectionString(
    `esdb://admin:changeit@eventstoredb:2113?tls=false`,
);

export { client };
