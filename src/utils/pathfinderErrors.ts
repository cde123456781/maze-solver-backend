class InvalidMazeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidMazeError';
    }
}

class NoPathFoundError extends Error {
    constructor() {
        super('No Path Found');
        this.name = 'NoPathFoundError';
    }
}

export { InvalidMazeError, NoPathFoundError };
