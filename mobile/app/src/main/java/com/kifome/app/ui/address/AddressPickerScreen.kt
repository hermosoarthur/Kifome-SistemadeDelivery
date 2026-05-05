package com.kifome.app.ui.address

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kifome.app.BuildConfig
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.maps.android.compose.CameraPositionState
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.kifome.app.ui.components.KifomeButton
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun AddressPickerScreen(
    onBack: () -> Unit,
    onConfirm: () -> Unit,
    viewModel: AddressViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val selectedAddress by viewModel.selectedAddress.collectAsState()
    val scope = rememberCoroutineScope()

    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<String>>(emptyList()) }
    var placeIdsByText by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var mapLoaded by remember { mutableStateOf(false) }
    var mapLoadError by remember { mutableStateOf<String?>(null) }

    if (BuildConfig.MAPS_API_KEY.isNotBlank() && !Places.isInitialized()) {
        Places.initialize(context.applicationContext, BuildConfig.MAPS_API_KEY)
    }
    val placesClient = remember {
        if (Places.isInitialized()) Places.createClient(context.applicationContext) else null
    }

    val defaultLatLng = selectedAddress?.let { LatLng(it.lat, it.lng) } ?: LatLng(-23.5505, -46.6333)
    val cameraPositionState: CameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(defaultLatLng, 16f)
    }

    LaunchedEffect(query) {
        if (query.length < 3) {
            results = emptyList()
            placeIdsByText = emptyMap()
            return@LaunchedEffect
        }

        val client = placesClient
        if (client == null) {
            mapLoadError = "Places não inicializado. Verifique MAPS_API_KEY."
            return@LaunchedEffect
        }

        val request = FindAutocompletePredictionsRequest.builder()
            .setQuery(query)
            .build()

        client.findAutocompletePredictions(request)
            .addOnSuccessListener { response ->
                val items = response.autocompletePredictions.take(5)
                results = items.map { it.getFullText(null).toString() }
                placeIdsByText = items.associate { it.getFullText(null).toString() to it.placeId }
            }
            .addOnFailureListener { e ->
                results = emptyList()
                placeIdsByText = emptyMap()
                mapLoadError = "Falha no autocomplete: ${e.localizedMessage ?: "erro"}"
            }
    }

    LaunchedEffect(Unit) {
        delay(5000)
        if (!mapLoaded && mapLoadError == null) {
            mapLoadError = "Mapa não carregou. Verifique a API key e as permissões no Google Cloud."
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
            }
            Text("Escolher endereço", style = MaterialTheme.typography.titleLarge)
        }

        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            placeholder = { Text("Buscar endereço...") }
        )

        LazyColumn(modifier = Modifier.fillMaxWidth().height(120.dp)) {
            items(results) { result ->
                Text(
                    text = "📍 $result",
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val placeId = placeIdsByText[result] ?: return@clickable
                            val request = FetchPlaceRequest.newInstance(
                                placeId,
                                listOf(Place.Field.LAT_LNG, Place.Field.ADDRESS)
                            )
                            placesClient?.fetchPlace(request)
                                ?.addOnSuccessListener { fetch ->
                                    val latLng = fetch.place.latLng
                                    if (latLng != null) {
                                        scope.launch {
                                            cameraPositionState.animate(
                                                CameraUpdateFactory.newLatLngZoom(latLng, 16f)
                                            )
                                        }
                                        viewModel.selecionarPeloAutoComplete(
                                            fetch.place.address ?: result,
                                            latLng
                                        )
                                    }
                                }
                                ?.addOnFailureListener { e ->
                                    mapLoadError = "Falha ao buscar local: ${e.localizedMessage ?: "erro"}"
                                }
                        }
                        .padding(vertical = 6.dp),
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        GoogleMap(
            modifier = Modifier.fillMaxWidth().height(300.dp),
            cameraPositionState = cameraPositionState,
            onMapLoaded = {
                mapLoaded = true
                cameraPositionState.move(CameraUpdateFactory.newLatLngZoom(defaultLatLng, 16f))
            }
        ) {
            Marker(state = MarkerState(position = cameraPositionState.position.target))
        }

        if (mapLoadError != null) {
            Text(
                text = mapLoadError ?: "",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
        }

        KifomeButton(
            text = "Usar ponto do mapa",
            onClick = { viewModel.selecionarPeloMapa(cameraPositionState.position.target, context) }
        )

        Text("Endereço selecionado:")
        Text(selectedAddress?.enderecoCompleto ?: "-", color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(modifier = Modifier.weight(1f))
        KifomeButton(
            text = "Confirmar endereço",
            onClick = {
                viewModel.salvarEndereco()
                onConfirm()
            }
        )
    }
}


