import { Collection } from 'src/app/domain/definitions/key-types';
export interface SlideData<T = { error?: string }> {
    collection: Collection;
    data: T;
    stable: boolean;
    type: string;
    options: {
        [key: string]: any;
    };
    error?: string;
}
