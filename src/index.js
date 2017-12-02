"use strict";

import {Vector} from 'sylvester-es6';

require('./styles/styles.scss');
const slv = require('sylvester-es6');

let rootElement = document.getElementById('root');

class Point {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Plane {
    constructor(point, normal) {
        this.point = point;
        this.normal = normal;
    }
}

class Ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }
}

function testCanvas() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var canvasWidth = canvas.width;
    // That's how you define the value of a pixel //
    function drawPixel (x, y, r, g, b, a) {
        var index = (x + y * canvasWidth) * 4;

        canvasData.data[index + 0] = r;
        canvasData.data[index + 1] = g;
        canvasData.data[index + 2] = b;
        canvasData.data[index + 3] = a;
    }

    // That's how you update the canvas, so that your //
    // modification are taken in consideration //
    function updateCanvas() {
        ctx.putImageData(canvasData, 0, 0);
    }
    drawPixel(1, 1, 255, 0, 0, 255);
    drawPixel(1, 2, 255, 0, 0, 255);
    drawPixel(1, 3, 255, 0, 0, 255);
    updateCanvas();
}

document.addEventListener("DOMContentLoaded",function(){
    testCanvas();
});

