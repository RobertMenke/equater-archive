package com.equater.equater.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.equater.equater.ui.accentPrimary
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.textPrimary

@Composable fun RadioButtonCard(text: String, isSelected: Boolean, onSelected: () -> Unit) {
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) backgroundSecondary() else backgroundPrimary()
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(90.dp)
            .padding(vertical = 8.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundColor)
            .clickable { onSelected() }
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            RadioButtonCircle(
                isSelected = isSelected,
                onSelected = onSelected,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Text(text = text, style = MaterialTheme.typography.body1)
        }
    }
}

@Composable
fun RadioButtonCircle(
    isSelected: Boolean,
    onSelected: () -> Unit,
    modifier: Modifier = Modifier,
    outerCircleDiameter: Dp = 32.dp,
    innerCircleDiameter: Dp = 16.dp
) {
    val borderColor by animateColorAsState(targetValue = if (isSelected) accentPrimary() else textPrimary())
    val innerCircleColor by animateColorAsState(targetValue = if (isSelected) accentPrimary() else Color.Transparent)

    Box(modifier = modifier.clickable { onSelected() }, contentAlignment = Alignment.Center) {
        Box(
            modifier = Modifier
                .size(outerCircleDiameter)
                .clip(CircleShape)
                .background(Color.Transparent)
                .border(width = 2.dp, color = borderColor, shape = CircleShape)
        )

        Box(
            modifier = Modifier
                .size(innerCircleDiameter)
                .clip(CircleShape)
                .background(innerCircleColor)
        )
    }
}
