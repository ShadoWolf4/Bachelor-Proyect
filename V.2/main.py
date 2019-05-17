#!/usr/bin/python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, abort, send_file, redirect
from flask_socketio import SocketIO, disconnect
from jinja2 import TemplateNotFound
from camera import Camera
import datetime
import subprocess
import time
import sys
import os

frontCamera = Camera(0, label='Frontal').start()
rearCamera = Camera(1, label='Trasera').start()

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
    try:
        socketio.stop()
    except SystemExit:
        subprocess.run(['kill', '%d' % os.getpid()])

@socketio.on('message')
def handleMessage(payload):
    print(payload)
    
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=False)