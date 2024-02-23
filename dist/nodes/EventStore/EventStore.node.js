"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStore = void 0;
const db_client_1 = require("@eventstore/db-client");
const uuid_1 = require("uuid");
class EventStore {
    constructor() {
        this.description = {
            displayName: 'EventStore Node',
            name: 'eventStoreNode',
            icon: 'file:eventstore.png',
            group: ['transform'],
            version: 1,
            description: 'Interact with EventStoreDB',
            defaults: {
                name: 'EventStore Node',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'EventStoreApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Connection Settings',
                    name: 'connectionSettings',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: false,
                    },
                    options: [
                        {
                            displayName: 'Connection Settings',
                            name: 'connectionSettings',
                            values: [
                                {
                                    displayName: 'Host',
                                    name: 'host',
                                    type: 'string',
                                    default: 'localhost',
                                    placeholder: 'Host',
                                    description: 'The host of the EventStoreDB instance.',
                                },
                                {
                                    displayName: 'Port',
                                    name: 'port',
                                    type: 'string',
                                    default: '2113',
                                    placeholder: 'Port',
                                    description: 'The port of the EventStoreDB instance.',
                                },
                                {
                                    displayName: 'Username',
                                    name: 'username',
                                    type: 'string',
                                    default: 'admin',
                                    placeholder: 'Username',
                                    description: 'The username for the EventStoreDB instance.',
                                },
                                {
                                    displayName: 'Password',
                                    name: 'password',
                                    type: 'string',
                                    typeOptions: {
                                        password: true,
                                    },
                                    default: 'changeit',
                                    placeholder: 'Password',
                                    description: 'The password for the EventStoreDB instance.',
                                },
                            ],
                        },
                    ],
                    default: ''
                },
                {
                    displayName: 'Stream Name',
                    name: 'streamName',
                    type: 'string',
                    default: '',
                    placeholder: 'Stream Name',
                    description: 'The name of the stream to interact with.',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    options: [
                        {
                            name: 'Read',
                            value: 'read',
                        },
                        {
                            name: 'Write',
                            value: 'write',
                        },
                        {
                            name: 'Subscribe',
                            value: 'subscribe',
                        },
                        {
                            name: 'Subscribe to Projection',
                            value: 'subscribeProjection',
                        },
                        {
                            name: 'Read from Version',
                            value: 'readFromVersion',
                        },
                    ],
                    default: 'read',
                    description: 'The operation to perform.',
                },
                {
                    displayName: 'Event Type',
                    name: 'eventType',
                    type: 'string',
                    default: '',
                    placeholder: 'Event Type',
                    description: 'The type of the event to write.',
                    displayOptions: {
                        show: {
                            operation: ['write'],
                        },
                    },
                },
                {
                    displayName: 'Event Data',
                    name: 'eventData',
                    type: 'json',
                    default: {},
                    placeholder: 'Event Data',
                    description: 'The data of the event to write.',
                    displayOptions: {
                        show: {
                            operation: ['write'],
                        },
                    },
                },
                {
                    displayName: 'Version',
                    name: 'version',
                    type: 'number',
                    default: 0,
                    placeholder: 'Version',
                    description: 'The version from which to start reading events.',
                    displayOptions: {
                        show: {
                            operation: ['readFromVersion'],
                        },
                    },
                },
                {
                    displayName: 'Projection Name',
                    name: 'projectionName',
                    type: 'string',
                    default: '',
                    placeholder: 'Projection Name',
                    description: 'The name of the projection to subscribe to.',
                    displayOptions: {
                        show: {
                            operation: ['subscribeProjection'],
                        },
                    },
                },
            ],
        };
    }
    async execute() {
        var _a, _b;
        function createConnectionOptions(settings) {
            return {
                endpoint: {
                    address: settings.host,
                    port: settings.port
                }
            };
        }
        function createChannelCredentialOptions() {
            return {
                insecure: true,
            };
        }
        function createCredentials(settings) {
            return {
                username: settings.username,
                password: settings.password
            };
        }
        const returnData = [];
        const connectionSettings = this.getNodeParameter('connectionSettings', 0);
        const operation = this.getNodeParameter('operation', 0);
        const streamName = this.getNodeParameter('streamName', 0);
        const eventType = this.getNodeParameter('eventType', 0);
        const eventData = this.getNodeParameter('eventData', 0);
        const version = this.getNodeParameter('version', 0);
        const connectionsOptions = createConnectionOptions(connectionSettings);
        const channelCredentialOptions = createChannelCredentialOptions();
        const credentials = createCredentials(connectionSettings);
        const client = new db_client_1.EventStoreDBClient(connectionsOptions, channelCredentialOptions, credentials);
        if (operation === 'read') {
            const events = client.readStream(streamName, {
                direction: db_client_1.FORWARDS,
                fromRevision: db_client_1.START,
                maxCount: 10,
            });
            for await (const resolvedEvent of events) {
                returnData.push({ json: (_a = resolvedEvent.event) === null || _a === void 0 ? void 0 : _a.data });
            }
        }
        else if (operation === 'write') {
            const event = (0, db_client_1.jsonEvent)({
                id: (0, uuid_1.v4)(),
                type: eventType,
                data: eventData,
            });
            await client.appendToStream(streamName, event);
            returnData.push({ json: { success: true } });
        }
        else if (operation === 'subscribe') {
        }
        else if (operation === 'subscribeProjection') {
        }
        else if (operation === 'readFromVersion') {
            const events = client.readStream(streamName, {
                direction: db_client_1.FORWARDS,
                fromRevision: BigInt(version),
                maxCount: 10,
            });
            for await (const resolvedEvent of events) {
                returnData.push({ json: (_b = resolvedEvent.event) === null || _b === void 0 ? void 0 : _b.data });
            }
        }
        return this.prepareOutputData(returnData);
    }
}
exports.EventStore = EventStore;
//# sourceMappingURL=EventStore.node.js.map