import jwt, os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from app.models import Usuario


def gerar_token(usuario_id, tipo):
    payload = {
        'sub': usuario_id, 'tipo': tipo,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=int(os.environ.get('JWT_EXPIRATION_HOURS', 24)))
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def token_requerido(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth = request.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            token = auth.split(' ')[1]
        if not token:
            return jsonify({'erro': 'Token necessário'}), 401
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            usuario = Usuario.query.get(payload['sub'])
            if not usuario or not usuario.ativo:
                return jsonify({'erro': 'Usuário inválido'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'erro': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'erro': 'Token inválido'}), 401
        return f(usuario, *args, **kwargs)
    return decorated


def requer_tipo(*tipos):
    def decorator(f):
        @wraps(f)
        @token_requerido
        def decorated(usuario, *args, **kwargs):
            if usuario.tipo not in tipos:
                return jsonify({'erro': f'Acesso restrito para: {", ".join(tipos)}'}), 403
            return f(usuario, *args, **kwargs)
        return decorated
    return decorator
