import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { EventStoreDBClient, SingleNodeOptions, jsonEvent, START, FORWARDS, JSONEventType, Credentials, ChannelCredentialOptions } from '@eventstore/db-client';
import { v4 } from 'uuid';


export class EventStoreNode implements INodeType {
	description: INodeTypeDescription = {
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {

		interface ConnectionSettings {
			host: string;
			port: number;
			username: string;
			password: string;
		}

		function createConnectionOptions(settings: ConnectionSettings): SingleNodeOptions {
			return {
				endpoint: {
					address: settings.host,
					port: settings.port
				}
			};
		}

		function createChannelCredentialOptions(): ChannelCredentialOptions {
			return {
				insecure: true,
			};
		}

		function createCredentials(settings: ConnectionSettings): Credentials {
			return {
				username: settings.username,
				password: settings.password
			};
		}

		const returnData: INodeExecutionData[] = [];

		const connectionSettings: ConnectionSettings = this.getNodeParameter('connectionSettings',   0) as { host: string, port: number, username: string, password: string };
		const operation = this.getNodeParameter('operation',   0) as string;
		const streamName = this.getNodeParameter('streamName',   0) as string;
		const eventType = this.getNodeParameter('eventType',   0) as string;
		const eventData = this.getNodeParameter('eventData',   0) as Record<string, unknown>;
		const version = this.getNodeParameter('version',   0) as number;

		const connectionsOptions = createConnectionOptions(connectionSettings);
		const channelCredentialOptions = createChannelCredentialOptions();
		const credentials = createCredentials(connectionSettings);

		const client = new EventStoreDBClient(connectionsOptions, channelCredentialOptions, credentials);

		if (operation === 'read') {
			const events = client.readStream<JSONEventType>(streamName, {
				direction: FORWARDS,
				fromRevision: START,
				maxCount:   10,
			});

			for await (const resolvedEvent of events) {
				returnData.push(<INodeExecutionData>{json: resolvedEvent.event?.data});
			}
		} else if (operation === 'write') {
			const event = jsonEvent({
				id: v4(),
				type: eventType,
				data: eventData,
			});

			await client.appendToStream(streamName, event);
			returnData.push({ json: { success: true } });
		} else if (operation === 'subscribe') {
			// Subscription logic here
		} else if (operation === 'subscribeProjection') {
			// Subscription to projection logic here
		} else if (operation === 'readFromVersion') {
			const events = client.readStream<JSONEventType>(streamName, {
				direction: FORWARDS,
				fromRevision: BigInt(version),
				maxCount:   10,
			});

			for await (const resolvedEvent of events) {
				returnData.push(<INodeExecutionData>{json: resolvedEvent.event?.data});
			}
		}

		return this.prepareOutputData(returnData);
	}
}
