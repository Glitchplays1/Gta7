// Short, fictional courier/heist-style missions with checkpoints and route choice.
export function createMissionSystem({ THREE, scene, terrain, getPlayer, getVehicle, addCash, hint }) {
    const missions = [
        { name: 'Neon Data Run', description: 'Collect 3 glowing data drives around the city.', reward: 600, points: [[-58, -54], [62, -42], [18, 78]] },
        { name: 'Harbor Express', description: 'Deliver the package to the three marked drop points.', reward: 750, points: [[-92, 22], [88, 28], [12, -105]] },
        { name: 'Skyline Circuit', description: 'Visit all 3 skyline beacons. Car or on foot — your choice.', reward: 900, points: [[-115, -80], [112, -76], [0, 120]] }
    ];
    let active = null, nextPoint = 0, completed = 0;
    const markers = [];
    const panel = document.getElementById('mission-panel');
    const title = document.getElementById('mission-title');
    const detail = document.getElementById('mission-detail');
    const progress = document.getElementById('mission-progress');

    function show(text) {
        if (hint) {
            hint.textContent = text;
            hint.style.display = 'block';
            clearTimeout(hint._timer);
            hint._timer = setTimeout(() => { hint.style.display = 'none'; }, 2600);
        }
    }
    function clearMarkers() {
        for (const marker of markers) scene.remove(marker);
        markers.length = 0;
    }
    function render() {
        if (!panel) return;
        panel.style.display = active ? 'block' : 'none';
        if (active) {
            title.textContent = active.name;
            detail.textContent = active.description;
            progress.textContent = 'CHECKPOINT ' + Math.min(nextPoint + 1, active.points.length) + ' / ' + active.points.length;
        }
    }
    function accept(index) {
        if (active) { show('Finish your current job first. Press J to view the job board.'); return; }
        active = missions[index];
        nextPoint = 0;
        clearMarkers();
        active.points.forEach(([x,z], i) => {
            const y = terrain.getSupportHeight(x,z,3);
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(2.1, .16, 8, 28),
                new THREE.MeshBasicMaterial({ color: 0x22d3ee })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.set(x, y + .25, z);
            scene.add(ring);
            markers.push(ring);
        });
        render();
        show(active.name + ' started! Reach the glowing checkpoints in any order.');
    }
    function update(delta, elapsed) {
        if (!active) return;
        const player = getPlayer();
        if (!player) return;
        markers.forEach((marker, i) => {
            marker.rotation.z += delta * 1.2;
            marker.position.y = terrain.getSupportHeight(marker.position.x, marker.position.z, marker.position.y) + .3 + Math.sin(elapsed * 2 + i) * .12;
        });
        const vehicle = getVehicle();
        const position = vehicle ? vehicle.mesh.position : player;
        const point = active.points[nextPoint];
        if (Math.hypot(position.x - point[0], position.z - point[1]) < 5) {
            const marker = markers[nextPoint];
            if (marker) { scene.remove(marker); markers[nextPoint] = null; }
            nextPoint++;
            if (nextPoint >= active.points.length) {
                addCash(active.reward);
                completed++;
                show('Job complete! +' + active.reward + ' credits. Great work!');
                active = null;
                clearMarkers();
            } else {
                show('Checkpoint reached! Keep going to the next beacon.');
            }
            render();
        }
    }
    function openBoard() {
        const existing = document.getElementById('job-board');
        if (!existing) return;
        existing.style.display = existing.style.display === 'block' ? 'none' : 'block';
        if (existing.style.display === 'block') document.exitPointerLock();
    }
    document.querySelectorAll('[data-mission]').forEach(button => {
        button.addEventListener('click', () => {
            accept(Number(button.dataset.mission));
            const board = document.getElementById('job-board');
            if (board) board.style.display = 'none';
            if (document.pointerLockElement !== null) document.exitPointerLock();
        });
    });
    window.addEventListener('keydown', event => {
        if (event.repeat || event.target.closest('input,button,select')) return;
        if (event.key.toLowerCase() === 'j') openBoard();
    });
    return { update, getCompleted: () => completed };
}
