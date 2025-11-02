/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { PinoLoggerService } from 'src/common/logger/pino.logger.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private db1: RedisClientType;
  private db2: RedisClientType;
  private db3: RedisClientType;

  constructor(private readonly logger: PinoLoggerService) {
    this.db1 = createClient({ url: process.env.REDIS_DB1_URL || 'redis://127.0.0.1:6379/0' });
    this.db2 = createClient({ url: process.env.REDIS_DB2_URL || 'redis://127.0.0.1:6379/1' });
    this.db3 = createClient({ url: process.env.REDIS_DB3_URL || 'redis://127.0.0.1:6379/2' });

    [this.db1, this.db2, this.db3].forEach((client, i) => {
      const dbIndex = i + 1;
      client.on('connect', () => {
        this.logger.log(`Redis DB${String(dbIndex)} connecting...`);
      });
      client.on('ready', () => {
        this.logger.log(`Redis DB${String(dbIndex)} connected`);
      });
      client.on('error', (err) => {
        this.logger.error(`Redis DB${String(dbIndex)} error:`, err.message);
      });
      client.on('end', () => {
        this.logger.log(`Redis DB${String(dbIndex)} connection closed`);
      });
      void client.connect();
    });
  }

  getClient(db: number): RedisClientType {
    switch (db) {
      case 1:
        return this.db1;
      case 2:
        return this.db2;
      case 3:
        return this.db3;
      default:
        throw new Error('Invalid DB index');
    }
  }

  async setData(db: number, key: string, value: any, ttlSeconds?: number): Promise<void> {
    const client = this.getClient(db);
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await client.set(key, val, { EX: ttlSeconds });
    } else {
      await client.set(key, val);
    }
  }

  async getData(db: number, key: string): Promise<any> {
    const client = this.getClient(db);
    const data = await client.get(key);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  async delKey(db: number, key: string): Promise<void> {
    const client = this.getClient(db);
    await client.del(key);
  }

  async flushAll(): Promise<void> {
    await Promise.all([this.db1.flushAll(), this.db2.flushAll(), this.db3.flushAll()]);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.db1.quit(), this.db2.quit(), this.db3.quit()]);
  }
}
