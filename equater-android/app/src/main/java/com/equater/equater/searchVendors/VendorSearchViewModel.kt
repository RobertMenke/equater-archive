package com.equater.equater.searchVendors

import android.content.Context
import android.widget.Toast
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.equater.equater.database.repository.VendorRepository
import com.google.android.libraries.places.api.model.AutocompletePrediction
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.model.TypeFilter
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsResponse
import com.google.android.libraries.places.api.net.PlacesClient
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class VendorSearchViewModel @Inject constructor(
    private val vendorRepository: VendorRepository,
    private val placesClient: PlacesClient
) : ViewModel() {
    // Search query should be updated, and debouncedSearchQuery should
    // be used to trigger new searches
    val searchQuery = MutableStateFlow("")

    @OptIn(FlowPreview::class)
    val debouncedSearchQuery = searchQuery
        .debounce(800L)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), "")

    val isSearching = MutableStateFlow(false)

    val isSearchingGoogleMaps = MutableStateFlow(false)

    // Exclusively gets search results from the server
    val vendorSearchResults = MutableStateFlow<List<Vendor>>(listOf())

    // Exclusively uses a local cache (room db) that is populated on login
    val popularVendors = vendorRepository
        .getPopularVendors()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), listOf())

    val noResultsFound = MutableStateFlow(false)

    val noGoogleMapsResultsFound = MutableStateFlow(false)

    val googlePlacesVendors = MutableStateFlow<List<AutocompletePrediction>>(listOf())

    suspend fun searchVendors(context: Context, query: String) {
        noResultsFound.value = false
        noGoogleMapsResultsFound.value = false
        googlePlacesVendors.value = listOf()

        if (query.isEmpty()) {
            vendorSearchResults.value = listOf()
            return
        }

        isSearching.value = true
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val vendors = vendorRepository.searchVendors(query)
                withContext(Dispatchers.Main) {
                    vendorSearchResults.value = vendors
                    noResultsFound.value = vendors.isEmpty()
                }
            } catch (e: Throwable) {
                Timber.e(e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Error searching merchants", Toast.LENGTH_LONG).show()
                    vendorSearchResults.value = listOf()
                }
            }

            withContext(Dispatchers.Main) {
                isSearching.value = false
            }
        }
    }

    // https://developers.google.com/maps/documentation/places/android-sdk/autocomplete#get_place_predictions
    fun searchGoogleMaps(context: Context) {
        isSearchingGoogleMaps.value = true
        val query = searchQuery.value
        // Create a new token for the autocomplete session. Pass this to FindAutocompletePredictionsRequest,
        // and once again when the user makes a selection (for example when calling fetchPlace()).
        val token = AutocompleteSessionToken.newInstance()
        // Use the builder to create a FindAutocompletePredictionsRequest.
        val request = FindAutocompletePredictionsRequest
            .builder()
            .setCountries("US")
            .setTypeFilter(TypeFilter.ESTABLISHMENT)
            .setSessionToken(token)
            .setQuery(query)
            .build()

        placesClient
            .findAutocompletePredictions(request)
            .addOnSuccessListener { response: FindAutocompletePredictionsResponse ->
                noGoogleMapsResultsFound.value = response.autocompletePredictions.isEmpty()
                googlePlacesVendors.value = response.autocompletePredictions
                isSearchingGoogleMaps.value = false
            }
            .addOnFailureListener { exception: Exception? ->
                Timber.e(exception)
                Toast.makeText(context, "No google maps results found", Toast.LENGTH_LONG).show()
                noGoogleMapsResultsFound.value = true
                isSearchingGoogleMaps.value = false
            }
    }

    fun createVendorFromGooglePlaceAsync(data: GooglePlacesPredictionItem) = viewModelScope.async(Dispatchers.IO) {
        vendorRepository.createVendorFromGooglePlace(data)
    }
}
