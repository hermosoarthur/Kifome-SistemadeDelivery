# Arquivo: backend/app/utils/nf_utils.py
"""Utilitário para geração de Nota Fiscal em PDF com ReportLab."""

import io
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ── Paleta de cores Kifome ────────────────────────────────────────────────────
_COR_PRIMARIA = (0.949, 0.388, 0.141)   # laranja #F2631F  (r, g, b em 0-1)
_COR_CINZA_ESC = (0.2, 0.2, 0.2)
_COR_CINZA_MED = (0.5, 0.5, 0.5)
_COR_CINZA_CLR = (0.94, 0.94, 0.94)
_COR_BRANCO = (1, 1, 1)


def _fmt_brl(valor) -> str:
    """Formata um valor numérico em reais (R$ 0,00)."""
    try:
        return f'R$ {float(valor):,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    except (TypeError, ValueError):
        return 'R$ 0,00'


def _fmt_dt(dt) -> str:
    """Formata um datetime para exibição legível."""
    if dt is None:
        return '—'
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except ValueError:
            return dt
    return dt.strftime('%d/%m/%Y às %H:%M')


def gerar_nf_pdf(pedido) -> bytes:
    """Gera o PDF da Nota Fiscal do pedido e devolve os bytes.

    Parâmetro
    ---------
    pedido : models.Pedido
        Instância do modelo com os relacionamentos ``restaurante``,
        ``cliente`` e ``itens`` já carregados (lazy load é suficiente
        desde que ainda dentro do contexto de sessão SQLAlchemy).

    Retorna
    -------
    bytes
        Conteúdo binário do PDF gerado.
    """
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
        )
    except ImportError as exc:
        logger.error('[nf_utils] ReportLab não instalado: %s', exc)
        raise

    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    estilos = getSampleStyleSheet()

    estilo_titulo = ParagraphStyle(
        'Titulo',
        parent=estilos['Heading1'],
        fontSize=20,
        textColor=colors.Color(*_COR_PRIMARIA),
        spaceAfter=4,
        leading=24,
    )
    estilo_subtitulo = ParagraphStyle(
        'Subtitulo',
        parent=estilos['Normal'],
        fontSize=10,
        textColor=colors.Color(*_COR_CINZA_MED),
        spaceAfter=2,
    )
    estilo_secao = ParagraphStyle(
        'Secao',
        parent=estilos['Heading2'],
        fontSize=11,
        textColor=colors.Color(*_COR_CINZA_ESC),
        spaceBefore=10,
        spaceAfter=4,
        leading=14,
    )
    estilo_normal = ParagraphStyle(
        'NF_Normal',
        parent=estilos['Normal'],
        fontSize=9,
        textColor=colors.Color(*_COR_CINZA_ESC),
        leading=13,
    )
    estilo_rodape = ParagraphStyle(
        'Rodape',
        parent=estilos['Normal'],
        fontSize=8,
        textColor=colors.Color(*_COR_CINZA_MED),
        alignment=1,  # centro
    )

    cor_primaria_rl = colors.Color(*_COR_PRIMARIA)
    cor_cinza_clr_rl = colors.Color(*_COR_CINZA_CLR)

    elementos = []

    # ── Cabeçalho ─────────────────────────────────────────────────────────────
    elementos.append(Paragraph('🍔 Kifome', estilo_titulo))
    elementos.append(Paragraph('Nota Fiscal — Comprovante de Pedido', estilo_subtitulo))
    elementos.append(HRFlowable(width='100%', thickness=2, color=cor_primaria_rl, spaceAfter=6))

    # ── Informações do pedido ─────────────────────────────────────────────────
    elementos.append(Paragraph('Dados do Pedido', estilo_secao))

    restaurante = pedido.restaurante
    cliente = pedido.cliente

    info_pedido = [
        [Paragraph('<b>Nº do Pedido:</b>', estilo_normal), Paragraph(f'#{pedido.id}', estilo_normal)],
        [Paragraph('<b>Data do Pedido:</b>', estilo_normal), Paragraph(_fmt_dt(pedido.criado_em), estilo_normal)],
        [Paragraph('<b>Data de Entrega:</b>', estilo_normal), Paragraph(_fmt_dt(pedido.entregue_confirmado_cliente_em), estilo_normal)],
        [Paragraph('<b>Método de Pagamento:</b>', estilo_normal), Paragraph((pedido.pagamento_metodo or '—').replace('_', ' ').title(), estilo_normal)],
        [Paragraph('<b>Status do Pagamento:</b>', estilo_normal), Paragraph((pedido.pagamento_status or '—').title(), estilo_normal)],
    ]

    tabela_info = Table(info_pedido, colWidths=[5 * cm, None])
    tabela_info.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), cor_cinza_clr_rl),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.Color(0.97, 0.97, 0.97)]),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.Color(*_COR_CINZA_MED)),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elementos.append(tabela_info)
    elementos.append(Spacer(1, 0.3 * cm))

    # ── Restaurante ───────────────────────────────────────────────────────────
    elementos.append(Paragraph('Restaurante', estilo_secao))
    nome_rest = getattr(restaurante, 'nome_fantasia', '—') if restaurante else '—'
    end_rest = getattr(restaurante, 'endereco', '—') if restaurante else '—'
    tel_rest = getattr(restaurante, 'telefone', '—') if restaurante else '—'
    elementos.append(Paragraph(f'<b>{nome_rest}</b><br/>Endereço: {end_rest}<br/>Telefone: {tel_rest or "—"}', estilo_normal))
    elementos.append(Spacer(1, 0.3 * cm))

    # ── Cliente / Entrega ──────────────────────────────────────────────────────
    elementos.append(Paragraph('Cliente & Endereço de Entrega', estilo_secao))
    nome_cli = getattr(cliente, 'nome', '—') if cliente else '—'
    email_cli = getattr(cliente, 'email', '—') if cliente else '—'
    end_entrega = pedido.endereco_entrega or '—'
    elementos.append(Paragraph(
        f'<b>{nome_cli}</b><br/>E-mail: {email_cli}<br/>Endereço de entrega: {end_entrega}',
        estilo_normal,
    ))
    elementos.append(Spacer(1, 0.3 * cm))

    # ── Itens do pedido ───────────────────────────────────────────────────────
    elementos.append(Paragraph('Itens do Pedido', estilo_secao))

    cabecalho_itens = [
        Paragraph('<b>Produto</b>', estilo_normal),
        Paragraph('<b>Qtd.</b>', estilo_normal),
        Paragraph('<b>Preço Unit.</b>', estilo_normal),
        Paragraph('<b>Subtotal</b>', estilo_normal),
    ]
    linhas_itens = [cabecalho_itens]

    for item in pedido.itens:
        nome_prod = item.produto.nome if item.produto else f'Produto #{item.produto_id}'
        qtd = item.quantidade
        preco_unit = float(item.preco_unitario)
        subtotal = qtd * preco_unit
        linhas_itens.append([
            Paragraph(nome_prod, estilo_normal),
            Paragraph(str(qtd), estilo_normal),
            Paragraph(_fmt_brl(preco_unit), estilo_normal),
            Paragraph(_fmt_brl(subtotal), estilo_normal),
        ])

    tabela_itens = Table(linhas_itens, colWidths=[None, 1.5 * cm, 3.5 * cm, 3.5 * cm])
    tabela_itens.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), cor_primaria_rl),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(0.97, 0.97, 0.97)]),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.Color(*_COR_CINZA_MED)),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elementos.append(tabela_itens)
    elementos.append(Spacer(1, 0.3 * cm))

    # ── Totais ────────────────────────────────────────────────────────────────
    taxa = float(pedido.taxa_entrega) if pedido.taxa_entrega is not None else 0.0
    total = float(pedido.total)
    subtotal_itens = total - taxa

    dados_totais = [
        [Paragraph('Subtotal dos itens:', estilo_normal), Paragraph(_fmt_brl(subtotal_itens), estilo_normal)],
        [Paragraph('Taxa de entrega:', estilo_normal), Paragraph(_fmt_brl(taxa), estilo_normal)],
        [Paragraph('<b>Total:</b>', estilo_normal), Paragraph(f'<b>{_fmt_brl(total)}</b>', estilo_normal)],
    ]
    tabela_totais = Table(dados_totais, colWidths=[None, 3.5 * cm], hAlign='RIGHT')
    tabela_totais.setStyle(TableStyle([
        ('BACKGROUND', (0, 2), (-1, 2), cor_cinza_clr_rl),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.Color(*_COR_CINZA_MED)),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elementos.append(tabela_totais)

    # ── Rodapé ────────────────────────────────────────────────────────────────
    elementos.append(Spacer(1, 0.5 * cm))
    elementos.append(HRFlowable(width='100%', thickness=1, color=cor_primaria_rl, spaceAfter=6))
    elementos.append(Paragraph(
        'Kifome — Sistema de Delivery · Este documento é apenas um comprovante de pedido e não possui validade fiscal.',
        estilo_rodape,
    ))

    doc.build(elementos)
    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes
