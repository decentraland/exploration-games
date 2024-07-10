import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint('progress', 'progress_pkey')
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint('progress', 'progress_pkey', {
    primaryKey: ['user_address', 'game_id']
  })
}
