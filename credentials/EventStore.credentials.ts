import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EventStore implements ICredentialType {
	name = 'eventStore';
	displayName = 'EventStore DB';
	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'localhost',
		},
		{
			displayName: 'Port',
			name: 'port',
			type: 'number',
			default: 2113,
		},
		{
			displayName: 'User',
			name: 'user',
			type: 'string',
			default: 'admin',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: 'changeit',
		}
	];
}
