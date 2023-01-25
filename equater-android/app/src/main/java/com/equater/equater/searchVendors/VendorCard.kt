package com.equater.equater.searchVendors

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
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.equater.equater.components.PhotoAvatar
import com.equater.equater.profile.VendorLogo
import com.equater.equater.ui.backgroundSecondary

@Composable
fun VendorCard(vendor: Vendor, onSelected: (Vendor) -> Unit, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val image = remember { VendorLogo(context, vendor) }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(100.dp)
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundSecondary())
            .clickable { onSelected(vendor) }
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            PhotoAvatar(
                photo = image,
                modifier = Modifier.padding(horizontal = 16.dp),
                size = 60.dp
            )
            Column(
                modifier = Modifier
                    .fillMaxWidth(0.7f)
                    .fillMaxHeight(),
                verticalArrangement = Arrangement.Center
            ) {
                Text(vendor.friendlyName, style = MaterialTheme.typography.body1.copy(fontSize = 18.sp))
            }
        }
    }
}
