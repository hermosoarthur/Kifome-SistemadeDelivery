package com.kifome.app.ui.cliente

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.ui.theme.KifomeBordas
import com.kifome.app.ui.theme.KifomePrimary
import com.kifome.app.ui.theme.KifomeTextoSecundario
import com.kifome.app.ui.theme.PillShape

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
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { padding ->
        when (val state = uiState) {
            is MeusPedidosUiState.Loading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = KifomePrimary, strokeWidth = 2.dp)
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
                                onClick = { onVerPedido(pedido.id) },
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                                border = BorderStroke(1.dp, KifomeBordas)
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
                                            color = KifomePrimary,
                                            fontWeight = FontWeight.Black,
                                            fontSize = 16.sp
                                        )
                                    }
                                    StatusBadge(status = pedido.status)
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
private fun StatusBadge(status: String) {
    val (bgColor, textColor) = when (status.lowercase()) {
        "entregue"               -> Color(0xFFD1FAE5) to Color(0xFF065F46)
        "preparando", "pendente" -> Color(0xFFFEF3C7) to Color(0xFFc20c0c)
        "cancelado"              -> Color(0xFFFEE2E2) to Color(0xFFc20c0c)
        "confirmado"             -> Color(0xFFDBEAFE) to Color(0xFF1E40AF)
        "em_entrega", "saiu"     -> Color(0xFFFFEDD5) to Color(0xFFc20c0c)
        else                     -> Color(0xFFF8FAFC) to KifomeTextoSecundario
    }
    val isOther = status.lowercase() !in listOf("entregue", "preparando", "pendente", "cancelado", "confirmado", "em_entrega", "saiu")
    Surface(
        shape = PillShape,
        color = bgColor,
        border = if (isOther) BorderStroke(1.dp, KifomeBordas) else null
    ) {
        Text(
            status.uppercase().replace("_", " "),
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            fontWeight = FontWeight.ExtraBold,
            fontSize = 11.sp
        )
    }
}
