// Enterable homes: a shared furnished interior reached from generated house doors.
export function createHomeSystem({ THREE, scene, terrain, getPlayer, getVehicle, hint }) {
    const buildings = terrain.data.buildings || [];
    const doors = [];
    for (const b of buildings) {
        for (const side of [-1, 1]) {
            doors.push({ x: b.x, z: b.z + side * (b.depth / 2 + 2), y: terrain.getSupportHeight(b.x, b.z + side * (b.depth / 2 + 2), 3) });
        }
    }

    const interiorOrigin = new THREE.Vector3(0, 250, 0);
    const room = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8c9ad, roughness: .9 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x795b43, roughness: .9 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: .8 });
    const makeBox = (w,h,d,mat,x,y,z) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
        mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; room.add(mesh);
    };
    makeBox(14,.3,12,floorMat,0,250,0);
    makeBox(14,5,.3,wallMat,0,252.5,-6);
    makeBox(14,5,.3,wallMat,0,252.5,6);
    makeBox(.3,5,12,wallMat,-7,252.5,0);
    makeBox(.3,5,12,wallMat,7,252.5,0);
    makeBox(14,.3,12,trimMat,0,255.1,0);
    // Door opening is represented by a bright frame on the south wall.
    makeBox(2.2,3,.18,trimMat,0,251.65,5.82);
    makeBox(1.7,2.6,.12,new THREE.MeshStandardMaterial({color:0x2563eb}),0,251.5,5.72);
    // Living room furniture.
    makeBox(4,.65,1.5,new THREE.MeshStandardMaterial({color:0x2563eb}),-3,250.65,-2.8);
    makeBox(3,.35,1.4,trimMat,-3,251.15,-2.8);
    makeBox(2.2,.25,1.2,new THREE.MeshStandardMaterial({color:0x9ca3af}),2.8,250.45,-2.5);
    makeBox(1.5,1.4,.18,trimMat,2.8,251.2,-4.8);
    makeBox(2.4,.2,1.5,new THREE.MeshStandardMaterial({color:0x7c3aed}),-2.8,250.4,2.4);
    makeBox(1.4,.9,.12,trimMat,-2.8,250.9,1.65);
    makeBox(1.2,.8,1.2,new THREE.MeshStandardMaterial({color:0x8b5e3c}),4.5,250.4,3.8);
    const lamp = new THREE.PointLight(0xffd9a0, 2.2, 22);
    lamp.position.set(0,254.3,0); room.add(lamp);
    scene.add(room);
    room.visible = false;

    let inside = false;
    let returnPosition = null;
    let returnRotation = 0;
    let nearestDoor = null;
    function show(text) {
        if (!hint) return;
        hint.textContent = text;
        hint.style.display = 'block';
        clearTimeout(hint._timer);
        hint._timer = setTimeout(() => { if (!inside) hint.style.display = 'none'; }, 1800);
    }
    function update() {
        const player = getPlayer();
        if (!player || getVehicle()) return;
        if (inside) {
            if (hint) { hint.textContent = 'Press E to leave the home'; hint.style.display = 'block'; }
            return;
        }
        nearestDoor = null;
        let best = 3.8;
        for (const door of doors) {
            const d = Math.hypot(player.x-door.x, player.z-door.z);
            if (d < best) { best = d; nearestDoor = door; }
        }
        if (nearestDoor) {
            if (hint) { hint.textContent = 'Press E to enter home'; hint.style.display = 'block'; }
        }
    }
    function enter() {
        const player = getPlayer();
        if (!player || !nearestDoor || getVehicle()) return false;
        returnPosition = player.position.clone();
        returnRotation = player.rotation.y;
        inside = true;
        room.visible = true;
        player.position.set(0,250.2,3.7);
        player.rotation.y = Math.PI;
        show('Welcome home! Press E to leave.');
        return true;
    }
    function exit() {
        const player = getPlayer();
        if (!inside || !player) return false;
        inside = false;
        room.visible = false;
        player.position.copy(returnPosition);
        player.rotation.y = returnRotation;
        nearestDoor = null;
        show('You stepped outside.');
        return true;
    }
    return { update, enter, exit, isInside: () => inside, show };
}
