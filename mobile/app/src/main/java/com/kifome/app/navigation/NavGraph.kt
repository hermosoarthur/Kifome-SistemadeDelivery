package com.kifome.app.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.kifome.app.core.datastore.UserPreferences
import com.kifome.app.ui.address.AddressPickerScreen
import com.kifome.app.ui.auth.LoginScreen
import com.kifome.app.ui.auth.OtpScreen
import com.kifome.app.ui.auth.RegistroScreen
import com.kifome.app.ui.home.HomeScreen

@Composable
fun KifomeNavGraph(userPreferences: UserPreferences) {
    val navController = rememberNavController()
    val startDestination by produceState<String?>(initialValue = null) {
        value = if (userPreferences.getTokenValue().isNullOrBlank()) Screen.Login.route else Screen.Home.route
    }

    val start = startDestination ?: return

    NavHost(navController = navController, startDestination = start) {
        composable(Screen.Login.route) {
            LoginScreen(
                onNavigateToOtp = { metodo, contato ->
                    navController.navigate(Screen.Otp.createRoute(metodo, contato))
                },
                onNavigateHome = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.Otp.route,
            arguments = listOf(
                navArgument("metodo") { type = NavType.StringType },
                navArgument("contato") { type = NavType.StringType }
            )
        ) { entry ->
            val metodo = entry.arguments?.getString("metodo") ?: "email"
            val contato = entry.arguments?.getString("contato") ?: ""
            OtpScreen(
                metodo = metodo,
                contato = contato,
                onBack = { navController.popBackStack() },
                onNavigateHome = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateRegistro = {
                    navController.navigate(Screen.Registro.createRoute(contato, metodo, ""))
                }
            )
        }

        composable(
            route = Screen.Registro.route,
            arguments = listOf(
                navArgument("contato") { type = NavType.StringType },
                navArgument("metodo") { type = NavType.StringType },
                navArgument("codigo") { type = NavType.StringType }
            )
        ) { entry ->
            RegistroScreen(
                contato = entry.arguments?.getString("contato") ?: "",
                metodo = entry.arguments?.getString("metodo") ?: "email",
                codigo = entry.arguments?.getString("codigo") ?: "",
                onNavigateHome = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Home.route) {
            HomeScreen(
                onAddressClick = { navController.navigate(Screen.AddressPicker.route) },
                onRestauranteClick = { }
            )
        }

        composable(Screen.AddressPicker.route) {
            AddressPickerScreen(
                onBack = { navController.popBackStack() },
                onConfirm = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.Placeholder.route,
            arguments = listOf(navArgument("tipo") { type = NavType.StringType })
        ) { entry ->
            androidx.compose.material3.Text("Em breve: área ${entry.arguments?.getString("tipo") ?: ""}")
        }
    }
}
