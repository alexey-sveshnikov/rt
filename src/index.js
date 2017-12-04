"use strict";
require('./styles/styles.scss');

import {Vector, Sphere, Plane, Point, Normal, Ray} from 'es6-3d-primitives';

function raytrace(scene, width, height, set_pixel_func) {
    const shiftX = width / 2;
    const shiftY = height / 2;

    for (let x = 0; x <= width; x++) {
        for (let y = 0; y <= height; y += 1) {
            const ray = new Ray(new Point(x - shiftX, y - shiftY, 0), new Vector(0, 0, -1));
            for (const obj of scene) {
                if (obj.hit(ray)) {
                    //console.log(`Tracing ${x}x${y}, ray ${ray}: hit`);
                    set_pixel_func(x, y, 255, 255, 255, 0);
                } else {
                    //console.log(`Tracing ${x}x${y}, ray ${ray}: miss`);
                    set_pixel_func(x, y, 0, 0, 0, 0);
                }
            }
        }
    }
}


function render(canvas) {
    const scene = [
        new Sphere(new Point(0, 0, 100), 30),
    ];

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    console.log(`Rendering to canvas ${canvasWidth}x${canvasHeight}`);

    var ctx = canvas.getContext('2d');
    var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

    function drawPixel (x, y, r, g, b, a) {
        var index = (x + y * canvasWidth) * 4;

        canvasData.data[index + 0] = r;
        canvasData.data[index + 1] = g;
        canvasData.data[index + 2] = b;
        canvasData.data[index + 3] = a;
    }

    function updateCanvas() {
        ctx.putImageData(canvasData, 0, 0);
    }

    raytrace(scene, canvasWidth, canvasHeight, function(x, y, r, g, b) {
        drawPixel(x, y, r, g, b, 255);
    });
    updateCanvas();
}

function main() {
    var canvas = document.getElementById('canvas');
    render(canvas);
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
    main();
});

