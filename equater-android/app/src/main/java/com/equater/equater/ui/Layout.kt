package com.equater.equater.ui

import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp

val frameFillParent = Modifier.fillMaxHeight().fillMaxWidth()
fun Modifier.frameFillWidth(height: Dp) = fillMaxWidth().height(height)
fun Modifier.frameFillHeight(width: Dp) = fillMaxHeight().width(width)
