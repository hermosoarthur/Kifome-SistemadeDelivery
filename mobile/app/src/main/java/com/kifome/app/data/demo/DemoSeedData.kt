package com.kifome.app.data.demo

import com.kifome.app.data.api.dto.ProdutoDto
import com.kifome.app.data.api.dto.RestauranteDto

object DemoSeedData {
    val restaurantes: List<RestauranteDto> = listOf(
        RestauranteDto(
            id = "demo_burger_house",
            nomeFantasia = "Burger House",
            descricao = "Hambúrguer artesanal feito na brasa com ingredientes frescos",
            endereco = "Rua das Flores, 120 - Centro",
            telefone = "(11) 98888-1001",
            categoria = "Lanches",
            imagemUrl = null,
            status = "aberto",
            taxaEntrega = 4.99,
            tempoEstimado = "25-35 min",
            nota = 4.8
        ),
        RestauranteDto(
            id = "demo_pizza_prime",
            nomeFantasia = "Pizza Prime",
            descricao = "Pizzas italianas com massa de longa fermentação e ingredientes importados",
            endereco = "Av. Paulista, 900 - Bela Vista",
            telefone = "(11) 97777-2002",
            categoria = "Pizza",
            imagemUrl = null,
            status = "aberto",
            taxaEntrega = 5.99,
            tempoEstimado = "35-50 min",
            nota = 4.7
        ),
        RestauranteDto(
            id = "demo_sushi_tokyo",
            nomeFantasia = "Sushi Tokyo",
            descricao = "Combinados e temakis frescos do dia, com salmão norueguês",
            endereco = "Rua Augusta, 455 - Consolação",
            telefone = "(11) 96666-3003",
            categoria = "Chinesa",
            imagemUrl = null,
            status = "aberto",
            taxaEntrega = 6.99,
            tempoEstimado = "40-55 min",
            nota = 4.9
        ),
        RestauranteDto(
            id = "demo_brasa_grill",
            nomeFantasia = "Brasa Grill",
            descricao = "Pratos brasileiros tradicionais, grelhados e marmitas executivas",
            endereco = "Rua do Mercado, 32 - Centro",
            telefone = "(11) 95555-4004",
            categoria = "Marmita",
            imagemUrl = null,
            status = "aberto",
            taxaEntrega = 3.99,
            tempoEstimado = "20-30 min",
            nota = 4.5
        ),
        RestauranteDto(
            id = "demo_acai_power",
            nomeFantasia = "Açaí Power",
            descricao = "Açaí fresquinho da Amazônia com coberturas especiais",
            endereco = "Rua Verde, 67 - Pinheiros",
            telefone = "(11) 94444-5005",
            categoria = "Açaí",
            imagemUrl = null,
            status = "aberto",
            taxaEntrega = 4.49,
            tempoEstimado = "15-25 min",
            nota = 4.6
        ),
        RestauranteDto(
            id = "demo_padaria_sol",
            nomeFantasia = "Padaria do Sol",
            descricao = "Salgados, pães e doces artesanais frescos todo dia",
            endereco = "Av. Brigadeiro, 1200 - Itaim",
            telefone = "(11) 93333-6006",
            categoria = "Padarias",
            imagemUrl = null,
            status = "aberto",
            taxaEntrega = 2.99,
            tempoEstimado = "15-20 min",
            nota = 4.4
        ),
        RestauranteDto(
            id = "demo_arab_house",
            nomeFantasia = "Arab House",
            descricao = "Esfihas, kibes e pratos árabes autênticos preparados na hora",
            endereco = "Rua Haddock Lobo, 321 - Higienópolis",
            telefone = "(11) 92222-7007",
            categoria = "Árabe",
            imagemUrl = null,
            status = "aberto",
            taxaEntrega = 4.99,
            tempoEstimado = "30-45 min",
            nota = 4.7
        ),
        RestauranteDto(
            id = "demo_salad_green",
            nomeFantasia = "Salad Green",
            descricao = "Saladas, wraps e bowls saudáveis para o seu dia a dia",
            endereco = "Rua Oscar Freire, 890 - Jardins",
            telefone = "(11) 91111-8008",
            categoria = "Saudável",
            imagemUrl = null,
            status = "aberto",
            taxaEntrega = 5.49,
            tempoEstimado = "20-30 min",
            nota = 4.6
        )
    )

    val produtosPorRestaurante: Map<String, List<ProdutoDto>> = mapOf(
        "demo_burger_house" to listOf(
            ProdutoDto("p_bh_1", "demo_burger_house", "Smash Burger", "Pão brioche, queijo cheddar e molho especial da casa", 29.90, "Lanches", null, true),
            ProdutoDto("p_bh_2", "demo_burger_house", "Bacon Burger", "Burger 160g com bacon crocante e queijo americano", 34.90, "Lanches", null, true),
            ProdutoDto("p_bh_3", "demo_burger_house", "Veggie Burger", "Burger de grão-de-bico com rúcula e tomate seco", 32.90, "Lanches", null, true),
            ProdutoDto("p_bh_4", "demo_burger_house", "Batata Frita G", "Batata crocante com sal de parrilla e ketchup artesanal", 17.50, "Acompanhamentos", null, true),
            ProdutoDto("p_bh_5", "demo_burger_house", "Onion Rings", "Anéis de cebola empanados e crocantes", 15.90, "Acompanhamentos", null, true),
            ProdutoDto("p_bh_6", "demo_burger_house", "Milk Shake 400ml", "Chocolate, morango ou baunilha", 19.90, "Bebidas", null, true)
        ),
        "demo_pizza_prime" to listOf(
            ProdutoDto("p_pp_1", "demo_pizza_prime", "Margherita", "Molho artesanal, mozzarella de búfala e manjericão fresco", 52.00, "Pizzas", null, true),
            ProdutoDto("p_pp_2", "demo_pizza_prime", "Pepperoni", "Mozzarella premium e pepperoni importado", 58.00, "Pizzas", null, true),
            ProdutoDto("p_pp_3", "demo_pizza_prime", "Quatro Queijos", "Mozzarella, gorgonzola, parmesão e catupiry", 62.00, "Pizzas", null, true),
            ProdutoDto("p_pp_4", "demo_pizza_prime", "Portuguesa", "Ovos, presunto, cebola, azeitona e catupiry", 56.00, "Pizzas", null, true),
            ProdutoDto("p_pp_5", "demo_pizza_prime", "Calzone Frango", "Frango desfiado, requeijão e catupiry", 48.00, "Calzone", null, true),
            ProdutoDto("p_pp_6", "demo_pizza_prime", "Refrigerante 2L", "Coca-Cola, Guaraná ou Fanta", 13.00, "Bebidas", null, true)
        ),
        "demo_sushi_tokyo" to listOf(
            ProdutoDto("p_st_1", "demo_sushi_tokyo", "Combo 24 Peças", "Sashimi, uramaki e hot roll fresco do dia", 69.90, "Combinados", null, true),
            ProdutoDto("p_st_2", "demo_sushi_tokyo", "Combo 40 Peças", "Variedade completa para compartilhar", 109.90, "Combinados", null, true),
            ProdutoDto("p_st_3", "demo_sushi_tokyo", "Temaki Salmão", "Temaki de salmão norueguês com cream cheese", 28.50, "Temakis", null, true),
            ProdutoDto("p_st_4", "demo_sushi_tokyo", "Hot Roll 10 Peças", "Empanado crocante com salmão cremoso", 34.90, "Hot Roll", null, true),
            ProdutoDto("p_st_5", "demo_sushi_tokyo", "Missoshiru", "Sopa japonesa tradicional com tofu", 12.00, "Sopas", null, true)
        ),
        "demo_brasa_grill" to listOf(
            ProdutoDto("p_bg_1", "demo_brasa_grill", "PF Frango Grelhado", "Arroz, feijão, salada e fritas", 27.90, "Pratos", null, true),
            ProdutoDto("p_bg_2", "demo_brasa_grill", "Parmegiana", "Bife à parmegiana com arroz e fritas", 39.90, "Pratos", null, true),
            ProdutoDto("p_bg_3", "demo_brasa_grill", "Marmita Executiva", "2 proteínas + 3 acompanhamentos à escolha", 32.90, "Marmitas", null, true),
            ProdutoDto("p_bg_4", "demo_brasa_grill", "Picanha na Chapa", "250g com mandioca frita e vinagrete", 54.90, "Grelhados", null, true),
            ProdutoDto("p_bg_5", "demo_brasa_grill", "Suco Natural 500ml", "Laranja, limão ou abacaxi com hortelã", 11.50, "Bebidas", null, true)
        ),
        "demo_acai_power" to listOf(
            ProdutoDto("p_ap_1", "demo_acai_power", "Açaí 400ml", "Açaí puro com granola, banana e mel", 21.90, "Açaí", null, true),
            ProdutoDto("p_ap_2", "demo_acai_power", "Açaí 700ml", "Açaí na tigela com frutas vermelhas e granola", 32.90, "Açaí", null, true),
            ProdutoDto("p_ap_3", "demo_acai_power", "Smoothie Tropical", "Açaí, manga, maracujá e leite de coco", 24.90, "Smoothies", null, true)
        ),
        "demo_padaria_sol" to listOf(
            ProdutoDto("p_ps_1", "demo_padaria_sol", "Coxinha (unid.)", "Frango cremoso em massa dourada crocante", 7.50, "Salgados", null, true),
            ProdutoDto("p_ps_2", "demo_padaria_sol", "Esfiha Aberta (unid.)", "Carne moída temperada no pão árabe", 8.50, "Salgados", null, true),
            ProdutoDto("p_ps_3", "demo_padaria_sol", "Combo 10 Salgados", "Sortido: coxinha, esfiha e quibe", 65.00, "Combos", null, true),
            ProdutoDto("p_ps_4", "demo_padaria_sol", "Bolo de Cenoura Fatiado", "Fatia de 150g com cobertura de ganache", 12.90, "Doces", null, true),
            ProdutoDto("p_ps_5", "demo_padaria_sol", "Café com Leite 300ml", "Café fresquinho com leite vaporizado", 9.90, "Bebidas", null, true)
        ),
        "demo_arab_house" to listOf(
            ProdutoDto("p_ah_1", "demo_arab_house", "Esfiha Fechada (5 unid.)", "Carne moída com temperos árabes autênticos", 28.90, "Esfihas", null, true),
            ProdutoDto("p_ah_2", "demo_arab_house", "Kibe Frito (6 unid.)", "Kibe de carne assada com hortelã", 32.90, "Kibes", null, true),
            ProdutoDto("p_ah_3", "demo_arab_house", "Homus com Pão Árabe", "Homus cremoso com azeite e levedo", 22.90, "Entradas", null, true),
            ProdutoDto("p_ah_4", "demo_arab_house", "Kafta Grelhada", "3 unidades de kafta no carvão com arroz de lentilha", 44.90, "Pratos", null, true)
        ),
        "demo_salad_green" to listOf(
            ProdutoDto("p_sg_1", "demo_salad_green", "Bowl Mediterrâneo", "Quinoa, grão-de-bico, pepino, tomate e feta", 36.90, "Bowls", null, true),
            ProdutoDto("p_sg_2", "demo_salad_green", "Wrap de Frango", "Frango grelhado, alface, tomate e molho iogurte", 31.90, "Wraps", null, true),
            ProdutoDto("p_sg_3", "demo_salad_green", "Salada Caesar G", "Alface romana, croutons, parmesão e molho caesar", 29.90, "Saladas", null, true),
            ProdutoDto("p_sg_4", "demo_salad_green", "Suco Verde 400ml", "Couve, maçã verde, limão e gengibre", 18.90, "Bebidas", null, true)
        )
    )

    fun filtrarRestaurantes(busca: String?, categoria: String?): List<RestauranteDto> {
        val buscaLimpa = busca?.trim().orEmpty()
        val categoriaLimpa = categoria?.trim().orEmpty()

        return restaurantes
            .filter {
                buscaLimpa.isBlank() ||
                    it.nomeFantasia.contains(buscaLimpa, ignoreCase = true) ||
                    it.categoria?.contains(buscaLimpa, ignoreCase = true) == true
            }
            .filter {
                categoriaLimpa.isBlank() ||
                    categoriaLimpa.equals("Todos", ignoreCase = true) ||
                    it.categoria?.equals(categoriaLimpa, ignoreCase = true) == true
            }
    }
}
