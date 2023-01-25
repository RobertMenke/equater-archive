package com.equater.equater.searchVendors

import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.components.NotFound
import com.equater.equater.components.SearchBar
import com.equater.equater.sharedExpenseCreation.SharedBillSheetState
import com.equater.equater.sharedExpenseCreation.SharedBillViewModel
import com.equater.equater.ui.AppIcon
import com.equater.equater.ui.accentPrimaryForText

@OptIn(ExperimentalAnimationApi::class, ExperimentalComposeUiApi::class)
@Composable
fun VendorSearchView(
    onSelected: (Vendor?) -> Unit,
    viewModel: VendorSearchViewModel = hiltViewModel(),
    sharedBillViewModel: SharedBillViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val searchText by viewModel.searchQuery.collectAsState()
    val debouncedSearchText by viewModel.debouncedSearchQuery.collectAsState()
    val isSearching by viewModel.isSearching.collectAsState()
    val noResultsFound by viewModel.noResultsFound.collectAsState()
    val noGoogleMapsResultsFound by viewModel.noGoogleMapsResultsFound.collectAsState()
    val vendorSearchResults by viewModel.vendorSearchResults.collectAsState()
    val popularVendors by viewModel.popularVendors.collectAsState()
    val googlePlaces by viewModel.googlePlacesVendors.collectAsState()

    LaunchedEffect(debouncedSearchText) {
        viewModel.searchVendors(context, debouncedSearchText)
    }

    val vendors by derivedStateOf {
        val searchNotActive = debouncedSearchText.isEmpty() &&
            vendorSearchResults.isEmpty() &&
            !isSearching

        if (searchNotActive) {
            popularVendors
        } else {
            vendorSearchResults
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
                .height(52.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Select A Merchant", style = MaterialTheme.typography.h4)
            TextButton(onClick = { sharedBillViewModel.sheetState.value = SharedBillSheetState.Hidden }) {
                Text(
                    text = "Done",
                    style = MaterialTheme.typography.body1.copy(
                        color = accentPrimaryForText(),
                        fontWeight = FontWeight.Bold
                    )
                )
            }
        }

        SearchBar(
            searchText = searchText,
            placeholderText = "Search",
            onSearchTextChanged = { viewModel.searchQuery.value = it },
            onClearClick = { viewModel.searchQuery.value = "" },
            onNavigateBack = { onSelected(null) },
            isLoading = isSearching
        )

        when {
            isSearching -> {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(150.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator()
                }
            }
            noResultsFound && !noGoogleMapsResultsFound && googlePlaces.isEmpty() -> {
                GooglePlacesFallbackAction()
            }
            noGoogleMapsResultsFound -> {
                NotFound(text = "No merchants found", modifier = Modifier.padding(top = 8.dp))
            }
            noResultsFound -> {
                LazyColumn(modifier = Modifier.padding(top = 8.dp)) {
                    item("powered_by_google") {
                        Image(
                            painter = AppIcon.PoweredByGoogle.painterResource(),
                            contentDescription = "Powered by Google",
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    }
                    googlePlaces.forEach { place ->
                        item(place.placeId) {
                            GooglePlacesVendorCard(data = place, onSelected = onSelected)
                        }
                    }
                }
            }
            else -> {
                LazyColumn(modifier = Modifier.padding(top = 8.dp)) {
                    items(vendors.size, { index -> vendors[index].id }) { index ->
                        val vendor = vendors[index]
                        VendorCard(vendor, onSelected)
                    }
                }
            }
        }
    }
}
