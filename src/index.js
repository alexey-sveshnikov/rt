"use strict";
require('./styles/styles.scss');

import {Vector, Sphere, Plane, Point, Normal, Ray, Color} from 'es6-3d-primitives';
import {CheckerBoard} from './objects/checkerboard'

class Light {
    constructor(origin, color) {
        this.origin = origin;
        this.color = color;
    }
}


function *primeRays(width, height, viewPaneDistance, pixelSize, cameraPosition) {
    const shiftX = width / 2 + 0.5;
    const shiftY = height / 2 + 0.5;

    for (let y = 0; y <= height; y += 1) {
        for (let x = 0; x <= width; x++) {
            const viewPanePoint = new Point(
                (x - shiftX) * pixelSize,
                (y - shiftY) * pixelSize,
                -viewPaneDistance
            );
            const direction = viewPanePoint.sub(cameraPosition).normalize();

            yield {
                displayX: x,
                displayY: y,
                ray: new Ray(
                    new Point(
                        cameraPosition.x, // + Math.random() * 0.05,
                        cameraPosition.y, // + Math.random() * 0.05,
                        cameraPosition.z, // + Math.random() * 0.01
                    ),
                    direction
                )
            }
        }
    }
}

function rayTrace(ray, scene) {
    let nearest_object_distance = Infinity;
    let nearest_object;
    for (const obj of scene.objects) {
        const distance = obj.hit(ray);
        if (distance !== false && distance < nearest_object_distance) {
            nearest_object_distance = distance;
            nearest_object = obj;
        }
    }

    if (nearest_object_distance > scene.horizonDistance) {
        return {
            distance: Infinity,
            color: scene.backgroundColor,
        }
    }

    if (nearest_object !== undefined) {
        const hit_point = ray.origin.add(ray.vector.normalize().mul(nearest_object_distance - 0.001));
        // console.log(`We hit an object ${nearest_object} at distance ${nearest_object_distance}, hit point ${hit_point}`);

        let color = nearest_object.color;

        for (const light of scene.lights) {
            const direction = light.origin.sub(hit_point);
            const ray = new Ray(hit_point, direction.normalize());
            const light_distance = light.origin.distance(hit_point);

            let visible = true;

            for (const obj of scene.objects) {
                // console.log(`Tracing secondary ray ${ray}`);
                const d = obj.hit(ray);
                if (d !== false && d < light_distance) {
                    visible = false;
                    break;
                }
            }

            if (visible) {
                // console.log(`adding color: ${color} + ${light.color}`);
                color = color.add(light.color);
                // console.log(`result: ${color}`);
            }
        }
        return {
            distance: nearest_object_distance,
            color: color,
        }
    } else {
        return {
            distance: Infinity,
            color: scene.backgroundColor,
        }
    }
}


function render(scene, width, height, primeRaysGen, setPixelFunc) {

    const pixelSize = 0.4;

    for (const {displayX, displayY, ray} of primeRaysGen(width, height, scene.viewPaneDistance, pixelSize, scene.cameraPosition)) {
        let samples = [];
        const sample_count = 1;
        for (let n = 0; n < sample_count; n += 1) {
            const {color} = rayTrace(ray, scene);
            samples.push(color);
        }
        let result = new Color(0, 0, 0);
        for (let color of samples) {
            if (color === undefined) {
                result = result.add(background);
            } else {
                result = result.add(color);
            }
        }
        result = result.mul(1/sample_count);
        //console.log(`Tracing ${x}x${y}. dx: ${dx}, dy: ${dy}, ray ${ray}. Color: ${color}`);
        setPixelFunc(displayX, displayY, result);
    }
}

function getScene(name) {
    switch(name) {
        case 'test':
            return {
                objects: [
                    new Sphere(new Point(0, 0, 0), 10, new Color(0.1, 0.1, 0.1)),
                ],
                lights: [
                    new Light(new Point(300, 0, 0), new Color(0, 0, 1)),
                ],
                backgroundColor: new Color(0.1, 0.1, 0.13),
                cameraPosition: new Point(0, 0, 50),
                viewPaneDistance: 40,
                horizonDistance: Infinity,
            };
            break;
        default:
            let scene = [
                // new Sphere(new Point(0, 50, 400), 1000, new Color(0.1, 0.1, 0.15)),
            ];

            const rate = 13;
            for (let i = 0.1; i < 5.2; i += Math.random() * 0.05 + 0.12) {
                const x = i * rate * Math.cos(Math.PI * i);
                const y = i * rate * Math.sin(Math.PI * i);

                scene.push(
                    new Sphere(
                        new Point(x, y + 35, 15),
                        i,
                        new Color(
                            Math.cos(Math.PI * i * 0.08) * 0.8 + 0.2,
                            0.1,
                            0.1
                        )
                    )
                )
            }

            scene.push(
                new CheckerBoard(new Point(0, 0, 0), new Normal(0, 1, 0), new Color(1, 1, 1))
            );

            let lights = [
                new Light(new Point(300, 50, 0), new Color(0, 0, 1)),
            ];

            return {
                objects: scene,
                lights: lights,
                backgroundColor: new Color(0.1, 0.1, 0.15),
                cameraPosition: new Point(0, 50, 400),
                viewPaneDistance: 300,
                horizonDistance: 1000,
            };
    }
}

function main() {
    var canvas = document.getElementById('canvas');

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    console.log(`Rendering to canvas ${canvasWidth}x${canvasHeight}`);

    var ctx = canvas.getContext('2d');
    var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

    function drawPixel (x, y, r, g, b, a) {
        const index = (x + y * canvasWidth) * 4;

        canvasData.data[index + 0] = r;
        canvasData.data[index + 1] = g;
        canvasData.data[index + 2] = b;
        canvasData.data[index + 3] = a;
    }

    function updateCanvas() {
        ctx.putImageData(canvasData, 0, 0);
    }

    let scene_name = window.location.search.substr(1);
    if (!scene_name) {
        scene_name = 'default';
    }

    render(getScene(scene_name), canvasWidth, canvasHeight, primeRays, function(x, y, color) {
        //console.log(`Drawing at ${x} x ${y} : ${color.r * 255}, ${color.g * 255}, ${color.b * 255}`)
        drawPixel(x, canvasHeight - y, color.r * 255, color.g * 255, color.b * 255, 255);
        // if (y % 100 == 0 && x == 0) {
        //     updateCanvas();
        // }
    });
    updateCanvas();
}

document.addEventListener("DOMContentLoaded", function(){
    main();
});

