from flask import Blueprint
from app.controllers.auth_controller import login, registro, login_google, me
from app.utils.jwt_utils import token_requerido, requer_tipo
from app.controllers import (
    atualizar_usuario,
    listar_restaurantes, meus_restaurantes, criar_restaurante, obter_restaurante, atualizar_restaurante, deletar_restaurante,
    listar_produtos, criar_produto, atualizar_produto, deletar_produto,
    criar_pedido, meus_pedidos_cliente, pedidos_restaurante, atualizar_status_pedido, entregas_entregador, pedidos_disponiveis,
    criar_entregador, meu_perfil_entregador, atualizar_entregador
)

# Auth
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
auth_bp.route('/login', methods=['POST'])(login)
auth_bp.route('/registro', methods=['POST'])(registro)
auth_bp.route('/google', methods=['POST'])(login_google)

@auth_bp.route('/me', methods=['GET'])
@token_requerido
def rota_me(u): return me(u)

# Usuarios
usuarios_bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')
usuarios_bp.route('/registro', methods=['POST'])(registro)

@usuarios_bp.route('/<int:uid>', methods=['PUT'])
@token_requerido
def rota_atualizar_usuario(u, uid): return atualizar_usuario(u, uid)

# Restaurantes
restaurantes_bp = Blueprint('restaurantes', __name__, url_prefix='/api/restaurantes')
restaurantes_bp.route('', methods=['GET'])(listar_restaurantes)
restaurantes_bp.route('/<int:rid>', methods=['GET'])(obter_restaurante)

@restaurantes_bp.route('/meus', methods=['GET'])
@requer_tipo('restaurante')
def rota_meus(u): return meus_restaurantes(u)

@restaurantes_bp.route('', methods=['POST'])
@requer_tipo('restaurante')
def rota_criar_r(u): return criar_restaurante(u)

@restaurantes_bp.route('/<int:rid>', methods=['PUT'])
@requer_tipo('restaurante')
def rota_atualizar_r(u, rid): return atualizar_restaurante(u, rid)

@restaurantes_bp.route('/<int:rid>', methods=['DELETE'])
@requer_tipo('restaurante')
def rota_deletar_r(u, rid): return deletar_restaurante(u, rid)

# Produtos
produtos_bp = Blueprint('produtos', __name__, url_prefix='/api/restaurantes')

@produtos_bp.route('/<int:rid>/produtos', methods=['GET'])
def rota_listar_produtos(rid): return listar_produtos(rid)

@produtos_bp.route('/<int:rid>/produtos', methods=['POST'])
@requer_tipo('restaurante')
def rota_criar_produto(u, rid): return criar_produto(u, rid)

@produtos_bp.route('/<int:rid>/produtos/<int:pid>', methods=['PUT'])
@requer_tipo('restaurante')
def rota_atualizar_produto(u, rid, pid): return atualizar_produto(u, rid, pid)

@produtos_bp.route('/<int:rid>/produtos/<int:pid>', methods=['DELETE'])
@requer_tipo('restaurante')
def rota_deletar_produto(u, rid, pid): return deletar_produto(u, rid, pid)

# Pedidos
pedidos_bp = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')

@pedidos_bp.route('', methods=['POST'])
@requer_tipo('cliente')
def rota_criar_pedido(u): return criar_pedido(u)

@pedidos_bp.route('/meus', methods=['GET'])
@requer_tipo('cliente')
def rota_meus_pedidos(u): return meus_pedidos_cliente(u)

@pedidos_bp.route('/restaurante/<int:rid>', methods=['GET'])
@requer_tipo('restaurante')
def rota_pedidos_restaurante(u, rid): return pedidos_restaurante(u, rid)

@pedidos_bp.route('/<int:pid>/status', methods=['PUT'])
@token_requerido
def rota_status(u, pid): return atualizar_status_pedido(u, pid)

@pedidos_bp.route('/entregas', methods=['GET'])
@requer_tipo('entregador')
def rota_entregas(u): return entregas_entregador(u)

@pedidos_bp.route('/disponiveis', methods=['GET'])
@requer_tipo('entregador')
def rota_disponiveis(u): return pedidos_disponiveis(u)

# Entregadores
entregadores_bp = Blueprint('entregadores', __name__, url_prefix='/api/entregadores')

@entregadores_bp.route('', methods=['POST'])
@token_requerido
def rota_criar_e(u): return criar_entregador(u)

@entregadores_bp.route('/meu-perfil', methods=['GET'])
@requer_tipo('entregador')
def rota_meu_perfil(u): return meu_perfil_entregador(u)

@entregadores_bp.route('/<int:eid>', methods=['PUT'])
@requer_tipo('entregador')
def rota_atualizar_e(u, eid): return atualizar_entregador(u, eid)
