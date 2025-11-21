/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PriorityQueue } from 'priority-queue-typescript';

import { InvalidMazeError, NoPathFoundError } from './pathfinderErrors.js';

class Node {
    public get col(): number {
        return this._col;
    }

    public set col(newCol: number) {
        this._col = newCol;
    }

    public get cost(): number {
        return this._cost;
    }

    public set cost(newCost: number) {
        this._cost = newCost;
    }

    public get count(): number {
        return this._count;
    }

    public set count(newCount: number) {
        this._count = newCount;
    }

    public get parent(): Node | null {
        return this._parent;
    }

    public set parent(parent: Node | null) {
        this._parent = parent;
    }

    public get row(): number {
        return this._row;
    }

    public set row(newRow: number) {
        this._row = newRow;
    }

    private _col: number;
    private _cost!: number;
    private _count: number;
    private _parent: Node | null;

    private _row: number;

    public constructor(
        row: number,
        col: number,
        parent: Node | null,
        count: number,
        cost?: number
    ) {
        this._row = row;
        this._col = col;
        this._parent = parent;
        this._count = count;
        if (cost == undefined) {
            this.cost = 0;
        } else {
            this.cost = cost;
        }
    }
}

class Pathfinder {
    public get currentBestCostMap(): Map<string, Node> {
        return this._currentBestCostMap;
    }

    public get goalNode(): Node {
        return this._goalNode;
    }

    public set goalNode(node: Node) {
        this._goalNode = node;
    }

    public get mazeArray(): string[][] {
        return this._mazeArray;
    }

    public set mazeArray(maze: string[][]) {
        this._mazeArray = maze;
    }

    public get nodesToCheck(): PriorityQueue<Node> {
        return this._nodesToCheck;
    }

    private _currentBestCostMap = new Map<string, Node>();
    private _goalNode!: Node;
    private _mazeArray!: string[][];
    private priorityQueueComparator = (a: Node, b: Node) => {
        const value =
            a.cost +
            this.calculateHeuristicCost(a) -
            (b.cost + this.calculateHeuristicCost(b));

        if (value == 0) {
            if (a.count < b.count) {
                return -1;
            } else {
                return 1;
            }
        }

        return value;
    };

    private _nodesToCheck = new PriorityQueue<Node>(10, (a: Node, b: Node) =>
        this.priorityQueueComparator(a, b)
    );

    private counter = 0;

    public constructor(mazeString: string, width: number, height: number) {
        let start: Node;
        [this.mazeArray, start, this.goalNode] = this.decodeMazeString(
            mazeString,
            width,
            height
        );
        this.nodesToCheck.add(start);
        this.currentBestCostMap.set([start.row, start.col].toString(), start);
    }

    public calculateHeuristicCost = (node: Node): number => {
        const row_distance = Math.abs(node.row - this.goalNode.row);
        const col_distance = Math.abs(node.col - this.goalNode.col);
        return row_distance + col_distance;
    };

    public encodeMazeString = (): string => {
        let returnString = '';
        this.mazeArray.forEach((element) => {
            element.forEach((value) => {
                returnString = returnString.concat(value);
            });
        });

        return returnString;
    };

    public getNeighbours = (node: Node): Node[] => {
        const neighbours: Node[] = [];

        if (node.col - 1 >= 0) {
            if (this.mazeArray[node.row][node.col - 1] != 'W') {
                neighbours.push(
                    new Node(
                        node.row,
                        node.col - 1,
                        node,
                        this.counter,
                        node.cost + 1
                    )
                );

                this.counter++;
            }
        }

        if (node.col + 1 < this.mazeArray[0].length) {
            if (this.mazeArray[node.row][node.col + 1] != 'W') {
                neighbours.push(
                    new Node(
                        node.row,
                        node.col + 1,
                        node,
                        this.counter,
                        node.cost + 1
                    )
                );
                this.counter++;
            }
        }

        if (node.row - 1 >= 0) {
            if (this.mazeArray[node.row - 1][node.col] != 'W') {
                neighbours.push(
                    new Node(
                        node.row - 1,
                        node.col,
                        node,
                        this.counter,
                        node.cost + 1
                    )
                );
            }
            this.counter++;
        }

        if (node.row + 1 < this.mazeArray.length) {
            if (this.mazeArray[node.row + 1][node.col] != 'W') {
                neighbours.push(
                    new Node(
                        node.row + 1,
                        node.col,
                        node,
                        this.counter,
                        node.cost + 1
                    )
                );
                this.counter++;
            }
        }

        return neighbours;
    };

    public getPath = (node: Node): Node[] => {
        const path: Node[] = [];
        let current = node;

        while (current.parent != null) {
            path.push(current);
            current = current.parent;
        }

        return path.reverse();
    };

    public isGoal = (node: Node): boolean => {
        return node.col == this.goalNode.col && node.row == this.goalNode.row;
    };

    public solve = (): string => {
        let path: Node[];
        let current: Node | null;

        while (!this.nodesToCheck.empty()) {
            current = this.nodesToCheck.poll();

            if (this.isGoal(current!)) {
                path = this.getPath(current!);
                this.updateMaze(path);
                return this.encodeMazeString();
            }

            const neighbours = this.getNeighbours(current!);

            neighbours.forEach((node) => {
                const keyString = [node.row, node.col].toString();

                if (!this.currentBestCostMap.has(keyString)) {
                    this.nodesToCheck.add(node);
                    this.currentBestCostMap.set(keyString, node);
                } else {
                    const recordedValue =
                        this.currentBestCostMap.get(keyString);

                    if (recordedValue!.cost > node.cost) {
                        this.currentBestCostMap.set(keyString, node);

                        let found = false;
                        for (const element of this.nodesToCheck) {
                            if (element === node) {
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            this.nodesToCheck.add(node);
                        }
                    }
                }
            });
        }

        throw new NoPathFoundError();
    };

    public updateMaze = (updatedNodes: Node[]): void => {
        updatedNodes.forEach((node) => {
            if (this.mazeArray[node.row][node.col] != 'F') {
                this.mazeArray[node.row][node.col] = 'P';
            }
        });
    };

    private decodeMazeString = function (
        mazeString: string,
        row: number,
        col: number
    ): [string[][], Node, Node] {
        const mazeArray: string[][] = [];
        let start!: Node;
        let finish!: Node;

        if (mazeString.length != row * col) {
            throw new InvalidMazeError(
                'mazeString does not fit the specified width and height'
            );
        } else if (!(mazeString.includes('S') && mazeString.includes('F'))) {
            throw new InvalidMazeError(
                'mazeString does not contain a start or finish'
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-spread
        if ([...mazeString].filter((i) => i === 'S').length > 1) {
            throw new InvalidMazeError('mazeString has more than one start');
            // eslint-disable-next-line @typescript-eslint/no-misused-spread
        } else if ([...mazeString].filter((i) => i === 'F').length > 1) {
            throw new InvalidMazeError('mazeString has more than one finish');
        }

        let currentCharIndex = 0;
        for (let i = 0; i < row; i++) {
            const rowArray: string[] = [];
            for (let j = 0; j < col; j++) {
                const char = mazeString.charAt(currentCharIndex);
                if (char == ' ' || char == 'S' || char == 'F' || char == 'W') {
                    rowArray.push(char);

                    if (char == 'S') {
                        start = new Node(i, j, null, 0);
                    } else if (char == 'F') {
                        finish = new Node(i, j, null, 0);
                    }
                } else {
                    throw new InvalidMazeError(
                        'mazeString contains an invalid character'
                    );
                }

                currentCharIndex += 1;
            }
            mazeArray.push(rowArray);
        }

        return [mazeArray, start, finish];
    };
}

export { Node, Pathfinder };
