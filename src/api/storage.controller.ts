import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
    DisableStorageUnitCommand,
    EnableStorageUnitCommand,
    RegisterStorageUnitCommand,
} from 'src/storage/storage.commands';
import { v4 as uuid } from 'uuid';

@Controller('storage')
export class StorageController {
    constructor(private readonly commandBus: CommandBus) {}

    @Post('register')
    async registerStorage(@Body('capacity') capacity: string): Promise<any> {
        const aggregateId = uuid();
        await this.commandBus.execute(
            new RegisterStorageUnitCommand(aggregateId, capacity),
        );
        return { message: 'command received', aggregateId };
    }

    @Post('/:id/disable')
    async disableStorage(@Param('id') id: string): Promise<any> {
        await this.commandBus.execute(new DisableStorageUnitCommand(id));
        return { message: 'command received' };
    }

    @Post('/:id/enable')
    async enableStorage(@Param('id') id: string): Promise<any> {
        await this.commandBus.execute(new EnableStorageUnitCommand(id));
        return { message: 'command received' };
    }
}
