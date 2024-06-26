/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, PgType } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    'progress',
    {
      game_id: {
        type: PgType.UUID,
        notNull: true,
        references: 'games'
      },
      user_address: {
        type: PgType.VARCHAR,
        notNull: true
      },
      level: {
        type: PgType.INT,
        notNull: true
      },
      score: {
        type: PgType.INT,
        notNull: true
      },
      data: {
        type: PgType.JSON,
        notNull: false
      },
      updated_at: {
        type: PgType.TIMESTAMP,
        default: pgm.func('now()')
      }
    },
    {
      constraints: {
        primaryKey: ['user_address', 'game_id']
      }
    }
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('progress')
}
