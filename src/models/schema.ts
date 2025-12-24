import { sql } from 'drizzle-orm';
import { check, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const mazeTable = sqliteTable(
    'mazes',
    {
        id: int('id').primaryKey({ autoIncrement: true }),
        isPublic: int('is_public').notNull(),
        mazeString: text('maze_string').notNull(),
        name: text('name').notNull(),
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
            sql`LENGTH(${table.name}) >= 1 AND LENGTH(${table.name}) <= 30`
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
            sql`LENGTH(${table.username}) >= 5 AND LENGTH(${table.username}) <= 32`
        )
    ]
);

const blacklistTable = sqliteTable('blacklist', {
    id: int('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique()
});

export { blacklistTable, mazeTable, userTable };
