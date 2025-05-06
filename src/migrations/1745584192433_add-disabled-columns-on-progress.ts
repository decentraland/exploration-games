/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions = {
  disabled: { type: 'boolean', notNull: true, default: false }
}

const tableName = 'progress'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(tableName, shorthands)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, shorthands)
}
