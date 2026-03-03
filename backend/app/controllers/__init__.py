from flask import request, jsonify
from app import db
from app.models import Usuario, Restaurante, Produto, Pedido, ItemPedido, Entregador


# ── USUARIO ──────────────────────────────────────────────
def atualizar_usuario(usuario_atual, usuario_id):
    if usuario_atual.id != usuario_id:
        return jsonify({'erro': 'Sem permissão'}), 403
    u = Usuario.query.get_or_404(usuario_id)
    data = request.get_json(silent=True) or {}
    if 'nome' in data and data['nome'].strip():
        u.nome = data['nome'].strip()
    if 'telefone' in data:
        u.telefone = data['telefone'].strip()
    try:
        db.session.commit()
        return jsonify({'usuario': u.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar'}), 500


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
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 12, type=int), 50)
    q = Restaurante.query.filter_by(status='aprovado')
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
    if not data.get('nome_fantasia', '').strip():
        return jsonify({'erro': 'Nome é obrigatório'}), 400
    if not data.get('endereco', '').strip():
        return jsonify({'erro': 'Endereço é obrigatório'}), 400
    try:
        r = Restaurante(
            nome_fantasia=data['nome_fantasia'].strip(),
            descricao=data.get('descricao', ''),
            endereco=data['endereco'].strip(),
            telefone=data.get('telefone', ''),
            categoria=data.get('categoria', ''),
            imagem_url=data.get('imagem_url', ''),
            status='aprovado',
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
    if r.usuario_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    data = request.get_json(silent=True) or {}
    for c in ['nome_fantasia', 'descricao', 'endereco', 'telefone', 'categoria', 'imagem_url', 'status']:
        if c in data:
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
    ps = Produto.query.filter_by(restaurante_id=rid).all()
    return jsonify({'produtos': [p.to_dict() for p in ps]}), 200


def criar_produto(usuario_atual, rid):
    r = Restaurante.query.get_or_404(rid)
    if r.usuario_id != usuario_atual.id:
        return jsonify({'erro': 'Sem permissão'}), 403
    data = request.get_json(silent=True) or {}
    if not data.get('nome', '').strip():
        return jsonify({'erro': 'Nome é obrigatório'}), 400
    try:
        preco = float(data.get('preco', 0))
    except:
        return jsonify({'erro': 'Preço inválido'}), 400
    try:
        p = Produto(
            restaurante_id=rid,
            nome=data['nome'].strip(),
            descricao=data.get('descricao', ''),
            preco=preco,
            categoria=data.get('categoria', ''),
            imagem_url=data.get('imagem_url', ''),
            disponivel=data.get('disponivel', True)
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
    for c in ['nome', 'descricao', 'categoria', 'imagem_url']:
        if c in data:
            setattr(p, c, data[c])
    if 'preco' in data:
        try:
            p.preco = float(data['preco'])
        except:
            pass
    if 'disponivel' in data:
        p.disponivel = bool(data['disponivel'])
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
    endereco = data.get('endereco_entrega', '').strip()

    if not rid or not itens or not endereco:
        return jsonify({'erro': 'restaurante_id, itens e endereco_entrega são obrigatórios'}), 400

    Restaurante.query.get_or_404(rid)
    total = 0.0
    itens_obj = []
    for item in itens:
        p = Produto.query.get(item.get('produto_id'))
        if not p or not p.disponivel:
            return jsonify({'erro': f'Produto {item.get("produto_id")} indisponível'}), 400
        qtd = int(item.get('quantidade', 1))
        total += p.preco * qtd
        itens_obj.append({'produto': p, 'quantidade': qtd, 'preco': p.preco})

    try:
        pedido = Pedido(
            cliente_id=usuario_atual.id,
            restaurante_id=rid,
            status='pendente',
            endereco_entrega=endereco,
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
    # Restaurante pode atualizar seus pedidos, entregador também
    r = Restaurante.query.get(pedido.restaurante_id)
    e = Entregador.query.filter_by(usuario_id=usuario_atual.id).first()
    if (not r or r.usuario_id != usuario_atual.id) and (not e or e.id != pedido.entregador_id):
        return jsonify({'erro': 'Sem permissão'}), 403

    data = request.get_json(silent=True) or {}
    status_validos = ['pendente', 'confirmado', 'preparando', 'saiu_entrega', 'entregue', 'cancelado']
    novo_status = data.get('status', '')
    if novo_status not in status_validos:
        return jsonify({'erro': f'Status inválido. Use: {", ".join(status_validos)}'}), 400

    pedido.status = novo_status
    if novo_status == 'saiu_entrega' and e:
        pedido.entregador_id = e.id
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
    status = request.args.get('status', 'saiu_entrega')
    ps = Pedido.query.filter_by(entregador_id=e.id).order_by(Pedido.criado_em.desc()).all()
    return jsonify({'entregas': [p.to_dict() for p in ps]}), 200


def pedidos_disponiveis(usuario_atual):
    ps = Pedido.query.filter_by(status='confirmado', entregador_id=None).order_by(Pedido.criado_em.desc()).all()
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
