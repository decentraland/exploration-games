import { MigrationBuilder, ColumnDefinitions, PgType } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('progress', {
    level: {
      type: PgType.INT,
      notNull: true,
      default: 1
    }
  })
  pgm.addColumn('challenges', {
    target_level: {
      type: PgType.INTEGER,
      notNull: true,
      default: 1
    }
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('progress', ['level'])
  pgm.dropColumns('challenges', ['target_level'])
}
