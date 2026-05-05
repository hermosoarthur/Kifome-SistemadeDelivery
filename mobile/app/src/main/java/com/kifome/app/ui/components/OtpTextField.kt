package com.kifome.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.BasicTextField

@Composable
fun OtpTextField(
    value: String,
    onValueChange: (String) -> Unit,
    onComplete: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val focusRequesters = remember { List(6) { FocusRequester() } }
    val digits = remember(value) { (value.take(6) + "      ").take(6).toCharArray() }
    val boxes = remember { mutableStateListOf("", "", "", "", "", "") }

    LaunchedEffect(value) {
        value.take(6).forEachIndexed { index, c -> boxes[index] = c.toString() }
        for (i in value.length until 6) boxes[i] = ""
        if (value.length == 6) onComplete(value)
    }

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = modifier) {
        repeat(6) { index ->
            BasicTextField(
                value = boxes[index],
                onValueChange = { input ->
                    val cleaned = input.filter { it.isDigit() }
                    when {
                        cleaned.length >= 6 -> {
                            val pasted = cleaned.take(6)
                            onValueChange(pasted)
                        }
                        cleaned.isNotEmpty() -> {
                            val chars = value.toMutableList()
                            while (chars.size < 6) chars.add(' ')
                            chars[index] = cleaned.first()
                            val merged = chars.joinToString("").replace(" ", "")
                            onValueChange(merged)
                            if (index < 5) focusRequesters[index + 1].requestFocus()
                        }
                        else -> {
                            val newValue = buildString {
                                value.forEachIndexed { i, c -> if (i != index) append(c) }
                            }
                            onValueChange(newValue)
                        }
                    }
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                textStyle = MaterialTheme.typography.titleLarge.copy(
                    color = MaterialTheme.colorScheme.onSurface,
                    textAlign = TextAlign.Center,
                    fontSize = 22.sp
                ),
                modifier = Modifier
                    .size(48.dp, 56.dp)
                    .focusRequester(focusRequesters[index]),
                decorationBox = { inner ->
                    Box(
                        modifier = Modifier
                            .size(48.dp, 56.dp)
                            .background(
                                MaterialTheme.colorScheme.surfaceVariant,
                                RoundedCornerShape(12.dp)
                            )
                            .border(
                                width = 1.dp,
                                color = if (boxes[index].isNotEmpty()) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                                shape = RoundedCornerShape(12.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        if (boxes[index].isEmpty()) {
                            Text(" ")
                        }
                        inner()
                    }
                }
            )
        }
    }
}

