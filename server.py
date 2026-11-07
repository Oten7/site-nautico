"""Servidor local de demonstração: Python 3, SQLite, sem dependências externas.
Execute: ADMIN_PASSWORD='uma-senha-forte' python server.py
Não publique este servidor na internet. Use somente em localhost.
"""
import os, json, sqlite3, hmac, secrets, re
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parent
DB=ROOT/'maceio_nautica.sqlite3'
PASSWORD=os.environ.get('ADMIN_PASSWORD','')
HOST='127.0.0.1'
PORT=int(os.environ.get('PORT','8000'))
SEEDS=[
('Passeios pelo litoral','barco','Maceió, AL','Conheça possibilidades de passeios de barco pelo litoral. Consulte rotas e duração diretamente com os prestadores.','https://maceio.al.gov.br/transform/imagens/_1200x630_crop_center-center_82_none/Turismo-Massayo-Verao-2025-Foto-Itawi-Albuquerque.jpeg?mtime=1737397460','Prefeitura de Maceió / Itawi Albuquerque'),
('Experiências de catamarã','catamara','Ponta Verde, Maceió','Conheça a modalidade de passeio de catamarã. Os serviços reais dependem de cadastro e confirmação.','https://www.amenithotel.com.br/v2/wp-content/uploads/2023/03/IMagem-Catamara-Lopana-Maceio.jpg','Amenit Hotel / catamarã em Maceió'),
('Mergulho e contemplação','mergulho','Piscinas naturais da Pajuçara','Atividades de observação da vida marinha e mergulho, conforme condições do mar e orientação dos profissionais.','https://www.amenithotel.com.br/v2/wp-content/uploads/2022/04/02-Piscinas-Naturais-de-Pajucara-Foto-Ciro-Amado-02-1024x683-1.jpg','Foto: Ciro Amado / Amenit Hotel'),
('Passeios de jangada','jangada','Pajuçara, Maceió','Conheça as jangadas tradicionais e as experiências ligadas às piscinas naturais da Pajuçara.','https://img.7segundos.com.br/0bEZCK6FXqBN1YpD58g5WiQXmII%3D/1200x630/smart/s3.7segundos.com.br/uploads/imagens/117047-passeio_de_jangada_na_praia_da_pajucara_1024x686_jpg.jpeg','7Segundos / passeio de jangada em Pajuçara')]
def connect():
    con=sqlite3.connect(DB)
    con.row_factory=sqlite3.Row
    return con
def init_db():
    with connect() as con:
        con.execute('CREATE TABLE IF NOT EXISTS tours (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL, location TEXT NOT NULL DEFAULT "", description TEXT NOT NULL, image_url TEXT NOT NULL DEFAULT "", image_credit TEXT NOT NULL DEFAULT "", provider TEXT NOT NULL DEFAULT "", contact TEXT NOT NULL DEFAULT "", verified INTEGER NOT NULL DEFAULT 0)')
        con.execute('CREATE TABLE IF NOT EXISTS interests (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, profile TEXT NOT NULL, message TEXT NOT NULL DEFAULT "", created_at TEXT NOT NULL)')
        if con.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='seed_state'").fetchone()[0]==0:
            con.execute('CREATE TABLE seed_state (done INTEGER NOT NULL)')
            con.execute('INSERT INTO seed_state (done) VALUES (1)')
            con.executemany('INSERT INTO tours (title,category,location,description,image_url,image_credit) VALUES (?,?,?,?,?,?)',SEEDS)
def validate_tour(obj):
    if not isinstance(obj,dict):raise ValueError('Dados inválidos')
    allowed={'title':100,'category':20,'location':100,'description':800,'image_url':1000,'image_credit':200,'provider':100,'contact':120}
    d={k:str(obj.get(k,'')).strip()[:limit] for k,limit in allowed.items()}
    if not d['title'] or not d['description']:raise ValueError('Título e descrição são obrigatórios')
    if d['category'] not in ('barco','catamara','mergulho','jangada'):raise ValueError('Categoria inválida')
    if d['image_url'] and not d['image_url'].startswith('https://'):raise ValueError('A imagem deve usar URL HTTPS')
    d['verified']=int(obj.get('verified') is True)
    return d
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def send_json(self,status,obj):
        data=json.dumps(obj,ensure_ascii=False).encode('utf-8')
        self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(data)
    def admin(self):
        key=self.headers.get('X-Admin-Password','')
        return bool(PASSWORD) and hmac.compare_digest(key,PASSWORD)
    def body(self):
        length=int(self.headers.get('Content-Length','0'))
        if length<1 or length>20000:raise ValueError('Corpo da requisição inválido')
        return json.loads(self.rfile.read(length).decode('utf-8'))
    def pathonly(self):return urlsplit(self.path).path
    def do_GET(self):
        path=self.pathonly()
        if path=='/api/tours':
            with connect() as con:items=[dict(x) for x in con.execute('SELECT * FROM tours ORDER BY id')]
            return self.send_json(200,items)
        if path in ('/api/admin/check','/api/admin/interests','/api/admin/export'):
            if not self.admin():return self.send_json(401,{'error':'Senha inválida'})
            if path=='/api/admin/check':return self.send_json(200,{'ok':True})
            with connect() as con:
                interests=[dict(x) for x in con.execute('SELECT * FROM interests ORDER BY id DESC')]
                if path.endswith('/interests'):return self.send_json(200,interests)
                tours=[dict(x) for x in con.execute('SELECT * FROM tours ORDER BY id')]
            return self.send_json(200,{'tours':tours,'interests':interests})
        if path.startswith('/api/'):return self.send_json(404,{'error':'Não encontrado'})
        return super().do_GET()
    def do_POST(self):
        path=self.pathonly()
        if path=='/api/interests':
            try:
                data=self.body()
                name=str(data.get('name','')).strip()[:80];email=str(data.get('email','')).strip()[:120];profile=str(data.get('profile','')).strip()[:80];message=str(data.get('message','')).strip()[:600]
                if not name or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email) or not profile:raise ValueError('Preencha nome, e-mail válido e perfil')
                with connect() as con:con.execute('INSERT INTO interests (name,email,profile,message,created_at) VALUES (?,?,?,?,?)',(name,email,profile,message,datetime.now(timezone.utc).isoformat()))
                return self.send_json(201,{'ok':True})
            except (ValueError,TypeError,KeyError,json.JSONDecodeError) as e:return self.send_json(400,{'error':str(e)})
        if path=='/api/admin/tours':
            if not self.admin():return self.send_json(401,{'error':'Senha inválida'})
            try:
                d=validate_tour(self.body())
                with connect() as con:
                    cur=con.execute('INSERT INTO tours (title,category,location,description,image_url,image_credit,provider,contact,verified) VALUES (:title,:category,:location,:description,:image_url,:image_credit,:provider,:contact,:verified)',d)
                return self.send_json(201,{'ok':True,'id':cur.lastrowid})
            except (ValueError,TypeError,json.JSONDecodeError) as e:return self.send_json(400,{'error':str(e)})
        return self.send_json(404,{'error':'Não encontrado'})
    def do_PUT(self):
        path=self.pathonly()
        if not self.admin():return self.send_json(401,{'error':'Senha inválida'})
        m=re.fullmatch(r'/api/admin/tours/(\d+)',path)
        if not m:return self.send_json(404,{'error':'Não encontrado'})
        try:
            d=validate_tour(self.body());d['id']=int(m.group(1))
            with connect() as con:cur=con.execute('UPDATE tours SET title=:title,category=:category,location=:location,description=:description,image_url=:image_url,image_credit=:image_credit,provider=:provider,contact=:contact,verified=:verified WHERE id=:id',d)
            return self.send_json(200 if cur.rowcount else 404,{'ok':bool(cur.rowcount)})
        except (ValueError,TypeError,json.JSONDecodeError) as e:return self.send_json(400,{'error':str(e)})
    def do_DELETE(self):
        path=self.pathonly()
        if not self.admin():return self.send_json(401,{'error':'Senha inválida'})
        if path=='/api/admin/interests':
            with connect() as con:con.execute('DELETE FROM interests')
            return self.send_json(200,{'ok':True})
        m=re.fullmatch(r'/api/admin/tours/(\d+)',path)
        if not m:return self.send_json(404,{'error':'Não encontrado'})
        with connect() as con:cur=con.execute('DELETE FROM tours WHERE id=?',(int(m.group(1)),))
        return self.send_json(200 if cur.rowcount else 404,{'ok':bool(cur.rowcount)})
if __name__=='__main__':
    if not PASSWORD:
        print('ERRO: defina ADMIN_PASSWORD antes de iniciar. Consulte README.md.');raise SystemExit(1)
    init_db();print(f'Maceió Náutica: http://{HOST}:{PORT}');print(f'Painel: http://{HOST}:{PORT}/admin.html');print('Use Ctrl+C para encerrar. Não publique este servidor na internet.')
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
