package com.kifome.app.navigation

import android.net.Uri

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Otp : Screen("otp/{metodo}/{contato}") {
        fun createRoute(metodo: String, contato: String) = "otp/$metodo/${Uri.encode(contato)}"
    }

    object Registro : Screen("registro/{contato}/{metodo}/{codigo}") {
        fun createRoute(contato: String, metodo: String, codigo: String) =
            "registro/${Uri.encode(contato)}/$metodo/$codigo"
    }

    object Home : Screen("home")
    object AddressPicker : Screen("address_picker")
    object Placeholder : Screen("placeholder/{tipo}") {
        fun createRoute(tipo: String) = "placeholder/$tipo"
    }
}

