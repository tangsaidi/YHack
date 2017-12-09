#!/bin/sh

inotifywait -m `pwd` -e create -e moved_to |
	while read path action file; do
		if [[ "$file" = audio.wav ]]; then
			python3.6 measure.py audio.wav
		fi
	done
