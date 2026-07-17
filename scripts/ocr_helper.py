
import os
import shutil
import errno
import subprocess
import tempfile
from tempfile import mkdtemp
import time
import sys

try:
    from PIL import Image
except ImportError:
    print('Error: You need to install the "Image" package. Type: pip install Pillow')

try:
    import pytesseract
except ImportError:
    print('Error: You need to install the "pytesseract" package. Type: pip install pytesseract')
    exit()

try:
    from pdf2image import convert_from_path, convert_from_bytes
except ImportError:
    print('Error: You need to install the "pdf2image" package. Type: pip install pdf2image')
    exit()

def update_progress(progress):
    barLength = 20
    status = ""
    if progress >= 1:
        progress = 1
        status = "\r\n"
    block = int(round(barLength*progress))
    text = "\r🚀 PROGRESSO OCR: [{0}] {1:.1f}% {2}".format(
        "#"*block + "-"*(barLength-block), progress*100, status)
    sys.stdout.write(text)
    sys.stdout.flush()

def extract_tesseract(filename):
    print(f"📄 Lendo arquivo: {os.path.basename(filename)}")
    temp_dir = mkdtemp()
    contents = []
    try:
        # Converte PDF para Imagens (Necessita de Poppler instalado no sistema)
        paginas = convert_from_path(filename)
        
        for i, pagina in enumerate(paginas):
            # OCR com linguagem em português
            texto = pytesseract.image_to_string(pagina, lang='por')
            contents.append(f"--- Início da Página {i+1} ---\n{texto}\n")
            update_progress((i + 1) / len(paginas))
            
        return ''.join(contents)
    finally:
        shutil.rmtree(temp_dir)

def convert_recursive(source, destination):
    pdf_files = []
    for dirpath, _, files in os.walk(source):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(os.path.join(dirpath, file))
    
    if not pdf_files:
        print("❌ Nenhum PDF localizado.")
        return

    print(f"⚡ Localizados {len(pdf_files)} arquivos para processamento.")

    for i, source_path in enumerate(pdf_files):
        rel_path = os.path.relpath(source_path, source)
        dest_path = os.path.join(destination, os.path.splitext(rel_path)[0] + '.txt')
        
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        try:
            text = extract_tesseract(source_path)
            with open(dest_path, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"✅ Sucesso: {rel_path}")
        except Exception as e:
            print(f"❌ Falha em {rel_path}: {str(e)}")

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 MOTOR DE OCR RECURSIVO LEXISPREDICT v25000.0")
    print("="*50 + "\n")
    
    dir_path = os.path.dirname(os.path.realpath(__file__))
    
    source = input(f"📂 Pasta de Origem (PDFs) [{dir_path}]: ").strip() or dir_path
    destination = input(f"💾 Pasta de Destino (TXTs) [{dir_path}]: ").strip() or dir_path

    if os.path.exists(source):
        convert_recursive(source, destination)
        print("\n✨ Processamento concluído. O texto está pronto para o Gabinete.")
    else:
        print(f"❌ Caminho inválido: {source}")
