from flask import Blueprint
from app.controllers import (
    criar_pedido, meus_pedidos_cliente, pedidos_restaurante,
    atualizar_status_pedido, entregas_entregador, pedidos_disponiveis, avaliar_pedido,
    validar_entrega, confirmar_recebimento, simular_passo_entrega, codigo_entrega_cliente,
)
from app.utils.jwt_utils import token_requerido, requer_tipo

pedidos_bp = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')

@pedidos_bp.route('', methods=['POST'])
@requer_tipo('cliente')
def rota_criar(u): return criar_pedido(u)

@pedidos_bp.route('/meus', methods=['GET'])
@requer_tipo('cliente')
def rota_meus(u): return meus_pedidos_cliente(u)

@pedidos_bp.route('/restaurante/<int:rid>', methods=['GET'])
@requer_tipo('restaurante')
def rota_restaurante(u, rid): return pedidos_restaurante(u, rid)

@pedidos_bp.route('/<int:pid>/status', methods=['PUT'])
@token_requerido
def rota_status(u, pid): return atualizar_status_pedido(u, pid)

@pedidos_bp.route('/<int:pid>/avaliar', methods=['POST'])
@requer_tipo('cliente')
def rota_avaliar(u, pid): return avaliar_pedido(u, pid)

@pedidos_bp.route('/entregas', methods=['GET'])
@requer_tipo('entregador')
def rota_entregas(u): return entregas_entregador(u)

@pedidos_bp.route('/disponiveis', methods=['GET'])
@requer_tipo('entregador')
def rota_disponiveis(u): return pedidos_disponiveis(u)

@pedidos_bp.route('/<int:pid>/validar-entrega', methods=['POST'])
@requer_tipo('entregador')
def rota_validar_entrega(u, pid): return validar_entrega(u, pid)

@pedidos_bp.route('/<int:pid>/confirmar-recebimento', methods=['POST'])
@requer_tipo('cliente')
def rota_confirmar_recebimento(u, pid): return confirmar_recebimento(u, pid)

@pedidos_bp.route('/<int:pid>/simular-passo', methods=['POST'])
@requer_tipo('cliente')
def rota_simular_passo(u, pid): return simular_passo_entrega(u, pid)

@pedidos_bp.route('/<int:pid>/codigo-entrega', methods=['GET'])
@requer_tipo('cliente')
def rota_codigo_entrega(u, pid): return codigo_entrega_cliente(u, pid)
