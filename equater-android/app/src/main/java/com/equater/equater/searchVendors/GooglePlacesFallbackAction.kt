package com.equater.equater.searchVendors

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.R
import com.equater.equater.ui.frameFillWidth

@Composable
fun GooglePlacesFallbackAction(viewModel: VendorSearchViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val isLoading by viewModel.isSearchingGoogleMaps.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp)
    ) {
        Text(
            text = "Try Google Maps",
            style = MaterialTheme.typography.body1.copy(fontSize = 22.sp, fontWeight = FontWeight.ExtraBold),
            modifier = Modifier.padding(vertical = 12.dp)
        )
        Text(
            text = context.getString(R.string.place_not_found_description),
            style = MaterialTheme.typography.body1.copy(fontSize = 16.sp, lineHeight = 24.sp)
        )
        Button(
            modifier = Modifier
                .padding(top = 16.dp)
                .frameFillWidth(52.dp),
            onClick = { if (!isLoading) viewModel.searchGoogleMaps(context) }
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = Color.White, strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
            } else {
                Text(text = "Search Google Maps", style = MaterialTheme.typography.body1.copy(color = Color.White))
            }
        }
    }
}
