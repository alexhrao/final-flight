import Position from './Position';
import Point from './Point';

export default interface FrameState {
    position: Position;
    fireAt: Point[];
    health: number;
};