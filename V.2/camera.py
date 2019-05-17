#!/usr/bin/python3
# -*- coding: utf-8 -*-

import multiprocessing
import numpy as numpy
import base64
import time
import os
from io import BytesIO
import cv2

class Camera():

    def __init__(self, frameDimensions=(480, 320), frameRate=20):
        self.frameDimensions = frameDimensions
        self.frameRate = frameRate
        self.imageQ = multiprocessing.Queue() 
        self.stop = multiprocessing.Event()
        self.exited = multiprocessing.Event()
        self.process = multiprocessing.Process(target=self.run, args=())
        self.process.daemon = True
        self.log('Creating camera...')

    def run(self):
        self.log('Starting camera...')
        frontCamera = cv2.VideoCapture(2)
        time.sleep(2)
        try:
            while not self.stop.is_set():
                (grabbed, front) = frontCamera.read()
                if grabbed:
                    self.imageQ.put(front)
        except KeyboardInterrupt:
            pass
        frontCamera.release()
        self.exited.set()
        self.log('Closing camera...')

    def log(self, message):
        print(os.getpid(), message)

if __name__ == "__main__":
    camera = Camera()
    camera.process.start()
    cv2.namedWindow('main', cv2.WINDOW_AUTOSIZE)
    try:
        while True:
            while not camera.imageQ.empty():
                image = camera.imageQ.get()
                if not image.empty():
                    cv2.imshow('main', image)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
    except KeyboardInterrupt:
        pass
    cv2.destroyAllWindows()
    camera.stop.set()

    while not camera.exited.is_set():
        print('Waiting for camera to exit...')
        time.sleep(1)

#     import numpy as np
# import cv2

# video_capture_0 = cv2.VideoCapture(2)
# video_capture_1 = cv2.VideoCapture(1)

# while True:
#     # Capture frame-by-frame
#     ret0, frame0 = video_capture_0.read()
#     ret1, frame1 = video_capture_1.read()

#     if (ret0):
#         # Display the resulting frame
#         cv2.imshow('Cam 0', frame0)

#     if (ret1):
#         # Display the resulting frame
#         cv2.imshow('Cam 1', frame1)

#     if cv2.waitKey(1) & 0xFF == ord('q'):
#         break

# # When everything is done, release the capture
# video_capture_0.release()
# video_capture_1.release()
# cv2.destroyAllWindows()