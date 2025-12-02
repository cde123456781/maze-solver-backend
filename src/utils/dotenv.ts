import 'dotenv/config';

const getPort = (): string => {
    if (process.env.PORT) {
        return process.env.PORT;
    } else {
        return '9001';
    }
};

const getDatabaseName = (): string => {
    if (process.env.DB_FILE_NAME) {
        return process.env.DB_FILE_NAME;
    } else {
        throw new Error('DB_FILE_NAME is not in .env');
    }
};

const getJWTSecret = (): string => {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    } else {
        throw new Error('JWT_SECRET is not in .env');
    }
};

export { getDatabaseName, getJWTSecret, getPort };
