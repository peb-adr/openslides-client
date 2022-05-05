import { Injectable } from '@angular/core';
import { HttpService } from '../http.service';
import { Action } from './action';
import { ActionRequest, isActionError, isActionResponse } from './action-utils';

@Injectable({
    providedIn: 'root'
})
export class ActionService {
    private readonly ACTION_URL = `/system/action/handle_request`;

    public constructor(private http: HttpService) {}

    public async sendRequests<T>(requests: ActionRequest[]): Promise<T[] | null> {
        console.log(`send requests:`, requests);
        const response = await this.http.post<T>(this.ACTION_URL, requests);
        if (isActionError(response)) {
            throw response.message;
        } else if (isActionResponse<T>(response)) {
            const results = response.results;
            if (!results) {
                return null;
            }
            if (results.length !== requests.length) {
                throw new Error(`The action service did not return responses for each request.`);
            }
            return results[0] as T[];
        }
        throw new Error(`Unknown return type from action service`);
    }

    public create<T>(...requests: ActionRequest[]): Action<T> {
        return new Action<T>(r => this.sendRequests<T>(r) as any, ...requests);
    }

    /////////////////////////////////////////////////////////////////////////////////////
    /////////////////////// The following methods will be removed ///////////////////////
    /////////////////////////////////////////////////////////////////////////////////////

    /**
     * @deprecated This will be removed pretty soon, use `create` instead!
     * @param action
     * @param data
     * @returns
     */
    public async sendRequest<T>(action: string, data: any): Promise<T | void> {
        const results = await this.sendRequests<T>([{ action, data: [data] }]);
        if (!results) {
            return;
        }
        if (results.length !== 1) {
            throw new Error(`The action service did not respond with exactly one response for one request.`);
        }
        return results[0];
    }

    /**
     * @deprecated This will be removed pretty soon, use `create` instead!
     * @param action
     * @param data
     * @returns
     */
    public async sendBulkRequest<T>(action: string, data: any[]): Promise<T[] | null> {
        const results = await this.sendRequests<T>([{ action, data }]);
        if (results && results.length !== data.length) {
            throw new Error(`Inner resultlength is not ${data.length} from the action service`);
        }
        return results;
    }
}