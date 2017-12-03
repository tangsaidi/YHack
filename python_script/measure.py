# measure_wav_linux64.py
# Paul Boersma 2017-09-17
#
# A sample script that uses the Vokaturi library to extract the emotions from
# a wav file on disk. The file has to contain a mono recording.
#
# Call syntax:
#   python3 measure_wav_linux64.py path_to_sound_file.wav
#
# For the sound file hello.wav that comes with OpenVokaturi, the result should be:
#   Neutral: 0.760
#   Happy: 0.000
#   Sad: 0.238
#   Angry: 0.001
#   Fear: 0.000

import sys
import scipy.io.wavfile
from os import makedirs
from os.path import join, basename
import json

sys.path.append("api")
import Vokaturi

RESULTS_DIR = 'jsons'
makedirs(RESULTS_DIR, exist_ok=True)

print ("Loading library...")
Vokaturi.load("lib/Vokaturi_mac64.so")
print ("Analyzed by: %s" % Vokaturi.versionAndLicense())

print ("Reading sound file...")
file_name = sys.argv[1]
(sample_rate, samples) = scipy.io.wavfile.read(file_name)
print ("   sample rate %.3f Hz" % sample_rate)

print ("Allocating Vokaturi sample array...")
buffer_length = len(samples)
print ("   %d samples, %d channels" % (buffer_length, samples.ndim))
c_buffer = Vokaturi.SampleArrayC(buffer_length)
if samples.ndim == 1:  # mono
	c_buffer[:] = samples[:] / 32768.0
else:  # stereo
	c_buffer[:] = 0.5*(samples[:,0]+0.0+samples[:,1]) / 32768.0

print ("Creating VokaturiVoice...")
voice = Vokaturi.Voice (sample_rate, buffer_length)

print ("Filling VokaturiVoice with samples...")
voice.fill(buffer_length, c_buffer)

print ("Extracting emotions from VokaturiVoice...")
quality = Vokaturi.Quality()
emotionProbabilities = Vokaturi.EmotionProbabilities()
voice.extract(quality, emotionProbabilities)

if quality.valid:
    myjson = [{"Neutral": emotionProbabilities.neutrality},
    {"Happy":  emotionProbabilities.happiness},
    {"Sad": emotionProbabilities.sadness},
    {"Angry":  emotionProbabilities.anger},
    {"Fear": emotionProbabilities.fear}]


else:
	print ("Not enough sonorancy to determine emotions")

jpath = join(RESULTS_DIR, 'whatever' + '.json')
with open(jpath, 'w') as f:
    datatxt = json.dumps(myjson, indent=2)
        # print("Wrote", len(datatxt), "bytes to", jpath)
    f.write(datatxt)


voice.destroy()
