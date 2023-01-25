package com.equater.equater.extensions

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import java.text.NumberFormat

/**
 * This function expects currency to be stored in whole numbers.
 * For example, 137 -> $1.37
 */
fun Int.toCurrency(): String {
    var decimal = this.toBigDecimal()
    decimal = decimal.divide(100.toBigDecimal())
    val format: NumberFormat = NumberFormat.getCurrencyInstance()
    format.maximumFractionDigits = 2
    format.currency = java.util.Currency.getInstance("USD")

    // TODO: This could be a source of edge cases. Doubles are not ideal for currency.
    return format.format(decimal.toDouble())
}

@Composable
fun Dp.asFloat(): Float = with(LocalDensity.current) { toPx() }
fun Dp.asFloat(density: Density): Float = with(density) { toPx() }

@Composable
fun Dp.toPx(): Float = asFloat()

@Composable
fun Float.asDp(): Dp = with(LocalDensity.current) { toDp() }
fun Float.asDp(density: Density): Dp = with(density) { toDp() }

@Composable fun Float.toSp() = with(LocalDensity.current) { toSp() }
fun Float.toSp(density: Density) = with(density) { toSp() }
