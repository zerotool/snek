$(function () {
    init();
    setTimeout(drawRound, 2000);
});

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var cube;
var cellMultiplier = 9.2;
var round = 0;
var snekMaterials = [];
var anaglyphEnabled = false;
var animationSpeed = 100;

// Initialize scene parameters
function init() {
    // SCENE
    scene = new THREE.Scene();
    // CAMERA
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(50, 350, 200);
    camera.lookAt(scene.position);
    // RENDERER
    if (Detector.webgl)
        renderer = new THREE.WebGLRenderer({antialias: true});
    else
        renderer = new THREE.CanvasRenderer();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    container = document.getElementById('battle-3d-wrapper');
    container.appendChild(renderer.domElement);

    // EVENTS
    THREEx.WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey({charCode: 'f'.charCodeAt(0)});

    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // STATS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    //container.appendChild(stats.domElement);

    // LIGHT
    var light = new THREE.SpotLight(0xffffff);
    light.position.set(100, 200, 100);
    scene.add(light);

    // FLOOR
    var floorTexture = new THREE.TextureLoader().load('/images/checkerboard.png');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(13.5, 13.5);
    var floorMaterial = new THREE.MeshBasicMaterial({map: floorTexture, side: THREE.DoubleSide});
    var floorGeometry = new THREE.PlaneGeometry(250, 250, 1, 1);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.rotation.x = Math.PI / 2;
    floor.name = 'floor';
    scene.add(floor);

    // SKYBOX
    var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
    var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x20222F, side: THREE.BackSide});
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    skyBox.name = 'sky';
    scene.add(skyBox);

    ////////////
    // CUSTOM //
    ////////////

    // WALLS
    var cubeTexture = new THREE.TextureLoader().load('/images/wall.png');
    cubeTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    var cubeMaterial = new THREE.MeshBasicMaterial({map: cubeTexture, transparent: false});
    var cubeGeometry = new THREE.CubeGeometry(cellMultiplier, cellMultiplier, cellMultiplier);
    for (wallX = 0; wallX < 27; wallX++) {
        cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.name = 'wall';
        cube.position.set(getCellCoordinateByPosition(wallX + 1) - 1, 2.4, getCellCoordinateByPosition(0 + 1) - 1);
        scene.add(cube);
        cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.name = 'wall';
        cube.position.set(getCellCoordinateByPosition(wallX + 1) + 1, 2.4, getCellCoordinateByPosition(26 + 1) + 1);
        scene.add(cube);
    }
    for (wallY = 0; wallY < 27; wallY++) {
        cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.name = 'wall';
        cube.position.set(getCellCoordinateByPosition(0 + 1) - 1, 2.4, getCellCoordinateByPosition(wallY + 1) + 1);
        scene.add(cube);
        cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.name = 'wall';
        cube.position.set(getCellCoordinateByPosition(26 + 1) + 1, 2.4, getCellCoordinateByPosition(wallY + 1) - 1);
        scene.add(cube);
    }

    // SNEK TEXTURES
    $.each(window.gon.sneks, function (snekId, snek) {
        var bodyTexture = new THREE.TextureLoader().load(snek.style.body);
        bodyTexture.wrapS = bodyTexture.wrapT = THREE.RepeatWrapping;
        bodyTexture.repeat.set(0.5, 0.5);
        bodyTexture.offset.y = 0.25;
        var bodyPatternTexture = new THREE.TextureLoader().load(snek.style.body_pattern);
        bodyPatternTexture.wrapS = bodyPatternTexture.wrapT = THREE.RepeatWrapping;

        var headTexture = new THREE.TextureLoader().load(snek.style.head);
        headTexture.wrapS = headTexture.wrapT = THREE.RepeatWrapping;
        headTexture.repeat.set(1, 1);
        headTexture.offset.y = 0;
        var tailTexture = new THREE.TextureLoader().load(snek.style.tail);
        tailTexture.wrapS = tailTexture.wrapT = THREE.RepeatWrapping;

        snekMaterials[snekId] = {
            body: [
                new THREE.MeshBasicMaterial({map: bodyTexture, transparent: true}),
                new THREE.MeshBasicMaterial({map: bodyPatternTexture, transparent: true}),
            ],
            head: [
                new THREE.MeshBasicMaterial({map: headTexture, transparent: true}),
            ],
            tail: [
                new THREE.MeshBasicMaterial({map: tailTexture, transparent: true}),
            ]
        };
    });

    var width = window.innerWidth || 2;
    var height = window.innerHeight - 74 || 2;
    renderer.setSize(width, height);
    this.effect = new THREE.AnaglyphEffect(renderer);
    this.effect.setSize(width, height);
    animate();
}

// Draw round of battle
function drawRound() {
    clearSceneByObjectName('snake');
    $.each(window.gon.rounds[round].sneks, function (kSnek, snek) {
        $.each(snek.position, function (k, position) {
            if (k == 0) {
                //head
                var headGeometry = new THREE.CylinderGeometry(cellMultiplier - 4, 4, cellMultiplier - 4, 6);
                cube = createMultiMaterialObject(headGeometry, snekMaterials[snek.snek_id].head);
                if (snek.position[k + 1] && snek.position[k + 1].x != position.x) {
                    if (snek.position[k + 1].x > position.x) {
                        cube.rotation.y = Math.PI / 2;
                    } else {
                        cube.rotation.y = -1 * Math.PI / 2;
                    }
                }
                if (snek.position[k + 1] && snek.position[k + 1].y != position.y) {
                    if (snek.position[k + 1].y > position.y) {
                        cube.rotation.y = 0;
                    } else {
                        cube.rotation.y = -1 * Math.PI;
                    }
                }
            } else if (k == snek.position.length - 1) {
                //tail
                var tailGeometry = new THREE.ConeGeometry(cellMultiplier - 4.8, cellMultiplier, 9);
                cube = createMultiMaterialObject(tailGeometry, snekMaterials[snek.snek_id].tail);
                cube.rotation.z = Math.PI / 2;
                cube.rotation.z = -1 * Math.PI;
                if (snek.position[k - 1] && snek.position[k - 1].x != position.x) {
                    if (snek.position[k - 1].x < position.x) {
                        cube.rotation.y = Math.PI / 2;
                    } else {
                        cube.rotation.y = -1 * Math.PI / 2;
                    }
                }
                if (snek.position[k - 1] && snek.position[k - 1].y != position.y) {
                    if (snek.position[k - 1].y < position.y) {
                        cube.rotation.y = 0;
                    } else {
                        cube.rotation.y = -1 * Math.PI;
                    }
                }
            } else {
                //body
                var bodyGeometry = new THREE.CubeGeometry(cellMultiplier, cellMultiplier - 1.4, cellMultiplier);
                cube = createMultiMaterialObject(bodyGeometry, snekMaterials[snek.snek_id].body);
                if (snek.position[k + 1] && snek.position[k + 1].x != position.x) {
                    if (snek.position[k + 1].y > position.y) {
                        cube.rotation.y = 0;
                    } else {
                        cube.rotation.y = -1 * Math.PI;
                    }
                }
                if (snek.position[k + 1] && snek.position[k + 1].y != position.y) {
                    if (snek.position[k + 1].x > position.x) {
                        cube.rotation.y = Math.PI / 2;
                    } else {
                        cube.rotation.y = -1 * Math.PI / 2;
                    }
                }
            }
            cube.name = 'snake';
            cube.position.set(getCellCoordinateByPosition(position.x + 1), 4, getCellCoordinateByPosition(position.y + 1));
            scene.add(cube);
        });
    });
    round++;
    if (window.gon.rounds[round]) {
        setTimeout(function () {
            drawRound();
        }, animationSpeed);
    }
}

// SOME ROUTINE SERVICE FUNCTIONS

function getCellCoordinateByPosition(position) {
    return (position - 14) * cellMultiplier;
}

function animate() {
    requestAnimationFrame(animate);
    render();
    update();
}

function update() {
    if (keyboard.pressed("r")) {
        round = 0;
    }
    controls.update();
    stats.update();
}

function render() {
    if (anaglyphEnabled) {
        this.effect.render(scene, camera);
    } else {
        renderer.render(scene, camera);
    }
}

function createMultiMaterialObject(geometry, materials) {
    var group = new THREE.Group();
    for (var i = 0, l = materials.length; i < l; i++) {
        group.add(new THREE.Mesh(geometry, materials[i]));
    }
    return group;
};

// Delete all objects by name
function clearSceneByObjectName(name) {
    do {
        var deletedObjects = 0;
        $.each(scene.children, function (k, element) {
            if (element && element.name == name) {
                scene.remove(element);
                deletedObjects++;
            }
        });
    } while (deletedObjects > 0);
}
