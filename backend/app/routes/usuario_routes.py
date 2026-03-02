from flask import Blueprint
from app.controllers.auth_controller import registro
from app.controllers import atualizar_usuario
from app.utils.jwt_utils import token_requerido

usuarios_bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')
usuarios_bp.route('/registro', methods=['POST'])(registro)

@usuarios_bp.route('/<int:uid>', methods=['PUT'])
@token_requerido
def rota_atualizar(u, uid): return atualizar_usuario(u, uid)
