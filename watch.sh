#!/bin/sh

inotifywait -m ~ -e create -e moved_to |
	while read path action file; do
		if [[ "$file" = audio.wav ]]; then
			python3 measure.py audio.wav
		fi
	done