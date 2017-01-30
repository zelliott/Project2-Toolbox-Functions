
// Skybox texture from: https://github.com/mrdoob/three.js/tree/master/examples/textures/cube/skybox

const THREE = require('three');
const _ = require('lodash');

import Framework from './framework'
import Helpers from './helpers'
import Coords from './coordinates'

var settingsGUI = {
    flap: false,
    showFeathers: true,
    showWingCurve: true,
    showControlPoints: true,
    showWingOutline: true
};

var loadedFeather;

var pointsObj;
var pointsMatParams = {
    size: 1,
    sizeAttenuation: true,
    color: 0x0000ff
};

var curveObj;
var curveMatParams = {
    color: 0xff0000,
    side: THREE.DoubleSide,
    wireframe: false
};

var outlineObj;
var outlineMatParams = {
    color: 0x0000ff,
    linewidth: 10
};

var featherObjs = [];
var featherMatParams = {
    color: 0xaaaaaa,
    side: THREE.DoubleSide
};
var featherLayout = [
    {
        scale: 4.0,
        count: 30,
        countRange: [0, 30],
        distribution: new THREE.Vector3(0.0, 0.0, 0.0),
        orientation: new THREE.Vector3(0.0, 0.0, Math.PI)
    } // ,
    // {
    //     scale: 2.0,
    //     count: 15,
    //     countRange: [0, 15],
    //     distribution: new THREE.Vector3(0.0, 0.0, 0.0),
    //     orientation: new THREE.Vector3(Math.PI / 8.0, 0.0, Math.PI)
    // },
    // {
    //     scale: 1.0,
    //     distribution: new THREE.Vector3(0.0, 0.0, 0.0),
    //     orientation: new THREE.Vector3(0.0, 0.0, Math.PI)
    // }
]

var coordsFlap = [ Coords.A, Coords.B, Coords.C, Coords.D, Coords.E ];
var coordsFlapIndex = 0;
var coords = _.cloneDeep(coordsFlap[0]);

function renderPoints () {
    var pointsGeom = new THREE.Geometry();
    var points = [];

    _.each(coords, coord => {
        var point = new THREE.Vector3(coord.x, coord.y, coord.z);
        pointsGeom.vertices.push(point);
    });

    var pointsMat = new THREE.PointsMaterial(pointsMatParams);

    pointsObj = new THREE.Points(pointsGeom, pointsMat);
}

function renderCurve () {
    var points = [];
    _.each(coords, coord => {
        var point = new THREE.Vector3(coord.x, coord.y, coord.z);
        points.push(point);
    });

    var bezCurve = new THREE.CubicBezierCurve3(points[0], points[1], points[2], points[3]);
    var curve = new THREE.CurvePath();
    curve.add(bezCurve);
    curve.closePath();

    var numPoints = 50;
    var curveGeom = curve.createPointsGeometry(numPoints);

    for (var i = 0; i < numPoints - 1; i++) {
        curveGeom.faces.push(new THREE.Face3(0, i + 1, i + 2));
    }

    curveGeom.computeFaceNormals();
    curveGeom.computeVertexNormals();

    var curveMat = new THREE.MeshNormalMaterial(curveMatParams);

    curveObj = new THREE.Mesh(curveGeom, curveMat);
}

function renderOutline () {
    var points = [];
    _.each(coords, coord => {
        var point = new THREE.Vector3(coord.x, coord.y, coord.z);
        points.push(point);
    });

    var bezCurve = new THREE.CubicBezierCurve3(points[0], points[1], points[2], points[3]);
    var curve = new THREE.CurvePath();
    curve.add(bezCurve);
    curve.closePath();

    var outlineGeom = new THREE.Geometry();
    var numPoints = 50;

    outlineGeom.vertices = curve.getPoints(numPoints);

    var outlineMat = new THREE.LineBasicMaterial(outlineMatParams);

    outlineObj = new THREE.Line(outlineGeom, outlineMat);
}

function renderFeathers () {
    var points = [];
    _.each(coords, coord => {
        var point = new THREE.Vector3(coord.x, coord.y, coord.z);
        points.push(point);
    });

    var bezCurve = new THREE.CubicBezierCurve3(points[0], points[1], points[2], points[3]);
    var featherMat = new THREE.MeshLambertMaterial(featherMatParams);

    featherObjs = [];

    if (loadedFeather) {
        _.each(featherLayout, layout => {
            var count = layout.count;
            var distr = layout.distribution;
            var orien = layout.orientation;
            var scale = layout.scale;
            var countRange = layout.countRange;

            var numPoints = 10;
            var vertices = bezCurve.getPoints(count);
            var factor = 0.99;

            _.each(vertices, (vertex, i) => {
                if (_.inRange(i, countRange[0], countRange[1])) {
                    var featherObj = loadedFeather.clone();

                    featherObj.name = 'feather';
                    featherObj.position.set(vertex.x + distr.x, vertex.y + distr.y, vertex.z + distr.z);
                    featherObj.rotation.set(orien.x, orien.y, orien.z);
                    featherObj.scale.set(scale, scale, scale);

                    featherObjs.push(featherObj);

                    scale *= factor;
                }
            });
        });
    }

};

function renderWing (framework) {
    var { scene } = framework;

    scene.remove(curveObj);
    scene.remove(pointsObj);
    scene.remove(outlineObj);

    _.each(featherObjs, featherObj => {
        scene.remove(featherObj);
    });

    renderCurve();
    renderPoints();
    renderOutline();
    renderFeathers();

    if (settingsGUI.showWingCurve) {
        scene.add(curveObj);
    }

    if (settingsGUI.showControlPoints) {
        scene.add(pointsObj);
    }

    if (settingsGUI.showFeathers) {
        _.each(featherObjs, featherObj => {
            scene.add(featherObj);
        });
    }

    if (settingsGUI.showWingOutline) {
        scene.add(outlineObj);
    }
}

function loadFeather (framework) {
     var loader = new THREE.OBJLoader();

    loader.load('/geo/feather.obj', feather => {
        loadedFeather = feather;
        renderWing(framework);
    });
}

function loadSkybox (scene) {
    var loader = new THREE.CubeTextureLoader();
    var urlPrefix = '/images/skymap/';

    var skymap = new THREE.CubeTextureLoader().load([
        urlPrefix + 'px.jpg', urlPrefix + 'nx.jpg',
        urlPrefix + 'py.jpg', urlPrefix + 'ny.jpg',
        urlPrefix + 'pz.jpg', urlPrefix + 'nz.jpg'
    ]);

    scene.background = skymap;
}

// called after the scene loads
function onLoad (framework) {
    var { scene, camera, renderer, gui, stats } = framework;
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);

    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 3, 20);
    directionalLight.position.multiplyScalar(10);

    loadFeather(framework);
    loadSkybox(scene);

    // Camera
    camera.position.set(0, -20, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));

    scene.add(directionalLight);

    renderWing(framework);

    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });

    _.each(settingsGUI, (val, key) => {
        gui.add(settingsGUI, key).onChange(function () { renderWing(framework); });
    });

    // GUI controls for manipulating wing curve manually
    // _.each(coords, (coord, name) => {
    //     gui.add(coord, 'x', -40, 40).name(name + 'x').onChange(function () { renderWing(framework); });
    //     gui.add(coord, 'y', -40, 40).name(name + 'y').onChange(function () { renderWing(framework);});
    //     gui.add(coord, 'z', -40, 40).name(name + 'z').onChange(function () { renderWing(framework); });
    // });
}

// called on frame updates
var t = 0;

function onUpdate(framework) {
    // var feather = framework.scene.getObjectByName("feather");
    // if (feather !== undefined) {
    //     // Simply flap wing
    //     var date = new Date();
    //     feather.rotateZ(Math.sin(date.getTime() / 100) * 2 * Math.PI / 180);
    // }

    if (settingsGUI.flap) {
        t += 0.05;

        var s = Helpers.smootherstep(0.0, 1.0, t);

        _.each(coords, (coord, name) => {
            var u = coordsFlap[coordsFlapIndex][name];
            var v = coordsFlap[(coordsFlapIndex + 1) % 5][name];

            _.each(['x', 'y', 'z'], dim => {
                coords[name][dim] = (u[dim] * (1.0 - s)) + (v[dim] * s);
            });
        });

        if (Math.abs(t - 1.0) <= 0.0001) {
            coordsFlapIndex++;
            coordsFlapIndex %= 5;
            t = 0.0;
        }

        renderWing(framework);
    }
}

Framework.init(onLoad, onUpdate);