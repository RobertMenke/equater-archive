package com.equater.equater.searchVendors

import android.text.style.LocaleSpan
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.R
import com.equater.equater.components.AvatarLoader
import com.equater.equater.components.PhotoAvatar
import com.equater.equater.profile.LocalImage
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.backgroundSecondary
import com.google.android.libraries.places.api.model.AutocompletePrediction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber

@Composable
fun GooglePlacesVendorCard(
    data: AutocompletePrediction,
    onSelected: (Vendor) -> Unit,
    viewModel: VendorSearchViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }
    val style = LocaleSpan(java.util.Locale.getDefault())
    val pinIcon = remember { LocalImage(context, R.drawable.map_pin) }

    fun createVendor() {
        isLoading = true
        scope.launch {
            try {
                val place = GooglePlacesPredictionItem.fromPrediction(data, style)
                val response = viewModel.createVendorFromGooglePlaceAsync(place).await()
                val vendor = response.body()

                if (vendor != null) {
                    onSelected(vendor)
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            context,
                            "Unable to select merchant. Try again or call support.",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            } catch (e: Throwable) {
                Timber.e(e)
                withContext(Dispatchers.Main) {
                    Toast
                        .makeText(
                            context,
                            "Unable to select merchant. Try again or call support.",
                            Toast.LENGTH_LONG
                        )
                        .show()
                }
            }

            isLoading = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundSecondary())
            .clickable {
                createVendor()
            }
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            if (isLoading) {
                AvatarLoader(
                    background = backgroundPrimary(),
                    size = 60.dp,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            } else {
                PhotoAvatar(
                    photo = pinIcon,
                    modifier = Modifier.padding(horizontal = 16.dp),
                    background = backgroundPrimary(),
                    size = 60.dp,
                    imageSize = 30.dp
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth(0.7f)
                    .fillMaxHeight(),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    data.getPrimaryText(style).toString(),
                    style = MaterialTheme.typography.body1.copy(fontSize = 18.sp)
                )
                Text(
                    data.getPrimaryText(style).toString(),
                    style = MaterialTheme.typography.body2.copy(fontSize = 12.sp)
                )
            }
        }
    }
}
