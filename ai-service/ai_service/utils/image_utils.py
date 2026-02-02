"""
Image utility functions
"""
import base64
import tempfile
import os
import re
from pathlib import Path
from typing import Optional


def save_base64_image(base64_str: str, prefix: str = "face") -> str:
    """
    Save base64 image to temporary file
    
    Args:
        base64_str: Base64 encoded image string
        prefix: Prefix for temporary file name
        
    Returns:
        Path to temporary file
    """
    # Remove header if present (e.g., data:image/jpeg;base64,...)
    if ',' in base64_str:
        base64_str = base64_str.split(',', 1)[1]
    
    # Clean string
    base64_str = base64_str.strip()
    
    # Fix padding
    missing_padding = len(base64_str) % 4
    if missing_padding:
        base64_str += '=' * (4 - missing_padding)
    
    try:
        image_data = base64.b64decode(base64_str)
    except Exception as e:
        print(f"[ERROR] Base64 decode failed: {e}")
        print(f"[ERROR] Base64 snippet: {base64_str[:50]}...")
        raise ValueError("Invalid base64 string")

    fd, temp_path = tempfile.mkstemp(suffix='.jpg', prefix=prefix + '_')
    os.close(fd)
    
    with open(temp_path, 'wb') as f:
        f.write(image_data)
    
    return temp_path


def get_avatar_path(avatar_url: Optional[str], avatar_path: Optional[str], 
                   public_path: Optional[Path] = None) -> Optional[str]:
    """
    Get local file path from avatar URL or path
    
    Args:
        avatar_url: Avatar URL
        avatar_path: Avatar path
        public_path: Public directory path (for Laravel projects)
        
    Returns:
        Local file path if exists, None otherwise
    """
    if public_path is None:
        # Default to current directory
        public_path = Path.cwd()
    
    if avatar_path:
        clean_path = avatar_path.lstrip('/').lstrip('\\')
        local_path = public_path / clean_path
        if local_path.exists():
            return str(local_path)
    
    if avatar_url:
        match = re.search(r'[/\\]?(uploads[/\\]avatars[/\\][^?]+)', avatar_url)
        if match:
            relative_path = match.group(1).replace('\\', '/')
            local_path = public_path / relative_path
            if local_path.exists():
                return str(local_path)
    
    return None
