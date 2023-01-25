package com.equater.equater.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material.darkColors
import androidx.compose.material.lightColors
import androidx.compose.runtime.Composable
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.drawscope.DrawScope

val Red200 = Color(0xfff297a2)
val Red300 = Color(0xffea6d7e)
val Red700 = Color(0xffdd0d3c)
val Red800 = Color(0xffd00036)
val Red900 = Color(0xffc20029)

// Note that the color scheme here is a hex representation of argb (2 extra digits than a standard hex representation of rgb)
interface ColorScheme {
    val backgroundPrimary: Color
    val backgroundSecondary: Color
    val textPrimary: Color
    val textSecondary: Color
    val accentPrimaryForText: Color
    val accentPrimary: Color
        get() = Color(0xff7A04EB)
    val accentLight: Color
        get() = Color(0xffE5CCFE)
    val accentDark: Color
        get() = Color(0xff6D04D6)
}

object DarkTheme : ColorScheme {
    override val backgroundPrimary = Color(0xff101213)
    override val backgroundSecondary = Color(0xff272b2f)
    override val textPrimary = Color(0xffbbc1c5)
    override val textSecondary = Color(0xffa1aaaf)
    override val accentPrimaryForText = Color(0xffA033FE)
}

object LightTheme : ColorScheme {
    override val backgroundPrimary = Color(0xfffafbfb)
    override val backgroundSecondary = Color(0xffE8ECF0)
    override val textPrimary = Color(0xff3B4246)
    override val textSecondary = Color(0xff616D72)
    override val accentPrimaryForText = Color(0xff7A04EB)
}

val lightColors = lightColors(
    primary = LightTheme.accentPrimary,
    primaryVariant = LightTheme.accentDark,
    secondary = LightTheme.accentPrimary,
    secondaryVariant = LightTheme.accentDark,
    background = LightTheme.backgroundPrimary,
    surface = LightTheme.backgroundPrimary,
    onBackground = LightTheme.textPrimary,
    onSurface = LightTheme.textPrimary,
    error = Red800
)

val darkColors = darkColors(
    primary = DarkTheme.accentPrimary,
    primaryVariant = DarkTheme.accentDark,
    secondary = DarkTheme.accentPrimary,
    background = DarkTheme.backgroundPrimary,
    surface = DarkTheme.backgroundPrimary,
    onBackground = DarkTheme.textPrimary,
    onSurface = DarkTheme.textPrimary,
    error = Red300
)

@Composable
fun backgroundSecondary() =
    if (isSystemInDarkTheme()) {
        DarkTheme.backgroundSecondary
    } else {
        LightTheme.backgroundSecondary
    }

@Composable
fun backgroundPrimary() =
    if (isSystemInDarkTheme()) {
        DarkTheme.backgroundPrimary
    } else {
        LightTheme.backgroundPrimary
    }

@Composable
fun textPrimary() =
    if (isSystemInDarkTheme()) {
        DarkTheme.textPrimary
    } else {
        LightTheme.textSecondary
    }

@Composable
fun accentPrimary() =
    if (isSystemInDarkTheme()) {
        DarkTheme.accentPrimary
    } else {
        LightTheme.accentPrimary
    }

@Composable
fun accentPrimaryForText() =
    if (isSystemInDarkTheme()) {
        DarkTheme.accentPrimary
    } else {
        LightTheme.accentPrimary
    }

@Composable
fun accentLight() =
    if (isSystemInDarkTheme()) {
        DarkTheme.accentLight
    } else {
        LightTheme.accentLight
    }

@Composable
fun accentDark() =
    if (isSystemInDarkTheme()) {
        DarkTheme.accentDark
    } else {
        LightTheme.accentDark
    }

@Composable
fun lightRedDecline() =
    if (isSystemInDarkTheme()) {
        Color(0xffEE6D5E)
    } else {
        redDecline()
    }

@Composable
fun lightGreenAccept() = if (isSystemInDarkTheme()) Color(0xff5DE678) else greenAccept()
fun greenAccept() = Color(0xff389E4F)
fun redDecline() = Color(0xffA93326)
fun redSwipeToCancelLight() = Color(0xffA0574F)

val fooGradient = Brush.radialGradient(
    0.0f to Color.Red,
    0.3f to Color.Green,
    1.0f to Color.Blue,
    center = Offset(0.5f, 0.5f),
    radius = 0.5f,
    tileMode = TileMode.Repeated
)

fun DrawScope.purpleCardGradient(): Brush {
    return Brush.radialGradient(
        0.5f to Color(185, green = 23, blue = 148),
        1.0f to Color(121, green = 36, blue = 203),
        center = Offset(center.x, center.y),
        radius = size.width / 2
    )
}
