import { MongoDataBase } from '../types';
export default function ({ url, dbName }: {
    url?: string;
    dbName: string;
}): Promise<MongoDataBase>;
