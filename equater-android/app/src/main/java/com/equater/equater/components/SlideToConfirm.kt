package com.equater.equater.components

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.VisibilityThreshold
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.Icon
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.min
import com.equater.equater.R
import com.equater.equater.extensions.asDp
import com.equater.equater.ui.redDecline
import com.equater.equater.ui.redSwipeToCancelLight
import timber.log.Timber
import kotlin.math.ceil

enum class SlideToConfirmResult {
    SUCCESS,
    FAILURE
}

private val defaultSliderWidth = 60.dp

@Composable
fun SlideToConfirm(
    slideInstructionText: String,
    feedbackText: String,
    completion: ((SlideToConfirmResult) -> Unit) -> Unit
) {
    val density = LocalDensity.current
    val haptic = LocalHapticFeedback.current
    var isLoading by remember { mutableStateOf(false) }
    var isCompleted by remember { mutableStateOf(false) }
    var isReturningToOriginalState by remember { mutableStateOf(false) }
    var sliderTargetValue by remember { mutableStateOf(defaultSliderWidth) }
    val sliderWidth = animateDpAsState(
        targetValue = sliderTargetValue,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioLowBouncy,
            stiffness = Spring.StiffnessLow,
            visibilityThreshold = Dp.VisibilityThreshold
        ),
        finishedListener = { isReturningToOriginalState = false }
    )
    // This is a bit of a hack to only animate when we're going back to the original state
    val sliderWidthValue = if (isReturningToOriginalState) sliderWidth.value else sliderTargetValue

    fun calculateCompletedTextOpacity(maxWidth: Dp): Float {
        if (isLoading) {
            return 1f
        }

        // Don't show the completed text if the slider is less than halfway complete
        val halfwayPoint = maxWidth / 2

        if (sliderWidth.value < halfwayPoint) {
            return 0f
        }

        val maxOpacity = 1f
        val targetOpacity = (sliderWidth.value - halfwayPoint) / halfwayPoint

        return kotlin.math.min(targetOpacity, maxOpacity)
    }

    fun handleCompletion(result: SlideToConfirmResult) {
        when (result) {
            SlideToConfirmResult.SUCCESS -> {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                isCompleted = true
                isLoading = false
            }
            SlideToConfirmResult.FAILURE -> {
                isLoading = false
                sliderTargetValue = defaultSliderWidth
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(90.dp)
            .padding(bottom = 20.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        // Box underneath the contains the instruction to slide
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(redSwipeToCancelLight()),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = slideInstructionText, style = MaterialTheme.typography.body1.copy(color = Color.White))
        }

        // This is the view that will slide as the user drags their finger from left to right
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(90.dp)
        ) {
            BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                val width = maxWidth

                Row(
                    modifier = Modifier
                        .shadow(elevation = 8.dp, shape = RoundedCornerShape(4.dp), clip = true)
                        .fillMaxHeight()
                        .width(sliderWidthValue)
                        .clip(RoundedCornerShape(4.dp))
                        .background(redDecline())
                        .draggable(
                            orientation = Orientation.Horizontal,
                            state = rememberDraggableState { delta ->
                                if (!isLoading) {
                                    val proposedWidth = sliderTargetValue + ceil(delta).asDp(density)
                                    sliderTargetValue = min(proposedWidth, width)
                                }
                            },
                            onDragStopped = { position ->
                                Timber.d("Velocity $position")
                                if (sliderTargetValue >= width) {
                                    isLoading = true
                                    completion(::handleCompletion)
                                } else {
                                    isReturningToOriginalState = true
                                    sliderTargetValue = defaultSliderWidth
                                }
                            }
                        )
                ) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            text = feedbackText,
                            style = MaterialTheme.typography.body1.copy(
                                color = Color.White.copy(
                                    alpha = calculateCompletedTextOpacity(width)
                                )
                            )
                        )
                        // Icon at the right end of the filled box
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(end = 16.dp),
                            contentAlignment = Alignment.CenterEnd
                        ) {
                            when {
                                isCompleted -> Icon(
                                    imageVector = Icons.Filled.Check,
                                    tint = Color.White,
                                    contentDescription = "Success"
                                )
                                isLoading -> {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        strokeWidth = 1.dp,
                                        modifier = Modifier.scale(0.8f)
                                    )
                                }
                                else -> ColorIcon(asset = painterResource(id = R.drawable.chevron_double_right))
                            }
                        }
                    }
                }
            }
        }
    }
}
