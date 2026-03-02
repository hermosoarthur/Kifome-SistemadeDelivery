from flask import request, jsonify, current_app
from app import db, get_supabase
from app.models import Usuario
from app.utils.jwt_utils import gerar_token
from app.utils.validators import validar_email, validar_senha


def login():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    senha = data.get('senha', '')

    if not email or not senha:
        return jsonify({'erro': 'Email e senha obrigatórios'}), 400

    # Tenta autenticar via Supabase Auth primeiro
    sb = get_supabase()
    if sb:
        try:
            res = sb.auth.sign_in_with_password({'email': email, 'password': senha})
            if res.user:
                usuario = Usuario.query.filter_by(email=email).first()
                if not usuario:
                    # Cria usuário local se não existir
                    usuario = Usuario(
                        nome=res.user.user_metadata.get('nome', email.split('@')[0]),
                        email=email,
                        tipo=res.user.user_metadata.get('tipo', 'cliente'),
                        supabase_uid=res.user.id
                    )
                    db.session.add(usuario)
                    db.session.commit()
                token = gerar_token(usuario.id, usuario.tipo)
                return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200
        except Exception as e:
            # Fallback para autenticação local
            pass

    # Autenticação local (fallback)
    usuario = Usuario.query.filter_by(email=email, ativo=True).first()
    if not usuario or not usuario.verificar_senha(senha):
        return jsonify({'erro': 'Email ou senha incorretos'}), 401

    token = gerar_token(usuario.id, usuario.tipo)
    return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200


def registro():
    data = request.get_json(silent=True) or {}
    nome = data.get('nome', '').strip()
    email = data.get('email', '').strip().lower()
    senha = data.get('senha', '')
    tipo = data.get('tipo', 'cliente')
    telefone = data.get('telefone', '').strip()

    if not nome:
        return jsonify({'erro': 'Nome é obrigatório'}), 400
    if not validar_email(email):
        return jsonify({'erro': 'Email inválido'}), 400
    ok, msg = validar_senha(senha)
    if not ok:
        return jsonify({'erro': msg}), 400
    if tipo not in ['cliente', 'restaurante', 'entregador']:
        return jsonify({'erro': 'Tipo inválido'}), 400
    if Usuario.query.filter_by(email=email).first():
        return jsonify({'erro': 'Email já cadastrado'}), 409

    supabase_uid = None
    sb = get_supabase()
    if sb:
        try:
            res = sb.auth.admin.create_user({
                'email': email,
                'password': senha,
                'email_confirm': True,
                'user_metadata': {'nome': nome, 'tipo': tipo}
            })
            if res.user:
                supabase_uid = res.user.id
        except Exception as e:
            print(f'[Supabase] Registro falhou, usando local: {e}')

    try:
        usuario = Usuario(nome=nome, email=email, telefone=telefone, tipo=tipo, supabase_uid=supabase_uid)
        usuario.set_senha(senha)
        db.session.add(usuario)
        db.session.commit()
        return jsonify({'mensagem': 'Conta criada com sucesso', 'usuario': usuario.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao criar conta'}), 500


def login_google():
    data = request.get_json(silent=True) or {}
    access_token = data.get('access_token')
    if not access_token:
        return jsonify({'erro': 'Token do Google obrigatório'}), 400

    sb = get_supabase()
    if sb:
        try:
            res = sb.auth.sign_in_with_id_token({
                'provider': 'google',
                'token': access_token
            })
            if res.user:
                email = res.user.email.lower()
                usuario = Usuario.query.filter_by(email=email).first()
                if not usuario:
                    usuario = Usuario(
                        nome=res.user.user_metadata.get('full_name', email.split('@')[0]),
                        email=email,
                        tipo='cliente',
                        supabase_uid=res.user.id,
                        avatar_url=res.user.user_metadata.get('avatar_url', '')
                    )
                    db.session.add(usuario)
                    db.session.commit()
                token = gerar_token(usuario.id, usuario.tipo)
                return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200
        except Exception as e:
            return jsonify({'erro': f'Erro Google: {str(e)}'}), 401

    return jsonify({'erro': 'Supabase não configurado'}), 503


def me(usuario_atual):
    return jsonify({'usuario': usuario_atual.to_dict()}), 200
