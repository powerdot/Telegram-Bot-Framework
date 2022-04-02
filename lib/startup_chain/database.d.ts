import { MongoDataBase } from '../types';
export default function ({ url, dbName }: {
    url: any;
    dbName: any;
}): Promise<MongoDataBase>;
