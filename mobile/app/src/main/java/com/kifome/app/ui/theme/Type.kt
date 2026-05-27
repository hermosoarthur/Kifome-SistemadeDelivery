package com.kifome.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val KifomeFontFamily = FontFamily.Default

val KifomeTypography = Typography(
    displayLarge   = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.Black,     fontSize = 44.sp, letterSpacing = (-0.88).sp, lineHeight = 48.sp),
    headlineLarge  = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 32.sp, letterSpacing = (-0.64).sp),
    headlineMedium = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, letterSpacing = (-0.44).sp),
    headlineSmall  = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.Bold,      fontSize = 18.sp, letterSpacing = (-0.36).sp),
    titleLarge     = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.Bold,      fontSize = 16.sp),
    titleMedium    = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.SemiBold,  fontSize = 15.sp),
    titleSmall     = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.SemiBold,  fontSize = 14.sp),
    bodyLarge      = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.Normal,    fontSize = 15.sp, lineHeight = 22.sp),
    bodyMedium     = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.Normal,    fontSize = 13.sp, lineHeight = 20.sp),
    bodySmall      = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.Normal,    fontSize = 12.sp),
    labelLarge     = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp),
    labelMedium    = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 0.04.sp),
    labelSmall     = TextStyle(fontFamily = KifomeFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 0.08.sp),
)