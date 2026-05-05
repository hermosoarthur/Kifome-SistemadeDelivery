package com.kifome.app.ui.restaurante

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeuRestauranteScreen(
    onNavigateBack: () -> Unit,
    viewModel: MeuRestauranteViewModel = hiltViewModel()
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
                title = { Text("Meu Restaurante") },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when (val state = uiState) {
            is MeuRestauranteUiState.Loading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator()
                        Spacer(Modifier.height(8.dp))
                        Text("Conectando ao servidor... aguarde.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            is MeuRestauranteUiState.Error -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Text(state.message, color = MaterialTheme.colorScheme.error)
                }
            }
            is MeuRestauranteUiState.Success -> {
                val r = state.restaurante
                var nome by remember { mutableStateOf(r.nomeFantasia) }
                var descricao by remember { mutableStateOf(r.descricao ?: "") }
                var categoria by remember { mutableStateOf(r.categoria ?: "") }
                var status by remember { mutableStateOf(r.status) }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    OutlinedTextField(value = nome, onValueChange = { nome = it }, label = { Text("Nome fantasia") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = descricao, onValueChange = { descricao = it }, label = { Text("Descrição") }, modifier = Modifier.fillMaxWidth(), minLines = 3)
                    OutlinedTextField(value = categoria, onValueChange = { categoria = it }, label = { Text("Categoria") }, modifier = Modifier.fillMaxWidth())

                    Text("Status do restaurante", style = MaterialTheme.typography.titleSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("aberto", "fechado").forEach { s ->
                            FilterChip(selected = status == s, onClick = { status = s }, label = { Text(s.replaceFirstChar { it.uppercase() }) })
                        }
                    }

                    Button(
                        onClick = { viewModel.atualizar(nome, descricao, categoria, status) },
                        modifier = Modifier.fillMaxWidth().height(52.dp)
                    ) {
                        Text("Salvar alterações", fontSize = 16.sp)
                    }
                }
            }
        }
    }
}

