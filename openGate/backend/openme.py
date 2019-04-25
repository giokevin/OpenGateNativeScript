import RPi.GPIO as GPIO
from time import sleep

GPIO.setmode(GPIO.BCM)
pin = 18
GPIO.setup(pin, GPIO.OUT)
GPIO.setwarnings(False)

GPIO.output(pin,GPIO.HIGH)
sleep(0.5)
GPIO.output(pin,GPIO.LOW)
sleep(0.5)
GPIO.cleanup() 
	
print("Qua tutto a posto commander")
