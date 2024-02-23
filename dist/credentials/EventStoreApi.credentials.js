"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStoreApi = void 0;
class EventStoreApi {
    constructor() {
        this.name = 'EventStoreApi';
        this.displayName = 'EventStore API';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                default: '',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                qs: {
                    'api_key': '={{$credentials.apiKey}}'
                }
            },
        };
    }
}
exports.EventStoreApi = EventStoreApi;
//# sourceMappingURL=EventStoreApi.credentials.js.map