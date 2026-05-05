package com.kifome.app.ui.address

import android.content.Context
import android.location.Geocoder
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.maps.model.LatLng
import com.kifome.app.core.datastore.UserPreferences
import com.kifome.app.domain.model.EnderecoSelecionado
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale
import javax.inject.Inject

@HiltViewModel
class AddressViewModel @Inject constructor(
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _selectedAddress = MutableStateFlow<EnderecoSelecionado?>(null)
    val selectedAddress: StateFlow<EnderecoSelecionado?> = _selectedAddress.asStateFlow()

    init {
        viewModelScope.launch {
            userPreferences.getEndereco().collect { _selectedAddress.value = it }
        }
    }

    fun selecionarPeloMapa(latLng: LatLng, context: Context) {
        viewModelScope.launch {
            val geocoder = Geocoder(context, Locale("pt", "BR"))
            val endereco = withContext(Dispatchers.IO) {
                runCatching {
                    geocoder.getFromLocation(latLng.latitude, latLng.longitude, 1)?.firstOrNull()
                }.getOrNull()
            }

            if (endereco != null) {
                val selecionado = EnderecoSelecionado(
                    rua = endereco.thoroughfare.orEmpty(),
                    numero = endereco.subThoroughfare.orEmpty(),
                    bairro = endereco.subLocality.orEmpty(),
                    cidade = endereco.locality.orEmpty(),
                    estado = endereco.adminArea.orEmpty(),
                    cep = endereco.postalCode,
                    lat = latLng.latitude,
                    lng = latLng.longitude,
                    enderecoCompleto = endereco.getAddressLine(0).orEmpty()
                )
                _selectedAddress.value = selecionado
            }
        }
    }

    fun selecionarPeloAutoComplete(enderecoTexto: String, latLng: LatLng) {
        val selecionado = EnderecoSelecionado(
            rua = enderecoTexto,
            numero = "",
            bairro = "",
            cidade = "",
            estado = "",
            cep = null,
            lat = latLng.latitude,
            lng = latLng.longitude,
            enderecoCompleto = enderecoTexto
        )
        _selectedAddress.value = selecionado
    }

    fun salvarEndereco() {
        viewModelScope.launch {
            _selectedAddress.value?.let { userPreferences.saveEndereco(it) }
        }
    }
}


