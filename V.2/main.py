#!/usr/bin/python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, abort, send_file, redirect
from flask_socketio import SocketIO, disconnect
from jinja2 import TemplateNotFound
from camera import Camera
from gps import GPS
import subprocess
import datetime
import time
import sys
import os

frameDimensions = (640, 480)
frameRate = 24
frameQuality = 50

gps = GPS('/dev/ttyUSB0', 4800).start()
frontCamera = Camera(0, frameDimensions, frameRate, label='Frontal', verticalFlip=False).start()
rearCamera = Camera(1, frameDimensions, frameRate, label='Trasera', verticalFlip=False).start()

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

@app.route('/basic/<zoom>/<x>/<y>.png')
def sendMap(zoom, x, y):
    possibleImage = os.path.join('maps/basic/' + zoom, x, y + '.png')
    if (os.path.exists(possibleImage)):
        return send_file(possibleImage, mimetype='image/png')
    else:
        abort(404)

@app.route('/')
def index():
    return redirect(homepage['url'])

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
    
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=80, debug=False)