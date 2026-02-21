import Matter from 'matter-js';
import * as C from './Constants';

export default class Physics {
    constructor(canvas) {
        this.engine = Matter.Engine.create({
            gravity: { x: 0, y: C.GRAVITY },
            enableSleeping: false,
            positionIterations: 10,
            velocityIterations: 10,
        });
        this.world = this.engine.world;
        this.canvas = canvas;
        this.activeBall = null;
        this._settled = false;
        this._settleTimer = null;
        this._buildWorld();
    }

    _buildWorld() {
        const { W, H } = C;
        // Invisible boundaries + realistic floor
        const ground = Matter.Bodies.rectangle(W / 2, H + 50, W * 2, 100, { isStatic: true, friction: 0.6, restitution: 0.3 });
        const wallL = Matter.Bodies.rectangle(-25, H / 2, 50, H * 2, { isStatic: true });
        const wallR = Matter.Bodies.rectangle(W + 25, H / 2, 50, H * 2, { isStatic: true });
        // Ceiling (so ball can't fly off top)
        const ceiling = Matter.Bodies.rectangle(W / 2, -25, W * 2, 50, { isStatic: true, restitution: 0.4 });

        // Physical hoop rims — two small circles per column
        // These create realistic deflection when ball clips the rim
        this.rims = [];
        for (let col = 0; col < C.COLS; col++) {
            const cx = C.GRID_LEFT + col * C.CELL + C.CELL / 2;
            const hw = C.HOOP_W / 2;
            const rimL = Matter.Bodies.circle(cx - hw, C.HOOP_Y, 5, {
                isStatic: true, label: 'rim', restitution: 0.5, friction: 0.1
            });
            const rimR = Matter.Bodies.circle(cx + hw, C.HOOP_Y, 5, {
                isStatic: true, label: 'rim', restitution: 0.5, friction: 0.1
            });
            this.rims.push(rimL, rimR);
        }

        Matter.Composite.add(this.world, [ground, wallL, wallR, ceiling, ...this.rims]);
    }

    spawnBall() {
        if (this.activeBall) {
            Matter.Composite.remove(this.world, this.activeBall);
            this.activeBall = null;
        }
        this._settled = false;
        this._settleTimer = null;

        const ball = Matter.Bodies.circle(C.SPAWN.x, C.SPAWN.y, C.BALL_R, {
            restitution: 0.5,
            friction: 0.25,
            density: 0.003,
            frictionAir: 0.015,
            isStatic: false,
            label: 'ball',
            collisionFilter: {
                // Ball only collides with rims, walls, ground — NOT with itself or grid dividers
                category: 0x0001,
                mask: 0x0002   // rims/walls are in 0x0002
            }
        });

        // Set rim collision filter to match
        for (const rim of this.rims) {
            rim.collisionFilter = { category: 0x0002, mask: 0x0001 };
        }

        Matter.Composite.add(this.world, ball);
        this.activeBall = ball;
        return ball;
    }

    removeActiveBall() {
        if (this.activeBall) {
            Matter.Composite.remove(this.world, this.activeBall);
            this.activeBall = null;
        }
        this._settled = false;
        this._settleTimer = null;
    }

    pinAtSpawn() {
        if (!this.activeBall) return;
        Matter.Body.setPosition(this.activeBall, { x: C.SPAWN.x, y: C.SPAWN.y });
        Matter.Body.setVelocity(this.activeBall, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(this.activeBall, 0);
    }

    launch(vx, vy) {
        if (!this.activeBall) return;
        Matter.Sleeping.set(this.activeBall, false);
        Matter.Body.setVelocity(this.activeBall, { x: vx, y: vy });
        this._settled = false;
        this._settleTimer = Date.now();
    }

    // Detects if ball centre passes through a hoop opening this frame
    detectHoopScore() {
        const ball = this.activeBall;
        if (!ball) return -1;

        const bx = ball.position.x;
        const by = ball.position.y;

        // Must be within the vertical detection band around HOOP_Y
        if (by < C.HOOP_Y - C.HOOP_DETECT_BAND || by > C.HOOP_Y + C.HOOP_DETECT_BAND) return -1;

        for (let col = 0; col < C.COLS; col++) {
            const cx = C.GRID_LEFT + col * C.CELL + C.CELL / 2;
            // Check if ball centre is inside the rim opening (with generous margin)
            if (Math.abs(bx - cx) < C.HOOP_W / 2 - 2) {
                return col;
            }
        }
        return -1;
    }

    isOutOfBounds() {
        if (!this.activeBall) return false;
        const b = this.activeBall;
        return b.position.y > C.H + 120 || b.position.x < -80 || b.position.x > C.W + 80;
    }

    // Returns true when ball has been moving for 1s+ and is now slow
    isBallSettled() {
        if (!this.activeBall || !this._settleTimer) return false;
        if (Date.now() - this._settleTimer < 1000) return false; // min 1 second of flight

        const b = this.activeBall;
        const speed = Math.hypot(b.velocity.x, b.velocity.y);
        return speed < C.SETTLE_THRESHOLD;
    }

    update(dt) {
        Matter.Engine.update(this.engine, dt);
    }
}
