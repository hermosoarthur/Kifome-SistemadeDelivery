package com.kifome.app.ui.detail

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.kifome.app.data.api.dto.ProdutoDto
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RestauranteDetalheScreen(
    onNavigateBack: () -> Unit,
    onNavigateToCart: () -> Unit,
    viewModel: RestauranteDetalheViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cartItems by viewModel.cartItems.collectAsState()
    val totalItems = cartItems.sumOf { it.quantidade }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    when (val s = uiState) {
                        is DetalheUiState.Success -> Text(s.restaurante.nomeFantasia, maxLines = 1)
                        else -> Text("Restaurante")
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar")
                    }
                },
                actions = {
                    if (totalItems > 0) {
                        BadgedBox(badge = { Badge { Text("$totalItems") } }) {
                            IconButton(onClick = onNavigateToCart) {
                                Icon(Icons.Default.ShoppingCart, "Carrinho", tint = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
            )
        }
    ) { padding ->
        when (val state = uiState) {
            is DetalheUiState.Loading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.height(12.dp))
                        Text("Conectando ao servidor... aguarde.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            is DetalheUiState.Error -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("😕", fontSize = 48.sp)
                        Spacer(Modifier.height(8.dp))
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Spacer(Modifier.height(16.dp))
                        Button(onClick = { viewModel.carregar() }) { Text("Tentar novamente") }
                    }
                }
            }
            is DetalheUiState.Success -> {
                val restaurante = state.restaurante
                val produtosPorCategoria = state.produtos.groupBy { it.categoria ?: "Outros" }

                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    // Header imagem
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(220.dp)
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            if (restaurante.imagemUrl != null) {
                                AsyncImage(
                                    model = restaurante.imagemUrl,
                                    contentDescription = restaurante.nomeFantasia,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Text("🍽️", fontSize = 72.sp)
                            }
                        }
                    }

                    // Info restaurante
                    item {
                        val latLng = LatLng(
                            restaurante.latitude ?: -23.55052,
                            restaurante.longitude ?: -46.633308
                        )
                        val cameraPositionState = rememberCameraPositionState {
                            position = CameraPosition.fromLatLngZoom(latLng, 14f)
                        }

                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                restaurante.nomeFantasia,
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold
                            )
                            if (restaurante.categoria != null) {
                                Text(
                                    restaurante.categoria,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            if (!restaurante.descricao.isNullOrBlank()) {

                            Spacer(Modifier.height(14.dp))
                            Text(
                                text = "Localização",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(Modifier.height(8.dp))
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(170.dp),
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                GoogleMap(
                                    modifier = Modifier.fillMaxSize(),
                                    cameraPositionState = cameraPositionState
                                ) {
                                    Marker(
                                        state = MarkerState(position = latLng),
                                        title = restaurante.nomeFantasia,
                                        snippet = restaurante.endereco
                                    )
                                }
                            }
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    restaurante.descricao,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(
                                "📍 ${restaurante.endereco}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            Spacer(Modifier.height(10.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Surface(
                                    shape = RoundedCornerShape(50),
                                    color = MaterialTheme.colorScheme.primaryContainer
                                ) {
                                    Text(
                                        text = "Entrega 25-40 min",
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                Surface(
                                    shape = RoundedCornerShape(50),
                                    color = MaterialTheme.colorScheme.surfaceVariant
                                ) {
                                    Text(
                                        text = "Taxa R$ 4,99",
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                        HorizontalDivider()
                    }

                    // Produtos por categoria
                    produtosPorCategoria.forEach { (categoria, produtos) ->
                        item {
                            Text(
                                text = categoria,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                            )
                        }
                        items(produtos, key = { it.id }) { produto ->
                            ProdutoItem(
                                produto = produto,
                                onAdd = { viewModel.addToCart(produto) }
                            )
                        }
                    }
                }

                // FAB do carrinho
                if (totalItems > 0) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding)
                            .padding(16.dp),
                        contentAlignment = Alignment.BottomCenter
                    ) {
                        Button(
                            onClick = onNavigateToCart,
                            modifier = Modifier.fillMaxWidth().height(52.dp)
                        ) {
                            Icon(Icons.Default.ShoppingCart, null)
                            Spacer(Modifier.width(8.dp))
                            Text("Ver carrinho ($totalItems itens)")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProdutoItem(produto: ProdutoDto, onAdd: () -> Unit) {
    val formatter = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(produto.nome, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                if (!produto.descricao.isNullOrBlank()) {
                    Text(
                        produto.descricao,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        maxLines = 2
                    )
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    formatter.format(produto.preco),
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }

            if (produto.imagemUrl != null) {
                Spacer(Modifier.width(10.dp))
                Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(10.dp)).background(MaterialTheme.colorScheme.surfaceVariant)) {
                    AsyncImage(model = produto.imagemUrl, contentDescription = produto.nome, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                }
            }

            Spacer(Modifier.width(8.dp))
            FilledIconButton(onClick = onAdd, modifier = Modifier.size(38.dp)) {
                Icon(Icons.Default.Add, "Adicionar", modifier = Modifier.size(20.dp))
            }
        }
    }
}

