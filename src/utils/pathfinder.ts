const decodeMazeString = function (
    mazeString: string,
    width: number,
    height: number
): [string[][], number[], number[]] {
    const mazeArray: string[][] = [];
    let start: number[] = [];
    let finish: number[] = [];

    if (mazeString.length != height * width) {
        throw new Error(
            'mazeString does not fit the specified width and height'
        );
    } else if (!(mazeString.includes('S') && mazeString.includes('F'))) {
        throw new Error('mazeString does not contain a start or finish');
    }

    let currentCharIndex = 0;
    for (let i = 0; i < height; i++) {
        const rowArray: string[] = [];
        for (let j = 0; j < width; j++) {
            const char = mazeString.charAt(currentCharIndex);
            if (char == ' ' || char == 'S' || char == 'F' || char == 'W') {
                rowArray.push(char);

                if (char == 'S') {
                    start = [i, j];
                } else if (char == 'F') {
                    finish = [i, j];
                }
            } else {
                throw new Error('mazeString contains an invalid character');
            }

            currentCharIndex += 1;
        }
        mazeArray.push(rowArray);
    }

    return [mazeArray, start, finish];
};

const calculateHeuristicCost = function (
    node: number[],
    goal: number[]
): number {
    const node_x = node[0];
    const node_y = node[1];
    const goal_x = goal[0];
    const goal_y = goal[1];

    const x_distance = Math.abs(node_x - goal_x);
    const y_distance = Math.abs(node_y - goal_y);
    return x_distance + y_distance;
};

export { calculateHeuristicCost, decodeMazeString };
