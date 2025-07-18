/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex('user_challenges', ['user_address', 'challenge_id'])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('user_challenges', ['user_address', 'challenge_id'])
}
