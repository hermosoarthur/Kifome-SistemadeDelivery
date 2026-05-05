package com.kifome.app.ui.auth

import android.app.Activity
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.ui.components.KifomeButton
import com.kifome.app.ui.components.KifomeTextField

@Composable
fun LoginScreen(
    onNavigateToOtp: (metodo: String, contato: String) -> Unit,
    onNavigateHome: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val selectedTab by viewModel.selectedTab.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val otpNavigation by viewModel.otpNavigation.collectAsState()
    val homeNavigation by viewModel.homeNavigation.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    var email by remember { mutableStateOf("") }
    var telefone by remember { mutableStateOf("") }

    LaunchedEffect(error) {
        error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    LaunchedEffect(otpNavigation) {
        otpNavigation?.let { (metodo, contato) ->
            onNavigateToOtp(metodo, contato)
            viewModel.consumeOtpNavigation()
        }
    }

    LaunchedEffect(homeNavigation) {
        if (homeNavigation) {
            onNavigateHome()
            viewModel.consumeHomeNavigation()
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("🍔", fontSize = 72.sp)
            Text(
                text = "Kifome",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Seu delivery favorito",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium
            )

            Spacer(modifier = Modifier.height(24.dp))

            PrimaryTabRow(selectedTabIndex = selectedTab) {
                Tab(selected = selectedTab == 0, onClick = { viewModel.selectTab(0) }, text = { Text("📧 E-mail") })
                Tab(selected = selectedTab == 1, onClick = { viewModel.selectTab(1) }, text = { Text("📱 SMS") })
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (selectedTab == 0) {
                KifomeTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = "Seu e-mail",
                    placeholder = "seu@email.com",
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading
                )
            } else {
                KifomeTextField(
                    value = telefone,
                    onValueChange = { telefone = it.filter(Char::isDigit).take(11) },
                    label = "Seu telefone",
                    placeholder = "(99) 9 9999-9999",
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            KifomeButton(
                text = "Continuar",
                enabled = !isLoading,
                onClick = {
                    if (selectedTab == 0) {
                        viewModel.requestOtp(email.trim(), "email")
                    } else {
                        viewModel.requestOtp(telefone.trim(), "sms")
                    }
                }
            )

            Spacer(modifier = Modifier.height(18.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Divider(modifier = Modifier.weight(1f))
                Text(" ou ", textAlign = TextAlign.Center)
                Divider(modifier = Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedButton(
                onClick = { viewModel.loginGoogle(context as Activity) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Entrar com Google")
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "É um restaurante? Entrar aqui",
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.clickable { }
            )
        }
    }
}
