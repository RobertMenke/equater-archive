package com.equater.equater.extensions

import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

fun LocalDateTime.formatMonthDayYear(): String {
    return format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"))
}

fun LocalDateTime.formatWithSlashes(): String {
    return format(DateTimeFormatter.ofPattern("MM/dd/yyyy"))
}

fun LocalDateTime.toIso8601(): String {
    return this.atOffset(ZoneOffset.UTC).format(DateTimeFormatter.ISO_DATE_TIME)
}
