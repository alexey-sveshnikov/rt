"use strict";

export class CheckerBoard {
    constructor(point, normal, color) {
        this.point = point;
        this.normal = normal;
        this.color = color;
    }
    hit(ray) {
        const distance = this.normal.dot(this.point.sub(ray.origin)) / ray.vector.dot(this.normal);

        const v = ray.vector.normalize().mul(distance);

        const point = ray.origin.add(v);

        if (! isFinite(distance) || distance < 0) {
            return false;
        }

        if ((Math.ceil(point.x / 10) % 2 == 0) ^ (Math.ceil(point.z / 10) % 2 == 0)) {
            return false;
        }
        return distance;
    }
}
