#!/usr/bin/env python3
"""
MEENA // Takahara Academy Neural Speech Synthesis Daemon (Edge-TTS)
Asynchronous server running on DietPi for natural bilingual English & Malay TTS
"""

import asyncio
import os
import hashlib
import re
from aiohttp import web
import edge_tts

CACHE_DIR = "/tmp/bmb20_tts"
os.makedirs(CACHE_DIR, exist_ok=True)

VOICE_MAP = {
    "jenny": "en-US-JennyNeural",
    "aria": "en-US-AriaNeural",
    "sonia": "en-GB-SoniaNeural",
    "guy": "en-US-GuyNeural",
    "yasmin": "ms-MY-YasminNeural",
    "osman": "ms-MY-OsmanNeural"
}

MALAY_PATTERN = re.compile(
    r'\b(siapa|siapakah|apa|apakah|apa itu|bila|bilakah|mana|kat mana|di mana|dimana|kenapa|mengapa|'
    r'macam mana|bagaimana|bagaimanakah|berapa|berapakah|tolong|carikan|cari|pelakon|barisan pelakon|'
    r'watak|sinopsis|tentang|maksud|definisi|cuaca|pukul berapa|jam berapa|hari ini|tarikh|jadual|'
    r'bersihkan|padam|kemaskini|filem|terangkan|jelaskan|ceritakan|berdasarkan|maklumat|rasmi|'
    r'termasuklah|sebagai|adalah|saya|awak|kamu|anda)\b',
    re.IGNORECASE
)

async def handle_tts(request):
    text = request.query.get('text', '').strip()
    if not text:
        return web.json_response({'status': 'error', 'message': 'Empty text'}, status=400)

    voice_req = request.query.get('voice', '').strip().lower()
    if not voice_req:
        voice = 'ms-MY-YasminNeural' if MALAY_PATTERN.search(text) else 'en-US-JennyNeural'
    else:
        voice = VOICE_MAP.get(voice_req, request.query.get('voice', 'en-US-JennyNeural'))

    rate = request.query.get('rate', '+0%')
    pitch = request.query.get('pitch', '+0Hz')

    clean_text = re.sub(r'[#*_`~]', '', text)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()

    h = hashlib.md5(f"{voice}_{rate}_{pitch}_{clean_text}".encode('utf-8')).hexdigest()
    cache_path = os.path.join(CACHE_DIR, f"{h}.mp3")

    if not os.path.exists(cache_path) or os.path.getsize(cache_path) < 100:
        try:
            communicate = edge_tts.Communicate(clean_text, voice, rate=rate, pitch=pitch)
            await communicate.save(cache_path)
        except Exception as e:
            return web.json_response({'status': 'error', 'message': str(e)}, status=500)

    if os.path.exists(cache_path) and os.path.getsize(cache_path) >= 100:
        response = web.FileResponse(cache_path)
        response.headers['Content-Type'] = 'audio/mpeg'
        response.headers['Cache-Control'] = 'public, max-age=86400'
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    else:
        return web.json_response({'status': 'error', 'message': 'Synthesis failed'}, status=500)

async def handle_health(request):
    return web.json_response({'status': 'online', 'service': 'MEENA Neural Speech Daemon'})

def init_app():
    app = web.Application()
    app.router.add_get('/tts', handle_tts)
    app.router.add_get('/api/tts', handle_tts)
    app.router.add_get('/health', handle_health)
    return app

if __name__ == '__main__':
    app = init_app()
    web.run_app(app, host='0.0.0.0', port=8088)
