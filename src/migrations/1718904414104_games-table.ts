/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, PgType } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('games', {
    id: {
      type: PgType.UUID,
      primaryKey: true
    },
    name: {
      type: PgType.VARCHAR,
      notNull: true
    },
    parcel: {
      type: PgType.VARCHAR,
      notNull: true
    },
    max_levels: {
      type: PgType.INT,
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
  pgm.dropTable('games')
}
