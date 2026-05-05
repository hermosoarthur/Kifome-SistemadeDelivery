package com.kifome.app.ui.restaurante

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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

private val FILTROS = listOf("todos", "pendente", "confirmado", "preparando", "saiu", "entregue")
private val PROXIMOS_STATUS = mapOf(
    "pendente" to "confirmado",
    "confirmado" to "preparando",
    "preparando" to "saiu",
    "saiu" to "entregue"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PedidosRestauranteScreen(
    onNavigateBack: () -> Unit,
    viewModel: PedidosRestauranteViewModel = hiltViewModel()
) {
    val pedidos by viewModel.pedidos.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val filtro by viewModel.filtroStatus.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Pedidos") },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(FILTROS) { status ->
                    FilterChip(
                        selected = filtro == status,
                        onClick = { viewModel.setFiltro(status) },
                        label = { Text(status.replaceFirstChar { it.uppercase() }) }
                    )
                }
            }
            if (isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator()
                        Spacer(Modifier.height(8.dp))
                        Text("Conectando ao servidor... aguarde.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            } else if (pedidos.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📋", fontSize = 48.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("Nenhum pedido encontrado")
                    }
                }
            } else {
                LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(pedidos, key = { it.id }) { pedido ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                    Text("Pedido #${pedido.id.take(8)}", fontWeight = FontWeight.Bold)
                                    Text("R$ ${"%.2f".format(pedido.total)}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                }
                                Spacer(Modifier.height(4.dp))
                                Text("Status: ${pedido.status.uppercase()}", style = MaterialTheme.typography.bodySmall)
                                if (!pedido.enderecoEntrega.isNullOrBlank()) {
                                    Text("📍 ${pedido.enderecoEntrega}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                }
                                val proximoStatus = PROXIMOS_STATUS[pedido.status]
                                if (proximoStatus != null) {
                                    Spacer(Modifier.height(8.dp))
                                    Button(
                                        onClick = { viewModel.atualizarStatus(pedido.id, proximoStatus) },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("→ Mover para: ${proximoStatus.replaceFirstChar { it.uppercase() }}")
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

