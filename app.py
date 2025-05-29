from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
import os

# Crear la aplicación Flask
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'Atlas Interactivo del Mundo', 'templates'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'Atlas Interactivo del Mundo', 'static'))
app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

# Configurar la base de datos
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'atlas.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar SQLAlchemy
db = SQLAlchemy(app)

# Definir modelos
class Country(db.Model):
    __tablename__ = 'countries'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    capital = db.Column(db.String(100))
    population = db.Column(db.Integer)
    area = db.Column(db.Float)
    language = db.Column(db.String(100))
    currency = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    history = db.Column(db.Text)
    
    def __repr__(self):
        return f'<Country {self.name}>'

class Wonder(db.Model):
    __tablename__ = 'wonders'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    country = db.Column(db.String(100))
    description = db.Column(db.Text)
    year = db.Column(db.Integer)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    image_url = db.Column(db.String(255))
    
    def __repr__(self):
        return f'<Wonder {self.name}>'

class Explorer(db.Model):
    __tablename__ = 'explorers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    country = db.Column(db.String(100))
    birth_year = db.Column(db.Integer)
    death_year = db.Column(db.Integer)
    achievements = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    
    def __repr__(self):
        return f'<Explorer {self.name}>'

# Añadir este nuevo modelo después de los modelos existentes
class Landmark(db.Model):
    __tablename__ = 'landmarks'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id'), nullable=False)
    description = db.Column(db.Text)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    def __repr__(self):
        return f'<Landmark {self.name}>'

# Rutas para las páginas HTML
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/atlas')
def atlas():
    return render_template('atlas.html')

@app.route('/wonders')
def wonders():
    return render_template('wonders.html')

@app.route('/explorers')
def explorers():
    return render_template('explorers.html')

# API endpoints para obtener datos
@app.route('/api/countries')
def get_countries():
    countries = Country.query.all()
    return jsonify([{
        'id': country.id,
        'name': country.name,
        'capital': country.capital,
        'population': country.population,
        'area': country.area,
        'language': country.language,
        'currency': country.currency,
        'latitude': country.latitude,
        'longitude': country.longitude
    } for country in countries])

# Añadir este endpoint para obtener lugares famosos de un país
@app.route('/api/countries/<int:country_id>/landmarks')
def get_country_landmarks(country_id):
    landmarks = Landmark.query.filter_by(country_id=country_id).all()
    return jsonify([{
        'id': landmark.id,
        'name': landmark.name,
        'description': landmark.description,
        'latitude': landmark.latitude,
        'longitude': landmark.longitude
    } for landmark in landmarks])

@app.route('/api/wonders')
def get_wonders():
    wonders = Wonder.query.all()
    return jsonify([{
        'id': wonder.id,
        'name': wonder.name,
        'country': wonder.country,
        'description': wonder.description,
        'year': wonder.year,
        'latitude': wonder.latitude,
        'longitude': wonder.longitude,
        'image_url': wonder.image_url
    } for wonder in wonders])

@app.route('/api/explorers')
def get_explorers():
    explorers = Explorer.query.all()
    return jsonify([{
        'id': explorer.id,
        'name': explorer.name,
        'country': explorer.country,
        'birth_year': explorer.birth_year,
        'death_year': explorer.death_year,
        'achievements': explorer.achievements,
        'image_url': explorer.image_url
    } for explorer in explorers])

# Añadir este nuevo endpoint para buscar países por nombre
@app.route('/api/countries/search/<string:query>')
def search_countries(query):
    # Buscar países que contengan la consulta en su nombre (case insensitive)
    countries = Country.query.filter(Country.name.ilike(f'%{query}%')).all()
    return jsonify([{
        'id': country.id,
        'name': country.name,
        'capital': country.capital,
        'population': country.population,
        'area': country.area,
        'language': country.language,
        'currency': country.currency,
        'latitude': country.latitude,
        'longitude': country.longitude
    } for country in countries])

def create_tables_and_add_sample_data():
    db.create_all()
    
    # Verificar si ya hay datos en la tabla Landmark
    if Landmark.query.count() == 0 and Country.query.count() > 0:
        # Obtener algunos países para añadir landmarks
        usa = Country.query.filter_by(name='United States').first()
        france = Country.query.filter_by(name='France').first()
        japan = Country.query.filter_by(name='Japan').first()
        
        # Añadir landmarks de ejemplo
        if usa:
            db.session.add(Landmark(name='Statue of Liberty', country_id=usa.id, 
                                   description='Iconic statue in New York Harbor', 
                                   latitude=40.6892, longitude=-74.0445))
            db.session.add(Landmark(name='Grand Canyon', country_id=usa.id, 
                                   description='Massive canyon in Arizona', 
                                   latitude=36.0544, longitude=-112.2401))
        
        if france:
            db.session.add(Landmark(name='Eiffel Tower', country_id=france.id, 
                                   description='Iconic iron tower in Paris', 
                                   latitude=48.8584, longitude=2.2945))
            db.session.add(Landmark(name='Louvre Museum', country_id=france.id, 
                                   description='World\'s largest art museum', 
                                   latitude=48.8606, longitude=2.3376))
        
        if japan:
            db.session.add(Landmark(name='Mount Fuji', country_id=japan.id, 
                                   description='Japan\'s highest mountain', 
                                   latitude=35.3606, longitude=138.7274))
            db.session.add(Landmark(name='Tokyo Tower', country_id=japan.id, 
                                   description='Communications and observation tower', 
                                   latitude=35.6586, longitude=139.7454))
        
        db.session.commit()

@app.cli.command('init-db')
def init_db_command():
    """Inicializar la base de datos."""
    create_tables_and_add_sample_data()
    print('Base de datos inicializada.')

if __name__ == '__main__':
    with app.app_context():
        create_tables_and_add_sample_data()
    app.run(debug=True)
from flask import Flask, request, jsonify
import sqlite3
import jwt
from datetime import datetime, timedelta
import hashlib
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24).hex()

# Database setup
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  email TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL)''')
    conn.commit()
    conn.close()

init_db()

# Helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id, username):
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

# Routes
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([name, email, password]):
        return jsonify({'message': 'Todos los campos son requeridos'}), 400
    
    hashed_password = hash_password(password)
    
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                  (name, email, hashed_password))
        conn.commit()
        return jsonify({'message': 'Usuario registrado exitosamente'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'El correo electrónico ya está registrado'}), 400
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({'message': 'Correo electrónico y contraseña son requeridos'}), 400
    
    hashed_password = hash_password(password)
    
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT id, name FROM users WHERE email=? AND password=?", (email, hashed_password))
    user = c.fetchone()
    conn.close()
    
    if user:
        token = create_token(user[0], user[1])
        return jsonify({
            'message': 'Inicio de sesión exitoso',
            'token': token,
            'username': user[1]
        }), 200
    else:
        return jsonify({'message': 'Credenciales inválidas'}), 401

@app.route('/protected')
def protected():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token faltante'}), 401
    
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return jsonify({'message': f'Hola {data["username"]}'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Token inválido'}), 401

if __name__ == '__main__':
    app.run(debug=True)