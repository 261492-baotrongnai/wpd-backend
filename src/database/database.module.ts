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
        // Ensure migrations are discovered both in TS (dev) and JS (prod)
        migrations: [
          __dirname + '/migrations/*{.ts,.js}',
          __dirname + '/../database/migrations/*{.ts,.js}',
        ],
        autoLoadEntities: true,
        // In local development we keep synchronize enabled for convenience
        synchronize: configService.get('NODE_ENV') === 'development',
        // In non-development environments, automatically run pending migrations on app start
        migrationsRun: configService.get('NODE_ENV') !== 'development',
        timezone: '+07:00',
        ssl: {
          rejectUnauthorized: false,
        },
        connectTimeout: 60000,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {
  constructor() {
    // if data source is okay console.log
    console.log('Database connection established');
  }
}
