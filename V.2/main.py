#!/usr/bin/python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, abort, send_file
from flask_socketio import SocketIO, disconnect
import subprocess
import time
import sys
import os

app = Flask(__name__, static_url_path='', static_folder='web/static', template_folder='web/templates')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SECRET_KEY'] = 'JORGEMARGAINKEY'

socketio = SocketIO(app)

@app.errorhandler(404)
def pageNotFound(error):
    return "Not found."

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)