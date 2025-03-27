/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions, PgType } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

const tableName = 'missions'
const columnName = 'thumb_url'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(tableName, {
    [columnName]: {
      type: PgType.TEXT,
      notNull: true,
      default: 'http://placeholderURL.com'
    }
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, columnName)
}
