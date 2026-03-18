# Arquivo: backend/app/models/__init__.py
from datetime import datetime
from app import db
import bcrypt


class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    senha = db.Column(db.String(255), nullable=True)
    telefone = db.Column(db.String(20), nullable=True)
    tipo = db.Column(db.String(20), nullable=False, default='cliente')
    supabase_uid = db.Column(db.String(255), nullable=True, unique=True)
    google_id = db.Column(db.String(255), nullable=True, unique=True)
    facebook_id = db.Column(db.String(255), nullable=True, unique=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    ativo = db.Column(db.Boolean, default=True, nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    restaurantes = db.relationship('Restaurante', backref='dono', lazy='dynamic', cascade='all, delete-orphan')
    entregador = db.relationship('Entregador', backref='usuario', uselist=False, cascade='all, delete-orphan')
    pedidos = db.relationship('Pedido', backref='cliente', lazy='dynamic', foreign_keys='Pedido.cliente_id')

    def set_senha(self, senha):
        self.senha = bcrypt.hashpw(senha.encode(), bcrypt.gensalt()).decode()

    def verificar_senha(self, senha):
        if not self.senha:
            return False
        return bcrypt.checkpw(senha.encode(), self.senha.encode())

    def to_dict(self):
        return {
            'id': self.id, 'nome': self.nome, 'email': self.email,
            'telefone': self.telefone, 'tipo': self.tipo,
            'avatar_url': self.avatar_url, 'ativo': self.ativo,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
        }


class Restaurante(db.Model):
    __tablename__ = 'restaurantes'
    id = db.Column(db.Integer, primary_key=True)
    nome_fantasia = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    endereco = db.Column(db.String(500), nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    categoria = db.Column(db.String(100), nullable=True)
    imagem_url = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default='aprovado')
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    produtos = db.relationship('Produto', backref='restaurante', lazy='dynamic', cascade='all, delete-orphan')
    pedidos = db.relationship('Pedido', backref='restaurante', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id, 'nome_fantasia': self.nome_fantasia, 'descricao': self.descricao,
            'endereco': self.endereco, 'telefone': self.telefone, 'categoria': self.categoria,
            'imagem_url': self.imagem_url, 'status': self.status, 'usuario_id': self.usuario_id,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
        }


class Produto(db.Model):
    __tablename__ = 'produtos'
    id = db.Column(db.Integer, primary_key=True)
    restaurante_id = db.Column(db.Integer, db.ForeignKey('restaurantes.id', ondelete='CASCADE'), nullable=False)
    nome = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    preco = db.Column(db.Float, nullable=False)
    categoria = db.Column(db.String(100), nullable=True)
    imagem_url = db.Column(db.String(500), nullable=True)
    disponivel = db.Column(db.Boolean, default=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'restaurante_id': self.restaurante_id,
            'nome': self.nome, 'descricao': self.descricao,
            'preco': self.preco, 'categoria': self.categoria,
            'imagem_url': self.imagem_url, 'disponivel': self.disponivel,
        }


class Pedido(db.Model):
    __tablename__ = 'pedidos'
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    restaurante_id = db.Column(db.Integer, db.ForeignKey('restaurantes.id', ondelete='CASCADE'), nullable=False)
    entregador_id = db.Column(db.Integer, db.ForeignKey('entregadores.id', ondelete='SET NULL'), nullable=True)
    status = db.Column(db.String(30), default='pendente')
    endereco_entrega = db.Column(db.String(500), nullable=False)
    total = db.Column(db.Float, nullable=False, default=0.0)
    observacao = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    itens = db.relationship('ItemPedido', backref='pedido', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id, 'cliente_id': self.cliente_id,
            'restaurante_id': self.restaurante_id, 'entregador_id': self.entregador_id,
            'status': self.status, 'endereco_entrega': self.endereco_entrega,
            'total': self.total, 'observacao': self.observacao,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
            'restaurante': self.restaurante.to_dict() if self.restaurante else None,
            'itens': [i.to_dict() for i in self.itens],
        }


class ItemPedido(db.Model):
    __tablename__ = 'itens_pedido'
    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id', ondelete='CASCADE'), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id', ondelete='CASCADE'), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False, default=1)
    preco_unitario = db.Column(db.Float, nullable=False)

    produto = db.relationship('Produto')

    def to_dict(self):
        return {
            'id': self.id, 'produto_id': self.produto_id, 'quantidade': self.quantidade,
            'preco_unitario': self.preco_unitario,
            'produto': self.produto.to_dict() if self.produto else None,
        }


class Entregador(db.Model):
    __tablename__ = 'entregadores'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False, unique=True)
    veiculo = db.Column(db.String(20), default='moto')
    placa = db.Column(db.String(20), nullable=True)
    cnh = db.Column(db.String(20), nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    entregas = db.relationship('Pedido', backref='entregador', lazy='dynamic', foreign_keys='Pedido.entregador_id')

    def to_dict(self):
        return {
            'id': self.id, 'usuario_id': self.usuario_id,
            'usuario': self.usuario.to_dict() if self.usuario else None,
            'veiculo': self.veiculo, 'placa': self.placa, 'cnh': self.cnh, 'ativo': self.ativo,
        }


class AuthOtpRequest(db.Model):
    """OTP Request for Email and SMS authentication"""
    __tablename__ = 'auth_otp_requests'
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20), nullable=False)  # 'email', 'sms', 'magic_link'
    destino = db.Column(db.String(255), nullable=False, index=True)  # email or phone
    codigo_hash = db.Column(db.String(255), nullable=False)
    tentativas = db.Column(db.Integer, default=0)
    max_tentativas = db.Column(db.Integer, default=3)
    expiracao = db.Column(db.DateTime, nullable=False, index=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    verificado_em = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id, 'tipo': self.tipo, 'destino': self.destino,
            'tentativas': self.tentativas, 'max_tentativas': self.max_tentativas,
            'expiracao': self.expiracao.isoformat() if self.expiracao else None,
        }


class ResetPasswordToken(db.Model):
    """Password reset tokens"""
    __tablename__ = 'reset_password_tokens'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False, index=True)
    token_hash = db.Column(db.String(255), nullable=False, unique=True)
    expiracao = db.Column(db.DateTime, nullable=False, index=True)
    usado = db.Column(db.Boolean, default=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    usuario = db.relationship('Usuario', backref='reset_tokens')

    def to_dict(self):
        return {
            'id': self.id, 'usuario_id': self.usuario_id,
            'expiracao': self.expiracao.isoformat() if self.expiracao else None,
            'usado': self.usado,
        }
