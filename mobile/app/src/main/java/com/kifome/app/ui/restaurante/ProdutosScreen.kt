package com.kifome.app.ui.restaurante

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProdutosScreen(
    onNavigateBack: () -> Unit,
    viewModel: ProdutosViewModel = hiltViewModel()
) {
    val produtos by viewModel.produtos.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val message by viewModel.message.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showAddDialog by remember { mutableStateOf(false) }
    var nomeNovo by remember { mutableStateOf("") }
    var descNova by remember { mutableStateOf("") }
    var precoNovo by remember { mutableStateOf("") }
    var categoriaNova by remember { mutableStateOf("") }

    LaunchedEffect(message) {
        message?.let { snackbarHostState.showSnackbar(it); viewModel.clearMessage() }
    }

    val formatter = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Meus Produtos") },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } },
                actions = {
                    IconButton(onClick = { showAddDialog = true }) { Icon(Icons.Default.Add, "Adicionar produto") }
                }
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
        } else if (produtos.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🍕", fontSize = 48.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("Nenhum produto cadastrado")
                    Spacer(Modifier.height(16.dp))
                    Button(onClick = { showAddDialog = true }) { Text("Adicionar produto") }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(produtos, key = { it.id }) { produto ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.padding(12.dp).fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(produto.nome, fontWeight = FontWeight.SemiBold)
                                if (!produto.descricao.isNullOrBlank()) {
                                    Text(produto.descricao, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f), maxLines = 2)
                                }
                                Text(formatter.format(produto.preco), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Switch(
                                    checked = produto.disponivel,
                                    onCheckedChange = { viewModel.toggleDisponivel(produto) },
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                                IconButton(onClick = { viewModel.deletar(produto.id) }, modifier = Modifier.size(32.dp)) {
                                    Icon(Icons.Default.Delete, "Remover", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Novo produto") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = nomeNovo, onValueChange = { nomeNovo = it }, label = { Text("Nome*") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = descNova, onValueChange = { descNova = it }, label = { Text("Descrição") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = precoNovo, onValueChange = { precoNovo = it }, label = { Text("Preço (ex: 29.90)*") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = categoriaNova, onValueChange = { categoriaNova = it }, label = { Text("Categoria") }, modifier = Modifier.fillMaxWidth())
                }
            },
            confirmButton = {
                Button(onClick = {
                    val preco = precoNovo.replace(",", ".").toDoubleOrNull() ?: 0.0
                    if (nomeNovo.isNotBlank() && preco > 0) {
                        viewModel.criar(nomeNovo, descNova, preco, categoriaNova)
                        nomeNovo = ""; descNova = ""; precoNovo = ""; categoriaNova = ""
                        showAddDialog = false
                    }
                }) { Text("Salvar") }
            },
            dismissButton = { TextButton(onClick = { showAddDialog = false }) { Text("Cancelar") } }
        )
    }
}

