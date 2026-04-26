import os
import shutil

src_dir = r'C:\Users\Dell\Downloads\kimichat'
dst_dir = r'd:\Project\kimichat'

exclude_files = [
    r'client\src\utils\api.js',
    r'client\src\utils\socket.js',
    r'client\src\pages\Auth.jsx',
    r'client\src\components\profile\ProfilePanel.jsx',
    r'server\routes\auth.js',
    r'server\routes\users.js',
    r'server\routes\community.js',
    r'server\config\passport.js',
    r'server\index.js',
    r'client\vite.config.js',
    r'client\package.json',
    r'package.json',
    r'vercel.json',
    r'client\vercel.json',
    r'client\public\vercel.json'
]

exclude_dirs = ['node_modules', '.git', 'dist', 'mobile_rn']

def should_exclude(rel_path):
    parts = os.path.normpath(rel_path).split(os.sep)
    for ex_dir in exclude_dirs:
        if ex_dir in parts:
            return True
    
    rel_path_norm = os.path.normpath(rel_path)
    for ex in exclude_files:
        if rel_path_norm == os.path.normpath(ex):
            return True
    return False

for root, dirs, files in os.walk(src_dir):
    for f in files:
        src_path = os.path.join(root, f)
        rel_path = os.path.relpath(src_path, src_dir)
        
        if should_exclude(rel_path):
            continue
            
        dst_path = os.path.join(dst_dir, rel_path)
        
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        
        try:
            shutil.copy2(src_path, dst_path)
        except Exception as e:
            print(f"Error copying {src_path}: {e}")

print('Copy complete.')
