/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, PgType } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('progress', {
    game_id: {
      type: PgType.UUID,
      notNull: true
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
  })
  pgm.createIndex('progress', ['game_id', 'user_address'], { unique: true, name: 'user_progress_idx' })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('progress')
}
