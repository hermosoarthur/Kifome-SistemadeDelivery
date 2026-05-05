package com.kifome.app.ui.cliente

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.ui.theme.KifomeOrange
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CarrinhoScreen(
    onNavigateBack: () -> Unit,
    onPedidoCriado: (pedidoId: String) -> Unit,
    viewModel: CarrinhoViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val items by viewModel.items.collectAsState()
    val metodoPagamento by viewModel.metodoPagamento.collectAsState()
    val tipoEntrega by viewModel.tipoEntrega.collectAsState()
    val observacoes by viewModel.observacoes.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val formatter = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    val context = LocalContext.current

    LaunchedEffect(uiState) {
        when (val state = uiState) {
            is CarrinhoUiState.PedidoCriado -> {
                onPedidoCriado(state.pedido.id)
                viewModel.resetState()
            }
            is CarrinhoUiState.PagamentoOnline -> {
                // Abrir Mercado Pago via Chrome Custom Tabs
                abrirMercadoPago(context, state.initPoint)
                onPedidoCriado(state.pedido.id)
                viewModel.resetState()
            }
            is CarrinhoUiState.Error -> {
                snackbarHostState.showSnackbar(state.message)
                viewModel.resetState()
            }
            else -> Unit
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Meu Carrinho") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            if (items.isNotEmpty()) {
                Surface(shadowElevation = 12.dp) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        val subtotal = viewModel.getSubtotal()
                        val taxa = viewModel.getTaxaEntrega()
                        val total = viewModel.getTotal()
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Subtotal", style = MaterialTheme.typography.bodyMedium)
                            Text(formatter.format(subtotal), style = MaterialTheme.typography.bodyMedium)
                        }
                        Spacer(Modifier.height(4.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Taxa de entrega (${tipoEntrega.label.substringBefore("(")})", style = MaterialTheme.typography.bodyMedium)
                            Text(formatter.format(taxa), style = MaterialTheme.typography.bodyMedium)
                        }
                        Spacer(Modifier.height(8.dp))
                        HorizontalDivider()
                        Spacer(Modifier.height(8.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(
                                formatter.format(total),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = { viewModel.finalizarPedido() },
                            enabled = uiState !is CarrinhoUiState.Loading,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = KifomeOrange)
                        ) {
                            if (uiState is CarrinhoUiState.Loading) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                val iconPagamento = when (metodoPagamento) {
                                    MetodoPagamento.PIX -> "⚡"
                                    MetodoPagamento.CARTAO -> "💳"
                                    MetodoPagamento.DINHEIRO -> "💵"
                                    MetodoPagamento.MAQUININHA -> "🖥"
                                }
                                Text("$iconPagamento Finalizar Pedido • ${formatter.format(total)}", fontSize = 15.sp, color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (items.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("🛒", fontSize = 64.sp)
                    Text("Seu carrinho está vazio", style = MaterialTheme.typography.titleMedium)
                    Button(onClick = onNavigateBack, colors = ButtonDefaults.buttonColors(containerColor = KifomeOrange)) {
                        Text("Explorar restaurantes", color = Color.White)
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // ── Itens do carrinho ─────────────────────────────
                items(items, key = { it.produto.id }) { cartItem ->
                    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                        Row(
                            modifier = Modifier.padding(12.dp).fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(cartItem.produto.nome, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleSmall)
                                Text(
                                    formatter.format(cartItem.produto.preco),
                                    color = MaterialTheme.colorScheme.primary,
                                    style = MaterialTheme.typography.bodySmall
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Subtotal: ${formatter.format(cartItem.produto.preco * cartItem.quantidade)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                FilledIconButton(
                                    onClick = { viewModel.removeItem(cartItem.produto.id) },
                                    modifier = Modifier.size(32.dp),
                                    colors = IconButtonDefaults.filledIconButtonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                                ) {
                                    Icon(Icons.Default.Remove, "Remover", modifier = Modifier.size(14.dp))
                                }
                                Text(
                                    "${cartItem.quantidade}",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 12.dp)
                                )
                                FilledIconButton(
                                    onClick = { viewModel.addItem(cartItem.produto.id) },
                                    modifier = Modifier.size(32.dp),
                                    colors = IconButtonDefaults.filledIconButtonColors(containerColor = KifomeOrange)
                                ) {
                                    Icon(Icons.Default.Add, "Adicionar", modifier = Modifier.size(14.dp), tint = Color.White)
                                }
                            }
                        }
                    }
                }

                // ── Tipo de entrega ───────────────────────────────
                item {
                    Text("Tipo de entrega", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TipoEntrega.entries.forEach { tipo ->
                            val isSelected = tipoEntrega == tipo
                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { viewModel.setTipoEntrega(tipo) }
                                    .then(
                                        if (isSelected) Modifier.border(2.dp, KifomeOrange, RoundedCornerShape(12.dp))
                                        else Modifier
                                    ),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) KifomeOrange.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surface
                                )
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(tipo.label, style = MaterialTheme.typography.bodySmall, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal, color = if (isSelected) KifomeOrange else MaterialTheme.colorScheme.onSurface)
                                    Text(formatter.format(tipo.taxa), style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = if (isSelected) KifomeOrange else MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }
                }

                // ── Método de pagamento ───────────────────────────
                item {
                    Spacer(Modifier.height(4.dp))
                    Text("Método de pagamento", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        MetodoPagamento.entries.forEach { metodo ->
                            val isSelected = metodoPagamento == metodo
                            val emoji = when (metodo) {
                                MetodoPagamento.PIX -> "⚡ PIX"
                                MetodoPagamento.CARTAO -> "💳 Cartão no App (Mercado Pago)"
                                MetodoPagamento.DINHEIRO -> "💵 Dinheiro na Entrega"
                                MetodoPagamento.MAQUININHA -> "🖥 Maquininha na Entrega"
                            }
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { viewModel.setMetodoPagamento(metodo) }
                                    .then(
                                        if (isSelected) Modifier.border(2.dp, KifomeOrange, RoundedCornerShape(12.dp))
                                        else Modifier
                                    ),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) KifomeOrange.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surface
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    RadioButton(
                                        selected = isSelected,
                                        onClick = { viewModel.setMetodoPagamento(metodo) },
                                        colors = RadioButtonDefaults.colors(selectedColor = KifomeOrange)
                                    )
                                    Column {
                                        Text(emoji, style = MaterialTheme.typography.bodyMedium, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal, color = if (isSelected) KifomeOrange else MaterialTheme.colorScheme.onSurface)
                                        if (isSelected && (metodo == MetodoPagamento.PIX || metodo == MetodoPagamento.CARTAO)) {
                                            Text("Será redirecionado para o Mercado Pago", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // ── Observações ───────────────────────────────────
                item {
                    Spacer(Modifier.height(4.dp))
                    OutlinedTextField(
                        value = observacoes,
                        onValueChange = viewModel::setObservacoes,
                        label = { Text("Observações (opcional)") },
                        placeholder = { Text("Ex: sem cebola, ponto da carne...") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3,
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                item { Spacer(Modifier.height(8.dp)) }
            }
        }
    }
}

private fun abrirMercadoPago(context: Context, url: String) {
    runCatching<Unit> {
        val customTabsIntent = CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
        customTabsIntent.launchUrl(context, Uri.parse(url))
    }
}
