package com.kifome.app.ui.components

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kifome.app.ui.theme.KifomeBordas
import com.kifome.app.ui.theme.KifomePrimary
import com.kifome.app.ui.theme.KifomeSurface
import com.kifome.app.ui.theme.KifomeTextoClaro

@Composable
fun KifomeTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    singleLine: Boolean = true,
    enabled: Boolean = true,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    placeholder: String? = null
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = placeholder?.let { { Text(it) } },
        enabled = enabled,
        singleLine = singleLine,
        shape = RoundedCornerShape(16.dp),
        keyboardOptions = keyboardOptions,
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = KifomeSurface,
            unfocusedContainerColor = KifomeSurface,
            disabledContainerColor = KifomeSurface.copy(alpha = 0.6f),
            focusedBorderColor = KifomePrimary,
            unfocusedBorderColor = KifomeBordas,
            cursorColor = KifomePrimary,
            unfocusedPlaceholderColor = KifomeTextoClaro,
            focusedPlaceholderColor = KifomeTextoClaro,
        ),
        modifier = modifier
    )
}
