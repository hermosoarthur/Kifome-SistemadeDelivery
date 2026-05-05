package com.kifome.app.ui.restaurante

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
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
fun RestauranteDashScreen(
    onNavigateToPedidos: () -> Unit,
    onNavigateToProdutos: () -> Unit,
    onNavigateToMeuRestaurante: () -> Unit,
    onLogout: () -> Unit,
    viewModel: RestauranteDashViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Painel do Restaurante") },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.Logout, "Sair")
                    }
                }
            )
        }
    ) { padding ->
        when (val state = uiState) {
            is RestauranteDashUiState.Loading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator()
                        Spacer(Modifier.height(8.dp))
                        Text("Conectando ao servidor... aguarde.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            is RestauranteDashUiState.Error -> {
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
            is RestauranteDashUiState.Success -> {
                val restaurante = state.restaurante
                val pedidos = state.pedidosHoje
                val faturamento = pedidos.filter { it.status == "entregue" }.sumOf { it.total }
                val pendentes = pedidos.count { it.status == "pendente" }

                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("🍽️ ${restaurante.nomeFantasia}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                Text(
                                    restaurante.status.uppercase(),
                                    color = if (restaurante.status == "aberto") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }

                    // Resumo do dia
                    item {
                        Text("Resumo do dia", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            DashCard(modifier = Modifier.weight(1f), title = "Pedidos", value = "${pedidos.size}", icon = "📦")
                            DashCard(modifier = Modifier.weight(1f), title = "Faturamento", value = "R$ ${"%.2f".format(faturamento)}", icon = "💰")
                        }
                        Spacer(Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            DashCard(modifier = Modifier.weight(1f), title = "Pendentes", value = "$pendentes", icon = "⏳")
                            DashCard(modifier = Modifier.weight(1f), title = "Entregues", value = "${pedidos.count { it.status == "entregue" }}", icon = "✅")
                        }
                    }

                    // Ações
                    item {
                        Text("Ações rápidas", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                    item {
                        DashActionButton("📋 Gerenciar Pedidos", "Ver e atualizar status dos pedidos", onClick = onNavigateToPedidos)
                    }
                    item {
                        DashActionButton("🍕 Gerenciar Produtos", "Adicionar, editar ou remover produtos", onClick = onNavigateToProdutos)
                    }
                    item {
                        DashActionButton("⚙️ Meu Restaurante", "Editar dados do restaurante", onClick = onNavigateToMeuRestaurante)
                    }
                }
            }
        }
    }
}

@Composable
private fun DashCard(modifier: Modifier, title: String, value: String, icon: String) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(icon, fontSize = 28.sp)
            Spacer(Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Text(title, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
        }
    }
}

@Composable
private fun DashActionButton(title: String, subtitle: String, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), onClick = onClick) {
        Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.SemiBold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            }
            Icon(Icons.Default.ChevronRight, null)
        }
    }
}

