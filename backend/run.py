import os

from app import create_app
from app.models import Restaurante
from seed_demo_data import seed_demo_data


app = create_app('development')


def should_auto_seed() -> bool:
    return os.environ.get('AUTO_SEED_DEMO', 'true').lower() in ['1', 'true', 'yes']


def run_auto_seed_if_needed() -> None:
    if not should_auto_seed():
        return

    with app.app_context():
        if Restaurante.query.count() == 0:
            print('[seed] Banco vazio detectado. Executando seed de restaurantes/produtos demo...')
            seed_demo_data()
            print('[seed] Seed demo concluída.')


if __name__ == '__main__':
    run_auto_seed_if_needed()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '1').lower() in ['1', 'true', 'yes']
    app.run(host='0.0.0.0', port=port, debug=debug)
