#!/usr/bin/python3
# -*- coding: utf-8 -*-

from flask_socketio import SocketIO, disconnect
from flask import Flask, render_template, abort, send_file
from gps import GPS
from car import Car
import os
import time
import subprocess
import sys

latestStatus = {
    'position': [-1, -1, -1],
    'positionChanged': False,
    'distance': [0, 0, 0],
    'date': -1
}
car = None
gps = None

app = Flask(__name__, static_url_path='', static_folder='static', template_folder='templates')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SECRET_KEY'] = 'JORGEMARGAINKEY'

socketio = SocketIO(app)

def initCar():
    """
        Makes sure that a connection to the car is established.
    """

    global car

    # If the gps has not yet been initialized start it.
    if car is None:
        car = Car('/dev/ttyAMA0', 115200, debug=False)
        car.start()

    # Otherwise if the gps thread has died, start it again.
    elif not car.isAlive():
        car = None
        initCar()

def initGPS():
    """
        Makes sure that a connection to the gps is established.
    """

    global gps

    # If the gps has not yet been initialized start it.
    if gps is None:
        gps = GPS('/dev/ttyUSB0', 4800, debug=False)
        gps.start()

    # Otherwise if the gps thread has died, start it again.
    elif not gps.isAlive():
        gps = None
        initGPS()

@app.route('/basic/<zoom>/<x>/<y>.png')
def sendMap(zoom, x, y):
    """
        Map tile server. Checks if the tile exists and sends it back to the client.
        If the tile does not exist fire a 404 error.
    """

    possibleImage = os.path.join('maps/basic/' + zoom, x, y + '.png')
    if (os.path.exists(possibleImage)):
        return send_file(possibleImage, mimetype='image/png')
    else:
        abort(404)

@app.errorhandler(404)
def pageNotFound(error):
    """
        404 error handler. Caused when the client trys to load a file that does not
        exist.
    """

    return "Not found."

@app.route('/')
def index():
    """
        When a new connection occurs, send the main index file.
    """

    return render_template('index.html')

@socketio.on('message')
def handleMessage(message):
    """
        Handle messages received by the client.
    """

    # Make sure that the gps object is created/alive.
    global gps, car, latestStatus
    initGPS()
    initCar()

    def comGPSToServer():
        """
            Receives data from the gps -> server.
        """

        # Get the latest position from the gps.
        position = None
        distance = None
        velocity = None
        acceleration = None
        while not gps.messageQ.empty():
            message = gps.messageQ.get()
            position = message['position']
            distance = message['distance']
            date = message['date']
            velocity = message['velocity']
            acceleration = message['acceleration']

        # Srtore the latest position.
        if position is not None:
            latestStatus['positionChanged'] = True
            latestStatus['position'] = [x for x in position]
            latestStatus['distance'] = [x[0] for x in distance]
            latestStatus['date'] = date
            latestStatus['velocity'] = [x[0] for x in velocity]
            latestStatus['acceleration'] = [x[0] for x in acceleration]
        else:
            latestStatus['positionChanged'] = False
            

    def comServerToClient():
        """
            Sends data from the server -> client.
        """

        socketio.emit('status', latestStatus)

    def comServerToCar():
        """
            Sends data from the server -> car.
        """

        # Send commanded speed to the car.        
        command = 'VEL %d %d' % (message['leftSpeed'], message['rightSpeed'])
        car.commandQ.put(command)

    # Hanlde communications with the gps.
    comGPSToServer()

    # Handle communications with the car controller.
    comServerToCar()

    # Send data back to the client.
    comServerToClient()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=False)