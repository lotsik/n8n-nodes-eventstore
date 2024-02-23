import { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class EventStoreApi implements ICredentialType {
    name: string;
    displayName: string;
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
}
