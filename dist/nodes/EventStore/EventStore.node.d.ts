import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class EventStoreNode implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
