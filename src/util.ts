import { Point, Position } from "./types"
import { Unit, POINTER_RADIUS } from "./units";

export function dist(a: Point, b: Point) {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
};

export function angle(a: Point, b: Point, c: Point): number {
    const ba = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    const bc = Math.sqrt((b.x - c.x) ** 2 + (b.y - c.y) ** 2);
    const ac = Math.sqrt((a.x - c.x) ** 2 + (a.y - c.y) ** 2);
    const out = Math.acos(((ba ** 2) + (bc ** 2) - (ac ** 2)) / (2 * ba * bc)) * 180 / Math.PI;
    return c.y > b.y ? out : -out;
}

export function isUnitContained(mouseLocation: Point, netTranslate: Point, unit: Unit): boolean {
    const netUnitLocation: Point = {
        x: unit.position.x + netTranslate.x,
        y: unit.position.y + netTranslate.y,
    };
    // has to be within height and width
    return mouseLocation.x >= (netUnitLocation.x - unit.width / 2)
        && mouseLocation.x <= (netUnitLocation.x + unit.width / 2)
        && mouseLocation.y >= (netUnitLocation.y - unit.height / 2)
        && mouseLocation.y <= (netUnitLocation.y + unit.height / 2);
}

export function isPointerContained(mouseLocation: Point, netTranslate: Point, pointerPosn?: Position): boolean {
    if (pointerPosn === undefined) {
        return false;
    }
    const netPointerPosn: Point = {
        x: pointerPosn.x + netTranslate.x + POINTER_RADIUS * Math.cos(pointerPosn.heading * Math.PI / 180),
        y: pointerPosn.y + netTranslate.y + POINTER_RADIUS * Math.sin(pointerPosn.heading * Math.PI / 180),
    };
    //console.log(netPointerPosn);
    // distance to pointerPosn must be less than radius
    return dist(netPointerPosn, mouseLocation) < POINTER_RADIUS;
}