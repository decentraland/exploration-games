/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex('progress', ['game_id', 'user_address', 'disabled'])
  pgm.createIndex('progress', ['game_id', 'disabled'])
  pgm.createIndex('progress', ['user_address', 'disabled'])
  pgm.createIndex('progress', ['game_id'])
  // Remove old index
  pgm.dropIndex('progress', ['game_id', 'user_address'])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('progress', ['game_id', 'user_address', 'disabled'])
  pgm.dropIndex('progress', ['game_id', 'disabled'])
  pgm.dropIndex('progress', ['user_address', 'disabled'])
  pgm.dropIndex('progress', ['game_id'])
  // Recover old index
  pgm.createIndex('progress', ['game_id', 'user_address'])
}
