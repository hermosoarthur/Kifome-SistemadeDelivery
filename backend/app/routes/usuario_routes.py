from flask import Blueprint
from app.controllers.auth_controller import registro
from app.controllers import atualizar_usuario, listar_usuarios, obter_usuario, deletar_usuario
from app.utils.jwt_utils import token_requerido

usuarios_bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')
usuarios_bp.route('/registro', methods=['POST'])(registro)


@usuarios_bp.route('', methods=['GET'])
@token_requerido
def rota_listar(u):
	return listar_usuarios(u)


@usuarios_bp.route('/<int:uid>', methods=['GET'])
@token_requerido
def rota_obter(u, uid):
	return obter_usuario(u, uid)


@usuarios_bp.route('/<int:uid>', methods=['PUT'])
@token_requerido
def rota_atualizar(u, uid):
	return atualizar_usuario(u, uid)


@usuarios_bp.route('/<int:uid>', methods=['DELETE'])
@token_requerido
def rota_deletar(u, uid):
	return deletar_usuario(u, uid)
#bp