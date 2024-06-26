/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, PgType } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('user_challenges', {
    user_address: {
      type: PgType.VARCHAR,
      notNull: true
    },
    challenge_id: {
      type: PgType.UUID,
      notNull: true
    }
  })

  pgm.createIndex('user_challenges', ['user_address', 'challenge_id'], { unique: true })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_challenges')
}
