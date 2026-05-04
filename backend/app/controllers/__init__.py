# Arquivo: backend/app/controllers/__init__.py
from flask import request, jsonify
from app import db
from app.models import Usuario, Restaurante, Produto, Pedido, ItemPedido, Entregador, Notificacao
from app.utils.validators import validar_telefone, normalizar_telefone


def _to_float(value):
    if value is None or value == '':
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {'1', 'true', 'sim', 'yes'}


# ── USUARIO ──────────────────────────────────────────────
def atualizar_usuario(usuario_atual, usuario_id):
    if usuario_atual.id != usuario_id:
        return jsonify({'erro': 'Sem permissão'}), 403
    u = Usuario.query.get_or_404(usuario_id)
    data = request.get_json(silent=True) or {}
    if 'nome' in data and data['nome'].strip():
        nome = data['nome'].strip()
        if len(nome) > 100:
            return jsonify({'erro': 'nome deve ter no máximo 100 caracteres'}), 400
        u.nome = nome
    if 'telefone' in data:
        telefone = normalizar_telefone(data.get('telefone'))
        if telefone and not validar_telefone(telefone):
            return jsonify({'erro': 'telefone deve conter entre 10 e 15 dígitos'}), 400
        u.telefone = telefone
    if 'endereco_principal' in data:
        u.endereco_principal = (data.get('endereco_principal') or '').strip() or None
    if 'endereco_json' in data:
        endereco_json = data.get('endereco_json')
        u.endereco_json = endereco_json if isinstance(endereco_json, dict) else None
    if 'latitude' in data:
        lat = _to_float(data.get('latitude'))
        if data.get('latitude') not in (None, '') and lat is None:
            return jsonify({'erro': 'Latitude inválida'}), 400
        u.latitude = lat
    if 'longitude' in data:
        lng = _to_float(data.get('longitude'))
        if data.get('longitude') not in (None, '') and lng is None:
            return jsonify({'erro': 'Longitude inválida'}), 400
        u.longitude = lng
    u.tem_endereco = bool(u.endereco_principal)
    try:
        db.session.commit()
        return jsonify({'usuario': u.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar'}), 500


def atualizar_endereco_usuario(usuario_atual, usuario_id):
    if usuario_atual.id != usuario_id:
        return jsonify({'erro': 'Sem permissão'}), 403

    u = Usuario.query.get_or_404(usuario_id)
    data = request.get_json(silent=True) or {}

    endereco_principal = (data.get('endereco_principal') or '').strip()
    endereco_json = data.get('endereco_json')
    latitude = _to_float(data.get('latitude'))
    longitude = _to_float(data.get('longitude'))

    if not endereco_principal:
        return jsonify({'erro': 'Endereço principal é obrigatório'}), 400
    if endereco_json is not None and not isinstance(endereco_json, dict):
        return jsonify({'erro': 'endereco_json deve ser um objeto JSON'}), 400
    if data.get('latitude') not in (None, '') and latitude is None:
        return jsonify({'erro': 'Latitude inválida'}), 400
    if data.get('longitude') not in (None, '') and longitude is None:
        return jsonify({'erro': 'Longitude inválida'}), 400

    u.endereco_principal = endereco_principal
    u.endereco_json = endereco_json if isinstance(endereco_json, dict) else u.endereco_json
    u.latitude = latitude
    u.longitude = longitude
    u.tem_endereco = True

    try:
        db.session.commit()
        return jsonify({'usuario': u.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar endereço'}), 500


# ── USUÁRIOS (CRUD) ─────────────────────────────────────
def listar_usuarios(usuario_atual):
    # Retorna lista limitada de usuários (campos não sensíveis)
    us = Usuario.query.order_by(Usuario.criado_em.desc()).all()
    usuarios = [
        {
            'id': u.id, 'nome': u.nome, 'email': u.email,
            'telefone': u.telefone, 'tipo': u.tipo, 'ativo': u.ativo,
            'criado_em': u.criado_em.isoformat() if u.criado_em else None,
        } for u in us
    ]
    return jsonify({'usuarios': usuarios}), 200


def obter_usuario(usuario_atual, usuario_id):
    u = Usuario.query.get_or_404(usuario_id)
    return jsonify({'usuario': u.to_dict()}), 200


def deletar_usuario(usuario_atual, usuario_id):
    # Soft-delete: apenas o próprio usuário pode desativar sua conta
    if usuario_atual.id != usuario_id:
        return jsonify({'erro': 'Sem permissão'}), 403
    u = Usuario.query.get_or_404(usuario_id)
    try:
        u.ativo = False
        db.session.commit()
        return jsonify({'mensagem': 'Conta desativada'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao desativar conta'}), 500


# ── RESTAURANTE ───────────────────────────────────────────
def listar_restaurantes():
    busca = request.args.get('busca', '')
    categoria = request.args.get('categoria', '')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 12, type=int), 50)
    q = Restaurante.query.filter_by(status='aprovado')
    if categoria:
        q = q.filter(Restaurante.categoria.ilike(f'%{categoria}%'))
    if busca:
        q = q.filter(Restaurante.nome_fantasia.ilike(f'%{busca}%') |
                     Restaurante.categoria.ilike(f'%{busca}%'))
    p = q.order_by(Restaurante.criado_em.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({'restaurantes': [r.to_dict() for r in p.items], 'total': p.total}), 200


def meus_restaurantes(usuario_atual):
    rs = Restaurante.query.filter_by(usuario_id=usuario_atual.id).all()
    return jsonify({'restaurantes': [r.to_dict() for r in rs]}), 200


def criar_restaurante(usuario_atual):
    data = request.get_json(silent=True) or {}
    nome_fantasia = (data.get('nome_fantasia') or '').strip()
    descricao = (data.get('descricao') or '').strip()
    endereco = (data.get('endereco') or '').strip()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    endereco_json = data.get('endereco_json') if isinstance(data.get('endereco_json'), dict) else None

    if not nome_fantasia:
        return jsonify({'erro': 'Nome é obrigatório'}), 400
    if len(nome_fantasia) > 100:
        return jsonify({'erro': 'nome_fantasia deve ter no máximo 100 caracteres'}), 400
    if len(descricao) > 500:
        return jsonify({'erro': 'descricao deve ter no máximo 500 caracteres'}), 400
    if not endereco:
        return jsonify({'erro': 'Endereço é obrigatório'}), 400
    if len(endereco) < 10 or len(endereco) > 200:
        return jsonify({'erro': 'endereco deve ter entre 10 e 200 caracteres'}), 400

    # Parse lat/lng
    try:
        latitude = float(latitude) if latitude not in (None, '') else None
    except (TypeError, ValueError):
        latitude = None
    try:
        longitude = float(longitude) if longitude not in (None, '') else None
    except (TypeError, ValueError):
        longitude = None

    try:
        r = Restaurante(
            nome_fantasia=nome_fantasia,
            descricao=descricao,
            endereco=endereco,
            latitude=latitude,
            longitude=longitude,
            endereco_json=endereco_json,
            telefone=data.get('telefone', ''),
            categoria=data.get('categoria', ''),
            imagem_url=data.get('imagem_url', ''),
            status='pendente',
            usuario_id=usuario_atual.id
        )
        db.session.add(r)
        db.session.commit()
        return jsonify({'restaurante': r.to_dict()}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao criar restaurante'}), 500


def atualizar_restaurante(usuario_atual, rid):
    r = Restaurante.query.get_or_404(rid)
    is_owner = r.usuario_id == usuario_atual.id
    is_admin = usuario_atual.tipo == 'administrador'
    if not is_owner and not is_admin:
        return jsonify({'erro': 'Sem permissão'}), 403
    data = request.get_json(silent=True) or {}
    if 'status' in data and not is_admin:
        return jsonify({'erro': 'Apenas administradores podem alterar o status do restaurante'}), 403

    if 'status' in data:
        status = (data.get('status') or '').strip().lower()
        if status not in {'pendente', 'aprovado', 'rejeitado'}:
            return jsonify({'erro': 'status inválido. Use: pendente, aprovado, rejeitado'}), 400
        r.status = status

    nome_fantasia = (data.get('nome_fantasia') or '').strip() if 'nome_fantasia' in data else None
    descricao = (data.get('descricao') or '').strip() if 'descricao' in data else None
    endereco = (data.get('endereco') or '').strip() if 'endereco' in data else None

    if nome_fantasia is not None:
        if not nome_fantasia:
            return jsonify({'erro': 'nome_fantasia é obrigatório'}), 400
        if len(nome_fantasia) > 100:
            return jsonify({'erro': 'nome_fantasia deve ter no máximo 100 caracteres'}), 400

    if descricao is not None and len(descricao) > 500:
        return jsonify({'erro': 'descricao deve ter no máximo 500 caracteres'}), 400

    if endereco is not None:
        if len(endereco) < 10 or len(endereco) > 200:
            return jsonify({'erro': 'endereco deve ter entre 10 e 200 caracteres'}), 400

    for c in ['nome_fantasia', 'descricao', 'endereco', 'telefone', 'categoria', 'imagem_url']:
        if c in data:
            if c == 'nome_fantasia':
                setattr(r, c, nome_fantasia)
            elif c == 'descricao':
                setattr(r, c, descricao)
            elif c == 'endereco':
                setattr(r, c, endereco)
            else:
                setattr(r, c, data[c])

    # Geo fields
    if 'latitude' in data:
        try:
            r.latitude = float(data['latitude']) if data['latitude'] not in (None, '') else None
        except (TypeError, ValueError):
            pass
    if 'longitude' in data:
        try:
            r.longitude = float(data['longitude']) if data['longitude'] not in (None, '') else None
        except (TypeError, ValueError):
            pass
    if 'endereco_json' in data and isinstance(data['endereco_json'], dict):
        r.endereco_json = data['endereco_json']

    try:
        db.session.commit()
        return jsonify({'restaurante': r.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar'}), 500


def deletar_restaurante(usuario_atual, rid):
    r = Restaurante.query.get_or_404(rid)
    if r.usuario_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    try:
        db.session.delete(r)
        db.session.commit()
        return jsonify({'mensagem': 'Excluído'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao excluir'}), 500


def obter_restaurante(rid):
    r = Restaurante.query.get_or_404(rid)
    return jsonify({'restaurante': r.to_dict()}), 200


# ── PRODUTO ───────────────────────────────────────────────
def listar_produtos(rid):
    r = Restaurante.query.get_or_404(rid)
    busca = request.args.get('busca', '')
    categoria = request.args.get('categoria', '')
    disponivel = request.args.get('disponivel')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 100)

    q = Produto.query.filter_by(restaurante_id=rid)
    if busca:
        q = q.filter(Produto.nome.ilike(f'%{busca}%') |
                     Produto.categoria.ilike(f'%{busca}%'))
    if categoria:
        q = q.filter(Produto.categoria.ilike(f'%{categoria}%'))
    if disponivel is not None:
        flag = str(disponivel).lower() in ['1', 'true', 'sim', 'yes']
        q = q.filter(Produto.disponivel == flag)

    p = q.order_by(Produto.criado_em.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({'produtos': [produto.to_dict() for produto in p.items], 'total': p.total}), 200


def criar_produto(usuario_atual, rid):
    r = Restaurante.query.get_or_404(rid)
    if r.usuario_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    if r.status != 'aprovado':
        return jsonify({'erro': 'Restaurante precisa estar aprovado para cadastrar produtos'}), 403
    data = request.get_json(silent=True) or {}
    nome = (data.get('nome') or '').strip()
    descricao = (data.get('descricao') or '').strip()
    if not nome:
        return jsonify({'erro': 'Nome é obrigatório'}), 400
    if len(nome) > 50:
        return jsonify({'erro': 'nome deve ter no máximo 50 caracteres'}), 400
    if len(descricao) > 100:
        return jsonify({'erro': 'descricao deve ter no máximo 100 caracteres'}), 400
    try:
        preco = float(data.get('preco', 0))
    except (TypeError, ValueError):
        return jsonify({'erro': 'Preço inválido'}), 400
    if preco < 0:
        return jsonify({'erro': 'preco deve ser maior ou igual a zero'}), 400
    try:
        p = Produto(
            restaurante_id=rid,
            nome=nome,
            descricao=descricao,
            preco=preco,
            categoria=data.get('categoria', ''),
            imagem_url=data.get('imagem_url', ''),
            disponivel=_to_bool(data.get('disponivel', True))
        )
        db.session.add(p)
        db.session.commit()
        return jsonify({'produto': p.to_dict()}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao criar produto'}), 500


def atualizar_produto(usuario_atual, rid, pid):
    r = Restaurante.query.get_or_404(rid)
    if r.usuario_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    p = Produto.query.get_or_404(pid)
    data = request.get_json(silent=True) or {}
    if 'nome' in data:
        nome = (data.get('nome') or '').strip()
        if not nome:
            return jsonify({'erro': 'nome é obrigatório'}), 400
        if len(nome) > 50:
            return jsonify({'erro': 'nome deve ter no máximo 50 caracteres'}), 400
        p.nome = nome
    if 'descricao' in data:
        descricao = (data.get('descricao') or '').strip()
        if len(descricao) > 100:
            return jsonify({'erro': 'descricao deve ter no máximo 100 caracteres'}), 400
        p.descricao = descricao
    for c in ['categoria', 'imagem_url']:
        if c in data:
            setattr(p, c, data[c])
    if 'preco' in data:
        try:
            preco = float(data['preco'])
            if preco < 0:
                return jsonify({'erro': 'preco deve ser maior ou igual a zero'}), 400
            p.preco = preco
        except (TypeError, ValueError):
            return jsonify({'erro': 'Preço inválido'}), 400
    if 'disponivel' in data:
        p.disponivel = _to_bool(data['disponivel'])
    try:
        db.session.commit()
        return jsonify({'produto': p.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar'}), 500


def deletar_produto(usuario_atual, rid, pid):
    r = Restaurante.query.get_or_404(rid)
    if r.usuario_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    p = Produto.query.get_or_404(pid)
    try:
        db.session.delete(p)
        db.session.commit()
        return jsonify({'mensagem': 'Produto excluído'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao excluir'}), 500


# ── PEDIDO ────────────────────────────────────────────────

# Regras de compatibilidade pagamento
_METODOS_SITE = {'pix', 'cartao_app'}
_METODOS_ENTREGA = {'dinheiro', 'maquininha'}
_TAXAS_ENTREGA = {'padrao': 4.99, 'rapida': 7.99}


def _criar_notificacao(usuario_id, tipo, titulo, mensagem, pedido_id=None, dados=None):
    """Utilitário interno: persiste uma Notificacao."""
    try:
        n = Notificacao(
            usuario_id=usuario_id,
            pedido_id=pedido_id,
            tipo=tipo,
            titulo=titulo,
            mensagem=mensagem,
            dados_json=dados,
        )
        db.session.add(n)
        # Não faz commit aqui — quem chama é responsável
    except Exception:
        pass  # Não deixar erro de notificação derrubar o fluxo principal


def criar_pedido(usuario_atual):
    data = request.get_json(silent=True) or {}
    rid = data.get('restaurante_id')
    itens = data.get('itens', [])
    endereco = data.get('endereco_entrega', '').strip() or (usuario_atual.endereco_principal or '').strip()
    endereco_detalhes = data.get('endereco_detalhes') if isinstance(data.get('endereco_detalhes'), dict) else None
    endereco_coords = data.get('endereco_coords') if isinstance(data.get('endereco_coords'), dict) else {}
    endereco_latitude = _to_float(endereco_coords.get('lat'))
    endereco_longitude = _to_float(endereco_coords.get('lng'))

    # ── Sprint 3: campos de entrega e pagamento ──────────────────────────────
    tipo_entrega = (data.get('tipo_entrega') or 'padrao').lower()
    pagamento_contexto = (data.get('pagamento_contexto') or '').lower()
    pagamento_metodo = (data.get('pagamento_metodo') or '').lower()

    if tipo_entrega not in _TAXAS_ENTREGA:
        return jsonify({'erro': 'tipo_entrega inválido. Use: padrao, rapida'}), 400
    taxa_entrega = _TAXAS_ENTREGA[tipo_entrega]

    if pagamento_contexto not in {'site', 'entrega'}:
        return jsonify({'erro': 'pagamento_contexto inválido. Use: site, entrega'}), 400

    if pagamento_contexto == 'site' and pagamento_metodo not in _METODOS_SITE:
        return jsonify({'erro': 'Para pagamento no site use: pix, cartao_app'}), 400
    if pagamento_contexto == 'entrega' and pagamento_metodo not in _METODOS_ENTREGA:
        return jsonify({'erro': 'Para pagamento na entrega use: dinheiro, maquininha'}), 400

    if not rid or not itens or not endereco:
        return jsonify({'erro': 'restaurante_id, itens e endereco_entrega são obrigatórios'}), 400
    if usuario_atual.tipo == 'cliente' and not (usuario_atual.tem_endereco or data.get('endereco_entrega', '').strip()):
        return jsonify({'erro': 'Cadastre ou informe um endereço para concluir o pedido'}), 400
    if endereco_coords and (endereco_latitude is None or endereco_longitude is None):
        return jsonify({'erro': 'endereco_coords inválido. Use { lat, lng } numéricos'}), 400

    restaurante = Restaurante.query.get_or_404(rid)
    if restaurante.status != 'aprovado':
        return jsonify({'erro': 'Restaurante indisponível para receber pedidos'}), 400

    subtotal = 0.0
    itens_obj = []
    produto_restaurantes = set()
    for item in itens:
        p = Produto.query.get(item.get('produto_id'))
        if not p or not p.disponivel:
            return jsonify({'erro': f'Produto {item.get("produto_id")} indisponível'}), 400
        qtd = int(item.get('quantidade', 1))
        if qtd < 1:
            return jsonify({'erro': 'Quantidade mínima por item é 1'}), 400
        produto_restaurantes.add(p.restaurante_id)
        subtotal += float(p.preco) * qtd
        itens_obj.append({'produto': p, 'quantidade': qtd, 'preco': p.preco})

    if len(produto_restaurantes) != 1 or rid not in produto_restaurantes:
        return jsonify({'erro': 'Todos os produtos devem pertencer ao mesmo restaurante do pedido'}), 400

    total_geral = subtotal + taxa_entrega

    try:
        pedido = Pedido(
            cliente_id=usuario_atual.id,
            restaurante_id=rid,
            status='aguardando',
            endereco_entrega=endereco,
            endereco_detalhes=endereco_detalhes,
            endereco_latitude=endereco_latitude,
            endereco_longitude=endereco_longitude,
            total=total_geral,
            observacao=data.get('observacao', ''),
            tipo_entrega=tipo_entrega,
            taxa_entrega=taxa_entrega,
            pagamento_contexto=pagamento_contexto,
            pagamento_metodo=pagamento_metodo,
            pagamento_status='pendente',
        )
        db.session.add(pedido)
        db.session.flush()
        for i in itens_obj:
            db.session.add(ItemPedido(
                pedido_id=pedido.id,
                produto_id=i['produto'].id,
                quantidade=i['quantidade'],
                preco_unitario=i['preco']
            ))
        # Notificação ao cliente
        _criar_notificacao(
            usuario_id=usuario_atual.id,
            tipo='pedido_criado',
            titulo='Pedido realizado! 🎉',
            mensagem=f'Seu pedido #{pedido.id} foi enviado ao restaurante e está aguardando confirmação.',
            pedido_id=pedido.id,
        )
        db.session.commit()
        return jsonify({'pedido': pedido.to_dict()}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao criar pedido'}), 500


def meus_pedidos_cliente(usuario_atual):
    ps = Pedido.query.filter_by(cliente_id=usuario_atual.id).order_by(Pedido.criado_em.desc()).all()
    return jsonify({'pedidos': [p.to_dict() for p in ps]}), 200


def pedidos_restaurante(usuario_atual, rid):
    r = Restaurante.query.get_or_404(rid)
    if r.usuario_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    status = request.args.get('status')
    q = Pedido.query.filter_by(restaurante_id=rid)
    if status:
        q = q.filter_by(status=status)
    ps = q.order_by(Pedido.criado_em.desc()).all()
    return jsonify({'pedidos': [p.to_dict() for p in ps]}), 200


def atualizar_status_pedido(usuario_atual, pid):
    from datetime import datetime, timedelta
    pedido = Pedido.query.get_or_404(pid)
    r = Restaurante.query.get(pedido.restaurante_id)
    e = Entregador.query.filter_by(usuario_id=usuario_atual.id).first()
    is_restaurante_dono = bool(r and r.usuario_id == usuario_atual.id)
    is_cliente_dono = pedido.cliente_id == usuario_atual.id
    is_entregador_do_pedido = bool(e and pedido.entregador_id == e.id)
    is_entregador_livre = bool(e and pedido.entregador_id is None)

    data = request.get_json(silent=True) or {}
    status_validos = [
        'aguardando', 'confirmado', 'preparando', 'saiu_para_entrega',
        'entregue_aguardando_confirmacao_cliente', 'entregue', 'cancelado',
    ]
    novo_status = data.get('status', '')
    if novo_status not in status_validos:
        return jsonify({'erro': f'Status inválido. Use: {", ".join(status_validos)}'}), 400

    transicoes_permitidas = {
        'aguardando': {'confirmado', 'cancelado'},
        'confirmado': {'preparando'},
        'preparando': {'saiu_para_entrega'},
        'saiu_para_entrega': {'entregue_aguardando_confirmacao_cliente'},
        'entregue_aguardando_confirmacao_cliente': {'entregue'},
        'entregue': set(),
        'cancelado': set(),
    }
    if novo_status not in transicoes_permitidas.get(pedido.status, set()):
        return jsonify({'erro': f'Transição inválida: {pedido.status} -> {novo_status}'}), 400

    if novo_status in {'confirmado', 'preparando'} and not is_restaurante_dono:
        return jsonify({'erro': 'Apenas o restaurante pode confirmar ou preparar pedidos'}), 403

    if novo_status == 'cancelado':
        if not (is_cliente_dono and pedido.status == 'aguardando'):
            return jsonify({'erro': 'Cliente só pode cancelar pedido em status aguardando'}), 403

    if novo_status == 'saiu_para_entrega':
        if not (is_entregador_do_pedido or is_entregador_livre):
            return jsonify({'erro': 'Apenas entregador pode iniciar entrega'}), 403
        entrega_ativa = Pedido.query.filter(
            Pedido.entregador_id == e.id,
            Pedido.status == 'saiu_para_entrega',
            Pedido.id != pedido.id
        ).first()
        if entrega_ativa:
            return jsonify({'erro': 'Entregador já possui uma entrega ativa'}), 409
        pedido.entregador_id = e.id

        # Gerar código de validação de 6 dígitos
        import random, hashlib
        codigo_raw = str(random.randint(100000, 999999))
        pedido.codigo_entrega_hash = hashlib.sha256(codigo_raw.encode()).hexdigest()
        pedido.codigo_entrega_expira_em = datetime.utcnow() + timedelta(hours=2)
        pedido.codigo_entrega_enviado_em = datetime.utcnow()

        # Notificar cliente com o código
        _criar_notificacao(
            usuario_id=pedido.cliente_id,
            tipo='codigo_entrega',
            titulo='🛵 Seu pedido saiu para entrega!',
            mensagem=f'O entregador está a caminho. Código de confirmação: {codigo_raw}',
            pedido_id=pedido.id,
            dados={'codigo': codigo_raw},
        )

    if novo_status == 'entregue_aguardando_confirmacao_cliente':
        if not is_entregador_do_pedido:
            return jsonify({'erro': 'Apenas o entregador responsável pode avançar para este status'}), 403

    if novo_status == 'entregue' and not (is_entregador_do_pedido or is_cliente_dono):
        return jsonify({'erro': 'Apenas o entregador ou cliente podem concluir a entrega'}), 403

    pedido.status = novo_status

    # ── Notificações de mudança de status ──────────────────────────────────────
    _msgs_status = {
        'confirmado': ('✅ Pedido confirmado!', 'O restaurante confirmou seu pedido e em breve começará a prepará-lo.'),
        'preparando': ('👨‍🍳 Preparando seu pedido!', 'O restaurante está preparando seu pedido agora.'),
        'entregue_aguardando_confirmacao_cliente': ('📦 Pedido entregue — confirme o recebimento', 'O entregador diz que entregou. Por favor, confirme o recebimento no app.'),
        'entregue': ('🎉 Pedido concluído!', 'Seu pedido foi entregue. Obrigado por usar o Kifome!'),
        'cancelado': ('❌ Pedido cancelado', 'Seu pedido foi cancelado.'),
    }
    if novo_status in _msgs_status:
        titulo_n, msg_n = _msgs_status[novo_status]
        _criar_notificacao(
            usuario_id=pedido.cliente_id,
            tipo='status_mudou',
            titulo=titulo_n,
            mensagem=msg_n,
            pedido_id=pedido.id,
            dados={'novo_status': novo_status},
        )

    try:
        db.session.commit()
        return jsonify({'pedido': pedido.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar'}), 500


def entregas_entregador(usuario_atual):
    e = Entregador.query.filter_by(usuario_id=usuario_atual.id).first()
    if not e:
        return jsonify({'erro': 'Perfil de entregador não encontrado'}), 404
    status = request.args.get('status', 'saiu_para_entrega')
    q = Pedido.query.filter_by(entregador_id=e.id)
    if status:
        q = q.filter_by(status=status)
    ps = q.order_by(Pedido.criado_em.desc()).all()
    return jsonify({'entregas': [p.to_dict() for p in ps]}), 200


def pedidos_disponiveis(usuario_atual):
    ps = Pedido.query.filter_by(status='preparando', entregador_id=None).order_by(Pedido.criado_em.desc()).all()
    return jsonify({'pedidos': [p.to_dict() for p in ps]}), 200


# ── AVALIAÇÃO DE PEDIDO ───────────────────────────────────
def avaliar_pedido(usuario_atual, pid):
    pedido = Pedido.query.get_or_404(pid)
    if pedido.cliente_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    if pedido.status != 'entregue':
        return jsonify({'erro': 'Apenas pedidos entregues podem ser avaliados'}), 400
    if pedido.avaliacao_nota is not None:
        return jsonify({'erro': 'Este pedido já foi avaliado'}), 409

    data = request.get_json(silent=True) or {}
    nota = data.get('nota')
    comentario = (data.get('comentario') or '').strip()

    if nota is None:
        return jsonify({'erro': 'Nota é obrigatória (1 a 5)'}), 400
    try:
        nota = int(nota)
    except (TypeError, ValueError):
        return jsonify({'erro': 'Nota deve ser um número inteiro de 1 a 5'}), 400
    if nota < 1 or nota > 5:
        return jsonify({'erro': 'Nota deve ser entre 1 e 5'}), 400
    if len(comentario) > 500:
        return jsonify({'erro': 'Comentário deve ter no máximo 500 caracteres'}), 400

    from datetime import datetime
    pedido.avaliacao_nota = nota
    pedido.avaliacao_comentario = comentario or None
    pedido.avaliacao_em = datetime.utcnow()

    try:
        db.session.commit()
        return jsonify({'pedido': pedido.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao salvar avaliação'}), 500


# ── ENTREGADOR ────────────────────────────────────────────
def criar_entregador(usuario_atual):
    if Entregador.query.filter_by(usuario_id=usuario_atual.id).first():
        return jsonify({'erro': 'Você já tem perfil de entregador'}), 409
    data = request.get_json(silent=True) or {}
    veiculo = data.get('veiculo', 'moto')
    if veiculo not in ['moto', 'bicicleta', 'carro', 'a_pe']:
        return jsonify({'erro': 'Veículo inválido'}), 400
    try:
        e = Entregador(usuario_id=usuario_atual.id, veiculo=veiculo,
                       placa=data.get('placa', ''), cnh=data.get('cnh', ''))
        db.session.add(e)
        db.session.commit()
        return jsonify({'entregador': e.to_dict()}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao criar'}), 500


def meu_perfil_entregador(usuario_atual):
    e = Entregador.query.filter_by(usuario_id=usuario_atual.id).first()
    if not e:
        return jsonify({'erro': 'Perfil não encontrado'}), 404
    return jsonify({'entregador': e.to_dict()}), 200


def atualizar_entregador(usuario_atual, eid):
    e = Entregador.query.get_or_404(eid)
    if e.usuario_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    data = request.get_json(silent=True) or {}
    for c in ['veiculo', 'placa', 'cnh']:
        if c in data:
            setattr(e, c, data[c])
    if 'ativo' in data:
        e.ativo = bool(data['ativo'])
    try:
        db.session.commit()
        return jsonify({'entregador': e.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar'}), 500


# ── VALIDAR ENTREGA (código 6 dígitos) ───────────────────
def validar_entrega(usuario_atual, pid):
    """Entregador informa o código que o cliente recebeu para confirmar a entrega."""
    import hashlib
    from datetime import datetime

    pedido = Pedido.query.get_or_404(pid)
    e = Entregador.query.filter_by(usuario_id=usuario_atual.id).first()
    if not e or pedido.entregador_id != e.id:
        return jsonify({'erro': 'Apenas o entregador responsável pode validar a entrega'}), 403
    if pedido.status != 'saiu_para_entrega':
        return jsonify({'erro': 'O pedido não está em rota de entrega'}), 400

    data = request.get_json(silent=True) or {}
    codigo = str(data.get('codigo', '')).strip()
    if not codigo:
        return jsonify({'erro': 'Informe o código de validação'}), 400

    if not pedido.codigo_entrega_hash:
        return jsonify({'erro': 'Código de entrega não gerado para este pedido'}), 400

    agora = datetime.utcnow()
    if pedido.codigo_entrega_expira_em and agora > pedido.codigo_entrega_expira_em:
        return jsonify({'erro': 'Código de validação expirado. Solicite ao cliente o novo código.'}), 410

    codigo_hash = hashlib.sha256(codigo.encode()).hexdigest()
    if codigo_hash != pedido.codigo_entrega_hash:
        return jsonify({'erro': 'Código inválido'}), 400

    # Avança status
    pedido.status = 'entregue_aguardando_confirmacao_cliente'
    _criar_notificacao(
        usuario_id=pedido.cliente_id,
        tipo='aguardando_confirmacao',
        titulo='📦 Confirme o recebimento!',
        mensagem=f'O entregador validou a entrega do pedido #{pedido.id}. Por favor, confirme que você recebeu.',
        pedido_id=pedido.id,
    )
    try:
        db.session.commit()
        return jsonify({'pedido': pedido.to_dict(), 'mensagem': 'Entrega validada com sucesso'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao validar entrega'}), 500


# ── CONFIRMAR RECEBIMENTO PELO CLIENTE ───────────────────
def confirmar_recebimento(usuario_atual, pid):
    from datetime import datetime
    pedido = Pedido.query.get_or_404(pid)

    if pedido.cliente_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão — você não é o cliente deste pedido'}), 403
    if pedido.status != 'entregue_aguardando_confirmacao_cliente':
        return jsonify({'erro': 'Pedido não está aguardando confirmação de recebimento'}), 400
    if pedido.status == 'cancelado':
        return jsonify({'erro': 'Pedido cancelado não pode ser confirmado'}), 400

    pedido.status = 'entregue'
    pedido.entregue_confirmado_cliente_em = datetime.utcnow()
    pedido.entregue_confirmado_cliente_por = usuario_atual.id

    _criar_notificacao(
        usuario_id=usuario_atual.id,
        tipo='entregue_confirmado',
        titulo='🎉 Pedido concluído!',
        mensagem=f'Você confirmou o recebimento do pedido #{pedido.id}. Obrigado por usar o Kifome!',
        pedido_id=pedido.id,
    )
    try:
        db.session.commit()
        return jsonify({'pedido': pedido.to_dict(), 'mensagem': 'Recebimento confirmado com sucesso'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao confirmar recebimento'}), 500


# ── NOTIFICAÇÕES ─────────────────────────────────────────
def minhas_notificacoes(usuario_atual):
    from datetime import datetime
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 30, type=int), 100)
    apenas_nao_lidas = request.args.get('nao_lidas', '').lower() in {'1', 'true', 'sim'}

    q = Notificacao.query.filter_by(usuario_id=usuario_atual.id)
    if apenas_nao_lidas:
        q = q.filter_by(lida=False)
    pag = q.order_by(Notificacao.criado_em.desc()).paginate(page=page, per_page=per_page, error_out=False)
    nao_lidas = Notificacao.query.filter_by(usuario_id=usuario_atual.id, lida=False).count()
    return jsonify({
        'notificacoes': [n.to_dict() for n in pag.items],
        'total': pag.total,
        'nao_lidas': nao_lidas,
    }), 200


def marcar_notificacao_lida(usuario_atual, nid):
    from datetime import datetime
    n = Notificacao.query.get_or_404(nid)
    if n.usuario_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    if not n.lida:
        n.lida = True
        n.lida_em = datetime.utcnow()
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({'erro': 'Erro ao atualizar notificação'}), 500
    return jsonify({'notificacao': n.to_dict()}), 200


def marcar_todas_lidas(usuario_atual):
    from datetime import datetime
    Notificacao.query.filter_by(usuario_id=usuario_atual.id, lida=False).update(
        {'lida': True, 'lida_em': datetime.utcnow()},
        synchronize_session=False,
    )
    try:
        db.session.commit()
        return jsonify({'mensagem': 'Todas as notificações marcadas como lidas'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar notificações'}), 500


# ── PAGAMENTO MERCADO PAGO ───────────────────────────────
def mp_criar_preferencia(usuario_atual):
    data = request.get_json(silent=True) or {}
    pid = data.get('pedido_id')
    if not pid:
        return jsonify({'erro': 'pedido_id é obrigatório'}), 400
    pedido = Pedido.query.get_or_404(int(pid))
    if pedido.cliente_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    if pedido.pagamento_metodo not in ('cartao_app', 'pix'):
        return jsonify({'erro': 'Este pedido não usa pagamento online (cartão ou PIX no app)'}), 400
    if pedido.pagamento_preference_id:
        return jsonify({'preference_id': pedido.pagamento_preference_id, 'ja_existia': True}), 200

    try:
        from app.utils.mp_utils import criar_preference_mp
        pref = criar_preference_mp(pedido, usuario_atual)
        pedido.pagamento_preference_id = pref['id']
        pedido.pagamento_provedor = 'mercadopago'
        db.session.commit()
        return jsonify({'preference_id': pref['id'], 'init_point': pref.get('init_point'), 'sandbox_init_point': pref.get('sandbox_init_point')}), 200
    except Exception as ex:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao criar preferência MP: {str(ex)}'}), 500


def mp_webhook(usuario_atual=None):
    """Recebe notificações do Mercado Pago e atualiza status de pagamento."""
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    tipo = data.get('type') or data.get('topic', '')
    recurso_id = data.get('data', {}).get('id') or data.get('id')

    if tipo not in {'payment', 'merchant_order'}:
        return jsonify({'ok': True}), 200  # Ignora outros eventos

    try:
        from app.utils.mp_utils import obter_pagamento_mp
        pagamento = obter_pagamento_mp(str(recurso_id))
        if not pagamento:
            return jsonify({'ok': True}), 200

        external_ref = pagamento.get('external_reference', '')
        mp_status = pagamento.get('status', '')
        mp_id = str(pagamento.get('id', ''))

        if not external_ref.startswith('pedido_'):
            return jsonify({'ok': True}), 200

        pid = int(external_ref.replace('pedido_', ''))
        pedido = Pedido.query.get(pid)
        if not pedido:
            return jsonify({'ok': True}), 200

        # Idempotência: ignora se já processou este transaction_id
        if pedido.pagamento_transaction_id == mp_id:
            return jsonify({'ok': True, 'idempotente': True}), 200

        pedido.pagamento_transaction_id = mp_id
        mapa = {'approved': 'aprovado', 'rejected': 'recusado', 'cancelled': 'cancelado', 'pending': 'pendente', 'in_process': 'pendente'}
        pedido.pagamento_status = mapa.get(mp_status, 'pendente')

        if mp_status == 'approved':
            _criar_notificacao(
                usuario_id=pedido.cliente_id,
                tipo='pagamento_aprovado',
                titulo='💳 Pagamento aprovado!',
                mensagem=f'Seu pagamento do pedido #{pedido.id} foi aprovado.',
                pedido_id=pedido.id,
            )
        elif mp_status in {'rejected', 'cancelled'}:
            _criar_notificacao(
                usuario_id=pedido.cliente_id,
                tipo='pagamento_recusado',
                titulo='⚠️ Pagamento não aprovado',
                mensagem=f'Seu pagamento do pedido #{pedido.id} foi {pedido.pagamento_status}. Tente novamente.',
                pedido_id=pedido.id,
            )
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        print(f'[MP Webhook] Erro: {ex}')

    return jsonify({'ok': True}), 200


def mp_status_pedido(usuario_atual, pid):
    pedido = Pedido.query.get_or_404(pid)
    if pedido.cliente_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    return jsonify({
        'pedido_id': pedido.id,
        'pagamento_status': pedido.pagamento_status,
        'pagamento_metodo': pedido.pagamento_metodo,
        'pagamento_transaction_id': pedido.pagamento_transaction_id,
    }), 200


# ── SANDBOX: confirmar pagamento consultando o MP (webhook nao funciona em localhost) ─
def mp_confirmar_sandbox(usuario_atual, pid):
    """
    Consulta o status real do pagamento no Mercado Pago pela preference_id.
    Se aprovado: atualiza o banco e retorna 200.
    Se ainda pendente: retorna 402 (frontend continua polling).
    """
    pedido = Pedido.query.get_or_404(pid)
    if pedido.cliente_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403

    # Se já está aprovado no banco, retorna direto
    if pedido.pagamento_status == 'aprovado':
        return jsonify({'mensagem': 'Pagamento já confirmado', 'pedido': pedido.to_dict()}), 200

    # Consultar pagamentos da preference no MP
    if pedido.pagamento_preference_id:
        try:
            import mercadopago, os
            sdk = mercadopago.SDK(os.environ.get('MP_ACCESS_TOKEN', ''))
            # Buscar pagamentos associados à preference
            result = sdk.payment().search({'external_reference': f'pedido_{pid}'})
            resp = result.get('response', {})
            pagamentos = resp.get('results', [])
            # Verificar se algum pagamento foi aprovado
            aprovado = next((p for p in pagamentos if p.get('status') == 'approved'), None)
            recusado = next((p for p in pagamentos if p.get('status') in ('rejected', 'cancelled')), None)

            if aprovado:
                pedido.pagamento_status = 'aprovado'
                pedido.pagamento_transaction_id = str(aprovado.get('id', ''))
                _criar_notificacao(
                    usuario_id=pedido.cliente_id,
                    tipo='pagamento_aprovado',
                    titulo='💳 Pagamento aprovado!',
                    mensagem=f'Seu pagamento do pedido #{pedido.id} foi aprovado. O restaurante já foi notificado.',
                    pedido_id=pedido.id,
                )
                db.session.commit()
                return jsonify({'mensagem': 'Pagamento confirmado via MP', 'pedido': pedido.to_dict()}), 200

            if recusado:
                pedido.pagamento_status = 'recusado'
                db.session.commit()
                return jsonify({'erro': 'Pagamento recusado pelo Mercado Pago', 'status': 'recusado'}), 402

            # Nenhum pagamento aprovado ainda — pendente
            return jsonify({'erro': 'Pagamento ainda não confirmado pelo Mercado Pago', 'status': 'pendente'}), 402

        except Exception as ex:
            db.session.rollback()
            print(f'[sandbox confirm] Erro ao consultar MP: {ex}')
            return jsonify({'erro': f'Erro ao consultar Mercado Pago: {str(ex)}'}), 500

    # Sem preference_id: confirmar direto (fallback para métodos sem MP)
    pedido.pagamento_status = 'aprovado'
    _criar_notificacao(
        usuario_id=pedido.cliente_id,
        tipo='pagamento_aprovado',
        titulo='💳 Pagamento confirmado!',
        mensagem=f'Seu pagamento do pedido #{pedido.id} foi confirmado.',
        pedido_id=pedido.id,
    )
    try:
        db.session.commit()
        return jsonify({'mensagem': 'Pagamento confirmado', 'pedido': pedido.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao confirmar pagamento'}), 500


# ── SIMULAÇÃO DE ENTREGA (demo) ──────────────────────────────────────────────
def simular_passo_entrega(usuario_atual, pid):
    """
    Demo: avança o pedido para o próximo status na sequência natural.
    Quando chega em saiu_para_entrega, gera o código de entrega automaticamente.
    Retorna o pedido atualizado e o código em texto (se gerado neste passo).
    """
    from datetime import datetime, timedelta
    import random, hashlib

    pedido = Pedido.query.get_or_404(pid)
    if pedido.cliente_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403

    sequencia = [
        'aguardando',
        'confirmado',
        'preparando',
        'saiu_para_entrega',
        'entregue_aguardando_confirmacao_cliente',
        'entregue',
    ]

    if pedido.status not in sequencia:
        return jsonify({'erro': f'Simulação não disponível no status: {pedido.status}'}), 400

    idx_atual = sequencia.index(pedido.status)
    if idx_atual >= len(sequencia) - 1:
        return jsonify({'erro': 'Pedido já concluído.'}), 400

    proximo = sequencia[idx_atual + 1]
    codigo_gerado = None

    # Ao entrar em saiu_para_entrega: atribuir entregador virtual e gerar código
    if proximo == 'saiu_para_entrega':
        # Buscar qualquer entregador cadastrado, ou criar vínculo virtual
        entregador = Entregador.query.first()
        if entregador:
            pedido.entregador_id = entregador.id
        # Gerar código de 6 dígitos
        codigo_gerado = str(random.randint(100000, 999999))
        pedido.codigo_entrega_hash = hashlib.sha256(codigo_gerado.encode()).hexdigest()
        pedido.codigo_entrega_expira_em = datetime.utcnow() + timedelta(hours=2)
        pedido.codigo_entrega_enviado_em = datetime.utcnow()
        # Notificar cliente com o código
        _criar_notificacao(
            usuario_id=pedido.cliente_id,
            tipo='codigo_entrega',
            titulo='🛵 Seu pedido saiu para entrega!',
            mensagem=f'O entregador está a caminho. Código de confirmação: {codigo_gerado}',
            pedido_id=pedido.id,
            dados={'codigo': codigo_gerado},
        )

    pedido.status = proximo

    # Notificações de status
    _msgs = {
        'confirmado': ('✅ Pedido confirmado!', 'O restaurante confirmou seu pedido.'),
        'preparando': ('👨‍🍳 Preparando seu pedido!', 'O restaurante está preparando agora.'),
        'saiu_para_entrega': ('🛵 Saiu para entrega!', 'O entregador está a caminho.'),
        'entregue_aguardando_confirmacao_cliente': ('📦 Chegou! Confirme o recebimento.', 'Seu pedido foi entregue. Confirme no app.'),
    }
    if proximo in _msgs:
        t, m = _msgs[proximo]
        _criar_notificacao(
            usuario_id=pedido.cliente_id,
            tipo='status_mudou',
            titulo=t,
            mensagem=m,
            pedido_id=pedido.id,
            dados={'novo_status': proximo},
        )

    try:
        db.session.commit()
        resp = {'pedido': pedido.to_dict(), 'novo_status': proximo}
        if codigo_gerado:
            resp['codigo_entrega'] = codigo_gerado
        return jsonify(resp), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao simular passo'}), 500


# ── CÓDIGO DE ENTREGA PARA O CLIENTE ────────────────────────────────────────
def codigo_entrega_cliente(usuario_atual, pid):
    """Retorna o código de entrega do pedido para o cliente ver (para mostrar ao motoboy)."""
    pedido = Pedido.query.get_or_404(pid)
    if pedido.cliente_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    # Buscar da notificação mais recente do tipo codigo_entrega
    notif = (
        Notificacao.query
        .filter_by(usuario_id=usuario_atual.id, pedido_id=pid, tipo='codigo_entrega')
        .order_by(Notificacao.criado_em.desc())
        .first()
    )
    if not notif or not notif.dados or not notif.dados.get('codigo'):
        return jsonify({'erro': 'Código de entrega não disponível ainda'}), 404
    return jsonify({'codigo': notif.dados['codigo']}), 200
