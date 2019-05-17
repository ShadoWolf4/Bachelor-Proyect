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
        self.process = multiprocessing.Process(target=self.run, args=())
        self.process.daemon = False
        self.log('Creating camera...')

    def run(self):
        self.log('Starting camera...')
        camera1 = None
        camera2 = None
        try:
            camera1 = cv2.VideoCapture(1)
            # camera2 = cv2.VideoCapture(2)
            # camera1.set(cv2.CAP_PROP_FRAME_WIDTH, self.frameDimensions[0])
            # camera1.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frameDimensions[1])
            # camera1.set(cv2.CAP_PROP_FPS, self.frameRate)
            # camera2.set(cv2.CAP_PROP_FRAME_WIDTH, self.frameDimensions[0])
            # camera2.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frameDimensions[1])
            # camera2.set(cv2.CAP_PROP_FPS, self.frameRate)
            while not self.stop.is_set():
                ret1, frame1 = camera1.read()
                # ret2, frame2 = camera2.read()
                if ret1:
                    self.imageQ.put({
                        'camera1': frame1
                    })
        except KeyboardInterrupt:
            pass
        except Exception as e:
            print(e)
        if camera1 is not None:
            camera1.release()
        if camera2 is not None:
            camera2.release()
        self.log('Closing camera...')

    def log(self, message):
        print(os.getpid(), message)

if __name__ == "__main__":
    camera = Camera()
    camera.process.start()
    cv2.namedWindow('Cam 1', cv2.WINDOW_AUTOSIZE)
    # cv2.namedWindow('Cam 2', cv2.WINDOW_AUTOSIZE)
    try:
        while True:
            images = None
            while not camera.imageQ.empty():
                images = camera.imageQ.get()
            if images is not None:
                print(images['camera1'])
                cv2.imshow('Cam 1', images['camera1'])
                # cv2.imshow('Cam 2', images['camera2'])
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    except KeyboardInterrupt:
        pass

    cv2.destroyAllWindows()
    camera.stop.set()

    # Wait for camera to be dead.
    waitTime = 0
    print(os.getpid(), 'Waiting for Camera to die...')
    while camera.process.is_alive() or waitTime < 5:
        time.sleep(1)
        waitTime += 1




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