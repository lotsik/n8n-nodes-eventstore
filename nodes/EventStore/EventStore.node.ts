import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { EventStoreDBClient, jsonEvent, START, FORWARDS, JSONEventType } from '@eventstore/db-client';
import { v4 as uuid } from 'uuid';

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
								displayName: 'Endpoint',
								name: 'endpoint',
								type: 'string',
								default: 'esdb://localhost:2113',
								placeholder: 'Endpoint',
								description: 'The endpoint of the EventStoreDB instance.',
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
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];


		const connectionSettings = this.getNodeParameter('connectionSettings',   0) as { endpoint: string, username: string, password: string };
		const operation = this.getNodeParameter('operation',   0) as string;
		const streamName = this.getNodeParameter('streamName',   0) as string;
		const eventType = this.getNodeParameter('eventType',   0) as string;
		const eventData = this.getNodeParameter('eventData',   0) as Record<string, unknown>;
		const version = this.getNodeParameter('version',   0) as number;
		const projectionName = this.getNodeParameter('projectionName',   0) as string;


		const client = new EventStoreDBClient({
			endpoint: connectionSettings.endpoint,
			credentials: {
				username: connectionSettings.username,
				password: connectionSettings.password,
			},
		});

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
