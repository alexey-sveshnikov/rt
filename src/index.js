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
        return t;
    }
}

function raytrace(scene, width, height, set_pixel_func) {
    const shiftX = width / 2 + 0.5;
    const shiftY = height / 2 + 0.5;

    const background = new Color(0.1, 0.1, 0.15);

    const cameraPosition = new Point(0.001, 50.001, 400.001);

    const pixel_size = 0.4;
    const aspectRatio = width / height;

    for (let y = 0; y <= height; y += 1) {
        for (let x = 0; x <= width; x++) {

            const viewPanePoint = new Point(
                (x - shiftX) * pixel_size,
                (y - shiftY) * pixel_size,
                -300
            );
            const dir = viewPanePoint.sub(cameraPosition).normalize();

            let samples = [];
            const sample_count = 25;
            for (let n = 0; n < sample_count; n += 1) {
                const ray = new Ray(
                    new Point(
                        cameraPosition.x + Math.random() * 0.15,
                        cameraPosition.y + Math.random() * 0.15,
                        cameraPosition.z + Math.random() * 0.2
                    ),
                    dir
                );
                //console.log(`dy: ${dy}. ray to ${ray} (y: ${ray.vector.y})`);
                let nearest_object_color = background;
                let nearest_object_distance = Infinity;
                for (const obj of scene) {
                    const distance = obj.hit(ray);
                    if (distance != false && distance < nearest_object_distance) {
                        nearest_object_distance = distance;
                        nearest_object_color = obj.color;
                    }
                }
                samples.push(nearest_object_color);
            }
            let result = new Color(0, 0, 0);
            for (let color of samples) {
                result = result.add(color);
            }
            result = result.mul(1/sample_count);
            //console.log(`Tracing ${x}x${y}. dx: ${dx}, dy: ${dy}, ray ${ray}. Color: ${color}`);
            set_pixel_func(x, y, result);
        }
    }
}

function render(canvas) {
    const scene = [
        new Sphere(new Point(0, 50, 400), 1000, new Color(0.1, 0.1, 0.15)),
    ];


    const rate = 20;
    for (let i = 0.1; i < 5.2; i += 0.17) {
        const x = i * rate * Math.cos(Math.PI * i);
        const y = i * rate * Math.sin(Math.PI * i);

        console.log(`New sphere at ${x}, ${y}`);
        scene.push(
            new Sphere(new Point(x, y + 70, 15), i, new Color(1, 0, 0))
        )
    }

    // scene.push(
    //     new Sphere(new Point(0, 30, 0), 30, new Color(1, 1, 0))
    // );
    scene.push(
        new CheckerBoard(new Point(0, 0, 0), new Normal(0, 1, 0), new Color(1, 1, 1))
    );


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

