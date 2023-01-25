package com.equater.equater.ui

import androidx.annotation.DrawableRes
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource
import com.equater.equater.R
import com.equater.equater.components.ColorIcon

enum class AppIcon(@DrawableRes val lightTheme: Int, @DrawableRes val darkTheme: Int) {
    Create(R.drawable.ic_pen, R.drawable.ic_pen),
    BalanceScale(R.drawable.balance_scale, R.drawable.balance_scale),
    CreditCard(R.drawable.credit_card, R.drawable.credit_card),
    File(R.drawable.file, R.drawable.file),
    Logout(R.drawable.logout, R.drawable.logout),
    Phone(R.drawable.phone_dial, R.drawable.phone_dial),
    UserProfile(R.drawable.user_profile, R.drawable.user_profile),
    Settings(R.drawable.ic_user_settings_square_filled_24x24, R.drawable.ic_user_settings_square_filled_24x24),
    UserSuccessCircle(R.drawable.user_success_circle, R.drawable.user_success_circle),
    CancelCircle(R.drawable.cancel_circle, R.drawable.cancel_circle),
    CancelColorFilled(R.drawable.cancel_color_filled, R.drawable.cancel_color_filled),
    Camera(R.drawable.camera, R.drawable.camera),
    Mailbox(R.drawable.mailbox_light_mode, R.drawable.mailbox_dark_mode),
    CallDialPad(R.drawable.phone_dialpad_light_mode, R.drawable.phone_dialpad_dark_mode),
    Chat(R.drawable.chat_light_mode, R.drawable.chat_dark_mode),
    ShoppingBag(R.drawable.shopping_bag, R.drawable.shopping_bag),
    WalletIcon(R.drawable.wallet_icon_light_mode, R.drawable.wallet_icon_dark_mode),
    MoneyTransfer(R.drawable.money_transfer, R.drawable.money_transfer),
    PoweredByGoogle(R.drawable.powered_by_google_on_white, R.drawable.powered_by_google_on_non_white),
    Clock(R.drawable.clock_icon_white_clipped, R.drawable.clock_icon_white_clipped),
    Calendar(R.drawable.calendar_light_mode, R.drawable.calendar_dark_mode),
    CardSuccess(R.drawable.card_success, R.drawable.card_success),
    WalletGray(R.drawable.wallet_gray_light_mode, R.drawable.wallet_gray_dark_mode),
    DangerZone(R.drawable.ic_heartbeat_filled_24x24, R.drawable.ic_heartbeat_filled_24x24),
    Photo(R.drawable.users_photograph, R.drawable.users_photograph);

    @Composable fun getIcon(modifier: Modifier = Modifier, contentDescription: String = "Icon") {
        val icon = if (isSystemInDarkTheme()) darkTheme else lightTheme

        Icon(painterResource(id = icon), contentDescription = contentDescription, modifier = modifier)
    }

    @Composable fun getColorIcon(modifier: Modifier = Modifier) {
        val icon = if (isSystemInDarkTheme()) darkTheme else lightTheme

        ColorIcon(painterResource(id = icon), modifier = modifier)
    }

    @Composable fun painterResource(): Painter = painterResource(if (isSystemInDarkTheme()) darkTheme else lightTheme)
}
