import {
    MAX_COLS,
    MAX_MAZE_NAME,
    MAX_ROWS,
    MAX_USERNAME,
    MIN_COLS,
    MIN_MAZE_NAME,
    MIN_MAZE_STRING,
    MIN_ROWS,
    MIN_USERNAME
} from '#utils/constants.js';
import { sql } from 'drizzle-orm';
import { check, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const mazeTable = sqliteTable(
    'mazes',
    {
        cols: int('cols').notNull(),
        id: int('id').primaryKey({ autoIncrement: true }),
        isPublic: int('is_public').notNull(),
        mazeString: text('maze_string').notNull(),
        name: text('name').notNull(),
        rows: int('rows').notNull(),
        solvedMazeString: text('solved_maze_string').notNull(),
        userId: int('user_id')
            .notNull()
            .references(() => userTable.id, {
                onDelete: 'cascade'
            })
    },
    (table) => [
        check(
            'isPublic_check',
            sql`${table.isPublic} = 1 OR ${table.isPublic} = 0`
        ),
        check(
            'name_check',
            sql`LENGTH(${table.name}) >= ${MIN_MAZE_NAME} AND LENGTH(${table.name}) <= ${MAX_MAZE_NAME}`
        ),
        check(
            'cols_check',
            sql`${table.cols} >= ${MIN_COLS} AND ${table.cols} <= ${MAX_COLS}`
        ),
        check(
            'rows_check',
            sql`${table.rows} >= ${MIN_ROWS} AND ${table.rows} <= ${MAX_ROWS}`
        ),
        check(
            'maze_string_check',
            sql`LENGTH(${table.mazeString}) >= ${MIN_MAZE_STRING}`
        )
    ]
);

const userTable = sqliteTable(
    'user',
    {
        id: int('id').primaryKey({ autoIncrement: true }),
        password: text('password').notNull(),
        username: text('username').notNull().unique()
    },
    (table) => [
        check(
            'username_check',
            sql`LENGTH(${table.username}) >= ${MIN_USERNAME} AND LENGTH(${table.username}) <= ${MAX_USERNAME}`
        )
    ]
);

const blacklistTable = sqliteTable('blacklist', {
    id: int('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique()
});

export { blacklistTable, mazeTable, userTable };
