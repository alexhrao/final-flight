import Unit from "./Unit";
import { FrameState, Position } from '../types';
import { dist } from "../util";
import Controller from "../Controller";

export default class Looper extends Unit {
    private readonly range = 100;
    private readonly fireAngle = 60;
    public readonly maxDist = 500;
    public readonly width = 30;
    public readonly height = 10;

    protected _flyDist = 500;
    public get flyDist(): number {
        return this._flyDist;
    }
    public set flyDist(dist: number) {
        if (dist > this.maxDist) {
            this._flyDist = this.maxDist;
        } else if (dist < 0.25 * this.maxDist) {
            this._flyDist = 0.25 * this.maxDist;
        } else {
            this._flyDist = dist;
        }
        this.controller.rerender();
    }

    public get nextHeading(): number {
        return this._nextHeading;
    }
    public set nextHeading(head: number) {
        this._nextHeading = head;
        this.controller.rerender();
    }

    public constructor(canvas: HTMLCanvasElement, id: number, private controller: Controller) {
        super(canvas, id);
    }
    public readonly damage = 100;

    public generatePath = (numFrames: number): Position[] => {
        const out: Position[] = [];
        const distPerFrame = this._flyDist / numFrames;
        const posn: Position = {...this.position};
        posn.heading = (this.nextHeading);
        for (let f = 0; f < numFrames; ++f) {
            out.push({...posn});
            posn.x += distPerFrame * Math.cos(out[f].heading * Math.PI / 180);
            posn.y += distPerFrame * Math.sin(out[f].heading * Math.PI / 180);
        }
        return out;
    }
    public render = (frame?: FrameState): void => {
        const ctx = this.canvas.getContext('2d')!;
        const showMove = frame === undefined && this.isControllable;
        if (frame === undefined) {
            frame = {
                health: this._health,
                position: this.position,
                fireAt: [],
            };
        }
        this._health = frame.health;
        this.position = frame.position;
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.position.heading * Math.PI / 180);
        ctx.translate(-this.position.x, -this.position.y );
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(90 * Math.PI / 180);
        ctx.translate(-this.position.x, -this.position.y );
        ctx.beginPath();
            ctx.moveTo(this.position.x - this.width / 2, this.position.y + this.height / 2);
            ctx.lineTo(this.position.x + this.width / 2, this.position.y + this.height / 2);
            ctx.lineTo(this.position.x + this.width / 4, this.position.y - this.height / 2);
            ctx.lineTo(this.position.x - this.width / 4, this.position.y - this.height / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        // if the frame was undefined, we are allowed to move:
        if (showMove) {
            ctx.moveTo(this.position.x, this.position.y);
            // draw the line. Multiply range by relative heading
            const endX = this.position.x + this.flyDist * Math.cos(this.nextHeading * Math.PI / 180);
            const endY = this.position.y + this.flyDist * Math.sin(this.nextHeading * Math.PI / 180);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            // draw a circle at the end
            this._pointerPosition = {
                x: endX,
                y: endY,
                heading: this.nextHeading
            };
            this.drawPointer();
        }
        ctx.stroke();
        ctx.restore();
        // Draw the smoke

        // Are we firing at anybody? If so, draw the bullet and play the sound?
        frame.fireAt.forEach(p => {
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
    }
    public fireAt = (units: Unit[]): Unit[] => {
        // looper can only fire at one person, so find who is closest and engage if in range
        return units.filter(target => (
            // Not ourselves
            target.id !== this.id
                // Distance
                && dist(this.position, target.position) <= this.range
                // Find angle?
                && true
        ));
    }
}