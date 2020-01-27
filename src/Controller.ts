import { Unit } from './units';
import { FrameState, Position, Point } from './types';
import { isUnitContained, isPointerContained, angle, dist } from './util';

const FRAME_PER_TURN = 500;

interface UnitState {
    unit: Unit;
    state: FrameState;
}

export default class Controller {
    private isGrab: boolean = false;
    private guidedUnit?: Unit;
    public isExecuting: boolean = false;

    private translation: Point = { x: 0, y: 0 };
    public constructor(private canvas: HTMLCanvasElement, private onComplete: () => unknown) {}
    private _units: Unit[] = [];
    public get units(): Unit[] {
        return [...this._units];
    }

    public onMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>): void => {
        if (this.isExecuting) {
            this.isGrab = true;
            this.canvas.classList.add('grabbing');
            return;
        }
        const mouse: Point = { x: e.clientX, y: e.clientY };
        console.log(angle(this._units[0].pointerPosition!, this._units[0].position, mouse));
        const unit = this._units.find(u => isPointerContained(mouse, this.translation, u.pointerPosition));
        if (unit) {
            this.guidedUnit = unit;
        } else if (this._units.find(u => isUnitContained({ x: e.clientX, y: e.clientY }, this.translation, u))) {
            // check if we hit any units
            // not grabbing!
            this.isGrab = false;
            this.canvas.classList.remove('grabbing');
        } else {
            this.isGrab = true;
            this.canvas.classList.add('grabbing');
        }
    }

    public onMouseUp = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>): void => {
        if (this.isExecuting) {
            this.canvas.classList.remove('grabbing');
            this.isGrab = false;
            return;
        }
        this.guidedUnit = undefined;
        this.canvas.classList.remove('grabbing');
        this.canvas.classList.remove('normal');
        this.isGrab = false;
    }

    public onMouseMove = (e: React.MouseEvent): void => {
        if (this.isExecuting) {
            if (this.isGrab) {
                e.stopPropagation();
                // If this
                const ctx = this.canvas.getContext('2d')!
                // move canvas
                ctx.translate(e.movementX, e.movementY);
                this.translation.x += e.movementX;
                this.translation.y += e.movementY;
                window.requestAnimationFrame(this.rerender);
            }
            return;
        }
        // If we are mouse over ship, change class
        const pointerPosn = {
            x: e.clientX,
            y: e.clientY,
        };
        if (this.guidedUnit) {
            const horizontal: Point = {
                x: this.guidedUnit.position.x + this.guidedUnit.maxDist,
                y: this.guidedUnit.position.y,
            };
            this.guidedUnit.nextHeading = angle(horizontal, this.guidedUnit.position, {
                x: pointerPosn.x - this.translation.x,
                y: pointerPosn.y - this.translation.y,
            });
            this.guidedUnit.flyDist = dist({
                x: this.guidedUnit.position.x + this.translation.x,
                y: this.guidedUnit.position.y + this.translation.y,
            }, pointerPosn);
        } else if (this._units.find(u => isUnitContained(pointerPosn, this.translation, u))) {
            this.canvas.classList.add('pointing');
            this.canvas.classList.remove('normal');
        } else if (this._units.find(u => isPointerContained(pointerPosn, this.translation, u.pointerPosition))) {
            this.canvas.classList.remove('pointing');
            this.canvas.classList.add('normal');
        } else {
            this.canvas.classList.remove('pointing');
            this.canvas.classList.remove('normal');
        }
        if (!this.isGrab) {
            return;
        }
        
        e.stopPropagation();
        // If this
        const ctx = this.canvas.getContext('2d')!
        // move canvas
        ctx.translate(e.movementX, e.movementY);
        this.translation.x += e.movementX;
        this.translation.y += e.movementY;
        window.requestAnimationFrame(this.rerender);
    }

    public removeUnit = (unit: Unit|number): void => {
        if (typeof unit === 'number') {
            this._units = this._units.filter(u => u.id !== unit);
        } else {
            this._units = this._units.filter(u => u.id !== unit.id);
        }
    }
    public addUnit = (unit: Unit): void => {
        if (this._units.find(u => u.id === unit.id) === undefined) {
            this._units.push(unit);
        }
    }
    private clearCanvas = (): void => {
        const ctx = this.canvas.getContext('2d')!;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }
    public rerender = (): void => {
        // Clear the canvas
        this.clearCanvas();
        this._units.forEach(u => u.render());
    }
    public initialRender = (): void => {
        this._units.forEach(u => u.render({
            fireAt: [],
            health: 100,
            position: u.position,
        }));
        this.rerender();
    }
    public executeTurn = (): void => {
        // For each frame, we need to figure out:
        // 1. Where each unit will be
        // 2. What each unit's health will be
        // 3. What each unit is firing at
        // frameStates[frame] -> UnitState[]
        const frameStates: UnitState[][] = [];
        // To do this, we iterate over each frame first.
        // unitFramePaths[unit][frame] -> position
        const unitFramePaths: Position[][] = this._units.map(u => u.generatePath(FRAME_PER_TURN));
        for (let f = 0; f < FRAME_PER_TURN; ++f) {
            // We are looking in a single frame. Set the positions accordingly
            unitFramePaths.forEach((posns, i) => {
                this._units[i].position = posns[f];
            });
            // fires[source] -> targets[]
            const fires: Unit[][] = this._units.map(source => source.fireAt(this._units));
            
            const unitStates: UnitState[] = this._units.map((me: Unit, i: number): UnitState => {
                // Figure out who is firing at us
                let damage = 0;
                fires.forEach((targets, s) => {
                    // if any of the targets are me, reduce my health accordingly
                    if (targets.find(t => t.id === me.id)) {
                        damage += this._units[s].damage;
                    }
                });
                let currHealth = f === 0 ? this._units[i].health : frameStates[f - 1][i].state.health;
                return {
                    unit: me,
                    state: {
                        position: {...this._units[i].position},
                        fireAt: fires[i].map(u => u.position),
                        health: currHealth - damage,
                    }
                };
            });
            frameStates.push(unitStates);
        }
        let fInd = 0;
        const animator = (): void => {
            // Clear the canvas
            this.clearCanvas();
            // render everyone accordingly
            const unitStates: UnitState[] = frameStates[fInd];
            unitStates.forEach(us => us.unit.render(us.state));
            if (++fInd < FRAME_PER_TURN) {
                window.requestAnimationFrame(animator);
            } else {
                // Call completion function...?
                this.rerender();
                this.onComplete();
            }
        }
        window.requestAnimationFrame(animator);
    }
}