import { calculateHeuristicCost, decodeMazeString } from '#utils/pathfinder.js';
import { describe, expect, it } from 'vitest';

describe('test mazeString function', () => {
    it('should convert mazeString to a valid nested array and return the start and finish positions', () => {
        const answerArray: string[][] = [
            ['S', ' '],
            [' ', 'F']
        ];
        const startCheck: number[] = [0, 0];
        const finishCheck: number[] = [1, 1];

        const [testArray, start, finish] = decodeMazeString('S  F', 2, 2);

        expect(testArray).toStrictEqual(answerArray);
        expect(start).toStrictEqual(startCheck);
        expect(finish).toStrictEqual(finishCheck);
    });

    it('should throw an error if the mazeString does not contain a start or finish point', () => {
        expect(() => decodeMazeString('   F', 2, 2)).toThrowError(
            'mazeString does not contain a start or finish'
        );

        expect(() => decodeMazeString('S     ', 2, 3)).toThrowError(
            'mazeString does not contain a start or finish'
        );

        expect(() => decodeMazeString('      ', 2, 3)).toThrowError(
            'mazeString does not contain a start or finish'
        );
    });

    it('should throw an error if the length of the mazeString does not match the specified height and width', () => {
        expect(() => decodeMazeString('   F', 2, 9)).toThrowError(
            'mazeString does not fit the specified width and height'
        );
    });

    it('should throw an error if the mazeString contains an invalid character', () => {
        expect(() => decodeMazeString('7S F', 2, 2)).toThrowError(
            'mazeString contains an invalid character'
        );
    });
});

describe('test calculateHeuristicCost function', () => {
    it('should calculate heuristic correctly', () => {
        expect(calculateHeuristicCost([1, 2], [4, 8])).toEqual(9);
        expect(calculateHeuristicCost([6, 4], [1, 3])).toEqual(6);
    });
});
