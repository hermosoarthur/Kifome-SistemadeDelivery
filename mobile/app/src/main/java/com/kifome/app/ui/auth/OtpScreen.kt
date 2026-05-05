package com.kifome.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.ui.components.KifomeButton
import com.kifome.app.ui.components.OtpTextField
import kotlinx.coroutines.delay

@Composable
fun OtpScreen(
    metodo: String,
    contato: String,
    onBack: () -> Unit,
    onNavigateHome: () -> Unit,
    onNavigateRegistro: () -> Unit,
    viewModel: OtpViewModel = hiltViewModel()
) {
    val code by viewModel.otpCode.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val navigateHome by viewModel.navigateHome.collectAsState()
    val navigateRegistro by viewModel.navigateRegistro.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var resendTimer by remember { mutableIntStateOf(60) }
    LaunchedEffect(Unit) {
        while (resendTimer > 0) {
            delay(1000)
            resendTimer--
        }
    }

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

    LaunchedEffect(navigateRegistro) {
        if (navigateRegistro) {
            onNavigateRegistro()
            viewModel.consumeNavigateRegistro()
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                verticalArrangement = Arrangement.Top
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                }
                Text("Código enviado", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    "Enviamos um código para $contato",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(24.dp))

                OtpTextField(
                    value = code,
                    onValueChange = viewModel::updateOtp,
                    onComplete = { completo -> viewModel.verificar(metodo, contato, completo) },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(20.dp))

                KifomeButton(
                    text = "Verificar",
                    enabled = code.length == 6 && !isLoading,
                    onClick = { viewModel.verificar(metodo, contato, code) }
                )

                TextButton(
                    onClick = { resendTimer = 60 },
                    enabled = resendTimer == 0,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                ) {
                    if (resendTimer == 0) {
                        Text("Reenviar código")
                    } else {
                        Text("Reenviar em ${resendTimer}s")
                    }
                }
            }

            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background.copy(alpha = 0.55f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Verificando...")
                }
            }
        }
    }
}
