import { Position } from "../types";

export default interface PowerUp {
    readonly name: string;
    readonly desc: string;
    render: (ref: HTMLCanvasElement, posn: Position) => void;
};