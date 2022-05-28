const TILE_SIZE = 50;
const WOOD = new THREE.TextureLoader().load('../res/wood.jpg');

export default class Game {
    constructor() {
        const root = document.getElementById("root"),
            w = root.clientWidth,
            h = root.clientHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x0066ff);
        this.renderer.setSize(w, h);
        this.locked = false;
        document.getElementById("root").append(this.renderer.domElement);

        let raycaster = new THREE.Raycaster();

        let selectedObject = null;
        let allowedMoves = [];

        root.onmousedown = (event) => {
            if (this.locked) return;
            if (!window.net.myTurn) return;
            if (this.colorName === "spectator") return;
            const mouseVector = new THREE.Vector2();
            mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouseVector, this.camera);
            const intersects = raycaster.intersectObjects(this.scene.children, true);

            const selected = intersects.filter(n => n.object.pawn).map(n => n.object.pawn)[0];
            const tileSelected = !selected ? raycaster.intersectObjects(this.boardObject.children).map(n => n.object)[0] : null;
            if (selected && selectedObject === null) {
                if((this.colorName === "red") === selected.black) return;
                // Clicked on a pawn, and no pawn was selected previously.
                allowedMoves = selected.getValidMoves();
                for (let [x, z] of allowedMoves) {
                    this.boardObject.children[x * 8 + z].mark();
                }
                if (allowedMoves.length > 0) {
                    selected.raise();
                    selectedObject = selected;
                }
                // Calculate valid movement candidates.

            } else if (tileSelected && selectedObject !== null) {
                // Clicked on a tile, and there's a pawn already selected.
                // temp
                let allowed = false;
                for (let [x, z] of allowedMoves) {
                    if (tileSelected.isAt([x, z])) allowed = true;
                }
                if (!allowed) return;

                for (let [x, z, removed] of allowedMoves) {
                    this.boardObject.children[x * 8 + z].unmark();
                    if (removed && tileSelected.isAt([x, z])) {
                        for(let pawn of removed){
                            window.net.sendEvent("REMOVE", {
                                at: [...pawn],
                            });
                            this.getPawnAt(...pawn).removeFromField();
                        }
                        let opponents;
                        if(this.colorName === "red") opponents = this.blackPawnsObjects;
                        else opponents = this.redPawnsObjects;

                        debugger;
                        if(opponents.filter(n => n.position.y !== 1000 && n.boardPosition[0] !== -1).length === 0){
                            // There's no more opponents.
                            window.net.sendEvent("I_WON", {});
                        }
                    }
                }
                window.net.sendEvent("MOVE", {
                    from: [...selectedObject.boardPosition],
                    to: [...tileSelected.index],
                });
                selectedObject.setPositionOnBoard(...tileSelected.index);
                selectedObject = null;
            }

        }

        this.board = Array(8).fill(0).map((n, i) => Array(8).fill(0));

        this.scene.add(new THREE.AxesHelper(1000));

        this.camera.position.set(500, 300, 0);
        this.camera.lookAt(this.scene.position);

        this.boardObject = new CheckersBoard();

        const tileGeometry = new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE / 2, TILE_SIZE);

        const positionOffset = -(-0.5 + (this.board.length / 2)) * TILE_SIZE;
        let i = 0;
        let k = 0;
        for (const row of this.board) {
            let q = 0;
            for (const tile of row) {
                const tileMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: WOOD, color: (k % 2 == 0) ? 0x454545 : 0xffffff });
                const tileObject = new CheckersTile(tileGeometry, tileMaterial);
                tileObject.position.x = positionOffset + i * TILE_SIZE;
                tileObject.position.y = 0;
                tileObject.position.z = positionOffset + q * TILE_SIZE;
                this.boardObject.add(tileObject);
                tileObject.index = [i, q];
                ++q;
                ++k
            }
            ++i;
            ++k;
        }

        void k;

        this.boardObject.position.set(0, 0, 0);
        this.scene.add(this.boardObject);

        this.redPawnsObjects = Array(16).fill(0).map((n, i) => new CheckersPawn(false));
        this.blackPawnsObjects = Array(16).fill(0).map((n, i) => new CheckersPawn(true));
        [...this.blackPawnsObjects, ...this.redPawnsObjects].forEach(n => {
            n.position.set(0, 1000, 0);
            this.scene.add(n);
        });

        this.render()
    }

    getPawnAt(x, z) {
        return [...this.blackPawnsObjects, ...this.redPawnsObjects]
            .filter(n => n.boardPosition[0] === x && n.boardPosition[1] === z)[0] ?? null;
    }

    initPositions(colorName) {
        this.colorName = colorName === null ? "spectator" : colorName;
        ui.showPlayingAs(this.colorName, false);
        let i = 0;
        for (let x = 1; x < 8; x += 2) {
            this.redPawnsObjects[i++].setPositionOnBoard(0, x, 0);
        }
        for (let x = 0; x < 8; x += 2) {
            this.redPawnsObjects[i++].setPositionOnBoard(1, x, 0);
        }
        i = 0;
        for (let x = 0; x < 8; x += 2) {
            this.blackPawnsObjects[i++].setPositionOnBoard(7, x, 0);
        }
        for (let x = 1; x < 8; x += 2) {
            this.blackPawnsObjects[i++].setPositionOnBoard(6, x, 0);
        }

        if (colorName === null) {
            this.camera.position.set(0, 700, 0);
            this.camera.lookAt(this.scene.position);
        } else if (colorName === "red") {
            this.camera.position.set(-500, 300, 0);
            this.camera.lookAt(this.scene.position);
        }
        [...this.blackPawnsObjects, ...this.redPawnsObjects].forEach(n => n.initAfterSetup());
    }

    render = () => {
        requestAnimationFrame(this.render);
        TWEEN.update();
        this.renderer.render(this.scene, this.camera);
    }
}

class CheckersTile extends THREE.Mesh {
    index = [0, 0];
    isAt([x, z]) {
        const [tx, tz] = this.index;
        return tx === x && tz === z;
    }
    constructor(a, b) {
        super(a, b);
    }

    mark() {
        this.originalColor = this.material.color;
        this.material.color = new THREE.Color(0x00ff00);
    }

    unmark() {
        this.material.color = this.originalColor;
    }
}

class CheckersBoard extends THREE.Object3D { }

const PAWN_GEOMETRY = new THREE.CylinderGeometry(25, 25, 10, 64);
const PLANE_GEOMETRY = new THREE.PlaneGeometry(TILE_SIZE - 20, TILE_SIZE - 20);
const QUEEN_IMAGE = new THREE.MeshBasicMaterial({ transparent: true, map: new THREE.TextureLoader().load( '../res/queen.png' ) });

class CheckersPawn extends THREE.Object3D {
    isQueen = false;

    constructor(color) {
        super();
        let material = color ? new THREE.MeshBasicMaterial({ color: 0x0 }) : new THREE.MeshBasicMaterial({ color: 0xff0000 });
        let planeMaterial = new THREE.MeshBasicMaterial({ opacity: 0, transparent: true });
        let pawnMesh = new THREE.Mesh(PAWN_GEOMETRY, material);
        pawnMesh.pawn = this;
        this.add(pawnMesh);
        this.plane = new THREE.Mesh(PLANE_GEOMETRY, planeMaterial);
        this.plane.rotation.x = -Math.PI / 2;            
        
        this.plane.position.y = 10;
        this.add(this.plane);
        this.black = color;
        this.boardPosition = [0, 0];
    }

    initAfterSetup(){
        switch(window.game.colorName){
            case "red": 
                this.plane.rotation.z = -Math.PI / 2;
                break;
            case "black":
                this.plane.rotation.z = Math.PI / 2;
                break;
        }
    }

    getValidMoves() {
        // Reds start out at 0, 1
        let validMoves = [];
        let opponent = !this.black;

        if (!this.isQueen) {
            let nextX = (this.boardPosition[0]) + (this.black ? -1 : 1);
            let currentZ = this.boardPosition[1];
            let possibleA = [nextX, currentZ + 1, null],
                possibleB = [nextX, currentZ - 1, null];
            if (window.game.getPawnAt(...possibleB)?.black === opponent) {
                possibleB[2] = [[...possibleB]];
                possibleB[0] += (this.black ? -1 : 1);
                possibleB[1] -= 1;
            }
            if (window.game.getPawnAt(...possibleA)?.black === opponent) {
                possibleA[2] = [[...possibleA]];
                possibleA[0] += (this.black ? -1 : 1);
                possibleA[1] += 1;
            }
            validMoves.push(possibleA, possibleB);
        }else{
            for(let directionR = 0; directionR<4; directionR++){
                let i = directionR;
                let incrX = 0,
                    incrZ = 0;
                if(i > 1){
                    i -= 2;
                    incrX = 1;
                }else{
                    incrX = -1;
                }
                incrZ = i ? -1 : 1;
                let [cx, cz] = this.boardPosition;
                cx += incrX;
                cz += incrZ;
                let thisDirectionRemoved = [];
                while(cx >= 0 && cx < 8 && cz >= 0 && cz < 8){
                    let pawnAtThat = window.game.getPawnAt(cx, cz);
                    if(pawnAtThat?.black === this.black) break; // Cannot break same colors.
                    if(pawnAtThat){
                        thisDirectionRemoved.push([cx, cz]);
                    }
                    validMoves.push([cx, cz, thisDirectionRemoved.length === 0 ? null : [...thisDirectionRemoved]]);
                    cx += incrX;
                    cz += incrZ;
                }
            }
        }
        return validMoves.filter(([x, z]) =>
            x >= 0 && x < 8 && z >= 0 && z < 8 &&
            !window.game.getPawnAt(x, z)
        );
    }

    setPositionOnBoard(x, z, time = 500) {
        if(( this.black && x == 0) ||
           (!this.black && x == 7))
        {
            this.isQueen = true;
            this.plane.material = QUEEN_IMAGE;
        }

        this.boardPosition = [x, z];
        x = x * TILE_SIZE - 3.5 * TILE_SIZE;
        z = z * TILE_SIZE - 3.5 * TILE_SIZE;
        window.game.locked = true;
        new TWEEN.Tween(this.position)
            .to({ x, z, y: 20 }, time)
            .easing(time === 0 ? TWEEN.Easing.Bounce.Out : TWEEN.Easing.Sinusoidal.InOut)
            .onComplete(() => window.game.locked = false)
            .start();
    }

    raise() {
        window.game.locked = true;
        new TWEEN.Tween(this.position)
            .to({ y: 50 }, 100)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onComplete(() => window.game.locked = false)
            .start();
    }

    removeFromField() {
        this.boardPosition = [-1, -1];
        window.game.locked = true;
        new TWEEN.Tween(this.position)
            .to({ y: 1000 }, 500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .onComplete(() => {
                window.game.locked = false;
            })
            .start();
    }
}