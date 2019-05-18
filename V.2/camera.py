#!/usr/bin/python3
# -*- coding: utf-8 -*-

import threading
import cv2
import time
import datetime
import os
import base64

class Camera():

    FONT_COLOR = (255, 255, 0)              # Defines the color of the font. Default is cyan.
    FONT = cv2.FONT_HERSHEY_SIMPLEX         # Font style for OpenCV.
    FONT_THICKNESS = 1                      # Font thickness parameter for OpenCV.
    FONT_SCALE = 0.6                        # Font scale parameter for OpenCV.

    def __init__(self, id, frameDimensions=(640, 480), frameRate=24, label='', verticalFlip=False):
        self.label = label
        self.verticalFlip = verticalFlip
        self.stopFlag = threading.Event()
        self.lock = threading.Lock()
        self.thread = None
        self.started = False
        self.stream = cv2.VideoCapture(id)
        self.stream.set(cv2.CAP_PROP_FRAME_WIDTH, frameDimensions[0])
        self.stream.set(cv2.CAP_PROP_FRAME_HEIGHT, frameDimensions[1])
        self.stream.set(cv2.CAP_PROP_FPS, frameRate)
        (self.grabbed, self.frame) = self.stream.read()

    def start(self):
        if self.started:
            return None
        self.started = True
        self.thread = threading.Thread(target=self.update, args=())
        self.thread.start()
        return self

    def drawText(self, frame, text, x0, y0):
        (width, height) = cv2.getTextSize(text, self.FONT, self.FONT_SCALE, self.FONT_THICKNESS)[0]
        boxCoords = (
            (x0, y0 - 5), 
            (x0 + width, y0 + height + 5)
        )
        cv2.rectangle(frame, boxCoords[0], boxCoords[1], (0, 0, 0), cv2.FILLED)
        cv2.putText(frame, text, (x0, y0 + height), self.FONT, fontScale=self.FONT_SCALE, color=self.FONT_COLOR, thickness=self.FONT_THICKNESS)

    def update(self):
        try:
            self.log('Starting camera: ' + self.label)
            while not self.stopFlag.is_set():
                (grabbed, frame) = self.stream.read()
                if self.verticalFlip:
                    frame = cv2.flip(frame, 1)
                date = datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S.%f')
                self.drawText(frame, date, 10, 15)
                self.lock.acquire()
                self.grabbed, self.frame = grabbed, frame
                self.lock.release()
        except Exception as e:
            print(e)
        self.log('Stoping camera: ' + self.label)

    def log(self, message):
        print(os.getpid(), message)

    def read(self):
        self.lock.acquire()
        frame = self.frame.copy()
        self.lock.release()
        return frame

    def stop(self):
        self.started = False
        self.stopFlag.set()
        self.thread.join()

    @staticmethod
    def encodeImage(frame, quality=100):
        _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
        binaryImage =  base64.b64encode(buffer)
        return binaryImage

    def __exit__(self, exc_type, exc_value, traceback) :
        self.stream.release()
    
if __name__ == "__main__":
    webcam = Camera(2, label='Vista Frontal').start()
    camera = Camera(0, label='Vista Trasera').start()
    cv2.namedWindow('main', cv2.WINDOW_AUTOSIZE)
    cv2.namedWindow('web', cv2.WINDOW_AUTOSIZE)
    while True:
        frame2 = webcam.read()
        frame = camera.read()
        cv2.imshow('main', frame)
        cv2.imshow('web', frame2)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
    camera.stop()
    webcam.stop()
    cv2.destroyAllWindows()