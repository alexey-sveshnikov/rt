"use strict";

import {K} from 'es6-3d-primitives';

export class CheckerBoard {
    constructor(point, normal, color) {
        this.point = point;
        this.normal = normal;
        this.color = color;
    }
    hit(ray) {
        const distance = this.normal.dot(this.point.sub(ray.origin)) / ray.vector.dot(this.normal);

        const v = ray.vector.mul(distance - K);

        const point = ray.origin.add(v);

        if (! isFinite(distance) || distance < 0) {
            return;
        }

        if ((Math.ceil(point.x / 10) % 2 == 0) ^ (Math.ceil(point.z / 10) % 2 == 0)) {
            return;
        }
        return {
            distance: distance,
            normal: this.normal,
            hit_point: point,
        }
    }
}
