package com.equater.equater.components.progressStepper

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.equater.equater.extensions.asFloat
import com.equater.equater.ui.accentPrimaryForText
import com.equater.equater.ui.backgroundPrimary

private val STEP_INDICATOR_DIAMETER = 24.dp
private val STEP_WIDTH = 52.dp

@Composable
fun ProgressStepper(
    currentStep: ProgressStepperDescriptor,
    onItemTapped: (ProgressStepperDescriptor) -> Unit
) {
    val allSteps = currentStep.getSteps()

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .padding(horizontal = 8.dp)
    ) {
        val width = maxWidth
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceEvenly,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .padding(vertical = 4.dp)
        ) {
            allSteps.forEachIndexed { index, progressStepperDescriptor ->
                Column(
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .width(STEP_WIDTH)
                        .padding(horizontal = 2.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .clickable { onItemTapped(progressStepperDescriptor) }
                ) {
                    Step(hasBeenVisited = progressStepperDescriptor.hasBeenVisited(currentStep))

                    Text(
                        text = progressStepperDescriptor.getTitle(),
                        style = MaterialTheme.typography.body2.copy(fontSize = 9.sp),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                if (index != allSteps.size - 1) {
                    val unitWidth = width / (currentStep.getSteps().size)
                    val itemWidth = STEP_WIDTH
                    val separatorWidth = unitWidth - itemWidth

                    Box(
                        modifier = Modifier
                            .padding(bottom = 12.dp)
                            .width(separatorWidth)
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(accentPrimaryForText())
                    )
                }
            }
        }
    }
}

@Composable private fun Step(hasBeenVisited: Boolean) {
    val rectangleBackground = backgroundPrimary()
    val rectHeight = 8.dp.asFloat()
    val halfRectHeight = rectHeight / 2
    val background by animateColorAsState(
        targetValue = if (hasBeenVisited) accentPrimaryForText() else backgroundPrimary(),
        animationSpec = tween(800, 0)
    )
    val rectangleOpacity by animateFloatAsState(
        targetValue = if (hasBeenVisited) 0f else 1f,
        animationSpec = tween(800, 0)
    )
    val rotationBase by animateFloatAsState(
        targetValue = if (hasBeenVisited) 90f else 0f,
        animationSpec = tween(800, 0)
    )

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(STEP_INDICATOR_DIAMETER)
            .wrapContentSize(Alignment.Center)
    ) {
        Box(
            modifier = Modifier
                .size(STEP_INDICATOR_DIAMETER)
                .clip(CircleShape)
                .background(background)
                .border(width = 4.dp, color = accentPrimaryForText(), shape = CircleShape)
        )

        Canvas(
            modifier = Modifier
                .size(STEP_INDICATOR_DIAMETER)
                .clip(CircleShape)
        ) {
            val canvasWidth = size.width
            val canvasHeight = size.height

            rotate(rotationBase + 45f) {
                drawRect(
                    color = rectangleBackground.copy(alpha = rectangleOpacity),
                    topLeft = Offset(x = 0f, y = (canvasHeight / 2F) - halfRectHeight),
                    size = Size(canvasWidth, rectHeight)
                )
            }

            rotate(rotationBase - 45f) {
                drawRect(
                    color = rectangleBackground.copy(alpha = rectangleOpacity),
                    topLeft = Offset(x = 0f, y = (canvasHeight / 2F) - halfRectHeight),
                    size = Size(canvasWidth, rectHeight)
                )
            }
        }
    }
}
