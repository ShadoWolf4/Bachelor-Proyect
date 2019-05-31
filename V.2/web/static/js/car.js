//This code is for the Canvas Section

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

        //Max and Min Angles of the direction of the Wheels
        //This would change when we have the Ackerman Code
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
        this.maxSpeed = 100;
        this.rightSpeed = 0;
    }

    //Resice the height and width of the Canvas
    resize(width, height) {
        this.containerWidth = width;
        this.containerHeight = height;
    }

    //Compares the Anlge of the direction witht the Max or the Min Angles
    constrain(value, min, max) {
        if (value < min) {
            return min;
        } else if (value > max) {
            return max;
        } else {
            return value;
        }
    }

    //Update the angle od the wheels
    update() {
        // If we are selection the front wheels, we can move them and make a comparision with the Min and Max
        if (this.movingFrontWheels) {
            if (this.increaseAngle) this.frontAngle += 1;
            if (this.decreaseAngle) this.frontAngle -= 1;
            this.frontAngle = this.constrain(this.frontAngle, this.minAngle, this.maxAngle);
        } else {
            //Move the back wheels with a comparision of the Min and Max
            if (this.increaseAngle) this.rearAngle += 1;
            if (this.decreaseAngle) this.rearAngle -= 1;
            this.rearAngle = this.constrain(this.rearAngle, this.minAngle, this.maxAngle);
        }
    }

    //Function to draw the arrow in case we selec the Key UP or Key Down
    drawArrow(x0, y0, angle, color) {
        
        //Size Configuration
        let length = 30;
        let headSize = 15;
        let headHeight = headSize * SIN_60;
        this.ctx.save();
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';

        //Direction Configuration
        this.ctx.translate(x0, y0);
        this.ctx.rotate(angle * DEG_TO_RAD);
        this.ctx.beginPath();
        
        //Color of the Arrow
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        
        //Movement of the Arrow
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

    //Section for the image of the Wheels
    drawWheel(x, y, angle, color) {
        
        //Size Configuration
        let length = 30;
        this.ctx.save();
        this.ctx.translate(x, y);

        //Angle Configuration
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

        //Font and color
        this.ctx.font = `12px ${FONT}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = GRAY_COLOR;

        //Show Text of actual Angel
        if (x > 0) {
            this.ctx.fillText(`${Math.floor(angle)}°`, x + 30, y);
        } else {
            this.ctx.fillText(`${Math.floor(angle)}°`, x - 30, y);
        }
    }

    //section to Draw the Chasis of the Model of the CAR
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

    //Draw the Menu and the circles to know in which section we are on
    drawDrivingModes() {
        this.ctx.font = `14px ${FONT}`;
        this.ctx.fillStyle = GRAY_COLOR;
        this.ctx.textBaseline = 'middle';

        // Text for the Menu
        this.ctx.fillText('Ackermann', 20, 10);
        this.ctx.fillText('Omindireccional', 20, 30);
        this.ctx.beginPath();
        
        //In Case we Have a Selected Section would change the circle to green
        this.ctx.fillStyle = this.drivingMode == 'ackermann' ? GREEN_COLOR : LIGHT_GRAY_COLOR;
        this.ctx.arc(5, 10, 5, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.fillStyle = this.drivingMode == 'omnidireccional' ? GREEN_COLOR : LIGHT_GRAY_COLOR;
        this.ctx.arc(5, 30, 5, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    // Draw the Locked Section, so the user can do anything
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

    //Function that starts teh Drawing of the Chasis, Wheels, Arrows, Locks, and Menu
    draw() {
        this.ctx.save();
        this.drawDrivingModes();
        this.ctx.translate(this.containerWidth / 2, this.containerHeight / 2 + 20);

        //If locked is selected, call Lock and stop any other process
        if (this.locked) {
            this.drawLockedScreen();
        } else {

            //Else, shows the image of the chasis and wheels, with the Angles
            this.drawChassis();
            this.drawWheel(-this.halfWidth, -this.halfHeight, this.frontAngle, this.movingFrontWheels ? GREEN_COLOR : GRAY_COLOR);
            this.drawWheel(this.halfWidth, -this.halfHeight, this.frontAngle, this.movingFrontWheels ? GREEN_COLOR : GRAY_COLOR);
            let rearColor = GRAY_COLOR;

            //If Ominidirecciontal is selected, we can now select the rear wheels, and they now appear in red color
            if (this.drivingMode == 'omnidireccional') {
                if (!this.movingFrontWheels) {
                    rearColor = GREEN_COLOR;
                }
            } else {
                rearColor = RED_COLOR;
            }
            this.drawWheel(-this.halfWidth, this.halfHeight, this.rearAngle, rearColor);
            this.drawWheel(this.halfWidth, this.halfHeight, this.rearAngle, rearColor);

            //If we move forward, draw the arrow
            if (this.moveForward) {
                this.drawArrow(0, -this.halfHeight, this.frontAngle, RED_COLOR);
            } else if (this.moveBackward) {
                this.drawArrow(0, this.halfHeight, this.rearAngle - 180, RED_COLOR);
            }

        }
        this.ctx.restore();
    }

        //In case of any key is being activated or selected
    keyDown(event) {
        switch(event.key) {

            //If key Arrow UP is selected, shows the move forward arrow
            case 'ArrowUp':
                if (!this.locked) {
                    this.moveForward = true;
                    this.moveBackward = false;
                    event.preventDefault();
                }
                break;

            //If key Arrow Down is selected, shows the move backward arrow
            case 'ArrowDown':
                if (!this.locked) {
                    this.moveForward = false;
                    this.moveBackward = true;
                    event.preventDefault();
                }
                break;
            
            //If the Arrow Left is selected, Change increase the left angle of the wheels
            case 'ArrowLeft':
                if (!this.locked) {
                    this.decreaseAngle = true;
                    this.increaseAngle = false;
                    event.preventDefault();
                }
                break;

            //If the Arrow Right is selected, Change increase the right angle of the wheels
            case 'ArrowRight':
                if (!this.locked) {
                    this.decreaseAngle = false;
                    this.increaseAngle = true;
                    event.preventDefault();
                }
                break;
            
            //This section is for the control of the vehicle, is not part of this proyect
            //We used it to change the velocidity of the Vehicle a student borrows us to make test
            case 'w':
            case 'W':
                this.leftSpeed = this.maxSpeed;
                this.rightSpeed = this.maxSpeed;
                break;
            case 's':
            case 'S':
                this.leftSpeed = -this.maxSpeed;
                this.rightSpeed = -this.maxSpeed;
                break;
            case 'a':
            case 'A':
                this.leftSpeed = 0;
                this.rightSpeed = this.maxSpeed;
                break;
            case 'd':
            case 'D':
                this.leftSpeed = this.maxSpeed;
                this.rightSpeed = 0;
                break;
        }
    }

    // In case the selected key is up. Chane everything to default
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

            //This is to change the Menu selection
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
            
            //This is to lock the screen at the mooent the key is up
            case 'l':
            case 'L':
                this.locked = !this.locked;
                break;
            
            //This is to change the wheels we are selecting
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
