import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables (supports running from project root)
dotenv.config({ path: resolve(process.cwd(), '.env') });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST as string,
  port: Number(process.env.MYSQL_PORT || 3306),
  username: process.env.MYSQL_USER as string,
  password: process.env.MYSQL_PASSWORD as string,
  database: process.env.MYSQL_DATABASE as string,
  entities: [resolve(__dirname, '..', '**/*.entity{.ts,.js}')],
  migrations: [
    resolve(__dirname, 'migrations/*{.ts,.js}'),
    resolve(__dirname, '..', 'database', 'migrations/*{.ts,.js}'),
  ],
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
  timezone: '+07:00',
});

export default AppDataSource;
