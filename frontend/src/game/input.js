/**
 * Keyboard input handler for player actions.
 * Returns a cleanup function.
 */
export function setupInput(emit) {
    let lastMoveTime = 0;
    const MOVE_COOLDOWN = 100; // 100ms input throttle

    const keyHandler = (e) => {
        const now = Date.now();
        switch (e.key.toLowerCase()) {
            case 'w':
                if (now - lastMoveTime > MOVE_COOLDOWN) { emit('move', { dx: 0, dy: -1 }); lastMoveTime = now; }
                break;
            case 'a':
                if (now - lastMoveTime > MOVE_COOLDOWN) { emit('move', { dx: -1, dy: 0 }); lastMoveTime = now; }
                break;
            case 's':
                if (now - lastMoveTime > MOVE_COOLDOWN) { emit('move', { dx: 0, dy: 1 }); lastMoveTime = now; }
                break;
            case 'd':
                if (now - lastMoveTime > MOVE_COOLDOWN) { emit('move', { dx: 1, dy: 0 }); lastMoveTime = now; }
                break;
            case 'e':
                emit('breakBlock');
                break;
            case ' ':
                e.preventDefault();
                emit('attack');
                break;
            default:
                break;
        }
    };

    window.addEventListener('keydown', keyHandler);

    return () => {
        window.removeEventListener('keydown', keyHandler);
    };
}
