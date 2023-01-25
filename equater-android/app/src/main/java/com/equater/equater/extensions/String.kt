package com.equater.equater.extensions

import timber.log.Timber
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

fun String.toLocalDateTime(): LocalDateTime {
    val offsetDateTime = OffsetDateTime.parse(this, DateTimeFormatter.ISO_DATE_TIME)

    return offsetDateTime.toLocalDateTime()
}

// This assumes we're dealing with an iso 8601 string
fun String.toTimestamp(): Long {
    return this.toLocalDateTime().toEpochSecond(ZoneOffset.UTC)
}

fun String.possessive(isPlural: Boolean = false): String {
    try {
        if (last() == 's' || isPlural) {
            return "$this'"
        }

        return "$this's"
    } catch (e: Throwable) {
        Timber.e(e)
        return this
    }
}

fun String.emailPreview() = this.substring(0..2)

fun String.isInt() = try {
    Integer.parseInt(this)
    true
} catch (e: Throwable) {
    false
}

fun String.toCurrency() = (this.toDouble() * 100).toInt().toCurrency()

fun String.toCurrencyRepresentation(): Int {
    if (this.trim().isEmpty()) {
        throw NumberFormatException("String is not formatted as a valid currency representation")
    }

    if (this.contains(".")) {
        val split = this.split(".")

        // Only allow 2 decimal places
        if (split.size == 2 && split[1].length > 2) {
            throw NumberFormatException("String is not formatted as a valid currency representation")
        }
    }

    val currencyString = this.toCurrency().replace("$", "").replace(".", "")

    if (!currencyString.isInt()) {
        throw NumberFormatException("String is not formatted as a valid currency representation")
    }

    return currencyString.toInt()
}

fun String.isValidCurrencyRepresentation(): Boolean {
    return try {
        val currency = toCurrencyRepresentation()
        currency > 0
    } catch (e: NumberFormatException) {
        false
    }
}
