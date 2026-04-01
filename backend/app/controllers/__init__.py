# Arquivo: backend/app/controllers/__init__.py
from flask import request, jsonify
from app import db
from app.models import Usuario, Restaurante, Produto, Pedido, ItemPedido, Entregador
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
    try:
        r = Restaurante(
            nome_fantasia=nome_fantasia,
            descricao=descricao,
            endereco=endereco,
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
    return jsonify({'produtos': [p.to_dict() for p in p.items], 'total': p.total}), 200


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
    except:
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
        except:
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
def criar_pedido(usuario_atual):
    data = request.get_json(silent=True) or {}
    rid = data.get('restaurante_id')
    itens = data.get('itens', [])
    endereco = data.get('endereco_entrega', '').strip() or (usuario_atual.endereco_principal or '').strip()
    endereco_detalhes = data.get('endereco_detalhes') if isinstance(data.get('endereco_detalhes'), dict) else None
    endereco_coords = data.get('endereco_coords') if isinstance(data.get('endereco_coords'), dict) else {}
    endereco_latitude = _to_float(endereco_coords.get('lat'))
    endereco_longitude = _to_float(endereco_coords.get('lng'))

    if not rid or not itens or not endereco:
        return jsonify({'erro': 'restaurante_id, itens e endereco_entrega são obrigatórios'}), 400
    if usuario_atual.tipo == 'cliente' and not (usuario_atual.tem_endereco or data.get('endereco_entrega', '').strip()):
        return jsonify({'erro': 'Cadastre ou informe um endereço para concluir o pedido'}), 400
    if endereco_coords and (endereco_latitude is None or endereco_longitude is None):
        return jsonify({'erro': 'endereco_coords inválido. Use { lat, lng } numéricos'}), 400

    restaurante = Restaurante.query.get_or_404(rid)
    if restaurante.status != 'aprovado':
        return jsonify({'erro': 'Restaurante indisponível para receber pedidos'}), 400
    total = 0.0
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
        total += float(p.preco) * qtd
        itens_obj.append({'produto': p, 'quantidade': qtd, 'preco': p.preco})

    if len(produto_restaurantes) != 1 or rid not in produto_restaurantes:
        return jsonify({'erro': 'Todos os produtos devem pertencer ao mesmo restaurante do pedido'}), 400

    try:
        pedido = Pedido(
            cliente_id=usuario_atual.id,
            restaurante_id=rid,
            status='aguardando',
            endereco_entrega=endereco,
            endereco_detalhes=endereco_detalhes,
            endereco_latitude=endereco_latitude,
            endereco_longitude=endereco_longitude,
            total=total,
            observacao=data.get('observacao', '')
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
    pedido = Pedido.query.get_or_404(pid)
    # Restaurante, cliente e entregador podem atualizar conforme regras
    r = Restaurante.query.get(pedido.restaurante_id)
    e = Entregador.query.filter_by(usuario_id=usuario_atual.id).first()
    is_restaurante_dono = bool(r and r.usuario_id == usuario_atual.id)
    is_cliente_dono = pedido.cliente_id == usuario_atual.id
    is_entregador_do_pedido = bool(e and pedido.entregador_id == e.id)
    is_entregador_livre = bool(e and pedido.entregador_id is None)

    data = request.get_json(silent=True) or {}
    status_validos = ['aguardando', 'confirmado', 'preparando', 'saiu_para_entrega', 'entregue', 'cancelado']
    novo_status = data.get('status', '')
    if novo_status not in status_validos:
        return jsonify({'erro': f'Status inválido. Use: {", ".join(status_validos)}'}), 400

    transicoes_permitidas = {
        'aguardando': {'confirmado', 'cancelado'},
        'confirmado': {'preparando'},
        'preparando': {'saiu_para_entrega'},
        'saiu_para_entrega': {'entregue'},
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

    if novo_status == 'entregue' and not is_entregador_do_pedido:
        return jsonify({'erro': 'Apenas o entregador responsável pode concluir a entrega'}), 403

    pedido.status = novo_status
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
