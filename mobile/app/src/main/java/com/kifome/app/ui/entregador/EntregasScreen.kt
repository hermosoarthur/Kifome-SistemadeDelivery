package com.kifome.app.ui.entregador

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
fun EntregasScreen(
    onNavigateBack: () -> Unit,
    onValidarEntrega: (pedidoId: String) -> Unit,
    viewModel: EntregasViewModel = hiltViewModel()
) {
    val entregas by viewModel.entregas.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val message by viewModel.message.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(message) {
        message?.let { snackbarHostState.showSnackbar(it); viewModel.clearMessage() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Minhas Entregas") },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator()
                    Spacer(Modifier.height(8.dp))
                    Text("Conectando ao servidor... aguarde.", style = MaterialTheme.typography.bodySmall)
                }
            }
        } else if (entregas.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🛵", fontSize = 48.sp)
                    Spacer(Modifier.height(16.dp))
                    Text("Nenhuma entrega em andamento")
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(entregas, key = { it.id }) { pedido ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Pedido #${pedido.id.take(8)}", fontWeight = FontWeight.Bold)
                                Text("R$ ${"%.2f".format(pedido.total)}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.height(4.dp))
                            Text("Status: ${pedido.status.uppercase()}", style = MaterialTheme.typography.bodySmall)
                            if (!pedido.enderecoEntrega.isNullOrBlank()) {
                                Text("📍 ${pedido.enderecoEntrega}", style = MaterialTheme.typography.bodySmall)
                            }
                            Spacer(Modifier.height(8.dp))
                            Button(
                                onClick = { onValidarEntrega(pedido.id) },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("🔐 Validar entrega")
                            }
                        }
                    }
                }
            }
        }
    }
}

