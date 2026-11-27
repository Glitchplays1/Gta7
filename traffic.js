// Lightweight ambient traffic that follows the central east-west streets.
export function createTrafficSystem({ THREE, scene, terrain }) {
    const cars = [];
    const colors = [0x2563eb, 0xdc2626, 0x16a34a, 0xe5e7eb, 0x7c3aed, 0xf59e0b];
    for (let i=0;i<6;i++) {
        const car = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.65,.58,3.1),new THREE.MeshStandardMaterial({color:colors[i],roughness:.65}));
        body.position.y=.62; body.castShadow=true; car.add(body);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.35,.62,1.5),new THREE.MeshStandardMaterial({color:0x93c5fd,roughness:.3}));
        cabin.position.set(0,1.17,-.1); car.add(cabin);
        for(const x of [-.72,.72]) for(const z of [-1,1]) {
            const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.16,10),new THREE.MeshStandardMaterial({color:0x111827}));
            wheel.rotation.z=Math.PI/2; wheel.position.set(x,.32,z); car.add(wheel);
        }
        const lane = [-3.2,3.2][i%2];
        const z = [-96,-48,0,48,96][i%5] + lane;
        const x = -100 + i*34;
        car.position.set(x,terrain.getSupportHeight(x,z,3),z);
        scene.add(car);
        cars.push({mesh:car,z,speed:4.5+(i%3)*.7});
    }
    function update(delta) {
        for(const item of cars) {
            item.mesh.position.x += item.speed*delta;
            if(item.mesh.position.x>105) item.mesh.position.x=-105;
            item.mesh.position.y=terrain.getSupportHeight(item.mesh.position.x,item.z,item.mesh.position.y);
        }
    }
    return {update};
}
