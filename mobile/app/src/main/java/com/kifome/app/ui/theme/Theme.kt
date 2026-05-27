package com.kifome.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary            = KifomePrimary,
    onPrimary          = KifomeOnPrimary,
    primaryContainer   = KifomePrimarySoft,
    onPrimaryContainer = KifomePrimaryDark,
    secondary          = KifomeSecundaria,
    onSecondary        = KifomeOnPrimary,
    secondaryContainer = KifomePrimarySoft,
    background         = KifomeFundo,
    onBackground       = KifomeTextoPrimario,
    surface            = KifomeSurface,
    onSurface          = KifomeTextoPrimario,
    surfaceVariant     = KifomeMuted,
    onSurfaceVariant   = KifomeTextoSecundario,
    outline            = KifomeBordas,
    error              = KifomeErro,
    onError            = KifomeOnPrimary,
)

@Composable
fun KifomeTheme(
    content: @Composable () -> Unit
) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as android.app.Activity).window
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
        }
    }
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography  = KifomeTypography,
        shapes      = KifomeShapes,
        content     = content
    )
}