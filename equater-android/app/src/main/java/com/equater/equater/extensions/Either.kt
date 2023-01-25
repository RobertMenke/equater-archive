package com.equater.equater.extensions

import arrow.core.Either

fun <L, R>Either<L, R>.effectLeft(f: (L) -> Unit) {
    mapLeft {
        f(it)
        it
    }
}

fun <L, R>Either<L, R>.effectRight(f: (R) -> Unit) {
    map {
        f(it)
        it
    }
}
