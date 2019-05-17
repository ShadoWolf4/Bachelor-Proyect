import threading
import cv2
import time

class CameraThreaded():

    def __init__(self, id):

        self.thread = threading.Thread(target=self.update, args=())
        self.stopFlag = threading.Event()
        self.lock = threading.Lock()

        self.stream = cv2.VideoCapture(id)
        (self.grabbed, self.frame) = self.stream.read()

    def start(self):
        self.thread.start()

    def update(self):
        while not self.stopFlag.is_set():
            (grabbed, frame) = self.stream.read()
            self.lock.acquire()
            self.grabbed, self.frame = grabbed, frame
            self.lock.release()

    def read(self):
        self.lock.acquire()
        frame = self.frame.copy()
        self.lock.release()
        return frame

    def stop(self):
        self.stopFlag.set()
        self.thread.join()
    
    
if __name__ == "__main__":
    camera = CameraThreaded(1)
    camera.start()
    while True:
        frame = camera.read()
        cv2.imshow('main', frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
    camera.stop()
    cv2.destroyAllWindows()