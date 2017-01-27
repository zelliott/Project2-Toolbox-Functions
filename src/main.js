
// Skybox texture from: https://github.com/mrdoob/three.js/tree/master/examples/textures/cube/skybox

const THREE = require('three');
const _ = require('lodash');

import Framework from './framework'

// called after the scene loads
function onLoad (framework) {
    var { scene, camera, renderer, gui, stats } = framework;
    var lambertWhite = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);

    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 3, 20);
    directionalLight.position.multiplyScalar(10);

    // set skybox
    // var loader = new THREE.CubeTextureLoader();
    // var urlPrefix = '/images/skymap/';

    // var skymap = new THREE.CubeTextureLoader().load([
    //     urlPrefix + 'px.jpg', urlPrefix + 'nx.jpg',
    //     urlPrefix + 'py.jpg', urlPrefix + 'ny.jpg',
    //     urlPrefix + 'pz.jpg', urlPrefix + 'nz.jpg'
    // ] );

    // scene.background = skymap;

    // load a simple obj mesh
    // var objLoader = new THREE.OBJLoader();
    // objLoader.load('/geo/feather.obj', function(obj) {

    //     // LOOK: This function runs after the obj has finished loading
    //     var featherGeo = obj.children[0].geometry;

    //     var featherMesh = new THREE.Mesh(featherGeo, lambertWhite);
    //     featherMesh.name = "feather";
    //     scene.add(featherMesh);
    // });

    // set camera position
    camera.position.set(0, 1, 20);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // scene.add(lambertCube);
    scene.add(directionalLight);

    var pointsObj;
    var curvePathObject;
    var coors = [
        { name: 'A', x: -20, y: 0, z: 0 },
        { name: 'B', x: -5, y: 15, z: 0 },
        { name: 'C', x: 20, y: 15, z: 0 },
        { name: 'D', x: 10, y: 0, z: 0 }
    ];
    function renderCurve3D () {
        scene.remove(curvePathObject);
        scene.remove(pointsObj);

        var pointsGeometry = new THREE.Geometry();
        var points = [];

        _.each(coors, coor => {
            var point = new THREE.Vector3(coor.x, coor.y, coor.z);
            pointsGeometry.vertices.push(point);
            points.push(point);
        });

        var pointsMaterialObj = { size: 3, sizeAttenuation: false, color: 0x0000ff };
        var pointsMaterial = new THREE.PointsMaterial(pointsMaterialObj);

        pointsObj = new THREE.Points(pointsGeometry, pointsMaterial);

        var curve = new THREE.CubicBezierCurve3(points[0], points[1], points[2], points[3]);

        var curvePath = new THREE.CurvePath();
        curvePath.add(curve);
        curvePath.closePath();

        var numPoints = 100;
        var curvePathGeometry = curvePath.createPointsGeometry(numPoints);

        for (var i = 0; i < numPoints - 1; i++) {
            curvePathGeometry.faces.push(new THREE.Face3(0, i + 1, i + 2));
        }

        var curvePathMaterialObj = { color : 0xff0000, side: THREE.DoubleSide, wireframe: true };
        var curvePathMaterial = new THREE.MeshDepthMaterial(curvePathMaterialObj);

        curvePathObject = new THREE.Mesh(curvePathGeometry, curvePathMaterial);

        scene.add(pointsObj);
        scene.add(curvePathObject);
    }

    renderCurve3D();

    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });

    _.each(coors, coor => {
        gui.add(coor, 'x', -20, 20).name(coor.name + 'x').onChange(renderCurve3D);
        gui.add(coor, 'y', -20, 20).name(coor.name + 'y').onChange(renderCurve3D);
        gui.add(coor, 'z', -20, 20).name(coor.name + 'z').onChange(renderCurve3D);
    });
}

// called on frame updates
function onUpdate(framework) {
    // var feather = framework.scene.getObjectByName("feather");
    // if (feather !== undefined) {
    //     // Simply flap wing
    //     var date = new Date();
    //     feather.rotateZ(Math.sin(date.getTime() / 100) * 2 * Math.PI / 180);
    // }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);