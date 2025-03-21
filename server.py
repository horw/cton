#!/usr/bin/env python3
"""
Simple HTTP Server for Chinese Tones Learning Website
"""

import http.server
import socketserver
import webbrowser
from pathlib import Path

# Configuration
PORT = 8081
DIRECTORY = Path(__file__).parent

class Handler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

def main():
    """Start the server and open the browser"""
    
    print(f"Starting server at http://localhost:{PORT}")
    print(f"Serving files from: {DIRECTORY}")
    print("Press Ctrl+C to stop the server")
    
    # Try to open the browser
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception as e:
        print(f"Could not open browser automatically: {e}")
        print(f"Please open http://localhost:{PORT} in your browser")
    
    # Start the server
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped by user")

if __name__ == "__main__":
    main()
