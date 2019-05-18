#!/usr/bin/python3
# -*- coding: utf-8 -*-

from dateutil.parser import parse
from dateutil.tz import gettz
from dateutil.tz import tzutc, tzlocal
from queue import Queue
from os import getpid
import numpy as np
import threading
import datetime
import serial
import time

class GPS(threading.Thread):

    R_EARTH = 6378137.0
    E = 0.08181919
    E_SQ = np.power(E, 2)
    LAT = 0
    LON = 1
    ALT = 2
    
    def __init__(self, serialPort, baudRate, debug=False):
        threading.Thread.__init__(self)
        self.debug = debug
        self.serialPort = serialPort
        self.baudRate = baudRate
        self.daemon = True
        self.stop = threading.Event()
        self.messageQ = Queue()
        self.commandQ = Queue()

        self.date = datetime.date.today()
        self.position = np.array([0, 0, 0], dtype=np.float)
        self.prevPosition = np.array([0, 0, 0], dtype=np.float)
        self.positionChanged = False
        self.timeSinceLastPositionChange = time.time()
        self.positionUpdateRate = 0
        
        self.totalDistance = np.array([[0], [0], [0]], dtype=np.float)
        self.velocity = np.array([0, 0, 0], dtype=np.float)
        self.acceleration = np.array([0, 0, 0], dtype=np.float)

        print(getpid(), 'Creating GPS...')

    def geodeticToECEF(self, position):

        latitude = np.deg2rad(position[self.LAT])   # phi
        longitude = np.deg2rad(position[self.LON])  # lambda
        altitude = position[self.ALT]

        ne = self.R_EARTH / np.sqrt(1 - self.E_SQ * np.power(np.sin(latitude), 2))
        
        return np.array([
            [(ne + altitude) * np.cos(latitude) * np.cos(longitude)],
            [(ne + altitude) * np.cos(latitude) * np.sin(longitude)],
            [(ne * (1 - self.E_SQ) + altitude) * np.sin(latitude)]
        ], dtype=np.float)

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

        return np.array([correctedLatitude, correctedLongitude, correctedAltitude], dtype=np.float)

    def getRotationMatrix(self, position):

        latitude = np.deg2rad(position[self.LAT])   # phi
        longitude = np.deg2rad(position[self.LON])  # lambda

        return np.array([
            [-np.sin(latitude) * np.cos(longitude), -np.sin(latitude) * np.sin(longitude), np.cos(latitude)],
            [-np.sin(longitude), np.cos(longitude), 0],
            [-np.cos(latitude) * np.cos(longitude), -np.cos(latitude) * np.sin(longitude), -np.sin(latitude)]
        ], dtype=np.float)

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

        self.velocity = deltaECEF/self.positionUpdateRate
        self.acceleration = self.velocity/self.positionUpdateRate

        self.totalDistance += np.absolute(np.matmul(rotationMatrix, deltaECEF))

        # print('\nNew Point: ')
        # print(np.matmul(self.rotationMatrix, deltaECEF))
        # print(deltaECEF)
        # print(self.position)
        #print(positionECEF)

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

                # Check that data was received.
                if all(payload[1:5]) and payload[8]:

                    # Store current stored position as previous.
                    # This will help determine if a change has occured.
                    self.prevPosition = self.position.copy()

                    # Update current position. Gps data is in NMEA format, convert it to geodetic.
                    self.position = self.nmeaToGeodetic(payload[1], payload[2], payload[3], payload[4], payload[8])

                    # Calculate the change in position
                    if np.linalg.norm(self.position - self.prevPosition) > 0.1:
                        
                        # Set change flag and calculate the time between position updates.
                        self.positionChanged = True
                        self.positionUpdateRate = time.time() - self.timeSinceLastPositionChange
                        self.timeSinceLastPositionChange = time.time()
                      

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

    def run(self):
        """
            Starts the execution of the thread. Called behind the scenes when
            gps.start() is called.
        """

        print(getpid(), 'Staring GPS...')

        # Wrapping the whole serial port inside of a try-except structure 
        # for handling connection errors.
        try:

            # Open the serial port with a 'with' statement. This ensures that
            # the port is always closed on exit and available when the application
            # restarts.
            with serial.Serial(port=self.serialPort, baudrate=self.baudRate, timeout=1) as gps:
                
                # Check if the stop flag has been set by the parent process.
                while not self.stop.is_set():
                    
                    # Read a new line from the gps, timeout is 1 second.
                    rawData = gps.readline()
                    if rawData:

                        # If data was obtained process it.
                        self.processData(rawData)
                        
                        # If the position changed send updated position to queue.
                        if self.positionChanged:
                            self.calculateBodyDynamics()
                            self.positionChanged = False
                            self.messageQ.put({
                                'position': self.position,
                                'positionUpdateRate': self.positionUpdateRate,
                                'distance': self.totalDistance,
                                'date': self.date.strftime("%m/%d/%Y %H:%M:%S"),
                                'velocity': self.velocity,
                                'acceleration': self.acceleration
                            })
                    
                    # Read commands from the parent thread.
                    while not self.commandQ.empty():
                        self.commandQ.get()
                        self.commandQ.task_done()

        except serial.serialutil.SerialException:

            # On an exception send message.
            print(getpid(), 'GPS communication can not be opened...')
            time.sleep(1)

        print(getpid(), 'Killing GPS...')

if __name__ == '__main__':
    gps = GPS('/dev/ttyUSB0', 4800, debug=True)
    gps.start()
    while gps.isAlive():
        try:
            while not gps.messageQ.empty():
                message = gps.messageQ.get()
                gps.messageQ.task_done()
                if message:
                    print('gps ->', message)
            time.sleep(0.2)
        except KeyboardInterrupt:
            break
    gps.stop.set()
    gps.join()