/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, PgType } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('challenges', {
    id: {
      type: PgType.UUID,
      primaryKey: true
    },
    description: {
      type: PgType.TEXT,
      notNull: true
    },
    game_id: {
      type: PgType.UUID,
      notNull: true,
      references: 'games'
    },
    target_level: {
      type: PgType.INTEGER,
      notNull: true
    },
    active: {
      type: PgType.BOOL,
      notNull: true,
      default: true
    }
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('challenges')
}
