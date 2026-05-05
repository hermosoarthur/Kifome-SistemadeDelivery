package com.kifome.app.ui.entregador

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Refresh
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
fun EntregadorDashScreen(
    onNavigateToEntregas: () -> Unit,
    onLogout: () -> Unit,
    viewModel: EntregadorDashViewModel = hiltViewModel()
) {
    val pedidos by viewModel.pedidosDisponiveis.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val message by viewModel.message.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(message) {
        message?.let { snackbarHostState.showSnackbar(it); viewModel.clearMessage() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Painel do Entregador") },
                actions = {
                    IconButton(onClick = { viewModel.carregar() }) { Icon(Icons.Default.Refresh, "Atualizar") }
                    IconButton(onClick = onLogout) { Icon(Icons.Default.Logout, "Sair") }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToEntregas,
                icon = { Text("🛵") },
                text = { Text("Minhas Entregas") }
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator()
                    Spacer(Modifier.height(8.dp))
                    Text("Conectando ao servidor... aguarde.", style = MaterialTheme.typography.bodySmall)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Text(
                        "Pedidos disponíveis (${pedidos.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                if (pedidos.isEmpty()) {
                    item {
                        Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("🛵", fontSize = 48.sp)
                                Spacer(Modifier.height(8.dp))
                                Text("Nenhum pedido disponível no momento")
                            }
                        }
                    }
                } else {
                    items(pedidos, key = { it.id }) { pedido ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Pedido #${pedido.id.take(8)}", fontWeight = FontWeight.Bold)
                                    Text("R$ ${"%.2f".format(pedido.total)}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                }
                                if (!pedido.enderecoEntrega.isNullOrBlank()) {
                                    Spacer(Modifier.height(4.dp))
                                    Text("📍 ${pedido.enderecoEntrega}", style = MaterialTheme.typography.bodySmall)
                                }
                                Spacer(Modifier.height(8.dp))
                                Button(
                                    onClick = { viewModel.aceitarPedido(pedido.id) },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("✅ Aceitar entrega")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

