package com.kifome.app.ui.entregador

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ValidarEntregaScreen(
    onNavigateBack: () -> Unit,
    onEntregaValidada: () -> Unit,
    viewModel: ValidarEntregaViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val codigoGerado by viewModel.codigoGerado.collectAsState()
    var codigoDigitado by remember { mutableStateOf("") }

    LaunchedEffect(uiState) {
        if (uiState is ValidarEntregaUiState.Success) {
            onEntregaValidada()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Validar Entrega") },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 32.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("🔐", fontSize = 72.sp)
            Spacer(Modifier.height(16.dp))
            Text("Validar Entrega", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text(
                "Solicite ao cliente o código de confirmação de entrega",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )

            if (codigoGerado != null) {
                Spacer(Modifier.height(16.dp))
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                    Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Código do pedido:", style = MaterialTheme.typography.bodySmall)
                        Text(
                            codigoGerado!!,
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            letterSpacing = 8.sp
                        )
                    }
                }
            }

            Spacer(Modifier.height(32.dp))
            OutlinedTextField(
                value = codigoDigitado,
                onValueChange = { if (it.length <= 6) codigoDigitado = it },
                label = { Text("Código do cliente") },
                placeholder = { Text("000000") },
                singleLine = true,
                enabled = uiState !is ValidarEntregaUiState.Loading,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                textStyle = MaterialTheme.typography.headlineMedium.copy(textAlign = TextAlign.Center, letterSpacing = 8.sp),
                modifier = Modifier.fillMaxWidth()
            )

            if (uiState is ValidarEntregaUiState.Error) {
                Spacer(Modifier.height(8.dp))
                Text((uiState as ValidarEntregaUiState.Error).message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(Modifier.height(24.dp))
            Button(
                onClick = { viewModel.validar(codigoDigitado) },
                enabled = codigoDigitado.length == 6 && uiState !is ValidarEntregaUiState.Loading,
                modifier = Modifier.fillMaxWidth().height(52.dp)
            ) {
                if (uiState is ValidarEntregaUiState.Loading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                } else {
                    Text("Confirmar entrega", fontSize = 16.sp)
                }
            }
        }
    }
}

