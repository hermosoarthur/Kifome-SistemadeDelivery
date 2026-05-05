package com.kifome.app.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.ui.components.KifomeButton
import com.kifome.app.ui.components.KifomeTextField

@Composable
fun RegistroScreen(
    contato: String,
    metodo: String,
    codigo: String,
    onNavigateHome: () -> Unit,
    viewModel: RegistroViewModel = hiltViewModel()
) {
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val navigateHome by viewModel.navigateHome.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var nome by remember { mutableStateOf("") }
    var tipo by remember { mutableStateOf("cliente") }
    var telefone by remember { mutableStateOf("") }
    var openTipoMenu by remember { mutableStateOf(false) }

    val tipos = listOf(
        "cliente" to "👤 Sou cliente",
        "restaurante" to "🍽️ Sou restaurante",
        "entregador" to "🚴 Sou entregador"
    )

    LaunchedEffect(error) {
        error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    LaunchedEffect(navigateHome) {
        if (navigateHome) {
            onNavigateHome()
            viewModel.consumeNavigateHome()
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            verticalArrangement = Arrangement.Top
        ) {
            Text("Criar conta", style = MaterialTheme.typography.headlineSmall)
            Spacer(modifier = Modifier.height(16.dp))

            KifomeTextField(
                value = nome,
                onValueChange = { nome = it },
                label = "Nome completo",
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedButton(onClick = { openTipoMenu = true }, modifier = Modifier.fillMaxWidth()) {
                Text(tipos.first { it.first == tipo }.second)
            }
            DropdownMenu(expanded = openTipoMenu, onDismissRequest = { openTipoMenu = false }) {
                tipos.forEach { (id, label) ->
                    DropdownMenuItem(
                        text = { Text(label) },
                        onClick = {
                            tipo = id
                            openTipoMenu = false
                        }
                    )
                }
            }

            if (metodo == "email") {
                Spacer(modifier = Modifier.height(12.dp))
                KifomeTextField(
                    value = telefone,
                    onValueChange = { telefone = it },
                    label = "Telefone",
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            KifomeButton(
                text = "Criar conta",
                enabled = !isLoading,
                onClick = {
                    viewModel.criarConta(
                        metodo = metodo,
                        contato = contato,
                        codigo = codigo,
                        nome = nome,
                        tipo = tipo,
                        telefone = telefone.ifBlank { null }
                    )
                }
            )
        }
    }
}

