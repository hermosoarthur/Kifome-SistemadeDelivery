package com.kifome.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.kifome.app.domain.model.Restaurante
import com.kifome.app.ui.theme.KifomeBordas
import com.kifome.app.ui.theme.KifomePrimary
import com.kifome.app.ui.theme.KifomePrimarySoft
import com.kifome.app.ui.theme.KifomeSucesso
import com.kifome.app.ui.theme.KifomeSurface
import com.kifome.app.ui.theme.PillShape
import java.util.Locale

@Composable
fun RestaurantCard(
    restaurante: Restaurante,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = KifomeSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        border = BorderStroke(1.dp, KifomeBordas)
    ) {
        // Image with top rounded corners and rating badge overlay
        Box {
            AsyncImage(
                model = restaurante.imagemUrl,
                contentDescription = restaurante.nomeFantasia,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
            )
            // Rating badge overlay
            val rating = restaurante.avaliacaoMedia?.let { String.format(Locale.US, "%.1f", it) } ?: "Novo"
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(10.dp)
                    .background(color = Color.White, shape = PillShape)
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(text = "⭐ $rating", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1F2937))
            }
        }

        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = restaurante.nomeFantasia,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            // Delivery info
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "🕐 ${restaurante.tempoEstimado} min",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text("·", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    text = "Entrega",
                    style = MaterialTheme.typography.bodySmall,
                    color = KifomeSucesso,
                    fontWeight = FontWeight.SemiBold
                )
                val taxa = String.format(Locale.US, "%.2f", restaurante.taxaEntrega)
                Text(
                    text = "R$$taxa",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(Modifier.height(4.dp))

            // "Ver cardápio" button
            Button(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth().height(36.dp),
                shape = PillShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = KifomePrimarySoft,
                    contentColor = KifomePrimary
                ),
                elevation = null
            ) {
                Text("Ver cardápio", fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
    }
}
