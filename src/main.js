
// Skybox texture from: https://github.com/mrdoob/three.js/tree/master/examples/textures/cube/skybox

const THREE = require('three');
const _ = require('lodash');

import Framework from './framework'
import Helpers from './helpers'
import Coords from './coordinates'

var mainSettingsGUI = {
    flap: {
        val: true,
        name: 'Flap wing'
    },
    flapSpeed: {
        val: 2.0,
        name: 'Flap speed'
    },
    showFeathers: {
        val: true,
        name: 'Show feathers'
    },
    showWingCurve: {
        val: false,
        name: 'Show shape'
    },
    showControlPoints: {
        val: false,
        name: 'Show ctrl points'
    },
    showWingOutline: {
        val: false,
        name: 'Show outline'
    }
};

var windSettingsGUI = {
    directionX: {
        val: false,
        name: 'X direction'
    },
    directionY: {
        val: false,
        name: 'Y direction'
    },
    directionZ: {
        val: true,
        name: 'Z direction'
    },
    strength: {
        val: 1.0,
        name: 'Strength'
    }
};

var featherSettingsGUI = {
    firstLayer: {
        scale: 6.0,
        count: 30,
        distribution: new THREE.Vector3(0.0, 0.0, 0.0),
        color: 0xFD6E4C
    },
    secondLayer: {
        scale: 6.0,
        count: 30,
        distribution: new THREE.Vector3(-5.0, 0.0, 0.0),
        color: 0xFEB251
    },
    thirdLayer: {
        scale: 2.0,
        count: 60,
        distribution: new THREE.Vector3(-5.0, 0.0, 1.0),
        color: 0xFFE456
    }
}

var loadedFeather;

var pointsObj;
var pointsMatParams = {
    size: 1,
    sizeAttenuation: true,
    color: 0x0000ff
};

var curveObj;
var curveMatParams = {
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
    side: THREE.DoubleSide
};
var featherLayout = [
    featherSettingsGUI.firstLayer,
    featherSettingsGUI.secondLayer,
    featherSettingsGUI.thirdLayer
];

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

    featherObjs = [];

    if (loadedFeather) {
        _.each(featherLayout, layout => {
            var count = layout.count;
            var distr = layout.distribution;
            var scale = layout.scale;
            var color = layout.color;

            var vertices = bezCurve.getPoints(count);
            var scaleFactor = 1.0;

            _.each(vertices, (vertex, i) => {
                var featherObj = loadedFeather.clone();

                featherObj.name = 'feather';
                featherObj.position.set(vertex.x + distr.x, vertex.y + distr.y, vertex.z + distr.z);
                featherObj.scale.set(scale, scale, scale);

                featherObj.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        var featherMat = new THREE.MeshBasicMaterial(featherMatParams);
                        featherMat.color = new THREE.Color(color);
                        child.material = featherMat;
                    }
                });

                featherObjs.push(featherObj);

                scale *= scaleFactor;
            });
        });
    }
};

function renderWind () {
    _.each(featherObjs, featherObj => {
        var date = new Date();
        var t = Math.sin(date.getTime() / 100) * 2 * Math.PI / 180;
        var strength = windSettingsGUI.strength.val;

        if (windSettingsGUI.directionX.val) {
            featherObj.rotateX(t * strength);
        }

        if (windSettingsGUI.directionY.val) {
            featherObj.rotateY(t * strength);
        }

        if (windSettingsGUI.directionZ.val) {
            featherObj.rotateZ(t * strength);
        }
    });
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
    renderWind();

    if (mainSettingsGUI.showWingCurve.val) {
        scene.add(curveObj);
    }

    if (mainSettingsGUI.showControlPoints.val) {
        scene.add(pointsObj);
    }

    if (mainSettingsGUI.showFeathers.val) {
        _.each(featherObjs, featherObj => {
            scene.add(featherObj);
        });
    }

    if (mainSettingsGUI.showWingOutline.val) {
        scene.add(outlineObj);
    }
}

function loadFeather (framework) {
    var loader = new THREE.OBJLoader();
    var urlPrefix = 'https://raw.githubusercontent.com/zelliott/Project2-Toolbox-Functions/master/geo/feather.obj';

    loader.load(urlPrefix, feather => {
        loadedFeather = feather;
        renderWing(framework);
    });
}

function loadSkybox (scene) {
    var loader = new THREE.CubeTextureLoader();
    var urlPrefix = './images/skymap/';
    var urlSuffix = '';

    var skymap = new THREE.CubeTextureLoader().load([
        urlPrefix + 'px.jpg' + urlSuffix, urlPrefix + 'nx.jpg' + urlSuffix,
        urlPrefix + 'py.jpg' + urlSuffix, urlPrefix + 'ny.jpg' + urlSuffix,
        urlPrefix + 'pz.jpg' + urlSuffix, urlPrefix + 'nz.jpg' + urlSuffix
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
    camera.position.set(0, -40, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));

    scene.add(directionalLight);

    renderWing(framework);

    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });

    var guiMainFolder = gui.addFolder('Main settings');
    _.each(mainSettingsGUI, (val, key) => {
        guiMainFolder.add(mainSettingsGUI[key], 'val').name(val.name).onChange(function () { renderWing(framework); });
    });

    var guiWindFolder = gui.addFolder('Wind settings');
    _.each(windSettingsGUI, (val, key) => {
        guiWindFolder.add(windSettingsGUI[key], 'val').name(val.name).onChange(function () { renderWind(framework); });
    });

    var guiFeatherFolder = gui.addFolder('Feather settings');
    _.each(featherSettingsGUI, (val, key) => {
        guiFeatherFolder.add(featherSettingsGUI[key], 'scale').name('Scale').onChange(function () { renderWing(framework); });
        guiFeatherFolder.add(featherSettingsGUI[key], 'count').name('Count').onChange(function () { renderWing(framework); });
        guiFeatherFolder.addColor(featherSettingsGUI[key], 'color').name('Color').onChange(function () { renderWing(framework); });
    });

    var guiWingCurveFolder = gui.addFolder('Change wing shape');
    _.each(coords, (val, key) => {
        guiWingCurveFolder.add(val, 'x', -40, 40).name('Point ' + key + ': x')
            .onChange(function () { renderWing(framework); });
        guiWingCurveFolder.add(val, 'y', -40, 40).name('Point ' + key + ': y')
            .onChange(function () { renderWing(framework); });
        guiWingCurveFolder.add(val, 'z', -40, 40).name('Point ' + key + ': z')
            .onChange(function () { renderWing(framework); });
    });
}

var t = 0;

function onUpdate(framework) {
    if (mainSettingsGUI.flap.val) {
        t += (0.02 * mainSettingsGUI.flapSpeed.val);

        var s = t;

        _.each(coords, (coord, name) => {
            var u = coordsFlap[coordsFlapIndex][name];
            var v = coordsFlap[(coordsFlapIndex + 1) % 5][name];

            _.each(['x', 'y', 'z'], dim => {
                coords[name][dim] = (u[dim] * (1.0 - s)) + (v[dim] * s);
            });
        });

        if (Math.abs(t - 1.0) <= 0.0001 || t > 1.0) {
            coordsFlapIndex++;
            coordsFlapIndex %= 5;
            t = 0.0;
        }
    }

     renderWing(framework);
}

Framework.init(onLoad, onUpdate);