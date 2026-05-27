package com.kifome.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.core.util.Resource
import com.kifome.app.ui.components.CategoryChip
import com.kifome.app.ui.components.KifomeButton
import com.kifome.app.ui.components.RestaurantCard
import com.kifome.app.ui.theme.KifomeMuted
import com.kifome.app.ui.theme.KifomePrimary
import com.kifome.app.ui.theme.KifomePrimaryDark
import com.kifome.app.ui.theme.KifomePrimarySoft
import com.kifome.app.ui.theme.KifomeSecundaria
import com.kifome.app.ui.theme.KifomeTextoClaro
import com.kifome.app.ui.theme.KifomeTextoPrimario
import com.kifome.app.ui.theme.PillShape

private val CATEGORIAS = listOf(
    "🍔" to "Lanches", "🍱" to "Marmita", "🍝" to "Italiana",
    "🏷️" to "Promoções", "🥐" to "Salgados", "🥗" to "Saudável",
    "🍧" to "Açaí", "🥙" to "Árabe", "🥢" to "Chinesa",
    "🥩" to "Carnes", "🍕" to "Pizza", "🍰" to "Doces & Bolos",
    "🥖" to "Padarias", "🥟" to "Pastel"
)

@Composable
fun HomeScreen(
    onAddressClick: () -> Unit,
    onRestauranteClick: (Int) -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val restaurantesState by viewModel.restaurantes.collectAsState()
    val categoriaAtiva by viewModel.categoriaAtiva.collectAsState()
    val busca by viewModel.busca.collectAsState()
    val nome by viewModel.nomeUsuario.collectAsState()
    val endereco by viewModel.enderecoAtual.collectAsState()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 16.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        // ── Hero Banner ──────────────────────────────────────────────
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.linearGradient(
                            listOf(Color(0xFF2E333B), Color(0xFF4A505D), KifomePrimaryDark)
                        ),
                        shape = RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp)
                    )
                    .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
                    .padding(top = 72.dp, bottom = 50.dp, start = 20.dp, end = 20.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Logo Kifome
                        Text(
                            text = "Kifome",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            fontStyle = FontStyle.Italic,
                            color = KifomePrimary
                        )
                        Row {
                            // Avatar com iniciais
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .background(
                                        brush = Brush.linearGradient(listOf(KifomePrimary, KifomeSecundaria)),
                                        shape = RoundedCornerShape(16.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = nome.firstOrNull()?.uppercase() ?: "U",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                            }
                            IconButton(onClick = { }) {
                                Icon(Icons.Default.Notifications, contentDescription = "Notificações", tint = Color.White)
                            }
                            IconButton(onClick = { }) {
                                Icon(Icons.Default.ShoppingCart, contentDescription = "Carrinho", tint = Color.White)
                            }
                        }
                    }

                    Spacer(Modifier.height(20.dp))

                    Text(
                        text = "Olá, $nome! 👋",
                        fontSize = 44.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = (-0.88).sp,
                        lineHeight = 48.sp
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "📍 $endereco",
                        color = Color.White.copy(alpha = 0.75f),
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.clickable(onClick = onAddressClick)
                    )
                }
            }
        }

        // ── Espaço após hero ─────────────────────────────────────────
        item { Spacer(Modifier.height(20.dp)) }

        // ── Search Bar (Pill) ─────────────────────────────────────────
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .background(color = KifomeMuted, shape = PillShape)
                    .padding(horizontal = 18.dp, vertical = 10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Icon(Icons.Default.Search, contentDescription = null, tint = KifomeTextoClaro, modifier = Modifier.size(18.dp))
                    Box(modifier = Modifier.weight(1f)) {
                        if (busca.isEmpty()) {
                            Text("Buscar restaurantes...", color = KifomeTextoClaro, style = MaterialTheme.typography.bodyMedium)
                        }
                        BasicTextField(
                            value = busca,
                            onValueChange = viewModel::buscar,
                            singleLine = true,
                            textStyle = MaterialTheme.typography.bodyMedium.copy(color = KifomeTextoPrimario),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }

        item { Spacer(Modifier.height(16.dp)) }

        // ── Refresh ───────────────────────────────────────────────────
        item {
            Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                KifomeButton(text = "Atualizar restaurantes", onClick = viewModel::refresh)
            }
        }

        item { Spacer(Modifier.height(16.dp)) }

        // ── Categorias ────────────────────────────────────────────────
        item {
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Text("Categorias", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(10.dp))
            }
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(CATEGORIAS) { (emoji, nomeCategoria) ->
                    CategoryChip(
                        emoji = emoji,
                        nome = nomeCategoria,
                        ativo = categoriaAtiva == nomeCategoria,
                        onClick = { viewModel.selecionarCategoria(nomeCategoria) }
                    )
                }
            }
        }

        item { Spacer(Modifier.height(16.dp)) }

        // ── Restaurantes ──────────────────────────────────────────────
        item {
            Text(
                "Restaurantes",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
            Spacer(Modifier.height(10.dp))
        }

        item {
            when (val state = restaurantesState) {
                is Resource.Loading -> {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        CircularProgressIndicator(color = KifomePrimary, strokeWidth = 2.dp)
                    }
                }
                is Resource.Error -> {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Erro: ${state.message}", color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(8.dp))
                        KifomeButton(text = "Tentar novamente", onClick = viewModel::refresh)
                    }
                }
                is Resource.Success -> {
                    if (state.data.isEmpty()) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("🍽️")
                            Text("Nenhum restaurante encontrado")
                        }
                    } else {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(600.dp)
                                .padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.data) { restaurante ->
                                RestaurantCard(
                                    restaurante = restaurante,
                                    onClick = { onRestauranteClick(restaurante.id) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
