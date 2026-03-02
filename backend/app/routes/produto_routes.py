from flask import Blueprint
from app.controllers import listar_produtos, criar_produto, atualizar_produto, deletar_produto
from app.utils.jwt_utils import requer_tipo

produtos_bp = Blueprint('produtos', __name__, url_prefix='/api/restaurantes')

@produtos_bp.route('/<int:rid>/produtos', methods=['GET'])
def rota_listar(rid): return listar_produtos(rid)

@produtos_bp.route('/<int:rid>/produtos', methods=['POST'])
@requer_tipo('restaurante')
def rota_criar(u, rid): return criar_produto(u, rid)

@produtos_bp.route('/<int:rid>/produtos/<int:pid>', methods=['PUT'])
@requer_tipo('restaurante')
def rota_atualizar(u, rid, pid): return atualizar_produto(u, rid, pid)

@produtos_bp.route('/<int:rid>/produtos/<int:pid>', methods=['DELETE'])
@requer_tipo('restaurante')
def rota_deletar(u, rid, pid): return deletar_produto(u, rid, pid)
