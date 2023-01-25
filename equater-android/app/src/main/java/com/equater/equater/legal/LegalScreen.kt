package com.equater.equater.legal

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Divider
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImagePainter
import coil.compose.rememberAsyncImagePainter
import com.equater.equater.R
import com.equater.equater.navigation.Route
import com.equater.equater.ui.textPrimaryColor

@Composable fun LegalScreen(navController: NavController) {
    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp, vertical = 16.dp)) {
        LegalDocRow(
            navController = navController,
            title = "Privacy Policy",
            subtitle = "Our data usage policy",
            destination = Route.PrivacyPolicyStatic
        )

        Divider(color = textPrimaryColor().copy(alpha = 0.5f), modifier = Modifier.padding(vertical = 2.dp))

        LegalDocRow(
            navController = navController,
            title = "Terms of Service",
            subtitle = "Disclaimers & fair usage",
            destination = Route.TermsOfServiceStatic
        )
    }
}

@Composable
private fun LegalDocRow(navController: NavController, title: String, subtitle: String, destination: Route) {
    @Composable fun getRightArrowPainter(): AsyncImagePainter {
        val drawable = if (isSystemInDarkTheme()) {
            R.drawable.chevron_right_dark_mode
        } else {
            R.drawable.chevron_right_light_mode
        }

        return rememberAsyncImagePainter(drawable)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
            .clickable {
                navController.navigate(destination.route)
            },
        contentAlignment = Alignment.CenterStart
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .padding(start = 16.dp)
        ) {
            Column {
                Text(title, style = MaterialTheme.typography.body1.copy(fontSize = 18.sp))
                Text(
                    subtitle,
                    style = MaterialTheme.typography.body2.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                )
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .padding(end = 16.dp),
            contentAlignment = Alignment.CenterEnd
        ) {
            Image(painter = getRightArrowPainter(), contentDescription = "Right Arrow")
        }
    }
}
