# Real-Time WebRTC Voice Bot Pipeline

## Overview
This project was built strictly following the provided Media Systems Challenge specification.
This project implements a real-time duplex voice pipeline using WebRTC and Node.js.

Architecture:

Browser Mic  
→ WebRTC  
→ Node Media Server  
→ Fake STT (Streaming)  
→ Bot Logic  
→ Fake TTS (Streaming PCM)  
→ WebRTC  
→ Browser Speaker  

## Features
→ WebRTC  
→ Node Media Server  
→ Fake STT (Streaming)  
→ Bot Logic  
→ Fake TTS (Streaming PCM)  
→ WebRTC  
→ Browser Speaker  

## Features

- Real-time PCM streaming (16kHz mono 16bit)
- 20ms audio framing
- Streaming Fake STT with VAD
- Streaming Fake TTS (tone generator)
- AbortController-based barge-in interruption
- Explicit session state machine
- Low latency (<20ms interruption)

## How To Run

Install:
`
npm install
`
Start server:
`
node server/server.js
`
Open browser:

http://localhost:3000

Click Start Call.

## Barge-In Test

1. Speak to trigger bot response
2. While bot audio is playing — speak again
3. Bot audio stops immediately

## Tech Stack

- Node.js
- WebRTC (wrtc)
- Express
- WebSocket
- AudioWorklet
- AbortController

No cloud STT/TTS APIs used.
