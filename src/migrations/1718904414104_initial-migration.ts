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
    user_name: {
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
      type: PgType.BIGINT
    }
  })

  pgm.createIndex('progress', ['game_id', 'user_address'])
  pgm.createIndex('progress', ['game_id', 'user_address', 'updated_at'], { unique: true })

  pgm.createTable('missions', {
    id: {
      type: PgType.UUID,
      primaryKey: true
    },
    description: {
      type: PgType.TEXT,
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

  pgm.createTable('user_missions', {
    id: {
      type: PgType.UUID,
      primaryKey: true
    },
    user_address: {
      type: PgType.VARCHAR,
      notNull: true
    },
    mission_id: {
      type: PgType.UUID,
      notNull: true,
      references: 'missions'
    },
    start_time: {
      type: PgType.BIGINT
    },
    end_time: {
      type: PgType.BIGINT,
      notNull: false
    },
    active: {
      type: PgType.BOOL,
      notNull: true,
      default: true
    }
  })

  pgm.createIndex('user_missions', ['user_address', 'mission_id', 'active'], { unique: true })

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
    mission_id: {
      type: PgType.UUID,
      notNull: true,
      references: 'missions'
    },
    target_level: {
      type: PgType.INTEGER,
      notNull: true
    },
    data: {
      type: PgType.JSON,
      notNull: false
    },
    active: {
      type: PgType.BOOL,
      notNull: true,
      default: true
    }
  })

  pgm.createIndex('challenges', ['game_id', 'mission_id'])

  pgm.createTable('user_challenges', {
    id: {
      type: PgType.UUID,
      primaryKey: true
    },
    user_address: {
      type: PgType.VARCHAR,
      notNull: true
    },
    challenge_id: {
      type: PgType.UUID,
      notNull: true,
      references: 'challenges'
    },
    challenge_uncompleted: {
      type: PgType.BOOL,
      notNull: true,
      default: false
    }
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_challenges')
  pgm.dropTable('challenges')
  pgm.dropTable('user_missions')
  pgm.dropTable('missions')
  pgm.dropTable('progress')
  pgm.dropTable('games')
}
