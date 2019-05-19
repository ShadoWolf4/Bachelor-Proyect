#!/usr/bin/python3
# -*- coding: utf-8 -*-

from dateutil.tz import tzutc, tzlocal
from dateutil.parser import parse
from dateutil.tz import gettz
from queue import Queue
import numpy as np
import threading
import datetime
import serial
import time
import os

class GPS():

    R_EARTH = 6378137.0
    E = 0.08181919
    E_SQ = np.power(E, 2)
    LAT = 0
    LON = 1
    ALT = 2

    def __init__(self, serialPort, baudRate):

        self.serialPort = serialPort
        self.baudRate = baudRate
        
        self.started = False
        self.thread = None
        self.lock = threading.Lock()
        self.stopFlag = threading.Event()

        self.date = datetime.date.today()
        self.isGPSFixed = False
        self.position = np.zeros((3))
        self.prevPosition = np.zeros((3))
        self.positionUpdateRate = 0
        self.timeSinceLastPositionUpdate = time.time()
        self.satellites = 0
        self.distance = np.zeros((3, 1))
        self.velocity = np.zeros((3, 1))
        self.acceleration = np.zeros((3, 1))

        self.latestStatus = {
            'position': self.position.tolist(),
            'distance': self.distance[:,0].tolist(),
            'velocity': self.velocity[:,0].tolist(),
            'acceleration': self.acceleration[:,0].tolist(),
            'fix': self.isGPSFixed,
            'satellites': self.satellites,
            'date': self.date.strftime("%m/%d/%Y %H:%M:%S")
        }

    def start(self):
        if self.started:
            return None
        self.started = True
        self.thread = threading.Thread(target=self.update, args=())
        self.thread.start()
        return self

    def stop(self):
        self.started = False
        self.stopFlag.set()
        self.thread.join()

    def read(self):
        self.lock.acquire()
        status = self.latestStatus
        self.lock.release()
        return status

    def log(self, message):
        print(os.getpid(), message)

    def update(self):
        self.log('Starting gps')
        try:
            with serial.Serial(port=self.serialPort, baudrate=self.baudRate, timeout=1) as gps:
                while not self.stopFlag.is_set():
                    rawData = gps.readline()
                    if rawData:
                        self.processData(rawData)
                        status = {
                            'position': self.position.tolist(),
                            'distance': self.distance[:,0].tolist(),
                            'velocity': self.velocity[:,0].tolist(),
                            'acceleration': self.acceleration[:,0].tolist(),
                            'fix': self.isGPSFixed,
                            'satellites': self.satellites,
                            'date': self.date.strftime("%m/%d/%Y %H:%M:%S")
                        }
                        self.lock.acquire()
                        self.latestStatus = status
                        self.lock.release()
        except Exception as e:
            print(e)
        self.log('Stoping gps')

    def geodeticToECEF(self, position):
        latitude = np.deg2rad(position[self.LAT])   # phi
        longitude = np.deg2rad(position[self.LON])  # lambda
        altitude = position[self.ALT]
        ne = self.R_EARTH / np.sqrt(1 - self.E_SQ * np.power(np.sin(latitude), 2))
        return np.array([
            [(ne + altitude) * np.cos(latitude) * np.cos(longitude)],
            [(ne + altitude) * np.cos(latitude) * np.sin(longitude)],
            [(ne * (1 - self.E_SQ) + altitude) * np.sin(latitude)]
        ])

    def nmeaToGeodetic(self, latitude, latitudeDirection, longitude, longitudeDirection, altitude):

        # Convert NMEA latitude to geodetic latitude.
        latitudeHours = int(float(latitude) / 100.0)
        latitudeMinutes = (float(latitude) % 100.0) / 60.0
        correctedLatitude = latitudeHours + latitudeMinutes
        if latitudeDirection == 'S':
            correctedLatitude *= -1

        # Convert NMEA longitude to geodetic longitude.
        longitudeHours = int(float(longitude) / 100.0)
        longitudeMinutes = (float(longitude) % 100.0) / 60.0
        correctedLongitude = longitudeHours + longitudeMinutes
        if longitudeDirection == 'W':
            correctedLongitude *= -1

        # Process altitude. Result is in meters.
        correctedAltitude = float(altitude) 

        return np.array([correctedLatitude, correctedLongitude, correctedAltitude])

    def getRotationMatrix(self, position):
        latitude = np.deg2rad(position[self.LAT])   # phi
        longitude = np.deg2rad(position[self.LON])  # lambda
        return np.array([
            [-np.sin(latitude) * np.cos(longitude), -np.sin(latitude) * np.sin(longitude), np.cos(latitude)],
            [-np.sin(longitude), np.cos(longitude), 0],
            [-np.cos(latitude) * np.cos(longitude), -np.cos(latitude) * np.sin(longitude), -np.sin(latitude)]
        ])

    def calculateBodyDynamics(self):
        """
            self.position [lat, lon, alt]
            self.prevPosition [lat, lon, alt]
            self.timeSinceLastPositionChange [seconds]
        """

        if np.linalg.norm(self.prevPosition) == 0:
            self.prevPosition = self.position.copy()

        prevPositionECEF = self.geodeticToECEF(self.prevPosition)
        rotationMatrix = self.getRotationMatrix(self.prevPosition)

        positionECEF = self.geodeticToECEF(self.position)

        deltaECEF = positionECEF - prevPositionECEF

        self.distance += np.absolute(np.matmul(rotationMatrix, deltaECEF))
        self.velocity = deltaECEF / self.positionUpdateRate
        self.acceleration = self.velocity / self.positionUpdateRate
        
    def processData(self, raw):
        """
            Processes the raw data obtained by the gps serial interface. The data obtained
            consists of several message types which after being identified, must be stripped
            and parsed to obatin relevant data.
            - Time and date
            - Latitude
            - Longitude
            - Altitude
        """

        # Remove new line characters, convert to utf-8 characters and split the string
        # by commas. Make sure that data was received.
        data = raw.strip().decode('utf-8', errors='ignore').split(',')
        if data:
            
            # Obtain the first column of the message to sort them out.
            messageType = data[0]

            # Store the rest of the payload in a separate variable.
            payload = data[1:]

            if messageType == '$GPGGA':
                # Latitude, longitude and altitude are obtained form this message.
                # Latitude is column 1 from payload, value must be divided by 100 to get degrees.
                # Latitude direction is column 2 from payload, value is 'S' or 'N'
                # Latitude is column 3 from payload, value must be divided by 100 to get degrees.
                # Latitude direction is column 4 from payload, value is 'W' or 'E'
                # Altitude is column 9 from payload, value is in meters.
                # Fix status is column 5 from payload, 0 is no fix, 1 is fixed.

                # Check if the gps has fixed on some satellites.
                if payload[5]:
                    self.isGPSFixed = payload[5] == '1'

                # Get the amount of satellites available.
                if payload[6]:
                    self.satellites = int(payload[6])
                
                # Check that data was received.
                if all(payload[1:5]) and payload[8]:

                    # Store current stored position as previous.
                    # This will help determine if a change has occured.
                    self.prevPosition = self.position.copy()

                    # Update current position. Gps data is in NMEA format, convert it to geodetic.
                    self.position = self.nmeaToGeodetic(payload[1], payload[2], payload[3], payload[4], payload[8])

                    # Calculate the time elapsed between gps position messages
                    self.positionUpdateRate = time.time() - self.timeSinceLastPositionUpdate
                    self.timeSinceLastPositionUpdate = time.time()

                    # Calculate distance traveled, velocity, and acceleration
                    self.calculateBodyDynamics()

            elif messageType == '$GPRMC':
                # Time and date data is obtained from this message.
                # Time is column 0 from payload, format is HMS
                # Date is column 8 from payload, format is MDY
                
                # Check that both columns were received.
                if payload[0] and payload[8]:

                    # Obtain the current time and date from the gps module.
                    # Parse object expects first the date and then the time.
                    # The time obtained by the gps is in UTC time.
                    utcDate = parse('%s %s UTC' % (payload[8], payload[0]), dayfirst=True)
                    
                    # Convert the utc date to the local time zone in the system.
                    self.date = utcDate.astimezone(tzlocal())

if __name__ == "__main__":
    gps = GPS('/dev/ttyUSB0', 4800).start()
    try:
        while True:
            data = gps.read()
            time.sleep(1.0/24)
    except KeyboardInterrupt:
        pass
    gps.stop()