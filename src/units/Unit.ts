import { PowerUp, powers as availablePowers } from "../powers";
import { Position, FrameState } from '../types';
import Team from "./Team";

export const POINTER_RADIUS = 10;

interface PowerCount {
    [index: string]: number;
};

export default abstract class Unit {
    public abstract readonly width: number;
    public abstract readonly height: number;
    public abstract readonly maxDist: number;
    public abstract readonly damage: number;

    protected abstract _flyDist: number;
    public abstract get flyDist(): number;
    public abstract set flyDist(dist: number);
    
    protected _nextHeading: number = 0;
    public abstract get nextHeading(): number;
    public abstract set nextHeading(head: number);

    protected _health: number = 100;
    public get health(): number {
        return this._health;
    }

    protected _team: Team = Team.RED;
    public get team(): Team {
        return this._team;
    }
    public set team(team: Team) {
        this._team = team;
    }

    protected _pointerPosition?: Position;
    public get pointerPosition(): Position|undefined {
        return this._pointerPosition;
    }

    private _isControllable: boolean = true;
    public get isControllable(): boolean {
        return this._isControllable;
    }
    public set isControllable(isC: boolean) {
        this._isControllable = isC;
    }
    
    public isVisible: boolean = false;
    protected _position: Position;
    public get position(): Position {
        return this._position;
    }
    public set position(position: Position) {
        this._position = position;
    }

    private _powers: PowerCount;
    public get powers(): PowerCount {
        return this._powers;
    }

    protected _selectedPower: PowerUp|undefined;
    public get selectedPower(): PowerUp|undefined {
        return this._selectedPower;
    }
    public set selectedPower(power: PowerUp|undefined) {
        if (power === undefined) {
            this._selectedPower = undefined;
            return;
        } else if (power.name === this._selectedPower?.name) {
            // Already done...
            return;
        } else if (this._powers[power.name] <= 0) {
            // Different one. Check that we can add
            return;
        }
        this._selectedPower = power;
    }

    public constructor(protected canvas: HTMLCanvasElement, public readonly id: number) {
        this._powers = {};
        availablePowers.forEach(p => {
            this._powers[p.name] = 0;
        });
        this._position = {
            x: 0,
            y: 0,
            heading: 0,
        };
    }

    public addPower = (power: PowerUp): void => {
        this._powers[power.name]++;
    }
    public drawPointer = (): void => {
        if (this._pointerPosition === undefined) {
            return;
        }
        const ctx = this.canvas.getContext('2d')!;
        ctx.beginPath();
        ctx.arc(
            this._pointerPosition.x + POINTER_RADIUS * Math.cos(this._pointerPosition.heading * Math.PI / 180),
            this._pointerPosition.y + POINTER_RADIUS * Math.sin(this._pointerPosition.heading * Math.PI / 180),
            POINTER_RADIUS, 0 * Math.PI, 2 * Math.PI);
        ctx.stroke();
    }

    public abstract render: (state?: FrameState) => void;
    public abstract generatePath: (numFrames: number) => Position[];
    public abstract fireAt: (posns: Unit[]) => Unit[];
}