package com.kifome.app.ui.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.core.util.Resource
import com.kifome.app.ui.components.CategoryChip
import com.kifome.app.ui.components.KifomeButton
import com.kifome.app.ui.components.RestaurantCard

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
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("🍔 Kifome", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Text("Olá, $nome! 👋")
                        Text(
                            text = "📍 $endereco",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.clickable(onClick = onAddressClick)
                        )
                    }
                    IconButton(onClick = { }) {
                        Icon(Icons.Default.Notifications, contentDescription = "Notificações")
                    }
                    IconButton(onClick = { }) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = "Carrinho")
                    }
                }
            }

            item {
                KifomeButton(text = "Atualizar restaurantes", onClick = viewModel::refresh)
            }

            item {
                OutlinedTextField(
                    value = busca,
                    onValueChange = viewModel::buscar,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Buscar restaurantes...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Buscar") }
                )
            }

            item {
                Text("Categorias", fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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

            item { Text("Restaurantes", fontWeight = FontWeight.Bold) }

            item {
                when (val state = restaurantesState) {
                    is Resource.Loading -> {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    is Resource.Error -> {
                        Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Erro: ${state.message}", color = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.height(8.dp))
                            KifomeButton(text = "Tentar novamente", onClick = viewModel::refresh)
                        }
                    }
                    is Resource.Success -> {
                        if (state.data.isEmpty()) {
                            Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("🍽️")
                                Text("Nenhum restaurante encontrado")
                            }
                        } else {
                            LazyVerticalGrid(
                                columns = GridCells.Fixed(2),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(600.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
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
