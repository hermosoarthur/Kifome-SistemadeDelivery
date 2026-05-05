package com.kifome.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = KifomePrimary,
    onPrimary = KifomeOnPrimary,
    primaryContainer = KifomeSurface2,
    onPrimaryContainer = KifomeOnSurface,
    secondary = KifomePrimary,
    onSecondary = KifomeOnPrimary,
    background = KifomeBackground,
    onBackground = KifomeOnSurface,
    surface = KifomeSurface,
    onSurface = KifomeOnSurface,
    surfaceVariant = KifomeSurface2,
    onSurfaceVariant = KifomeMuted,
    error = KifomeError,
    outline = KifomeSurface2
)

@Composable
fun KifomeTheme(
    darkTheme: Boolean = true,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as android.app.Activity).window
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}