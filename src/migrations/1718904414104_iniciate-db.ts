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
    active: {
      type: PgType.BOOL,
      notNull: true,
      default: true
    }
  })

  pgm.createTable('progress', {
    id: {
      type: PgType.UUID,
      primaryKey: true
    },
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
  })

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
    campaign_key: {
      type: PgType.TEXT,
      notNull: true,
      default: ''
    },
    active: {
      type: PgType.BOOL,
      notNull: true,
      default: true
    }
  })

  pgm.createTable(
    'user_challenges',
    {
      user_address: {
        type: PgType.VARCHAR,
        notNull: true
      },
      challenge_id: {
        type: PgType.UUID,
        notNull: true,
        references: 'challenges'
      }
    },
    {
      constraints: {
        primaryKey: ['user_address', 'challenge_id']
      }
    }
  )
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('games')
  pgm.dropTable('progress')
  pgm.dropTable('challenges')
}
