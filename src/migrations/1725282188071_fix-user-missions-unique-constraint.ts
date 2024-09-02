/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

const tableName = 'user_missions'

const oldColumns = ['user_address', 'mission_id', 'active']
const newColumns = ['user_address', 'mission_id']

const oldOptions = { unique: true }
const newOptions = { unique: true, where: 'active IS TRUE' }

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(tableName, oldColumns, oldOptions)
  pgm.createIndex(tableName, newColumns, newOptions)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex(tableName, oldColumns, oldOptions)
  pgm.dropIndex(tableName, newColumns, newOptions)
}
