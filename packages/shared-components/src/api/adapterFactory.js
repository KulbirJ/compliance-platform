// API Adapter Factory
// Creates the appropriate API adapter based on the environment
import { RestApiAdapter } from './restAdapter';
import { SharePointApiAdapter } from './sharepointAdapter';

export const createApiAdapter = (type, config) => {
  switch (type) {
    case 'rest':
      return new RestApiAdapter(config);
    case 'sharepoint':
      return new SharePointApiAdapter(config);
    default:
      throw new Error(`Unknown adapter type: ${type}`);
  }
};
