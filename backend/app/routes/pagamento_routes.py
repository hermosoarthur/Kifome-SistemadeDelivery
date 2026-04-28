from flask import Blueprint, request
from app.controllers import mp_criar_preferencia, mp_webhook, mp_status_pedido, mp_confirmar_sandbox
from app.utils.jwt_utils import token_requerido, requer_tipo

pagamentos_bp = Blueprint('pagamentos', __name__, url_prefix='/api/pagamentos')

@pagamentos_bp.route('/mp/preferencia', methods=['POST'])
@requer_tipo('cliente')
def rota_preferencia(u): return mp_criar_preferencia(u)

@pagamentos_bp.route('/mp/webhook', methods=['POST'])
def rota_webhook(): return mp_webhook()

@pagamentos_bp.route('/mp/pedido/<int:pid>/status', methods=['GET'])
@requer_tipo('cliente')
def rota_status(u, pid): return mp_status_pedido(u, pid)

@pagamentos_bp.route('/mp/sandbox/<int:pid>/confirmar', methods=['POST'])
@requer_tipo('cliente')
def rota_confirmar_sandbox(u, pid): return mp_confirmar_sandbox(u, pid)
