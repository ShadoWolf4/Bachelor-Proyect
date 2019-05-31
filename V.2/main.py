#!/usr/bin/python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, abort, send_file, redirect
from flask_socketio import SocketIO, disconnect
from jinja2 import TemplateNotFound
from camera import Camera
from car import Car
from gps import GPS
import subprocess
import datetime
import time
import sys
import os

frameDimensions = (640, 480)
frameRate = 16
frameQuality = 30
carEnabled = False

#Initialize all the sensors 
gps = GPS('COM7', 4800).start()
time.sleep(1)
if carEnabled:
    car = Car('/dev/ttyAMA0', 115200, debug=True)
    car.start()
time.sleep(1)
frontCamera = Camera(0, frameDimensions, frameRate, label='Frontal', verticalFlip=False).start()
time.sleep(1)
rearCamera = Camera(1, frameDimensions, frameRate, label='Trasera', verticalFlip=False).start()
time.sleep(1)

#Vairable for the Current Time
currentYear = datetime.datetime.now().strftime("%Y")


templateData = {
    'name': 'Vehículo Agrónomo',
    'copyright': 'Copyright © %s Departamento de Física y Matemáticas | Universidad de Monterrey' % currentYear,
    'navigation': {
        'analitica': {
            'name': 'Analítica',
            'url': 'analitica.html',
            'icon': 'fa-tachometer-alt'
        },
        'control': {
            'name': 'Control',
            'url': 'control.html',
            'icon': 'fa-cogs'
        },
        'intrucciones':{
            'name': 'Instrucciones',
            'url': 'instrucciones.html',
            'icon': 'fa-info-circle'
        }
    }
}
homepage = templateData['navigation']['analitica']

app = Flask(__name__, static_url_path='', static_folder='web/static', template_folder='web/templates')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SECRET_KEY'] = 'JORGEMARGAINKEY'

socketio = SocketIO(app)

def log(message):
    print(os.getpid(), message)

#Flask for the GPS
@app.route('/basic/<zoom>/<x>/<y>.png')
def sendMap(zoom, x, y):
    #Searchs for the path of each tile and the image of the GPS
    possibleImage = os.path.join('maps/basic/' + zoom, x, y + '.png')
    if (os.path.exists(possibleImage)):
        #If the image exists, then send it to the map
        return send_file(possibleImage, mimetype='image/png')
    else:
        abort(404)

#Main Flask, to redirect the user to the homepage
@app.route('/')
def index():
    return redirect(homepage['url'])


#Flask used to change the actual page or Html that we are on
@app.route('/<page>')
def htmlLookup(page):
    active = None
    for key, value in templateData['navigation'].items():
        if value['url'] == page:
            active = templateData['navigation'][key]
            break
    if active:
        return render_template(page, data=templateData, active=active)
    else:
        abort(404)

@app.errorhandler(404)
def pageNotFound(error):
    return "Not found."

#When the button shutdown is selected, the system starts to kill the process of the sensor. Ona at a time
@socketio.on('shutdown')
def handleShutdown(payload):
    log('Starting shutdown process...')
    frontCamera.stop()
    rearCamera.stop()
    gps.stop()
    try:
        socketio.stop()
    except SystemExit:
        subprocess.run(['kill', '%d' % os.getpid()])

#This Socket is for the comunication with the camera, and the movement of the car
@socketio.on('message')
def handleMessage(payload):
    if frontCamera.started and rearCamera.started and gps.started:
        frontCameraBytes = Camera.encodeImage(frontCamera.read(), quality=frameQuality)
        rearCameraBytes = Camera.encodeImage(rearCamera.read(), quality=frameQuality)
        socketio.emit('message', {
            'frontCamera': frontCameraBytes,
            'rearCamera': rearCameraBytes,
            'gps': gps.read()
        })
    #this is for the velocity and control of the vehicle.
    #The system is reci
    if payload:
        keys = payload.keys()
        if ('left' in keys and 'right' in keys):
            left = payload['left']
            right = payload['right']
        else:
            left = 0
            right = 0
        command = 'VEL %d %d' % (int(left), int(right))
        print(command)
        if carEnabled:
            car.commandQ.put(command)
        
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=False)