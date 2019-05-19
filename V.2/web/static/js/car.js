const DEG_TO_RAD = Math.PI / 180;
const SIN_60 = Math.sin(60 * DEG_TO_RAD);
const GREEN_COLOR = '#28a745';
const RED_COLOR = '#dc3545';
const GRAY_COLOR = '#343a40';
const MUTED_COLOR = '#6c757d';
const LIGHT_GRAY_COLOR = '#bbbbbb';
const WHITE_COLOR = '#ffffff';
const FONT = '-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, Sans Serif';

export default class Car {

    constructor(ctx) {
        this.ctx = ctx;
        this.x0 = 0;
        this.y0 = 0;
        this.containerWidth = 0;
        this.containerHeight = 0;
        this.width = 100;
        this.halfWidth = this.width / 2;
        this.height = 100;
        this.halfHeight = this.height / 2;
        this.maxAngle = 50;
        this.minAngle = -50;
        this.frontAngle = 0;
        this.rearAngle = 0;
        this.increaseAngle = false;
        this.decreaseAngle = false;
        this.moveForward = false;
        this.moveBackward = false;
        this.movingFrontWheels = true;
        this.drivingMode = 'ackermann';
        this.locked = false;
        this.leftSpeed = 0;
        this.rightSpeed = 0;
    }

    resize(width, height) {
        this.containerWidth = width;
        this.containerHeight = height;
    }

    constrain(value, min, max) {
        if (value < min) {
            return min;
        } else if (value > max) {
            return max;
        } else {
            return value;
        }
    }

    update() {
        if (this.movingFrontWheels) {
            if (this.increaseAngle) this.frontAngle += 1;
            if (this.decreaseAngle) this.frontAngle -= 1;
            this.frontAngle = this.constrain(this.frontAngle, this.minAngle, this.maxAngle);
        } else {
            if (this.increaseAngle) this.rearAngle += 1;
            if (this.decreaseAngle) this.rearAngle -= 1;
            this.rearAngle = this.constrain(this.rearAngle, this.minAngle, this.maxAngle);
        }
    }

    drawArrow(x0, y0, angle, color) {
        let length = 30;
        let headSize = 15;
        let headHeight = headSize * SIN_60;
        this.ctx.save();
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.translate(x0, y0);
        this.ctx.rotate(angle * DEG_TO_RAD);
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -length);
        this.ctx.translate(0, -length);
        this.ctx.moveTo(-headSize / 2, 0);
        this.ctx.lineTo(headSize / 2, 0);
        this.ctx.lineTo(0, -headHeight);
        this.ctx.lineTo(-headSize / 2, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();

    }

    drawWheel(x, y, angle, color) {
        let length = 30;
        this.ctx.save();
        this.ctx.translate(x, y);
        if (angle != 0) {
            this.ctx.rotate(angle * DEG_TO_RAD);
        }
        this.ctx.lineWidth = 14;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.strokeStyle = color || GRAY_COLOR;
        this.ctx.moveTo(0, -length / 2);
        this.ctx.lineTo(0, length / 2);
        this.ctx.stroke();
        this.ctx.restore();
        this.ctx.font = `12px ${FONT}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = GRAY_COLOR;
        if (x > 0) {
            this.ctx.fillText(`${Math.floor(angle)}°`, x + 30, y);
        } else {
            this.ctx.fillText(`${Math.floor(angle)}°`, x - 30, y);
        }
    }

    drawChassis() {
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = LIGHT_GRAY_COLOR;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.halfWidth, -this.halfHeight);
        this.ctx.lineTo(+this.halfWidth, -this.halfHeight);
        this.ctx.moveTo(-this.halfWidth, this.halfHeight);
        this.ctx.lineTo(+this.halfWidth, this.halfHeight);
        this.ctx.rect(-this.halfWidth + 25, -this.halfHeight, this.width - 50, this.height);
        this.ctx.stroke();
    }

    drawDrivingModes() {
        this.ctx.font = `14px ${FONT}`;
        this.ctx.fillStyle = GRAY_COLOR;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Ackermann', 20, 10);
        this.ctx.fillText('Omindireccional', 20, 30);
        this.ctx.beginPath();
        this.ctx.fillStyle = this.drivingMode == 'ackermann' ? GREEN_COLOR : LIGHT_GRAY_COLOR;
        this.ctx.arc(5, 10, 5, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.fillStyle = this.drivingMode == 'omnidireccional' ? GREEN_COLOR : LIGHT_GRAY_COLOR;
        this.ctx.arc(5, 30, 5, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawLockedScreen() {
        this.ctx.fillStyle = RED_COLOR;
        this.ctx.beginPath()
        this.ctx.rect(-this.containerWidth / 2, -25, this.containerWidth, 50);
        this.ctx.fill();
        this.ctx.fillStyle = WHITE_COLOR;
        this.ctx.font = `16px ${FONT}`;
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BLOQUEADO', 0, 0);
    }

    draw() {
        this.ctx.save();
        this.drawDrivingModes();
        this.ctx.translate(this.containerWidth / 2, this.containerHeight / 2 + 20);
        if (this.locked) {
            this.drawLockedScreen();
        } else {
            this.drawChassis();
            this.drawWheel(-this.halfWidth, -this.halfHeight, this.frontAngle, this.movingFrontWheels ? GREEN_COLOR : GRAY_COLOR);
            this.drawWheel(this.halfWidth, -this.halfHeight, this.frontAngle, this.movingFrontWheels ? GREEN_COLOR : GRAY_COLOR);
            let rearColor = GRAY_COLOR;
            if (this.drivingMode == 'omnidireccional') {
                if (!this.movingFrontWheels) {
                    rearColor = GREEN_COLOR;
                }
            } else {
                rearColor = RED_COLOR;
            }
            this.drawWheel(-this.halfWidth, this.halfHeight, this.rearAngle, rearColor);
            this.drawWheel(this.halfWidth, this.halfHeight, this.rearAngle, rearColor);
            if (this.moveForward) {
                this.drawArrow(0, -this.halfHeight, this.frontAngle, RED_COLOR);
            } else if (this.moveBackward) {
                this.drawArrow(0, this.halfHeight, this.rearAngle - 180, RED_COLOR);
            }

        }
        this.ctx.restore();
    }

    keyDown(event) {
        switch(event.key) {
            case 'ArrowUp':
                if (!this.locked) {
                    this.moveForward = true;
                    this.moveBackward = false;
                    event.preventDefault();
                }
                break;
            case 'ArrowDown':
                if (!this.locked) {
                    this.moveForward = false;
                    this.moveBackward = true;
                    event.preventDefault();
                }
                break;
            case 'ArrowLeft':
                if (!this.locked) {
                    this.decreaseAngle = true;
                    this.increaseAngle = false;
                    event.preventDefault();
                }
                break;
            case 'ArrowRight':
                if (!this.locked) {
                    this.decreaseAngle = false;
                    this.increaseAngle = true;
                    event.preventDefault();
                }
                break;
            case 'w':
            case 'W':
                this.leftSpeed = 50;
                this.rightSpeed = 50;
                break;
            case 's':
            case 'S':
                this.leftSpeed = -50;
                this.rightSpeed = -50;
                break;
            case 'a':
            case 'A':
                this.leftSpeed = 0;
                this.rightSpeed = 50;
                break;
            case 'd':
            case 'D':
                this.leftSpeed = 50;
                this.rightSpeed = 0;
                break;
        }
    }

    keyUp(event) {
        switch(event.key) {
            case 'ArrowUp': 
            case 'ArrowDown': 
                this.moveBackward = false;
                this.moveForward = false;
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                this.increaseAngle = false;
                this.decreaseAngle = false;
                event.preventDefault();
                break;
            case 'm':
            case 'M':
                if (this.drivingMode == 'ackermann') {
                    this.drivingMode = 'omnidireccional';
                } else {
                    this.drivingMode = 'ackermann';
                    this.movingFrontWheels = true;
                    this.rearAngle = 0;
                }
                break;
            case 'l':
            case 'L':
                this.locked = !this.locked;
                break;
            case 'c':
            case 'C':
                if (this.drivingMode == 'omnidireccional') {
                    this.movingFrontWheels = !this.movingFrontWheels;
                }
                break;
            case 'w':
            case 'W':
            case 's':
            case 'S':
            case 'a':
            case 'A':
            case 'd':
            case 'D':
                this.leftSpeed = 0;
                this.rightSpeed = 0;
        }
    }

}
