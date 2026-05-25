import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationModule } from '../config/config.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.get('database');
        const isSqlite = db.type === 'sqlite';
        return {
          type: isSqlite ? 'better-sqlite3' : 'postgres',
          database: isSqlite ? db.path : db.database,
          host: isSqlite ? undefined : db.host,
          port: isSqlite ? undefined : db.port,
          username: isSqlite ? undefined : db.username,
          password: isSqlite ? undefined : db.password,
          entities: [__dirname + '/entities/*.entity{.ts,.js}'],
          synchronize: true,
          autoLoadEntities: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
