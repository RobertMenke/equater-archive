package com.equater.equater.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.Divider
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.equater.equater.ui.textPrimaryColor

@Composable fun Fraction(numerator: Int, denominator: Int) {
    Column(modifier = Modifier.width(16.dp).height(52.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "$numerator", style = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.Bold))
        Divider(color = textPrimaryColor(), thickness = 2.dp, modifier = Modifier.padding(vertical = 2.dp))
        Text(text = "$denominator", style = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.Bold))
    }
}
