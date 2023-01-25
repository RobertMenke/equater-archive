package com.equater.equater.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.sp
import com.equater.equater.R

val appFontFamily = FontFamily(
    Font(resId = R.font.inter, weight = FontWeight.Normal, style = FontStyle.Normal),
    Font(resId = R.font.inter_medium, weight = FontWeight.Normal, style = FontStyle.Italic),
    Font(resId = R.font.inter_semi_bold, weight = FontWeight.Bold, style = FontStyle.Normal)
)

// Set of Material typography styles to start with
@Composable
fun makeTypography() = Typography(
    h1 = TextStyle(
        fontFamily = appFontFamily,
        fontWeight = FontWeight.Bold,
        color = if (isSystemInDarkTheme()) DarkTheme.textPrimary else LightTheme.textPrimary,
        fontSize = 36.sp
    ),
    h2 = TextStyle(
        fontFamily = appFontFamily,
        fontWeight = FontWeight.Bold,
        color = if (isSystemInDarkTheme()) DarkTheme.textPrimary else LightTheme.textPrimary,
        fontSize = 32.sp
    ),
    h3 = TextStyle(
        fontFamily = appFontFamily,
        fontWeight = FontWeight.Bold,
        color = if (isSystemInDarkTheme()) DarkTheme.textPrimary else LightTheme.textPrimary,
        fontSize = 28.sp,
        lineHeight = 34.sp
    ),
    h4 = TextStyle(
        fontFamily = appFontFamily,
        fontWeight = FontWeight.Bold,
        color = if (isSystemInDarkTheme()) DarkTheme.textPrimary else LightTheme.textPrimary,
        fontSize = 24.sp
    ),
    body1 = TextStyle(
        fontFamily = appFontFamily,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        color = if (isSystemInDarkTheme()) DarkTheme.textPrimary else LightTheme.textPrimary
    ),
    body2 = TextStyle(
        fontFamily = appFontFamily,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        color = if (isSystemInDarkTheme()) DarkTheme.textSecondary else LightTheme.textSecondary
    )
    /* Other default text styles to override
    button = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.W500,
        fontSize = 14.sp
    ),
    caption = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp
    )
    */
)

@Composable
fun textPrimaryColor() = if (isSystemInDarkTheme()) DarkTheme.textPrimary else LightTheme.textPrimary

@Composable
fun textSecondaryColor() = if (isSystemInDarkTheme()) DarkTheme.textSecondary else LightTheme.textSecondary

fun emailKeyboard() = KeyboardOptions(
    capitalization = KeyboardCapitalization.None,
    autoCorrect = false,
    keyboardType = KeyboardType.Email,
    imeAction = ImeAction.Next
)

fun passwordKeyboard() = KeyboardOptions(
    capitalization = KeyboardCapitalization.None,
    autoCorrect = false,
    keyboardType = KeyboardType.Password,
    imeAction = ImeAction.Go
)
