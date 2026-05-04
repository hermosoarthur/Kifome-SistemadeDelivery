from __future__ import annotations

import re
from decimal import Decimal, ROUND_HALF_UP
from collections import Counter

from app import create_app, db
from app.models import Produto, Restaurante, Usuario


CATEGORIAS_RESTAURANTE = [
    "Lanches",
    "Marmita",
    "Italiana",
    "Promoções",
    "Salgados",
    "Saudável",
    "Açaí",
    "Árabe",
    "Chinesa",
    "Carnes",
    "Pizza",
    "Doces & Bolos",
    "Padarias",
    "Pastel",
]

TEMA_RESTAURANTES = {
    "Lanches": [
        ("Smash Point Burger", "Hambúrguer artesanal com blend bovino e ingredientes premium"),
        ("Big Bites Grill", "Lanches parrilla, porções e combos para compartilhar"),
    ],
    "Marmita": [
        ("Panelinha da Vó", "Comida caseira com sabor de almoço em família"),
        ("Marmitex Bom Prato", "Marmitas do dia com ótimo custo-benefício"),
    ],
    "Italiana": [
        ("Trattoria Bella Massa", "Massas frescas, molhos artesanais e receitas italianas"),
        ("Nonna Pasta House", "Culinária italiana tradicional com toque caseiro"),
    ],
    "Promoções": [
        ("Oferta do Dia Express", "Combos promocionais e ofertas relâmpago"),
        ("Desconta Aí Delivery", "Pratos completos com preço especial todos os dias"),
    ],
    "Salgados": [
        ("Rei dos Salgados", "Salgados fritos e assados feitos na hora"),
        ("Casa do Salgado Gourmet", "Salgados recheados com ingredientes premium"),
    ],
    "Saudável": [
        ("Verde Leve Cozinha", "Refeições balanceadas, bowls e sucos naturais"),
        ("Fit no Pote", "Pratos saudáveis com foco em proteína e legumes"),
    ],
    "Açaí": [
        ("Açaí da Praia", "Açaí cremoso com frutas frescas e acompanhamentos"),
        ("Tigela Tropical", "Combinações de açaí, cremes e toppings especiais"),
    ],
    "Árabe": [
        ("Sultão do Kebab", "Esfihas, kebabs e pratos árabes tradicionais"),
        ("Cedro Árabe", "Culinária árabe com receitas clássicas e temperos frescos"),
    ],
    "Chinesa": [
        ("Dragão Wok", "Wok na hora com pratos clássicos da culinária chinesa"),
        ("China in Box Guarulhos", "Yakissoba, rolinho e pratos orientais completos"),
    ],
    "Carnes": [
        ("Brasa Nobre Steak", "Cortes grelhados, acompanhamentos e molhos especiais"),
        ("Parrilla 33", "Carnes na brasa com porções para dividir"),
    ],
    "Pizza": [
        ("Forno de Pedra Pizzaria", "Pizzas artesanais com massa de longa fermentação"),
        ("Bella Pizza Prime", "Pizzas tradicionais e especiais em forno à lenha"),
    ],
    "Doces & Bolos": [
        ("Doce Encanto Confeitaria", "Bolos, tortas e doces finos sob encomenda"),
        ("Bolo da Praça", "Bolos caseiros e sobremesas clássicas"),
    ],
    "Padarias": [
        ("Padaria Pão Quente", "Pães, cafés e lanches de padaria o dia todo"),
        ("Cantinho do Trigo", "Padaria artesanal com pães especiais"),
    ],
    "Pastel": [
        ("Pastel da Feira 1988", "Pastéis crocantes e caldo de cana"),
        ("Mega Pastelaria", "Pastéis especiais, porções e combos"),
    ],
}

MENU_POR_CATEGORIA = {
    "Lanches": {
        "Hambúrgueres": [
            ("Smash Bacon", "Pão brioche, blend 160g, queijo e bacon", Decimal("29.90")),
            ("Cheddar Duplo", "2 carnes, cheddar cremoso e cebola crispy", Decimal("34.90")),
        ],
        "Acompanhamentos": [
            ("Batata Frita Média", "Batata crocante com sal da casa", Decimal("13.90")),
            ("Onion Rings", "Anéis de cebola empanados", Decimal("15.90")),
        ],
        "Bebidas": [
            ("Refrigerante Lata", "350ml gelado", Decimal("6.50")),
            ("Milkshake Chocolate", "400ml com chantilly", Decimal("15.90")),
        ],
    },
    "Marmita": {
        "Marmitas Tradicionais": [
            ("Marmita Frango Grelhado", "Arroz, feijão, frango e salada", Decimal("21.90")),
            ("Marmita Bife Acebolado", "Arroz, feijão, bife e fritas", Decimal("24.90")),
        ],
        "Prato do Dia": [
            ("Feijoada Individual", "Feijoada completa com couve", Decimal("27.90")),
            ("Strogonoff de Frango", "Arroz, batata palha e salada", Decimal("25.90")),
        ],
        "Bebidas": [
            ("Suco de Laranja", "Natural 400ml", Decimal("8.90")),
            ("Refrigerante 600ml", "Escolha o sabor", Decimal("9.90")),
        ],
    },
    "Italiana": {
        "Massas": [
            ("Spaghetti à Bolonhesa", "Molho de carne e parmesão", Decimal("32.90")),
            ("Penne ao Molho Branco", "Molho cremoso com bacon", Decimal("34.90")),
        ],
        "Risotos": [
            ("Risoto de Funghi", "Arroz arbóreo e cogumelos", Decimal("39.90")),
            ("Risoto de Frango", "Frango desfiado e parmesão", Decimal("36.90")),
        ],
        "Sobremesas": [
            ("Tiramisù", "Clássico italiano", Decimal("18.90")),
            ("Cannoli", "Massa crocante e ricota doce", Decimal("16.90")),
        ],
    },
    "Promoções": {
        "Combos Econômicos": [
            ("Combo Almoço", "Prato + refrigerante lata", Decimal("19.90")),
            ("Combo Família", "2 pratos + 1 porção", Decimal("49.90")),
        ],
        "Leve Mais": [
            ("Leve 2 Pague 1", "Item promocional do dia", Decimal("24.90")),
            ("Rodada de Salgados", "10 salgados sortidos", Decimal("21.90")),
        ],
        "Bebidas": [
            ("Suco 500ml", "Sabores da casa", Decimal("7.90")),
            ("Água sem gás", "Garrafa 500ml", Decimal("4.50")),
        ],
    },
    "Salgados": {
        "Fritos": [
            ("Coxinha de Frango", "Unidade 120g", Decimal("8.50")),
            ("Bolinha de Queijo", "Porção com 8 unidades", Decimal("14.90")),
        ],
        "Assados": [
            ("Esfiha de Carne", "Aberta tradicional", Decimal("7.90")),
            ("Empada de Palmito", "Massa amanteigada", Decimal("8.90")),
        ],
        "Combos": [
            ("Combo Festa", "20 salgados variados", Decimal("34.90")),
            ("Combo Lanche", "6 salgados + refri lata", Decimal("24.90")),
        ],
    },
    "Saudável": {
        "Bowls": [
            ("Bowl Proteico", "Frango, quinoa e legumes", Decimal("29.90")),
            ("Bowl Veggie", "Grão-de-bico, folhas e homus", Decimal("27.90")),
        ],
        "Saladas": [
            ("Salada Caesar Fit", "Frango grelhado e molho leve", Decimal("25.90")),
            ("Salada Mediterrânea", "Folhas, tomate e queijo branco", Decimal("24.90")),
        ],
        "Sucos Naturais": [
            ("Suco Detox", "Couve, limão e maçã", Decimal("12.90")),
            ("Suco Energia", "Abacaxi com hortelã", Decimal("11.90")),
        ],
    },
    "Açaí": {
        "Açaí Tradicional": [
            ("Açaí 300ml", "Açaí puro com 2 complementos", Decimal("14.90")),
            ("Açaí 500ml", "Açaí puro com 3 complementos", Decimal("19.90")),
        ],
        "Açaí Especial": [
            ("Açaí com Nutella", "Nutella e morango", Decimal("24.90")),
            ("Açaí Power", "Whey, banana e granola", Decimal("26.90")),
        ],
        "Complementos": [
            ("Banana extra", "Porção adicional", Decimal("3.50")),
            ("Leite condensado extra", "Porção adicional", Decimal("3.50")),
        ],
    },
    "Árabe": {
        "Esfihas": [
            ("Esfiha de Carne", "Massa aberta tradicional", Decimal("8.90")),
            ("Esfiha de Queijo", "Queijo temperado", Decimal("8.50")),
        ],
        "Pratos Árabes": [
            ("Kebab de Frango", "Pão sírio, frango e salada", Decimal("27.90")),
            ("Kafta no Prato", "Kafta, arroz e tabule", Decimal("34.90")),
        ],
        "Acompanhamentos": [
            ("Homus com Pão", "Pasta de grão-de-bico", Decimal("16.90")),
            ("Babaganuche", "Pasta de berinjela", Decimal("17.90")),
        ],
    },
    "Chinesa": {
        "Yakissoba": [
            ("Yakissoba de Frango", "Macarrão, legumes e frango", Decimal("31.90")),
            ("Yakissoba Misto", "Frango e carne com legumes", Decimal("35.90")),
        ],
        "Pratos Quentes": [
            ("Frango Xadrez", "Frango, pimentão e molho especial", Decimal("33.90")),
            ("Carne com Brócolis", "Carne fatiada e legumes", Decimal("36.90")),
        ],
        "Entradas": [
            ("Rolinho Primavera", "Porção com 4 unidades", Decimal("16.90")),
            ("Guioza", "Porção com 6 unidades", Decimal("18.90")),
        ],
    },
    "Carnes": {
        "Cortes na Brasa": [
            ("Picanha 300g", "Com farofa e vinagrete", Decimal("59.90")),
            ("Fraldinha 300g", "Grelhada na brasa", Decimal("49.90")),
        ],
        "Pratos Executivos": [
            ("Contra-filé Executivo", "Arroz, feijão e fritas", Decimal("39.90")),
            ("Costela BBQ", "Costela assada com molho barbecue", Decimal("44.90")),
        ],
        "Acompanhamentos": [
            ("Arroz Biro-Biro", "Porção para 2 pessoas", Decimal("15.90")),
            ("Farofa da Casa", "Porção individual", Decimal("9.90")),
        ],
    },
    "Pizza": {
        "Pizzas Tradicionais": [
            ("Pizza Mussarela G", "Molho, mussarela e orégano", Decimal("49.90")),
            ("Pizza Calabresa G", "Calabresa, cebola e azeitona", Decimal("54.90")),
        ],
        "Pizzas Especiais": [
            ("Pizza Quatro Queijos G", "Mix de queijos especiais", Decimal("59.90")),
            ("Pizza Frango com Catupiry G", "Frango desfiado e catupiry", Decimal("58.90")),
        ],
        "Bebidas": [
            ("Refrigerante 2L", "Escolha o sabor", Decimal("14.90")),
            ("Suco Integral 1L", "Uva ou laranja", Decimal("16.90")),
        ],
    },
    "Doces & Bolos": {
        "Bolos": [
            ("Bolo de Cenoura", "Fatia com cobertura de chocolate", Decimal("13.90")),
            ("Bolo Red Velvet", "Fatia recheada", Decimal("16.90")),
        ],
        "Doces": [
            ("Brigadeiro Gourmet", "Unidade", Decimal("4.50")),
            ("Torta de Limão", "Fatia", Decimal("14.90")),
        ],
        "Combos Doces": [
            ("Combo Café da Tarde", "2 fatias + 2 cafés", Decimal("29.90")),
            ("Box de Doces", "12 mini doces sortidos", Decimal("34.90")),
        ],
    },
    "Padarias": {
        "Café da Manhã": [
            ("Pão na Chapa + Café", "Combo tradicional", Decimal("12.90")),
            ("Misto Quente + Suco", "Lanche rápido", Decimal("17.90")),
        ],
        "Pães": [
            ("Pão Francês (6 un)", "Pacote com 6 unidades", Decimal("8.90")),
            ("Pão Integral", "Unidade 500g", Decimal("11.90")),
        ],
        "Doces de Padaria": [
            ("Sonho de Creme", "Unidade recheada", Decimal("7.90")),
            ("Carolina de Chocolate", "Unidade", Decimal("6.90")),
        ],
    },
    "Pastel": {
        "Pastéis Tradicionais": [
            ("Pastel de Carne", "Pastel grande", Decimal("12.90")),
            ("Pastel de Queijo", "Pastel grande", Decimal("11.90")),
        ],
        "Pastéis Especiais": [
            ("Pastel Frango com Catupiry", "Recheio cremoso", Decimal("14.90")),
            ("Pastel Pizza", "Mussarela, tomate e orégano", Decimal("13.90")),
        ],
        "Bebidas": [
            ("Caldo de Cana 500ml", "Natural", Decimal("9.90")),
            ("Refrigerante Lata", "350ml", Decimal("6.50")),
        ],
    },
}

IMAGEM_POR_CATEGORIA = {
    "Lanches": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200",
    "Marmita": "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=1200",
    "Italiana": "https://images.unsplash.com/photo-1521389508051-d7ffb5dc8c28?w=1200",
    "Promoções": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200",
    "Salgados": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1200",
    "Saudável": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200",
    "Açaí": "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=1200",
    "Árabe": "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200",
    "Chinesa": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=1200",
    "Carnes": "https://images.unsplash.com/photo-1558030006-450675393462?w=1200",
    "Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200",
    "Doces & Bolos": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1200",
    "Padarias": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200",
    "Pastel": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200",
}

FATOR_PRECO_PADRAO = {
    1: Decimal("0.90"),  # econômico
    2: Decimal("1.12"),  # premium
}

FATOR_PRECO_POR_CATEGORIA = {
    "Promoções": {1: Decimal("0.78"), 2: Decimal("0.88")},
    "Saudável": {1: Decimal("0.98"), 2: Decimal("1.15")},
    "Carnes": {1: Decimal("1.00"), 2: Decimal("1.18")},
}

FAIXA_PRECO = {
    1: "econômico",
    2: "premium",
}

PROMOCOES_POR_CATEGORIA = {
    "Lanches": [
        ("Combo Smash + Fritas", "Sanduíche da casa + fritas com preço especial", Decimal("24.90")),
        ("Dupla de Burgers", "2 hambúrgueres clássicos com desconto", Decimal("44.90")),
    ],
    "Marmita": [
        ("Marmita da Semana", "Prato completo com valor promocional", Decimal("18.90")),
        ("Leve 2 Marmitas", "Combo de 2 marmitas para o almoço", Decimal("34.90")),
    ],
    "Italiana": [
        ("Festival de Massas", "Massa do dia com 20% OFF", Decimal("29.90")),
        ("Noite Italiana", "Massa + sobremesa em combo", Decimal("39.90")),
    ],
    "Promoções": [
        ("Oferta Relâmpago", "Prato campeão com preço imbatível", Decimal("16.90")),
        ("Super Combo Econômico", "Prato + bebida + acompanhamento", Decimal("22.90")),
    ],
    "Salgados": [
        ("Combo 12 Salgados", "Seleção variada da casa", Decimal("24.90")),
        ("Hora do Salgado", "6 salgados + refrigerante", Decimal("19.90")),
    ],
    "Saudável": [
        ("Menu Fit do Dia", "Bowl + suco com preço especial", Decimal("26.90")),
        ("Combo Wellness", "2 saladas com desconto", Decimal("42.90")),
    ],
    "Açaí": [
        ("Açaí em Dobro", "2 tigelas 300ml promocionais", Decimal("24.90")),
        ("Combo Verão", "Açaí 500ml + topping extra", Decimal("21.90")),
    ],
    "Árabe": [
        ("Festival de Esfihas", "10 esfihas sortidas", Decimal("29.90")),
        ("Combo Árabe", "Kebab + homus + refrigerante", Decimal("34.90")),
    ],
    "Chinesa": [
        ("Wok Promo", "Yakissoba grande com desconto", Decimal("29.90")),
        ("Combo Oriental", "Prato + entrada + bebida", Decimal("39.90")),
    ],
    "Carnes": [
        ("Churrasco Executivo", "Corte + 2 acompanhamentos", Decimal("34.90")),
        ("Parrilla em Dobro", "2 pratos de carne com desconto", Decimal("74.90")),
    ],
    "Pizza": [
        ("Terça da Pizza", "Pizza grande promocional", Decimal("39.90")),
        ("Combo Família Pizza", "2 pizzas + refrigerante 2L", Decimal("89.90")),
    ],
    "Doces & Bolos": [
        ("Degustação Doce", "4 doces selecionados", Decimal("18.90")),
        ("Combo Café da Tarde Plus", "Bolo + 2 cafés + doces", Decimal("32.90")),
    ],
    "Padarias": [
        ("Café Completo", "Pão na chapa + suco + doce", Decimal("19.90")),
        ("Combo Pães da Casa", "Seleção de pães artesanais", Decimal("23.90")),
    ],
    "Pastel": [
        ("Pastel em Dobro", "2 pastéis tradicionais promocionais", Decimal("19.90")),
        ("Combo Feira", "Pastel + caldo de cana", Decimal("16.90")),
    ],
}


def slugify(texto: str) -> str:
    texto = texto.lower().strip()
    texto = texto.replace("ç", "c").replace("ã", "a").replace("á", "a").replace("â", "a")
    texto = texto.replace("é", "e").replace("ê", "e").replace("í", "i")
    texto = texto.replace("ó", "o").replace("ô", "o").replace("õ", "o")
    texto = texto.replace("ú", "u")
    texto = re.sub(r"[^a-z0-9]+", "-", texto)
    return texto.strip("-")


def limit_text(texto: str, limite: int) -> str:
    return (texto or "")[:limite]


def get_fator_preco(categoria_restaurante: str, numero: int) -> Decimal:
    return FATOR_PRECO_POR_CATEGORIA.get(categoria_restaurante, FATOR_PRECO_PADRAO).get(numero, Decimal("1.00"))


def aplicar_fator_preco(preco: Decimal, fator: Decimal) -> Decimal:
    return (preco * fator).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def imagem_para_produto(categoria_produto: str, categoria_restaurante: str) -> str:
    c = (categoria_produto or "").lower()
    r = (categoria_restaurante or "").lower()

    if "pizza" in c:
        return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600"
    if "açaí" in c or "acai" in c:
        return "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600"
    if "suco" in c or "bebida" in c or "refrigerante" in c:
        return "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600"
    if "doce" in c or "sobremesa" in c or "bolo" in c:
        return "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600"
    if "carne" in c or "brasa" in c or "parrilla" in c:
        return "https://images.unsplash.com/photo-1558030006-450675393462?w=600"
    if "yakissoba" in c or "oriental" in c or "entrada" in c and "chines" in r:
        return "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600"
    if "esfiha" in c or "árabe" in c or "arabe" in c or "homus" in c:
        return "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
    if "hamb" in c or "lanche" in c:
        return "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600"
    if "pastel" in c:
        return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600"
    if "massa" in c or "risoto" in c:
        return "https://images.unsplash.com/photo-1521389508051-d7ffb5dc8c28?w=600"
    if "salada" in c or "bowl" in c or "fit" in c:
        return "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600"
    if "pão" in c or "café" in c or "padaria" in c:
        return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600"

    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"


def montar_cardapio_restaurante(categoria_restaurante: str, numero: int) -> dict[str, list[tuple[str, str, Decimal]]]:
    fator = get_fator_preco(categoria_restaurante, numero)
    cardapio_base = MENU_POR_CATEGORIA[categoria_restaurante]

    cardapio: dict[str, list[tuple[str, str, Decimal]]] = {}
    for categoria_produto, itens in cardapio_base.items():
        cardapio[categoria_produto] = [
            (nome, descricao, aplicar_fator_preco(preco, fator))
            for nome, descricao, preco in itens
        ]

    promocoes = PROMOCOES_POR_CATEGORIA.get(categoria_restaurante, [])
    if promocoes:
        cardapio["Promoções da Semana"] = [
            (nome, descricao, aplicar_fator_preco(preco, fator))
            for nome, descricao, preco in promocoes
        ]

    return cardapio


def ensure_owner(categoria: str, numero: int) -> Usuario:
    slug = slugify(categoria)
    email = f"restaurante.{slug}.{numero}@kifome.demo"

    owner = Usuario.query.filter_by(email=email).first()
    if owner:
        return owner

    owner = Usuario(
        nome=f"Dono {categoria} {numero}",
        email=email,
        telefone=f"11999{numero:02d}{len(categoria):04d}",
        tipo="restaurante",
        ativo=True,
    )
    db.session.add(owner)
    db.session.flush()
    return owner


def ensure_restaurante(owner: Usuario, categoria: str, numero: int) -> Restaurante:
    tema_nome, tema_desc = TEMA_RESTAURANTES[categoria][numero - 1]
    faixa = FAIXA_PRECO.get(numero, "intermediário")

    restaurante = Restaurante.query.filter_by(usuario_id=owner.id).first()
    if restaurante is None:
        restaurante = Restaurante(usuario_id=owner.id)
        db.session.add(restaurante)

    restaurante.nome_fantasia = limit_text(tema_nome, 100)
    restaurante.descricao = limit_text(f"{tema_desc}. Faixa de preço: {faixa}.", 500)
    restaurante.endereco = limit_text(f"Rua {slugify(categoria).replace('-', ' ').title()} {numero * 10}, Guarulhos - SP", 200)
    restaurante.telefone = f"11 4002-{1000 + numero + (len(categoria) * 2)}"
    restaurante.categoria = categoria
    restaurante.imagem_url = IMAGEM_POR_CATEGORIA.get(categoria, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200")
    restaurante.status = "aprovado"

    db.session.flush()
    return restaurante


def sync_produtos(restaurante: Restaurante, categoria_restaurante: str, numero: int) -> tuple[int, int, int]:
    cardapio = montar_cardapio_restaurante(categoria_restaurante, numero)
    existentes = Produto.query.filter_by(restaurante_id=restaurante.id).all()
    existentes_por_nome = {p.nome: p for p in existentes}

    nomes_desejados: set[str] = set()
    criados = 0
    atualizados = 0
    removidos = 0

    for categoria_produto, itens in cardapio.items():
        for nome, descricao, preco in itens:
            nome_limpo = limit_text(nome, 50)
            nomes_desejados.add(nome_limpo)

            produto = existentes_por_nome.get(nome_limpo)
            if produto is None:
                produto = Produto(restaurante_id=restaurante.id, nome=nome_limpo)
                db.session.add(produto)
                criados += 1
            else:
                atualizados += 1

            produto.descricao = limit_text(descricao, 100)
            produto.preco = preco
            produto.categoria = limit_text(categoria_produto, 100)
            produto.imagem_url = imagem_para_produto(categoria_produto, categoria_restaurante)
            produto.disponivel = True

    for produto in existentes:
        if produto.nome not in nomes_desejados:
            db.session.delete(produto)
            removidos += 1

    return criados, atualizados, removidos


def seed_demo_data() -> None:
    restaurantes_criados = 0
    produtos_criados = 0
    produtos_atualizados = 0
    produtos_removidos = 0

    for categoria in CATEGORIAS_RESTAURANTE:
        for numero in (1, 2):
            owner = ensure_owner(categoria, numero)
            antes_restaurante = Restaurante.query.filter_by(usuario_id=owner.id).first()
            restaurante = ensure_restaurante(owner, categoria, numero)

            if antes_restaurante is None:
                restaurantes_criados += 1

            criados, atualizados, removidos = sync_produtos(restaurante, categoria, numero)
            produtos_criados += criados
            produtos_atualizados += atualizados
            produtos_removidos += removidos

    db.session.commit()

    print("\n✅ Seed demo concluída com sucesso!")
    print(f"- Categorias de restaurante: {len(CATEGORIAS_RESTAURANTE)}")
    print(f"- Restaurantes criados agora: {restaurantes_criados}")
    print(f"- Produtos criados agora: {produtos_criados}")
    print(f"- Produtos atualizados: {produtos_atualizados}")
    print(f"- Produtos removidos (genéricos antigos): {produtos_removidos}")

    total_restaurantes = Restaurante.query.count()
    total_produtos = Produto.query.count()
    print(f"- Total de restaurantes no banco: {total_restaurantes}")
    print(f"- Total de produtos no banco: {total_produtos}")

    print("\n📊 Restaurantes por categoria:")
    for categoria in CATEGORIAS_RESTAURANTE:
        qtd = Restaurante.query.filter_by(categoria=categoria).count()
        print(f"  - {categoria}: {qtd}")

    print("\n📦 Categorias internas de produtos (geral):")
    cat_counter = Counter([p.categoria or "Sem categoria" for p in Produto.query.all()])
    for cat, qtd in sorted(cat_counter.items()):
        print(f"  - {cat}: {qtd}")


if __name__ == "__main__":
    app = create_app("development")
    with app.app_context():
        seed_demo_data()
