import { sql } from 'drizzle-orm';
import { check, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const MIN_COLS = 2;
const MIN_ROWS = 2;
const MIN_MAZE_STRING = 4;
const MIN_MAZE_NAME = 1;
const MIN_USERNAME = 5;

const MAX_COLS = 30;
const MAX_ROWS = 30;
const MAX_MAZE_NAME = 30;
const MAX_USERNAME = 32;

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
            sql`LENGTH(${table.name}) >= ${sql.raw(MIN_MAZE_NAME.toString())} AND LENGTH(${table.name}) <= ${sql.raw(MAX_MAZE_NAME.toString())}`
        ),
        check(
            'cols_check',
            sql`${table.cols} >= ${sql.raw(MIN_COLS.toString())} AND ${table.cols} <= ${sql.raw(MAX_COLS.toString())}`
        ),
        check(
            'rows_check',
            sql`${table.rows} >= ${sql.raw(MIN_ROWS.toString())} AND ${table.rows} <= ${sql.raw(MAX_ROWS.toString())}`
        ),
        check(
            'maze_string_check',
            sql`LENGTH(${table.mazeString}) >= ${sql.raw(MIN_MAZE_STRING.toString())}`
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
            sql`LENGTH(${table.username}) >= ${sql.raw(MIN_USERNAME.toString())} AND LENGTH(${table.username}) <= ${sql.raw(MAX_USERNAME.toString())}`
        )
    ]
);

const blacklistTable = sqliteTable('blacklist', {
    id: int('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique()
});

export {
    blacklistTable,
    MAX_COLS,
    MAX_MAZE_NAME,
    MAX_ROWS,
    MAX_USERNAME,
    mazeTable,
    MIN_COLS,
    MIN_MAZE_NAME,
    MIN_MAZE_STRING,
    MIN_ROWS,
    MIN_USERNAME,
    userTable
};
