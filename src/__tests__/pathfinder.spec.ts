import { Node, Pathfinder } from '#utils/pathfinder.js';
import { describe, expect, it } from 'vitest';

describe('test mazeString function', () => {
    it('should convert mazeString to a valid nested array and return the start and finish positions', () => {
        const answerArray: string[][] = [
            ['S', ' ', ' '],
            [' ', ' ', 'F']
        ];
        const startCheck: Node = new Node(0, 0, null, 0);
        const finishCheck: Node = new Node(1, 2, null, 0);

        const pathfinder = new Pathfinder('S    F', 2, 3);

        expect(pathfinder.mazeArray).toStrictEqual(answerArray);
        expect(pathfinder.nodesToCheck.poll()).toStrictEqual(startCheck);
        expect(pathfinder.goalNode).toStrictEqual(finishCheck);
    });

    it('should throw an error if the mazeString does not contain a start or finish point', () => {
        expect(() => new Pathfinder('   F', 2, 2)).toThrowError(
            'mazeString does not contain a start or finish'
        );

        expect(() => new Pathfinder('S     ', 2, 3)).toThrowError(
            'mazeString does not contain a start or finish'
        );

        expect(() => new Pathfinder('      ', 2, 3)).toThrowError(
            'mazeString does not contain a start or finish'
        );
    });

    it('should throw an error if the length of the mazeString does not match the specified height and width', () => {
        expect(() => new Pathfinder('   F', 2, 9)).toThrowError(
            'mazeString does not fit the specified width and height'
        );
    });

    it('should throw an error if the mazeString contains an invalid character', () => {
        expect(() => new Pathfinder('7S F', 2, 2)).toThrowError(
            'mazeString contains an invalid character'
        );
    });

    it('should throw an error if the mazeString contains multiple start or finish nodes', () => {
        expect(() => new Pathfinder('7SSF', 2, 2)).toThrowError(
            'mazeString has more than one start'
        );

        expect(() => new Pathfinder('7SFF', 2, 2)).toThrowError(
            'mazeString has more than one finish'
        );
    });
});

describe('test calculateHeuristicCost function', () => {
    it('should calculate heuristic correctly', () => {
        const pathfinder: Pathfinder = new Pathfinder('S  F', 2, 2);
        expect(
            pathfinder.calculateHeuristicCost(new Node(0, 0, null, 0))
        ).toEqual(2);
        expect(
            pathfinder.calculateHeuristicCost(new Node(1, 0, null, 0))
        ).toEqual(1);
    });
});

describe('test isGoal method', () => {
    it('should be able to detect a goal node correctly', () => {
        const pathfinder1: Pathfinder = new Pathfinder('S  F', 2, 2);
        const pathfinder2: Pathfinder = new Pathfinder('S      F ', 3, 3);
        expect(pathfinder1.isGoal(new Node(1, 1, null, 0))).toEqual(true);
        expect(pathfinder2.isGoal(new Node(2, 1, null, 0))).toEqual(true);
    });

    it('should be able to detect when a node is not a goal node', () => {
        const pathfinder1: Pathfinder = new Pathfinder('S  F', 2, 2);
        const pathfinder2: Pathfinder = new Pathfinder('S      F ', 3, 3);
        expect(pathfinder1.isGoal(new Node(0, 1, null, 0))).toEqual(false);
        expect(pathfinder2.isGoal(new Node(1, 1, null, 0))).toEqual(false);
    });
});

describe('test getNeighbours method', () => {
    it('should be able to return a list of valid neighbour nodes', () => {
        const pathfinder1: Pathfinder = new Pathfinder('S  F', 2, 2);
        const pathfinder2: Pathfinder = new Pathfinder('S      F ', 3, 3);
        const neighbours1: Node[] = pathfinder1.getNeighbours(
            new Node(0, 0, null, 0)
        );
        const neighbours2: Node[] = pathfinder2.getNeighbours(
            new Node(1, 1, null, 0)
        );

        expect([
            neighbours1[0].row,
            neighbours1[0].col,
            neighbours1[1].row,
            neighbours1[1].col
        ]).toStrictEqual([0, 1, 1, 0]);

        const neighbours2Coordinates: number[] = [];
        neighbours2.forEach((element) => {
            neighbours2Coordinates.push(element.row);
            neighbours2Coordinates.push(element.col);
        });

        expect(neighbours2Coordinates).toStrictEqual([1, 0, 1, 2, 0, 1, 2, 1]);
    });
});

describe('test solve method', () => {
    it('should be able to solve a maze correctly', () => {
        const pathfinder1: Pathfinder = new Pathfinder('S W     W  F', 4, 3);
        const pathfinder2: Pathfinder = new Pathfinder('S W    WW  F', 4, 3);
        const pathfinder3: Pathfinder = new Pathfinder('F  WW     WW  S', 5, 3);

        expect(pathfinder1.solve()).toEqual('SPW P  PW PF');
        expect(pathfinder2.solve()).toEqual('S WP  PWWPPF');
        expect(pathfinder3.solve()).toEqual('FPPWWPPPPPWWPPS');
    });

    it('should return an empty string if maze is not solvable', () => {
        const pathfinder1: Pathfinder = new Pathfinder('S  WWW     F', 4, 3);
        const pathfinder2: Pathfinder = new Pathfinder('SWF', 1, 3);
        expect(pathfinder1.solve()).toEqual('');
        expect(pathfinder2.solve()).toEqual('');
    });
});
