import { sql } from 'drizzle-orm';
import { check, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const mazeTable = sqliteTable(
    'mazes',
    {
        id: int('id').primaryKey({ autoIncrement: true }),
        isPublic: int('is_public').notNull(),
        mazeString: text('maze_string').notNull(),
        solvedMazeString: text('solved_maze_string').notNull(),
        userId: int('user_id').references(() => userTable.id)
    },
    (table) => [
        check(
            'isPublic_check',
            sql`${table.isPublic} = 1 OR ${table.isPublic} = 0`
        )
    ]
);

const userTable = sqliteTable('user', {
    id: int('id').primaryKey({ autoIncrement: true }),
    password: text('password').notNull(),
    username: text('username').notNull().unique()
});

export { mazeTable, userTable };
