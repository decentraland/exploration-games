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
      notNull: false
    },
    time: {
      type: PgType.INT,
      notNull: false
    },
    moves: {
      type: PgType.INT,
      notNull: false
    },
    score: {
      type: PgType.INT,
      notNull: false
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

  pgm.createIndex('progress', ['game_id', 'user_address'])
  pgm.createIndex('progress', ['game_id', 'user_address', 'updated_at'], { unique: true })

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

  pgm.createIndex('challenges', ['game_id'])

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
  pgm.dropTable('user_challenges')
  pgm.dropTable('challenges')
  pgm.dropTable('progress')
  pgm.dropTable('games')
}
