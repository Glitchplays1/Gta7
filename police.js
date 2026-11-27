// Cartoon police patrols and a five-star wanted system for GTA 7.
export function createPoliceSystem({ THREE, scene, terrain, getPlayer, starsElement, statusElement }) {
    let wanted = 0;
    let calmTimer = 0;
    let spawnTimer = 0;
    const patrolCars = [];
    const maxCars = 5;
    let roadblock = null;

    function renderStars() {
        if (starsElement) {
            starsElement.textContent = '★'.repeat(wanted) + '☆'.repeat(5 - wanted);
            starsElement.setAttribute('aria-label', wanted + ' out of 5 wanted stars');
        }
        if (statusElement) statusElement.textContent = wanted ? 'POLICE ALERT' : 'ALL CLEAR';
    }

    function setWanted(level) {
        wanted = Math.max(0, Math.min(5, Math.floor(level)));
        calmTimer = 0;
        renderStars();
    }

    function raiseWanted(amount = 1) {
        setWanted(Math.min(5, wanted + amount));
    }

    function makePoliceCar() {
        const car = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: .65 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x172554, roughness: .7 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, metalness: .15, roughness: .25 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, .65, 4.1), bodyMat);
        body.position.y = .72; body.castShadow = true; car.add(body);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, .72, 1.9), glassMat);
        cabin.position.set(0, 1.35, -.15); cabin.castShadow = true; car.add(cabin);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.22, .22, 2.6), darkMat);
        stripe.position.set(0, .88, .15); car.add(stripe);
        for (const x of [-.83, .83]) for (const z of [-1.35, 1.35]) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .22, 12), new THREE.MeshStandardMaterial({color:0x111827}));
            wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .43, z); car.add(wheel);
        }
        const red = new THREE.Mesh(new THREE.BoxGeometry(.48, .18, .32), new THREE.MeshBasicMaterial({color:0xef4444}));
        const blue = new THREE.Mesh(new THREE.BoxGeometry(.48, .18, .32), new THREE.MeshBasicMaterial({color:0x3b82f6}));
        red.position.set(-.3, 1.82, -.15); blue.position.set(.3, 1.82, -.15);
        car.add(red, blue);
        car.userData.lights = [red, blue];
        scene.add(car);
        return car;
    }

    function spawnCar(player) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 34 + Math.random() * 12;
        const x = player.x + Math.cos(angle) * distance;
        const z = player.z + Math.sin(angle) * distance;
        const car = makePoliceCar();
        car.position.set(x, terrain.getSupportHeight(x, z, player.y), z);
        car.rotation.y = Math.atan2(player.x - x, player.z - z);
        patrolCars.push({ mesh: car, phase: Math.random() * 6, speed: 7 + wanted * 1.2 });
    }

    function update(delta, elapsed) {
        const player = getPlayer();
        if (!player) return;
        if (wanted >= 3 && !roadblock) {
            roadblock = new THREE.Group();
            const beam = new THREE.Mesh(new THREE.BoxGeometry(8, .35, .45), new THREE.MeshStandardMaterial({color:0xf97316}));
            beam.position.y = 1.15; roadblock.add(beam);
            for (const x of [-3.2, 3.2]) {
                const post = new THREE.Mesh(new THREE.BoxGeometry(.35, 1.2, .35), new THREE.MeshStandardMaterial({color:0xf8fafc}));
                post.position.set(x, .6, 0); roadblock.add(post);
            }
            const bx = player.x + Math.sin(player.x * .03) * 12;
            const bz = player.z + Math.cos(player.z * .03) * 12;
            roadblock.position.set(bx, terrain.getSupportHeight(bx,bz,player.y), bz);
            roadblock.rotation.y = Math.round(player.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
            scene.add(roadblock);
        }
        if (wanted < 3 && roadblock) { scene.remove(roadblock); roadblock = null; }
        if (wanted > 0) {
            calmTimer += delta;
            spawnTimer -= delta;
            const desiredCars = Math.min(maxCars, Math.max(1, wanted));
            if (patrolCars.length < desiredCars && spawnTimer <= 0) {
                spawnCar(player);
                spawnTimer = 2.5;
            }
            for (const unit of patrolCars) {
                const car = unit.mesh;
                const dx = player.x - car.position.x;
                const dz = player.z - car.position.z;
                const distance = Math.hypot(dx, dz);
                const targetAngle = Math.atan2(dx, dz);
                let angleDiff = targetAngle - car.rotation.y;
                angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                car.rotation.y += Math.max(-1.8 * delta, Math.min(1.8 * delta, angleDiff));
                if (distance > 5) {
                    car.translateZ(unit.speed * delta);
                    car.position.y = terrain.getSupportHeight(car.position.x, car.position.z, car.position.y);
                }
                const lights = car.userData.lights;
                lights[0].visible = Math.sin(elapsed * 12 + unit.phase) > 0;
                lights[1].visible = !lights[0].visible;
            }
            // The alert cools down only after the player has kept some distance.
            const nearest = patrolCars.reduce((best, unit) => Math.min(best, unit.mesh.position.distanceTo(new THREE.Vector3(player.x, player.y, player.z))), Infinity);
            if (nearest > 65) {
                if (calmTimer > 18) {
                    setWanted(wanted - 1);
                    calmTimer = 0;
                }
            } else {
                calmTimer = 0;
            }
            if (wanted === 0) {
                for (const unit of patrolCars) scene.remove(unit.mesh);
                patrolCars.length = 0;
            }
        }
    }

    renderStars();
    return { raiseWanted, update, getWanted: () => wanted };
}
