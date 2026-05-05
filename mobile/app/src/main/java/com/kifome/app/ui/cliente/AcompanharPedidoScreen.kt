package com.kifome.app.ui.cliente

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.ui.theme.KifomeError
import com.kifome.app.ui.theme.KifomeOrange
import com.kifome.app.ui.theme.KifomeSuccess
import com.kifome.app.ui.theme.KifomeWarning

// ── Status pipeline completo da API ──
private val PASSOS = listOf(
    "pendente"     to "⏳ Aguardando confirmação",
    "confirmado"   to "✅ Confirmado pelo restaurante",
    "preparando"   to "👨‍🍳 Em preparação",
    "pronto"       to "✔️ Pronto para retirada",
    "em_entrega"   to "🛵 Saiu para entrega",
    "entregue"     to "🎉 Entregue!"
)

private fun statusColor(status: String) = when (status) {
    "pendente"   -> KifomeWarning
    "confirmado" -> Color(0xFF3B82F6)
    "preparando" -> KifomeOrange
    "pronto"     -> Color(0xFF84CC16)
    "em_entrega" -> Color(0xFF8B5CF6)
    "entregue"   -> KifomeSuccess
    "cancelado"  -> KifomeError
    else         -> Color(0xFF6B7280)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AcompanharPedidoScreen(
    onNavigateBack: () -> Unit,
    viewModel: AcompanharPedidoViewModel = hiltViewModel()
) {
    val pedido by viewModel.pedido.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val codigoEntrega by viewModel.codigoEntrega.collectAsState()
    val message by viewModel.message.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showAvaliacaoDialog by remember { mutableStateOf(false) }
    var notaAvaliacao by remember { mutableIntStateOf(5) }
    var comentarioAvaliacao by remember { mutableStateOf("") }

    LaunchedEffect(message) {
        message?.let { snackbarHostState.showSnackbar(it); viewModel.clearMessage() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Acompanhar Pedido") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            isLoading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        Text("Conectando ao servidor...", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f))
                    }
                }
            }
            error != null && pedido == null -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("😕", fontSize = 48.sp)
                        Text(error ?: "Erro desconhecido", color = MaterialTheme.colorScheme.error)
                    }
                }
            }
            pedido != null -> {
                val p = pedido!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // ── Status Card ────────────────────────────────
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = statusColor(p.status).copy(alpha = 0.12f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                "Pedido #${p.id.take(8).uppercase()}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Surface(
                                    shape = RoundedCornerShape(50),
                                    color = statusColor(p.status).copy(alpha = 0.2f)
                                ) {
                                    Text(
                                        p.status.uppercase().replace("_", " "),
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelMedium,
                                        color = statusColor(p.status),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                if (p.restauranteNome != null) {
                                    Text("• ${p.restauranteNome}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                }
                            }
                        }
                    }

                    // ── Código de entrega ──────────────────────────
                    if (codigoEntrega != null) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f))
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp).fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("🔑 Código de Entrega", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = codigoEntrega!!,
                                    style = MaterialTheme.typography.displaySmall,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = MaterialTheme.colorScheme.primary,
                                    letterSpacing = 8.sp,
                                    textAlign = TextAlign.Center
                                )
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    "Mostre este código ao entregador",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                        }
                    }

                    // ── Linha do Tempo ─────────────────────────────
                    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Linha do Tempo", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(12.dp))
                            if (p.status == "cancelado") {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Surface(shape = CircleShape, modifier = Modifier.size(12.dp), color = KifomeError) {}
                                    Text("❌ Pedido cancelado", style = MaterialTheme.typography.bodyMedium, color = KifomeError, fontWeight = FontWeight.Bold)
                                }
                            } else {
                                val statusIndex = PASSOS.indexOfFirst { it.first == p.status }
                                PASSOS.forEachIndexed { index, (_, label) ->
                                    val isCompleted = index <= statusIndex
                                    val isCurrent   = index == statusIndex
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Box(
                                            modifier = Modifier
                                                .size(12.dp)
                                                .background(
                                                    if (isCompleted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                                    CircleShape
                                                )
                                        )
                                        Text(
                                            label,
                                            style = if (isCurrent) MaterialTheme.typography.bodyMedium else MaterialTheme.typography.bodySmall,
                                            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                                            color = if (isCompleted)
                                                if (isCurrent) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                                            else
                                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.35f)
                                        )
                                    }
                                    if (index < PASSOS.size - 1) {
                                        Box(
                                            modifier = Modifier
                                                .padding(start = 5.dp)
                                                .width(2.dp)
                                                .height(18.dp)
                                                .background(
                                                    if (index < statusIndex)
                                                        MaterialTheme.colorScheme.primary
                                                    else
                                                        MaterialTheme.colorScheme.surfaceVariant
                                                )
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // ── Itens do pedido ────────────────────────────
                    if (!p.itens.isNullOrEmpty()) {
                        Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Itens do pedido", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.height(8.dp))
                                p.itens.forEach { item ->
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("${item.quantidade}x ${item.nome ?: item.produtoId}", style = MaterialTheme.typography.bodySmall)
                                        Text("R$ ${"%.2f".format(item.precoUnit * item.quantidade)}", style = MaterialTheme.typography.bodySmall)
                                    }
                                    Spacer(Modifier.height(2.dp))
                                }
                                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Total", fontWeight = FontWeight.Bold)
                                    Text("R$ ${"%.2f".format(p.total)}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }

                    // ── Ações ──────────────────────────────────────
                    when (p.status) {
                        "em_entrega" -> {
                            Button(
                                onClick = { viewModel.confirmarRecebimento() },
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = KifomeSuccess)
                            ) {
                                Text("✅ Confirmar Recebimento", color = Color.White)
                            }
                        }
                        "entregue" -> {
                            Button(
                                onClick = { showAvaliacaoDialog = true },
                                modifier = Modifier.fillMaxWidth().height(50.dp)
                            ) {
                                Text("⭐ Avaliar pedido")
                            }
                        }
                    }

                    // Botão simular (apenas p/ testes)
                    if (p.status != "entregue" && p.status != "cancelado") {
                        OutlinedButton(
                            onClick = { viewModel.simularPasso() },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("▶️ Simular próximo passo")
                        }
                    }
                }
            }
        }
    }

    // ── Diálogo de avaliação ──
    if (showAvaliacaoDialog) {
        AlertDialog(
            onDismissRequest = { showAvaliacaoDialog = false },
            title = { Text("Avaliar pedido") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Nota: $notaAvaliacao/5 ⭐")
                    Slider(
                        value = notaAvaliacao.toFloat(),
                        onValueChange = { notaAvaliacao = it.toInt() },
                        valueRange = 1f..5f,
                        steps = 3,
                        colors = SliderDefaults.colors(thumbColor = KifomeOrange, activeTrackColor = KifomeOrange)
                    )
                    OutlinedTextField(
                        value = comentarioAvaliacao,
                        onValueChange = { comentarioAvaliacao = it },
                        label = { Text("Comentário (opcional)") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.avaliar(notaAvaliacao, comentarioAvaliacao)
                        showAvaliacaoDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = KifomeOrange)
                ) { Text("Enviar", color = Color.White) }
            },
            dismissButton = {
                TextButton(onClick = { showAvaliacaoDialog = false }) { Text("Cancelar") }
            }
        )
    }
}
