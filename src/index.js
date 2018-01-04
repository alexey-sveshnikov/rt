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


function *primeRays(width, height, scene) {
    const viewPaneSegment = 2 * scene.viewPaneDistance * Math.tan(scene.cameraAngle);
    const pixelSize = viewPaneSegment / width;

    const shiftX = width / 2 + 0.5;
    const shiftY = height / 2 + 0.5;

    for (let y = 0; y <= height; y += 1) {
        for (let x = 0; x <= width; x++) {
            const viewPanePoint = new Point(
                (x - shiftX) * pixelSize,
                (y - shiftY) * pixelSize,
                -scene.viewPaneDistance
            );
            const direction = viewPanePoint.sub(scene.cameraPosition).normalize();

            yield {
                displayX: x,
                displayY: y,
                ray: new Ray(
                    new Point(
                        scene.cameraPosition.x, // + Math.random() * 0.05,
                        scene.cameraPosition.y, // + Math.random() * 0.05,
                        scene.cameraPosition.z, // + Math.random() * 0.01
                    ),
                    direction
                )
            }
        }
    }
}

function rayTrace(ray, scene) {
    let nearest_hit;
    let nearest_object;
    let nearest_object_distance = Infinity;

    for (const obj of scene.objects) {
        const result = obj.hit(ray);
        if (result !== undefined) {
            if (result.distance < nearest_object_distance) {
                nearest_object = obj;
                nearest_hit = result;
            }
        }
    }

    if (nearest_object !== undefined) {
        // console.log('We\'ve got a hit!', nearest_hit);
        if (nearest_hit.distance > scene.horizonDistance) {
            return {
                distance: Infinity,
                color: scene.backgroundColor,
            }
        }

        // console.log(`We hit an object ${nearest_object} at distance ${nearest_object_distance}, hit point ${hit_point}`);

        let color = nearest_object.color;

        for (const light of scene.lights) {
            const direction = light.origin.sub(nearest_hit.hit_point);
            const ray = new Ray(nearest_hit.hit_point, direction.normalize());
            const light_distance = light.origin.distance(nearest_hit.hit_point);

            // console.log('Emitting ray', ray);

            let visible = true;

            for (const obj of scene.objects) {
                // console.log(`Tracing secondary ray ${ray}`);
                const result = obj.hit(ray);
                if (result !== undefined) {
                    // console.log('Light ray was stopped!', result);
                    const d = result.distance;
                    if (d < light_distance) {
                        visible = false;
                        break;
                    }
                }
            }

            if (visible) {
                // console.count('Light is visible!');
                // console.log(`adding color: ${color} + ${light.color}`);
                const lambert_coeff = nearest_hit.normal.dot(ray.vector) * 0.05;
                const new_color = light.color.mul(lambert_coeff);
                // console.log(`Hit point normal: ${nearest_hit.normal}, lambert coeff: ${lambert_coeff}; color: ${light.color} -> ${new_color}`);
                color = color.add(new_color);
                // console.log(`result: ${color}`);
            } else {
                // console.count('Light is NOT visible!');
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


    for (const {displayX, displayY, ray} of primeRaysGen(width, height, scene)) {
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
                    new CheckerBoard(new Point(0, 0, 0), new Normal(0, 1, 0), new Color(1, 1, 1)),
                    new Sphere(new Point(0, 30, 0), 50, new Color(0.1, 0.1, 0.1)),
                ],
                lights: [
                    new Light(new Point(300, 0, 0), new Color(0, 0, 1)),
                ],
                backgroundColor: new Color(0.1, 0.1, 0.13),
                cameraPosition: new Point(0, 30, 200),
                cameraAngle: 45 * (Math.PI / 180),
                viewPaneDistance: 300,
                horizonDistance: 800,
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
                            Math.cos(Math.PI * i * 0.08) * 0.4 + 0.2,
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
                new Light(new Point(300, 100, 100), new Color(0, 0, 1)),
            ];

            return {
                objects: scene,
                lights: lights,
                backgroundColor: new Color(0.1, 0.1, 0.15),
                cameraPosition: new Point(0, 50, 250),
                cameraAngle: 45 * (Math.PI / 180),
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

    const time_started = performance.now();

    render(getScene(scene_name), canvasWidth, canvasHeight, primeRays, function(x, y, color) {
        //console.log(`Drawing at ${x} x ${y} : ${color.r * 255}, ${color.g * 255}, ${color.b * 255}`)
        drawPixel(x, canvasHeight - y, color.r * 255, color.g * 255, color.b * 255, 255);
        // if (y % 100 == 0 && x == 0) {
        //     updateCanvas();
        // }
    });
    updateCanvas();

    const time_finished = performance.now();
    document.getElementById('status').innerText = `Rendered in ${Math.round(time_finished - time_started)} ms`;
}

document.addEventListener("DOMContentLoaded", function(){
    main();
});

