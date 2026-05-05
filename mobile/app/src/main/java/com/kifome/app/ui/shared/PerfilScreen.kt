package com.kifome.app.ui.shared

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PerfilScreen(
    onNavigateBack: () -> Unit,
    onLogout: () -> Unit,
    viewModel: PerfilViewModel = hiltViewModel()
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
                title = { Text("Meu Perfil") },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when (val state = uiState) {
            is PerfilUiState.Loading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator()
                        Spacer(Modifier.height(8.dp))
                        Text("Conectando ao servidor... aguarde.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            is PerfilUiState.Error -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Spacer(Modifier.height(16.dp))
                        Button(onClick = { viewModel.carregar() }) { Text("Tentar novamente") }
                    }
                }
            }
            is PerfilUiState.Success -> {
                val u = state.usuario
                val nomeSeguro = (u.nome as String?)?.takeIf { it.isNotBlank() } ?: "Usuário"
                val emailSeguro = (u.email as String?)?.takeIf { it.isNotBlank() } ?: "Email não informado"
                val tipoSeguro = (u.tipo as String?)?.takeIf { it.isNotBlank() } ?: "cliente"
                val inicialNome = nomeSeguro.firstOrNull()?.uppercase() ?: "U"

                var nome by remember { mutableStateOf(nomeSeguro) }
                var telefone by remember { mutableStateOf(u.telefone ?: "") }
                var endereco by remember { mutableStateOf(u.enderecoPrincipal ?: "") }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Avatar
                    Box(
                        modifier = Modifier
                            .size(96.dp)
                            .clip(CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        if (u.avatarUrl != null) {
                            AsyncImage(model = u.avatarUrl, contentDescription = "Avatar", contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                        } else {
                            Surface(color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.fillMaxSize()) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(inicialNome, style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(nomeSeguro, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text(emailSeguro, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = MaterialTheme.colorScheme.primaryContainer,
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        Text(
                            tipoSeguro.uppercase(),
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    Spacer(Modifier.height(24.dp))
                    HorizontalDivider()
                    Spacer(Modifier.height(16.dp))

                    OutlinedTextField(value = nome, onValueChange = { nome = it }, label = { Text("Nome") }, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(value = telefone, onValueChange = { telefone = it }, label = { Text("Telefone") }, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = { viewModel.atualizarPerfil(nome, telefone) },
                        modifier = Modifier.fillMaxWidth()
                    ) { Text("Salvar perfil") }

                    Spacer(Modifier.height(16.dp))
                    HorizontalDivider()
                    Spacer(Modifier.height(16.dp))

                    Text("Endereço de entrega", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(value = endereco, onValueChange = { endereco = it }, label = { Text("Endereço principal") }, modifier = Modifier.fillMaxWidth(), minLines = 2)
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = { viewModel.atualizarEndereco(endereco) },
                        modifier = Modifier.fillMaxWidth()
                    ) { Text("Salvar endereço") }

                    Spacer(Modifier.height(32.dp))
                    TextButton(
                        onClick = { viewModel.logout(onLogout) },
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) { Text("Sair da conta", fontSize = 16.sp) }
                }
            }
        }
    }
}

