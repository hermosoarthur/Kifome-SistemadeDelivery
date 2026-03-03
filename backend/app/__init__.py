import os
from flask import Flask, jsonify, request, make_response
from flask_sqlalchemy import SQLAlchemy
from app.config.settings import config_map

db = SQLAlchemy()
supabase_client = None


def get_supabase():
    global supabase_client
    if supabase_client is None:
        url = os.environ.get('SUPABASE_URL', '')
        key = os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_KEY', '')
        if url and key:
            try:
                from supabase import create_client
                supabase_client = create_client(url, key)
            except Exception as e:
                print(f'[Supabase] Erro ao conectar: {e}')
    return supabase_client


def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    return response


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map['default']))

    db.init_app(app)

    @app.before_request
    def preflight():
        if request.method == 'OPTIONS':
            res = make_response()
            add_cors(res)
            res.headers['Access-Control-Max-Age'] = '3600'
            return res, 200

    app.after_request(add_cors)

    @app.errorhandler(Exception)
    def handle_exception(e):
        db.session.rollback()
        res = jsonify({'erro': str(e)})
        add_cors(res)
        return res, 500

    from app.routes.auth_routes import auth_bp
    from app.routes.usuario_routes import usuarios_bp
    from app.routes.restaurante_routes import restaurantes_bp
    from app.routes.entregador_routes import entregadores_bp
    from app.routes.produto_routes import produtos_bp
    from app.routes.pedido_routes import pedidos_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(usuarios_bp)
    app.register_blueprint(restaurantes_bp)
    app.register_blueprint(entregadores_bp)
    app.register_blueprint(produtos_bp)
    app.register_blueprint(pedidos_bp)

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'app': 'Kifome API v3'}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'erro': 'Recurso não encontrado'}), 404

    with app.app_context():
        db.create_all()

    return app
