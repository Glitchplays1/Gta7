// Enterable homes: shared furnished interior with reliable door proximity checks.
export function createHomeSystem({ THREE, scene, terrain, getPlayer, getVehicle, hint }) {
    const buildings = terrain.data?.buildings || [];
    const doors = [];
    for (const b of buildings) {
        for (const side of [-1, 1]) {
            const z = b.z + side * (b.depth / 2 + 1.65);
            doors.push({
                x: b.x,
                z,
                y: terrain.getSupportHeight(b.x, z, 3),
                buildingId: b.id
            });
        }
    }

    const room = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8c9ad, roughness: .9 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x795b43, roughness: .9 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: .8 });
    const makeBox = (w,h,d,mat,x,y,z) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
        mesh.position.set(x,y,z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        room.add(mesh);
    };

    // Interior is placed well above the playable map so it cannot collide with the city.
    makeBox(14,.3,12,floorMat,0,250,0);
    makeBox(14,5,.3,wallMat,0,252.5,-6);
    makeBox(14,5,.3,wallMat,0,252.5,6);
    makeBox(.3,5,12,wallMat,-7,252.5,0);
    makeBox(.3,5,12,wallMat,7,252.5,0);
    makeBox(14,.3,12,trimMat,0,255.1,0);
    // Clear doorway opening on the south wall.
    makeBox(5.9,5,.3,wallMat,-4.05,252.5,6);
    makeBox(5.9,5,.3,wallMat,4.05,252.5,6);
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
    lamp.position.set(0,254.3,0);
    room.add(lamp);
    scene.add(room);
    room.visible = false;

    let inside = false;
    let returnPosition = null;
    let returnRotation = 0;
    let nearestDoor = null;

    function findNearestDoor(player, maxDistance = 6) {
        let nearest = null;
        let best = maxDistance;
        for (const door of doors) {
            const distance = Math.hypot(player.position.x - door.x, player.position.z - door.z);
            if (distance < best) {
                best = distance;
                nearest = door;
            }
        }
        return nearest;
    }

    function show(message) {
        if (!hint) return;
        hint.textContent = message;
        hint.style.display = 'block';
        clearTimeout(hint._timer);
        hint._timer = setTimeout(() => {
            if (!inside && !nearestDoor) hint.style.display = 'none';
        }, 2200);
    }

    function update() {
        const player = getPlayer();
        if (!player) return;
        if (inside) {
            if (hint) {
                hint.textContent = 'Press E to leave the home';
                hint.style.display = 'block';
            }
            return;
        }
        if (getVehicle()) {
            nearestDoor = null;
            return;
        }
        nearestDoor = findNearestDoor(player, 6);
        if (hint && nearestDoor) {
            hint.textContent = 'Press E to enter home';
            hint.style.display = 'block';
        } else if (hint && hint.textContent.includes('Press E to enter home')) {
            hint.style.display = 'none';
        }
    }

    function enter() {
        const player = getPlayer();
        if (!player || getVehicle() || inside) return false;
        // Re-check immediately on key press; don't rely on the previous animation frame.
        nearestDoor = findNearestDoor(player, 6);
        if (!nearestDoor) {
            show('Walk up to a house door and press E.');
            return false;
        }
        returnPosition = player.position.clone();
        returnRotation = player.rotation.y;
        inside = true;
        room.visible = true;
        player.position.set(0, 250.22, 3.6);
        player.rotation.y = Math.PI;
        show('Welcome home! Press E to leave.');
        return true;
    }

    function exit() {
        const player = getPlayer();
        if (!inside || !player || !returnPosition) return false;
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
