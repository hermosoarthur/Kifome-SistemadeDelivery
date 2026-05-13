import os
import jwt
import datetime
from functools import wraps
from flask import Blueprint, jsonify, request
from sqlalchemy import func, cast, Date

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

ADMIN_SECRET   = os.environ.get('ADMIN_SEED_SECRET', '')
ADMIN_EMAIL    = os.environ.get('ADMIN_EMAIL', '')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '')
JWT_SECRET     = os.environ.get('SECRET_KEY', ADMIN_SECRET)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _gerar_token():
    payload = {
        'admin': True,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def _verificar_token():
    auth = request.headers.get('Authorization', '')
    token = auth.replace('Bearer ', '').strip()
    if not token:
        return False
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return data.get('admin', False)
    except Exception:
        return False


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not _verificar_token():
            return jsonify({'erro': 'Nao autorizado'}), 401
        return f(*args, **kwargs)
    return decorated


# ── Auth ──────────────────────────────────────────────────────────────────────

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.get_json(silent=True) or {}
    if data.get('email') == ADMIN_EMAIL and data.get('senha') == ADMIN_PASSWORD:
        return jsonify({'token': _gerar_token()}), 200
    return jsonify({'erro': 'Credenciais invalidas'}), 401


@admin_bp.route('/verificar', methods=['GET'])
def admin_verificar():
    if _verificar_token():
        return jsonify({'ok': True}), 200
    return jsonify({'erro': 'Nao autorizado'}), 401


# ── Dashboard KPIs ────────────────────────────────────────────────────────────

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    from app.models import Usuario, Restaurante, Pedido, Entregador
    hoje = datetime.date.today()
    inicio_mes = hoje.replace(day=1)

    total_usuarios = Usuario.query.filter_by(tipo='cliente').count()
    total_restaurantes = Restaurante.query.count()
    restaurantes_ativos = Restaurante.query.filter_by(status='ativo').count()
    total_entregadores = Entregador.query.filter_by(ativo=True).count()

    total_pedidos = Pedido.query.count()
    pedidos_hoje = Pedido.query.filter(
        cast(Pedido.criado_em, Date) == hoje
    ).count()
    pedidos_mes = Pedido.query.filter(
        Pedido.criado_em >= datetime.datetime.combine(inicio_mes, datetime.time.min)
    ).count()

    faturamento_total = Pedido.query.with_entities(
        func.coalesce(func.sum(Pedido.total), 0)
    ).filter(Pedido.status == 'entregue').scalar() or 0

    faturamento_mes = Pedido.query.with_entities(
        func.coalesce(func.sum(Pedido.total), 0)
    ).filter(
        Pedido.status == 'entregue',
        Pedido.criado_em >= datetime.datetime.combine(inicio_mes, datetime.time.min)
    ).scalar() or 0

    faturamento_hoje = Pedido.query.with_entities(
        func.coalesce(func.sum(Pedido.total), 0)
    ).filter(
        Pedido.status == 'entregue',
        cast(Pedido.criado_em, Date) == hoje
    ).scalar() or 0

    pedidos_por_status = {}
    rows = (
        Pedido.query
        .with_entities(Pedido.status, func.count(Pedido.id))
        .group_by(Pedido.status)
        .all()
    )
    for status, count in rows:
        pedidos_por_status[status] = count

    # Pedidos por dia (ultimos 7 dias)
    pedidos_7dias = []
    for i in range(6, -1, -1):
        dia = hoje - datetime.timedelta(days=i)
        qtd = Pedido.query.filter(cast(Pedido.criado_em, Date) == dia).count()
        fat = Pedido.query.with_entities(func.coalesce(func.sum(Pedido.total), 0)).filter(
            cast(Pedido.criado_em, Date) == dia, Pedido.status == 'entregue'
        ).scalar() or 0
        pedidos_7dias.append({'data': dia.isoformat(), 'pedidos': qtd, 'faturamento': float(fat)})

    return jsonify({
        'usuarios': total_usuarios,
        'restaurantes': total_restaurantes,
        'restaurantes_ativos': restaurantes_ativos,
        'entregadores': total_entregadores,
        'pedidos_total': total_pedidos,
        'pedidos_hoje': pedidos_hoje,
        'pedidos_mes': pedidos_mes,
        'faturamento_total': float(faturamento_total),
        'faturamento_mes': float(faturamento_mes),
        'faturamento_hoje': float(faturamento_hoje),
        'pedidos_por_status': pedidos_por_status,
        'pedidos_7dias': pedidos_7dias,
    }), 200


# ── Pedidos ───────────────────────────────────────────────────────────────────

@admin_bp.route('/pedidos', methods=['GET'])
@admin_required
def listar_pedidos():
    from app.models import Pedido, Usuario, Restaurante
    pagina   = int(request.args.get('pagina', 1))
    por_pag  = int(request.args.get('por_pagina', 20))
    status   = request.args.get('status', '')
    busca    = request.args.get('busca', '')

    q = Pedido.query.order_by(Pedido.criado_em.desc())
    if status:
        q = q.filter(Pedido.status == status)
    if busca:
        q = q.filter(Pedido.id == int(busca)) if busca.isdigit() else q

    total = q.count()
    pedidos = q.offset((pagina - 1) * por_pag).limit(por_pag).all()

    items = []
    for p in pedidos:
        d = p.to_dict()
        cliente = Usuario.query.get(p.cliente_id)
        rest    = Restaurante.query.get(p.restaurante_id)
        d['cliente_nome'] = cliente.nome if cliente else '-'
        d['restaurante_nome'] = rest.nome_fantasia if rest else '-'
        items.append(d)

    return jsonify({'pedidos': items, 'total': total, 'paginas': -(-total // por_pag)}), 200


@admin_bp.route('/pedidos/<int:pid>/status', methods=['PUT'])
@admin_required
def atualizar_status_pedido(pid):
    from app.models import Pedido
    from app import db
    data = request.get_json(silent=True) or {}
    novo_status = data.get('status', '')
    p = Pedido.query.get_or_404(pid)
    p.status = novo_status
    p.atualizado_em = datetime.datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True, 'status': p.status}), 200


# ── Restaurantes ──────────────────────────────────────────────────────────────

@admin_bp.route('/restaurantes', methods=['GET'])
@admin_required
def listar_restaurantes():
    from app.models import Restaurante, Pedido
    pagina  = int(request.args.get('pagina', 1))
    por_pag = int(request.args.get('por_pagina', 20))
    status  = request.args.get('status', '')
    busca   = request.args.get('busca', '').lower()

    q = Restaurante.query.order_by(Restaurante.criado_em.desc())
    if status:
        q = q.filter(Restaurante.status == status)
    if busca:
        q = q.filter(Restaurante.nome_fantasia.ilike(f'%{busca}%'))

    total = q.count()
    restaurantes = q.offset((pagina - 1) * por_pag).limit(por_pag).all()

    items = []
    for r in restaurantes:
        d = r.to_dict()
        d['total_pedidos'] = Pedido.query.filter_by(restaurante_id=r.id).count()
        d['faturamento'] = float(
            Pedido.query.with_entities(func.coalesce(func.sum(Pedido.total), 0))
            .filter_by(restaurante_id=r.id, status='entregue').scalar() or 0
        )
        items.append(d)

    return jsonify({'restaurantes': items, 'total': total, 'paginas': -(-total // por_pag)}), 200


@admin_bp.route('/restaurantes/<int:rid>/status', methods=['PUT'])
@admin_required
def atualizar_status_restaurante(rid):
    from app.models import Restaurante
    from app import db
    data   = request.get_json(silent=True) or {}
    novo   = data.get('status', '')
    r = Restaurante.query.get_or_404(rid)
    r.status = novo
    db.session.commit()
    return jsonify({'ok': True, 'status': r.status}), 200


# ── Usuarios ──────────────────────────────────────────────────────────────────

@admin_bp.route('/usuarios', methods=['GET'])
@admin_required
def listar_usuarios():
    from app.models import Usuario, Pedido
    pagina  = int(request.args.get('pagina', 1))
    por_pag = int(request.args.get('por_pagina', 20))
    tipo    = request.args.get('tipo', '')
    busca   = request.args.get('busca', '').lower()

    q = Usuario.query.order_by(Usuario.criado_em.desc())
    if tipo:
        q = q.filter(Usuario.tipo == tipo)
    if busca:
        q = q.filter((Usuario.nome.ilike(f'%{busca}%')) | (Usuario.email.ilike(f'%{busca}%')))

    total = q.count()
    usuarios = q.offset((pagina - 1) * por_pag).limit(por_pag).all()

    items = []
    for u in usuarios:
        d = u.to_dict()
        if u.tipo == 'cliente':
            d['total_pedidos'] = Pedido.query.filter_by(cliente_id=u.id).count()
        items.append(d)

    return jsonify({'usuarios': items, 'total': total, 'paginas': -(-total // por_pag)}), 200


@admin_bp.route('/usuarios/<int:uid>/ativo', methods=['PUT'])
@admin_required
def atualizar_usuario_ativo(uid):
    from app.models import Usuario
    from app import db
    data  = request.get_json(silent=True) or {}
    ativo = data.get('ativo', True)
    u = Usuario.query.get_or_404(uid)
    u.ativo = ativo
    db.session.commit()
    return jsonify({'ok': True, 'ativo': u.ativo}), 200


# ── Relatorio 1: Faturamento por Restaurante ──────────────────────────────────

@admin_bp.route('/relatorios/faturamento', methods=['GET'])
@admin_required
def relatorio_faturamento():
    from app.models import Pedido, Restaurante
    periodo = request.args.get('periodo', '30')  # dias

    try:
        dias = int(periodo)
    except ValueError:
        dias = 30

    inicio = datetime.datetime.utcnow() - datetime.timedelta(days=dias)

    rows = (
        Pedido.query
        .with_entities(
            Pedido.restaurante_id,
            func.count(Pedido.id).label('total_pedidos'),
            func.coalesce(func.sum(Pedido.total), 0).label('faturamento'),
            func.coalesce(func.avg(Pedido.total), 0).label('ticket_medio'),
            func.sum(func.cast(Pedido.status == 'cancelado', func.Integer())).label('cancelados'),
            func.sum(func.cast(Pedido.status == 'entregue', func.Integer())).label('entregues'),
        )
        .filter(Pedido.criado_em >= inicio)
        .group_by(Pedido.restaurante_id)
        .order_by(func.sum(Pedido.total).desc())
        .all()
    )

    resultado = []
    for r in rows:
        rest = Restaurante.query.get(r.restaurante_id)
        resultado.append({
            'restaurante_id': r.restaurante_id,
            'restaurante_nome': rest.nome_fantasia if rest else '-',
            'restaurante_categoria': rest.categoria if rest else '-',
            'total_pedidos': r.total_pedidos,
            'faturamento': float(r.faturamento),
            'ticket_medio': round(float(r.ticket_medio), 2),
            'entregues': int(r.entregues or 0),
            'cancelados': int(r.cancelados or 0),
        })

    faturamento_total_periodo = sum(x['faturamento'] for x in resultado)
    return jsonify({
        'periodo_dias': dias,
        'faturamento_total': faturamento_total_periodo,
        'restaurantes': resultado,
    }), 200


# ── Relatorio 3: Produtos Mais Vendidos ──────────────────────────────────────

@admin_bp.route('/relatorios/produtos-mais-vendidos', methods=['GET'])
@admin_required
def relatorio_produtos_mais_vendidos():
    from app.models import ItemPedido, Produto, Pedido, Restaurante
    periodo = request.args.get('periodo', '30')
    limit   = int(request.args.get('limit', 20))
    try:
        dias = int(periodo)
    except ValueError:
        dias = 30

    inicio = datetime.datetime.utcnow() - datetime.timedelta(days=dias)

    rows = (
        ItemPedido.query
        .join(Pedido, ItemPedido.pedido_id == Pedido.id)
        .with_entities(
            ItemPedido.produto_id,
            func.sum(ItemPedido.quantidade).label('total_vendido'),
            func.count(ItemPedido.id).label('num_pedidos'),
            func.coalesce(
                func.sum(ItemPedido.quantidade * ItemPedido.preco_unitario), 0
            ).label('receita'),
        )
        .filter(
            Pedido.criado_em >= inicio,
            Pedido.status != 'cancelado',
        )
        .group_by(ItemPedido.produto_id)
        .order_by(func.sum(ItemPedido.quantidade).desc())
        .limit(limit)
        .all()
    )

    resultado = []
    for r in rows:
        produto = Produto.query.get(r.produto_id)
        rest    = Restaurante.query.get(produto.restaurante_id) if produto else None
        resultado.append({
            'produto_id':         r.produto_id,
            'produto_nome':       produto.nome if produto else '-',
            'produto_imagem':     produto.imagem_url if produto else None,
            'produto_preco':      float(produto.preco) if produto else 0,
            'restaurante_nome':   rest.nome_fantasia if rest else '-',
            'restaurante_id':     rest.id if rest else None,
            'total_vendido':      int(r.total_vendido),
            'num_pedidos':        int(r.num_pedidos),
            'receita':            float(r.receita),
        })

    return jsonify({'periodo_dias': dias, 'produtos': resultado}), 200


# ── Relatorio 4: Taxa de Cancelamento por Restaurante ────────────────────────

@admin_bp.route('/relatorios/cancelamentos', methods=['GET'])
@admin_required
def relatorio_cancelamentos():
    from app.models import Pedido, Restaurante
    periodo = request.args.get('periodo', '30')
    try:
        dias = int(periodo)
    except ValueError:
        dias = 30

    inicio = datetime.datetime.utcnow() - datetime.timedelta(days=dias)

    rows = (
        Pedido.query
        .with_entities(
            Pedido.restaurante_id,
            func.count(Pedido.id).label('total'),
            func.sum(
                func.cast(Pedido.status == 'cancelado', func.Integer())
            ).label('cancelados'),
            func.sum(
                func.cast(Pedido.status == 'entregue', func.Integer())
            ).label('entregues'),
            func.coalesce(func.sum(Pedido.total), 0).label('faturamento'),
        )
        .filter(Pedido.criado_em >= inicio)
        .group_by(Pedido.restaurante_id)
        .having(func.count(Pedido.id) > 0)
        .order_by(
            (func.sum(func.cast(Pedido.status == 'cancelado', func.Integer())) /
             func.cast(func.count(Pedido.id), func.Float())).desc()
        )
        .all()
    )

    resultado = []
    for r in rows:
        rest = Restaurante.query.get(r.restaurante_id)
        cancelados = int(r.cancelados or 0)
        total      = int(r.total)
        taxa       = round((cancelados / total * 100) if total else 0, 1)
        resultado.append({
            'restaurante_id':   r.restaurante_id,
            'restaurante_nome': rest.nome_fantasia if rest else '-',
            'total_pedidos':    total,
            'entregues':        int(r.entregues or 0),
            'cancelados':       cancelados,
            'taxa_cancelamento': taxa,
            'faturamento':      float(r.faturamento),
        })

    media_taxa = round(
        sum(x['taxa_cancelamento'] for x in resultado) / len(resultado), 1
    ) if resultado else 0

    return jsonify({
        'periodo_dias': dias,
        'media_taxa_cancelamento': media_taxa,
        'restaurantes': resultado,
    }), 200


# ── Relatorio 5: Clientes Recorrentes vs Novos ───────────────────────────────

@admin_bp.route('/relatorios/retencao-clientes', methods=['GET'])
@admin_required
def relatorio_retencao_clientes():
    from app.models import Pedido, Usuario
    periodo = request.args.get('periodo', '30')
    try:
        dias = int(periodo)
    except ValueError:
        dias = 30

    inicio = datetime.datetime.utcnow() - datetime.timedelta(days=dias)

    # Clientes com pedido no periodo
    clientes_periodo = (
        Pedido.query
        .with_entities(
            Pedido.cliente_id,
            func.count(Pedido.id).label('pedidos_periodo'),
            func.coalesce(func.sum(Pedido.total), 0).label('gasto_periodo'),
        )
        .filter(
            Pedido.criado_em >= inicio,
            Pedido.status != 'cancelado',
        )
        .group_by(Pedido.cliente_id)
        .all()
    )

    novos         = []
    recorrentes   = []
    freq_1        = 0  # 1 pedido
    freq_2_5      = 0  # 2-5 pedidos
    freq_mais_5   = 0  # 5+ pedidos

    for c in clientes_periodo:
        # Pedidos anteriores ao periodo
        pedidos_antes = Pedido.query.filter(
            Pedido.cliente_id == c.cliente_id,
            Pedido.criado_em < inicio,
            Pedido.status != 'cancelado',
        ).count()

        usuario = Usuario.query.get(c.cliente_id)
        entry = {
            'cliente_id':      c.cliente_id,
            'cliente_nome':    usuario.nome if usuario else '-',
            'pedidos_periodo': int(c.pedidos_periodo),
            'gasto_periodo':   float(c.gasto_periodo),
            'e_recorrente':    pedidos_antes > 0,
        }

        if pedidos_antes > 0:
            recorrentes.append(entry)
        else:
            novos.append(entry)

        # Frequencia
        p = int(c.pedidos_periodo)
        if p == 1:
            freq_1 += 1
        elif p <= 5:
            freq_2_5 += 1
        else:
            freq_mais_5 += 1

    total_clientes = len(clientes_periodo)
    pct_recorrentes = round(len(recorrentes) / total_clientes * 100, 1) if total_clientes else 0
    pct_novos       = round(len(novos) / total_clientes * 100, 1) if total_clientes else 0

    # Top clientes por gasto
    top_clientes = sorted(
        [*novos, *recorrentes],
        key=lambda x: x['gasto_periodo'],
        reverse=True
    )[:20]

    return jsonify({
        'periodo_dias':       dias,
        'total_clientes':     total_clientes,
        'novos':              len(novos),
        'recorrentes':        len(recorrentes),
        'pct_novos':          pct_novos,
        'pct_recorrentes':    pct_recorrentes,
        'frequencia': {
            '1_pedido':   freq_1,
            '2_a_5':      freq_2_5,
            'mais_de_5':  freq_mais_5,
        },
        'top_clientes':       top_clientes,
    }), 200


# ── Seed (mantido) ────────────────────────────────────────────────────────────

@admin_bp.route('/seed', methods=['POST'])
def rodar_seed():
    secret = request.args.get('secret', '') or (request.get_json(silent=True) or {}).get('secret', '')
    if not ADMIN_SECRET or secret != ADMIN_SECRET:
        return jsonify({'erro': 'Nao autorizado'}), 403

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
