package com.equater.equater.linkBankAccount

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import com.equater.equater.R
import com.equater.equater.authentication.PlaidTokenType
import com.equater.equater.authentication.User
import com.equater.equater.authentication.UserAccount
import com.equater.equater.global.EnvironmentService
import com.plaid.link.OpenPlaidLink
import com.plaid.link.configuration.LinkTokenConfiguration
import com.plaid.link.result.LinkExit
import com.plaid.link.result.LinkSuccess
import kotlinx.coroutines.launch
import kotlinx.serialization.ExperimentalSerializationApi
import timber.log.Timber
import java.lang.IllegalStateException

@OptIn(ExperimentalSerializationApi::class)
@Composable
fun createPlaidLauncher(
    user: User,
    type: PlaidTokenType,
    onAccountLinked: suspend (UserAccount) -> Unit
): () -> Unit {
    val context = LocalContext.current
    val viewModel: PlaidViewModel = hiltViewModel()
    var plaidTokenConfig by remember { mutableStateOf<LinkTokenConfiguration?>(null) }
    val linkAccountHandler = rememberLauncherForActivityResult(OpenPlaidLink()) {
        when (it) {
            is LinkSuccess -> user.let { currentUser ->
                viewModel.handleLinkSuccess(it, currentUser, onComplete = { account, error ->
                    if (error != null) {
                        Timber.e(error)
                        Toast.makeText(
                            context,
                            "Error linking account. Contact ${EnvironmentService.getSupportPhoneNumber()}",
                            Toast.LENGTH_LONG
                        ).show()
                    }

                    if (account != null) {
                        onAccountLinked(account)
                    }
                })
            }
            is LinkExit -> {
                it.error?.let { linkError ->
                    Timber.e(linkError.toString())
                }

                if (it.error != null) {
                    Toast.makeText(
                        context,
                        "Error linking account. Contact ${EnvironmentService.getSupportPhoneNumber()}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    LaunchedEffect(type, user) {
        launch {
            user.let {
                plaidTokenConfig = viewModel.createTokenConfiguration(it, type)
            }
        }
    }

    return {
        val config = plaidTokenConfig
        if (config != null) {
            linkAccountHandler.launch(plaidTokenConfig)
        } else {
            Toast.makeText(
                context,
                context.getString(R.string.unable_to_link_account, EnvironmentService.getSupportPhoneNumber()),
                Toast.LENGTH_LONG
            ).show()
        }
    }
}

@OptIn(ExperimentalSerializationApi::class)
@Composable
fun createPlaidLauncher(
    account: UserAccount,
    onAccountLinked: suspend (UserAccount?) -> Unit
): () -> Unit {
    val token = account.getItemUpdateToken() ?: return {
        Timber.e("Account updated requested but no plaid token present.")
        throw IllegalStateException("Account updated requested but no plaid token present.")
    }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val viewModel: PlaidViewModel = hiltViewModel()
    var plaidTokenConfig by remember { mutableStateOf<LinkTokenConfiguration?>(null) }
    val linkAccountHandler = rememberLauncherForActivityResult(OpenPlaidLink()) { result ->
        when (result) {
            is LinkSuccess -> {
                viewModel.handleAccountUpdate(account) { account, error ->
                    if (account != null) {
                        onAccountLinked(account)
                        Toast.makeText(context, "Successfully updated account", Toast.LENGTH_SHORT).show()
                    } else {
                        onAccountLinked(null)
                        Toast.makeText(context, "Failed to update account", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            is LinkExit -> {
                result.error?.let { linkError ->
                    Timber.e(linkError.toString())
                }
                Toast.makeText(
                    context,
                    "Error linking account. Contact ${EnvironmentService.getSupportPhoneNumber()}",
                    Toast.LENGTH_LONG
                ).show()
                scope.launch { onAccountLinked(null) }
            }
        }
    }

    LaunchedEffect(true) {
        plaidTokenConfig = viewModel.createTokenConfiguration(token.plaidLinkToken)
    }

    return {
        val config = plaidTokenConfig
        if (config != null) {
            linkAccountHandler.launch(plaidTokenConfig)
        } else {
            Toast.makeText(
                context,
                context.getString(R.string.unable_to_link_account, EnvironmentService.getSupportPhoneNumber()),
                Toast.LENGTH_LONG
            ).show()
        }
    }
}
