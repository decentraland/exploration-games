/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, PgType } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    'user_challenges',
    {
      user_address: {
        type: PgType.VARCHAR,
        notNull: true
      },
      challenge_id: {
        type: PgType.UUID,
        notNull: true,
        references: 'challenges'
      }
    },
    {
      constraints: {
        primaryKey: ['user_address', 'challenge_id']
      }
    }
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_challenges')
}
