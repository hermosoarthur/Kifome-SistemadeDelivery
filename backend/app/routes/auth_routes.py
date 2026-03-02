from flask import Blueprint
from app.controllers.auth_controller import login, registro, login_google, me
from app.utils.jwt_utils import token_requerido

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
auth_bp.route('/login', methods=['POST'])(login)
auth_bp.route('/google', methods=['POST'])(login_google)

@auth_bp.route('/me', methods=['GET'])
@token_requerido
def rota_me(u): return me(u)
