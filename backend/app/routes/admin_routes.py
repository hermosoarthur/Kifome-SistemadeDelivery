import os
from flask import Blueprint, jsonify, request

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

ADMIN_SECRET = os.environ.get('ADMIN_SEED_SECRET', '')


@admin_bp.route('/seed', methods=['POST'])
def rodar_seed():
    secret = request.args.get('secret', '') or (request.get_json(silent=True) or {}).get('secret', '')
    if not ADMIN_SECRET or secret != ADMIN_SECRET:
        return jsonify({'erro': 'Não autorizado'}), 403

    try:
        from app.models import Restaurante
        from seed_demo_data import seed_demo_data
        count_antes = Restaurante.query.count()
        seed_demo_data()
        count_depois = Restaurante.query.count()
        return jsonify({
            'mensagem': 'Seed executado com sucesso',
            'restaurantes_antes': count_antes,
            'restaurantes_depois': count_depois,
        }), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500
