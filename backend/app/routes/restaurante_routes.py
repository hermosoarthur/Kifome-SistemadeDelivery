# Arquivo: backend/app/routes/restaurante_routes.py
from flask import Blueprint
from app.controllers import (listar_restaurantes, meus_restaurantes, criar_restaurante,
    obter_restaurante, atualizar_restaurante, deletar_restaurante)
from app.utils.jwt_utils import token_requerido, requer_tipo

restaurantes_bp = Blueprint('restaurantes', __name__, url_prefix='/api/restaurantes')
restaurantes_bp.route('', methods=['GET'])(listar_restaurantes)
restaurantes_bp.route('/<int:rid>', methods=['GET'])(obter_restaurante)

@restaurantes_bp.route('/meus', methods=['GET'])
@requer_tipo('restaurante')
def rota_meus(u): return meus_restaurantes(u)

@restaurantes_bp.route('', methods=['POST'])
@requer_tipo('restaurante')
def rota_criar(u): return criar_restaurante(u)

@restaurantes_bp.route('/<int:rid>', methods=['PUT'])
@requer_tipo('restaurante')
def rota_atualizar(u, rid): return atualizar_restaurante(u, rid)

@restaurantes_bp.route('/<int:rid>', methods=['DELETE'])
@requer_tipo('restaurante')
def rota_deletar(u, rid): return deletar_restaurante(u, rid)
