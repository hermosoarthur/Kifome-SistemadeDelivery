from flask import Blueprint
from app.controllers import minhas_notificacoes, marcar_notificacao_lida, marcar_todas_lidas
from app.utils.jwt_utils import token_requerido

notificacoes_bp = Blueprint('notificacoes', __name__, url_prefix='/api/notificacoes')

@notificacoes_bp.route('/minhas', methods=['GET'])
@token_requerido
def rota_minhas(u): return minhas_notificacoes(u)

@notificacoes_bp.route('/<int:nid>/lida', methods=['PUT'])
@token_requerido
def rota_lida(u, nid): return marcar_notificacao_lida(u, nid)

@notificacoes_bp.route('/marcar-todas-lidas', methods=['PUT'])
@token_requerido
def rota_todas_lidas(u): return marcar_todas_lidas(u)
