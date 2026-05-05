package com.kifome.app.ui.shared

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.ui.theme.KifomeOrange

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificacoesScreen(
    onNavigateBack: () -> Unit,
    viewModel: NotificacoesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val message by viewModel.message.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(message) {
        message?.let { snackbarHostState.showSnackbar(it); viewModel.clearMessage() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notificações") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar")
                    }
                },
                actions = {
                    val state = uiState
                    if (state is NotificacoesUiState.Success && state.notificacoes.any { !it.lida }) {
                        TextButton(onClick = { viewModel.marcarTodasLidas() }) {
                            Text("Marcar todas", color = KifomeOrange, style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when (val state = uiState) {
            is NotificacoesUiState.Loading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        CircularProgressIndicator(color = KifomeOrange)
                        Text("Carregando...", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            is NotificacoesUiState.Error -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("😕", fontSize = 48.sp)
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Button(onClick = { viewModel.carregar() }) { Text("Tentar novamente") }
                    }
                }
            }
            is NotificacoesUiState.Success -> {
                if (state.notificacoes.isEmpty()) {
                    Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("🔔", fontSize = 64.sp)
                            Text("Nenhuma notificação ainda", style = MaterialTheme.typography.titleMedium)
                            Text("Você será notificado sobre seus pedidos aqui", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f))
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(padding),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Não lidas primeiro
                        val naoLidas = state.notificacoes.filter { !it.lida }
                        val lidas = state.notificacoes.filter { it.lida }

                        if (naoLidas.isNotEmpty()) {
                            item {
                                Text(
                                    "Não lidas (${naoLidas.size})",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = KifomeOrange,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                            }
                            items(naoLidas, key = { it.id }) { notif ->
                                NotificacaoItem(
                                    titulo = notif.titulo,
                                    mensagem = notif.mensagem,
                                    createdAt = notif.createdAt,
                                    lida = false,
                                    onMarcarLida = { viewModel.marcarLida(notif) }
                                )
                            }
                        }

                        if (lidas.isNotEmpty()) {
                            item {
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Lidas",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                            }
                            items(lidas, key = { it.id }) { notif ->
                                NotificacaoItem(
                                    titulo = notif.titulo,
                                    mensagem = notif.mensagem,
                                    createdAt = notif.createdAt,
                                    lida = true,
                                    onMarcarLida = { }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificacaoItem(
    titulo: String,
    mensagem: String,
    createdAt: String?,
    lida: Boolean,
    onMarcarLida: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (lida)
                MaterialTheme.colorScheme.surface
            else
                KifomeOrange.copy(alpha = 0.08f)
        ),
        onClick = { if (!lida) onMarcarLida() }
    ) {
        Row(
            modifier = Modifier.padding(14.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Indicador de não lida
            if (!lida) {
                Surface(
                    shape = androidx.compose.foundation.shape.CircleShape,
                    color = KifomeOrange,
                    modifier = Modifier.size(8.dp).padding(top = 4.dp)
                ) {}
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    titulo,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = if (lida) FontWeight.Normal else FontWeight.Bold,
                    color = if (lida) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f) else MaterialTheme.colorScheme.onSurface
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    mensagem,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = if (lida) 0.5f else 0.75f)
                )
                if (createdAt != null) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        createdAt.take(16).replace("T", " "),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                    )
                }
            }
        }
    }
}

