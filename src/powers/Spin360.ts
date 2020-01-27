import PowerUp from './PowerUp';
import { Position } from '../types';

export default class Spin360 implements PowerUp {
    public readonly name = "360";
    public readonly desc = "Spin 360 Degrees over the duration of your turn";
    public render = (canvas: HTMLCanvasElement, posn: Position) => {
        
    }
}