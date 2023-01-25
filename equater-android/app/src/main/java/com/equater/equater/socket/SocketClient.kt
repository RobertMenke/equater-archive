package com.equater.equater.socket

import arrow.core.continuations.nullable
import com.equater.equater.BuildConfig
import com.equater.equater.authentication.User
import com.equater.equater.database.repository.AgreementRepository
import com.equater.equater.database.repository.TransactionRepository
import com.equater.equater.database.repository.UserRepository
import com.equater.equater.sharedExpenseCreation.SharedExpenseStory
import com.equater.equater.sharedExpenseCreation.TransactionStory
import com.fasterxml.jackson.databind.ObjectMapper
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.engineio.client.transports.WebSocket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

enum class SocketEvent(val event: String) {
    EmailConfirmed("EMAIL_CONFIRMED"),
    AgreementUpdated("AGREEMENT_UPDATED"),
    AgreementCreated("AGREEMENT_CREATED"),
    TransactionUpdated("TRANSACTION_UPDATED"),
    UserUpdated("USER_UPDATED");
}

class SocketClient @Inject constructor(
    private val userRepository: UserRepository,
    private val agreementRepository: AgreementRepository,
    private val transactionRepository: TransactionRepository,
    private val objectMapper: ObjectMapper
) {
    val scope = CoroutineScope(Job() + Dispatchers.IO)
    private var socket: Socket? = null

    fun listenForEvents(authToken: String) {
        val builder = IO.Options.builder()
            .setTransports(arrayOf(WebSocket.NAME))
            .setQuery("token=$authToken")
            .build()

        socket = IO.socket(BuildConfig.API_BASE, builder)
        socket?.connect()
        onEmailConfirmed()
        onAgreementUpdated()
        onAgreementCreated()
        onTransactionUpdated()
        onUserUpdated()
    }

    fun stopListening() {
        socket?.disconnect()
    }

    private fun onEmailConfirmed() {
        handleEvent<User>(SocketEvent.EmailConfirmed) { user ->
            scope.launch {
                val currentUser = userRepository.findAuthenticatedUser()
                val isAuthenticated = currentUser?.id == user.id
                userRepository.insertOrUpdateUser(user, isAuthenticated)
            }
        }
    }

    private fun onAgreementUpdated() {
        handleEvent<SharedExpenseStory>(SocketEvent.AgreementUpdated) { story ->
            scope.launch {
                val currentUser = userRepository.findAuthenticatedUser()
                if (currentUser != null) {
                    agreementRepository.insertAgreement(currentUser.id, story)
                }
            }
        }
    }

    private fun onAgreementCreated() {
        handleEvent<SharedExpenseStory>(SocketEvent.AgreementCreated) { story ->
            scope.launch {
                val agreement = agreementRepository.findAgreement(story.sharedExpense.id)

                if (agreement != null) {
                    return@launch
                }

                val currentUser = userRepository.findAuthenticatedUser()
                if (currentUser != null) {
                    agreementRepository.insertAgreement(currentUser.id, story)
                }
            }
        }
    }

    private fun onTransactionUpdated() {
        handleEvent<TransactionStory>(SocketEvent.TransactionUpdated) { story ->
            scope.launch {
                val currentUser = userRepository.findAuthenticatedUser()

                if (currentUser != null) {
                    transactionRepository.insertTransaction(currentUser.id, story)
                }
            }
        }
    }

    private fun onUserUpdated() {
        handleEvent<User>(SocketEvent.UserUpdated) { user ->
            scope.launch {
                val currentUser = userRepository.findAuthenticatedUser()
                val isAuthenticated = currentUser?.id == user.id
                userRepository.insertOrUpdateUser(user, isAuthenticated)
            }
        }
    }

    // We use jackson here because the server doesn't send spec-compliant JSON
    // which makes kotlin's serializers a pain to use
    private inline fun <reified T>handleEvent(socketEvent: SocketEvent, crossinline f: (T) -> Unit) {
        socket?.on(socketEvent.event) { socketData ->
            nullable.eager<Unit> {
                try {
                    val message = (socketData[0] as? String).bind()
                    val response = objectMapper.readValue(message, T::class.java)
                    f(response)
                } catch (e: Throwable) {
                    Timber.e(e)
                }
            }
        }
    }
}
