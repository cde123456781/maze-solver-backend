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

const getRefreshJWTSecret = (): string => {
    if (process.env.REFRESH_JWT_SECRET) {
        return process.env.REFRESH_JWT_SECRET;
    } else {
        throw new Error('REFRESH_JWT_SECRET is not in .env');
    }
};

const getAccessJWTSecret = (): string => {
    if (process.env.ACCESS_JWT_SECRET) {
        return process.env.ACCESS_JWT_SECRET;
    } else {
        throw new Error('ACCESS_JWT_SECRET is not in .env');
    }
};

export { getAccessJWTSecret, getDatabaseName, getPort, getRefreshJWTSecret };
