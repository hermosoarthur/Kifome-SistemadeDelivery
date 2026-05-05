package com.kifome.app.ui.cliente

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeusPedidosScreen(
    onNavigateBack: () -> Unit,
    onVerPedido: (pedidoId: String) -> Unit,
    viewModel: MeusPedidosViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Meus Pedidos") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") }
                }
            )
        }
    ) { padding ->
        when (val state = uiState) {
            is MeusPedidosUiState.Loading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator()
                        Spacer(Modifier.height(8.dp))
                        Text("Conectando ao servidor... aguarde.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            is MeusPedidosUiState.Error -> {
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
            is MeusPedidosUiState.Success -> {
                if (state.pedidos.isEmpty()) {
                    Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("📦", fontSize = 64.sp)
                            Spacer(Modifier.height(16.dp))
                            Text("Você ainda não fez nenhum pedido", style = MaterialTheme.typography.titleMedium)
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(padding),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(state.pedidos, key = { it.id }) { pedido ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                onClick = { onVerPedido(pedido.id) }
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text("Pedido #${pedido.id.take(8)}", fontWeight = FontWeight.Bold)
                                        Text(
                                            pedido.restauranteNome ?: "Restaurante",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                        )
                                        Text(
                                            "R$ ${"%.2f".format(pedido.total)}",
                                            color = MaterialTheme.colorScheme.primary,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                    Surface(
                                        shape = MaterialTheme.shapes.small,
                                        color = statusColor(pedido.status).copy(alpha = 0.15f)
                                    ) {
                                        Text(
                                            pedido.status.uppercase(),
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = statusColor(pedido.status),
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun statusColor(status: String) = when (status) {
    "pendente"   -> androidx.compose.ui.graphics.Color(0xFFF59E0B) // Amarelo
    "confirmado" -> androidx.compose.ui.graphics.Color(0xFF3B82F6) // Azul
    "preparando" -> androidx.compose.ui.graphics.Color(0xFFFF5A00) // Laranja
    "pronto"     -> androidx.compose.ui.graphics.Color(0xFF84CC16) // Verde claro
    "em_entrega" -> androidx.compose.ui.graphics.Color(0xFF8B5CF6) // Roxo
    "entregue"   -> androidx.compose.ui.graphics.Color(0xFF22C55E) // Verde
    "cancelado"  -> MaterialTheme.colorScheme.error               // Vermelho
    else         -> MaterialTheme.colorScheme.primary
}

