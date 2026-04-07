from flask import Blueprint
from app.controllers import criar_entregador, meu_perfil_entregador, atualizar_entregador
from app.utils.jwt_utils import token_requerido, requer_tipo

entregadores_bp = Blueprint('entregadores', __name__, url_prefix='/api/entregadores')

@entregadores_bp.route('', methods=['POST'])
@token_requerido
def rota_criar(u): return criar_entregador(u)

@entregadores_bp.route('/meu-perfil', methods=['GET'])
@requer_tipo('entregador')
def rota_perfil(u): return meu_perfil_entregador(u)

@entregadores_bp.route('/<int:eid>', methods=['PUT'])
@requer_tipo('entregador')
def rota_atualizar(u, eid): return atualizar_entregador(u, eid)
