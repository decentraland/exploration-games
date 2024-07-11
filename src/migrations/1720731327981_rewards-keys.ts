import { MigrationBuilder, PgType } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('challenges', {
    campaign_key: {
      type: PgType.TEXT,
      notNull: true,
      default: ''
    }
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('challenges', ['campaign_key'])
}
