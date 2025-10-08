import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow('MYSQL_HOST'),
        port: configService.getOrThrow('MYSQL_PORT'),
        username: configService.getOrThrow('MYSQL_USER'),
        password: configService.getOrThrow('MYSQL_PASSWORD'),
        database: configService.getOrThrow('MYSQL_DATABASE'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [
          __dirname + '/migrations/*{.ts,.js}',
          __dirname + '/../database/migrations/*{.ts,.js}',
        ],
        autoLoadEntities: true,
        synchronize: true,
        migrationsRun: configService.get('NODE_ENV') !== 'development',
        timezone: '+07:00',
        ssl: {
          rejectUnauthorized: false,
        },

        // Connection timeout settings
        connectTimeout: 60000, // 60 seconds for initial connection
        acquireTimeout: 60000, // 60 seconds to acquire connection from pool
        timeout: 60000, // 60 seconds for query execution

        // Connection pool settings for remote MySQL
        extra: {
          connectionLimit: 10, // Max connections in pool
          connectTimeout: 60000, // MySQL driver connection timeout (milliseconds)
          acquireTimeout: 60000, // Time to wait for connection from pool
          waitForConnections: true, // Queue requests when pool exhausted
          queueLimit: 0, // Unlimited queue
          enableKeepAlive: true, // Keep TCP connection alive (important for remote connections)
          keepAliveInitialDelay: 10000, // Start keep-alive after 10 seconds
          // TCP settings for remote connections
          socketPath: undefined, // Ensure TCP is used, not Unix socket
        },

        // Retry logic for connection failures
        retryAttempts: 10, // Retry 10 times
        retryDelay: 5000, // 5 seconds between retries (longer for remote server)

        // Connection pooling
        poolSize: 10, // Number of connections to maintain

        // Query timeout
        maxQueryExecutionTime: 30000, // Log slow queries over 30 seconds

        // Logging
        logging:
          configService.get('NODE_ENV') === 'development'
            ? ['error', 'warn', 'migration', 'schema']
            : ['error', 'warn'],

        // Character set (important for remote connections)
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {
  constructor() {
    console.log('Database connection established');
  }
}
