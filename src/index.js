"use strict";
require('./styles/styles.scss');

import {Sphere, Point, Normal, Ray, Color} from 'es6-3d-primitives';
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
                nearest_object_distance = result.distance;
            }
        }
    }

    if (nearest_object !== undefined) {
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
            const light_ray = new Ray(nearest_hit.hit_point, direction.normalize());
            const light_distance = light.origin.distance(nearest_hit.hit_point);

            //console.log('Emitting secondary ray', light_ray);

            let visible = true;

            for (const obj of scene.objects) {
                // console.log(`Tracing secondary ray ${light_ray}`);
                const result = obj.hit(light_ray);
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
                const lambert_coeff = nearest_hit.normal.dot(light_ray.vector);
                const new_color = light.color.mul(lambert_coeff);
                // console.log(`Hit point normal: ${nearest_hit.normal}, lambert coeff: ${lambert_coeff}; color: ${light.color} -> ${new_color}`);
                color = color.mul(new_color);
                // console.log(`result: ${color}`);
            } else {
                color = new Color(0, 0, 0);
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

function getDefaultScene() {
    let scene = [
        new CheckerBoard(new Point(0, 0, 0), new Normal(0, 1, 0), new Color(1, 1, 1))
        // new Sphere(new Point(0, 50, 400), 1000, new Color(0.1, 0.1, 0.15)),
    ];

    const rate = 13;
    //let x = -120;
    for (let i = 0.3; i < 5.2; i += Math.random() * 0.05 + 0.12) {
        const x = i * rate * Math.cos(Math.PI * i);
        const y = i * rate * Math.sin(Math.PI * i) + 20;
        //x = x + i*2 + i/2;
        //const y = 10;

        scene.push(
            new Sphere(
                new Point(x, y + 30, 0),
                i * 1.3,
                new Color(
                    Math.cos(Math.PI * i * 0.08) * 0.3 + 0.6,
                    0,
                    0.5
                )
            )
        )
    }

    let lights = [
        new Light(new Point(170, 250, 350), new Color(0.95, 0.95, 0.95)),
    ];

    return {
        objects: scene,
        lights: lights,
        backgroundColor: new Color(0.1, 0.1, 0.15),
        cameraPosition: new Point(0, 90, 280),
        cameraAngle: 40 * (Math.PI / 180),
        viewPaneDistance: 300,
        horizonDistance: 1000,
    };
}
function getSphereScene() {
    return {
        objects: [
            new CheckerBoard(new Point(0, 0, 0), new Normal(0, 1, 0), new Color(1, 1, 1)),
            new Sphere(new Point(0, 20, 0), 18, new Color(0.5, 1, 0)),
        ],
        lights: [
            new Light(new Point(20, 30, 40), new Color(1, 1, 1)),
        ],
        backgroundColor: new Color(0.1, 0.1, 0.1),
        cameraPosition: new Point(0, 25, 90),
        cameraAngle: 30 * (Math.PI / 180),
        viewPaneDistance: 300,
        horizonDistance: 800,
    };

}

function getHelloScene() {
    const width = 31;
    const height = 12;
    const matrix =
        ' x  x  xxxx  x     x     xxx   ' +
        ' x  x  x     x     x    x   x  ' +
        ' xxxx  xxx   x     x    x   x  ' +
        ' x  x  x     x     x    x   x  ' +
        ' x  x  xxxx  xxxx  xxxx  xxx   ' +
        '                               ' +
        'x   x   xxx   xxx   x     xxxx ' +
        'x   x  x   x  x  x  x     x   x' +
        'x   x  x   x  xxx   x     x   x' +
        'x x x  x   x  x x   x     x   x' +
        ' x x    xxx   x  x  xxxx  xxxx ' +
        '                                 ' ;
    let scene = [
        new CheckerBoard(new Point(0, -25, 0), new Normal(0, 1, 0), new Color(1, 1, 1)),
    ];

    const pixelX = 5;
    const pixelY = 7;

    for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
            const letter = matrix[y * width + x];
            if (letter == ' ') {
                continue;
            }
            const diameter = letter == 'x' ? 3 : 2.5;
            scene.push(
                new Sphere(new Point(x * pixelX - width/2 * pixelX, height * pixelY - y * pixelY, 0), diameter, new Color(1, 0.5, 0))
            )
        }
    }

    return {
        objects: scene,
        lights: [
            new Light(new Point(0, 200, 250), new Color(1, 1, 1)),
        ],
        backgroundColor: new Color(0.1, 0.1, 0.1),
        cameraPosition: new Point(0, 35, 300),
        cameraAngle: 45 * (Math.PI / 180),
        viewPaneDistance: 300,
        horizonDistance: 800,
    };
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

    let scene;

    switch (scene_name) {
        case 'sphere':
            scene = getSphereScene();
            break;
        case 'hello':
            scene = getHelloScene();
            break;
        default:
            scene = getDefaultScene();
    }

    const time_started = performance.now();

    render(scene, canvasWidth, canvasHeight, primeRays, function(x, y, color) {
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

