"use strict";
require('./styles/styles.scss');

import {Vector, Sphere, Plane, Point, Normal, Ray, Color} from 'es6-3d-primitives';

class CheckerBoard {
    constructor(point, normal, color) {
        this.point = point;
        this.normal = normal;
        this.color = color;
    }
    hit(ray) {
        const t = this.normal.dot(this.point.sub(ray.origin)) / ray.vector.dot(this.normal);

        const v = ray.vector.normalize().mul(t);

        const point = ray.origin.add(v);

        if (! isFinite(t) || t < 0) {
            return false;
        }

        if ((Math.ceil(point.x / 10) % 2 == 0) ^ (Math.ceil(point.z / 10) % 2 == 0)) {
           return false;
        }
        return true;
    }
}

function raytrace(scene, width, height, set_pixel_func) {
    const pixel_size = 1;
    const shiftX = width / 2 + 0.5;
    const shiftY = height / 2 + 0.5;

    const black = new Color(0, 0, 0);

    const cameraPosition = new Point(0, 50, 100);

    const viewField = Math.PI / 2;

    for (let y = 0; y <= height; y += 1) {
        for (let x = 0; x <= width; x++) {
            const dx = 1.0 * x / width - 0.5;
            const dy = 1.0 * y / height - 0.5;

            const ray = new Ray(
                cameraPosition,
                new Vector(
                    dx * viewField,
                    dy * viewField,
                    -1
                )
            );
            //console.log(`dy: ${dy}. ray to ${ray} (y: ${ray.vector.y})`);
            let color;
            for (const obj of scene) {
                if (obj.hit(ray)) {
                    //console.log(`Tracing ${x}x${y}, ray ${ray}: hit`);
                    color = obj.color;
                    break;
                } else {
                    color = black;
                    //console.log(`Tracing ${x}x${y}. dx: ${dx}, dy: ${dy},  ray ${ray}: miss`);
                    //set_pixel_func(x, y, black);
                }
            }
            //console.log(`Tracing ${x}x${y}. dx: ${dx}, dy: ${dy}, ray ${ray}. Color: ${color}`);
            set_pixel_func(x, y, color);
        }
    }
}


function render(canvas) {
    const scene = [
        new Sphere(new Point(0, 10, -50), 30, new Color(1, 1, 0)),
        new CheckerBoard(new Point(0, 0, 0), new Normal(0, 1, 0), new Color(1, 1, 1)),
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

    raytrace(scene, canvasWidth, canvasHeight, function(x, y, color) {
        //console.log(`Drawing at ${x} x ${y} : ${color.r * 255}, ${color.g * 255}, ${color.b * 255}`)
        drawPixel(x, canvasHeight - y, color.r * 255, color.g * 255, color.b * 255, 255);
    });
    updateCanvas();
}

function main() {
    var canvas = document.getElementById('canvas');
    render(canvas);
}

document.addEventListener("DOMContentLoaded", function(){
    main();
});

