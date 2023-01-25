package com.equater.equater.components

import android.graphics.Bitmap
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.Icon
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.annotation.ExperimentalCoilApi
import coil.compose.AsyncImagePainter
import coil.compose.SubcomposeAsyncImage
import com.equater.equater.R
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.initials
import com.equater.equater.extensions.emailPreview
import com.equater.equater.profile.Avatar
import com.equater.equater.profile.LocalImage
import com.equater.equater.profile.Photo
import com.equater.equater.profile.ProfileViewModel
import com.equater.equater.sharedExpenseCreation.UserInvite
import com.equater.equater.sharedExpenseCreation.emailPreview
import com.equater.equater.ui.backgroundPrimary
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.textPrimaryColor

@Composable
fun AuthenticatedUserAvatar(
    profileViewModel: ProfileViewModel,
    authViewModel: AuthenticationViewModel,
    background: Color = backgroundPrimary(),
    size: Dp = 100.dp,
    onClick: (() -> Unit)? = null
) {
    val user by authViewModel.authenticatedUser.collectAsState()
    val avatar by profileViewModel.currentAvatarPhoto.collectAsState()

    if (user?.initials()?.isEmpty() != false) {
        UserSilhouetteAvatar(onClick = onClick)
        return
    }

    var modifier = Modifier
        .size(size)
        .clip(CircleShape)
        .background(background)
        .border(BorderStroke(1.dp, backgroundPrimary()), shape = CircleShape)

    onClick?.let { clickListener ->
        modifier = modifier.clickable(onClick = clickListener)
    }

    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        avatar?.let { bitmap ->
            Image(
                bitmap = bitmap.asImageBitmap(),
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(100.dp),
                contentDescription = "Avatar"
            )
        }

        if (avatar == null) {
            user?.let { user ->
                Text(text = user.initials(), style = MaterialTheme.typography.h4.copy(textAlign = TextAlign.Center))
            }
        }
    }
}

@ExperimentalCoilApi
@Composable
fun UserAvatar(
    photo: Avatar,
    modifier: Modifier = Modifier,
    background: Color = backgroundPrimary(),
    size: Dp = 70.dp,
    onClick: (() -> Unit)? = null
) {
    var boxModifier = modifier
        .size(size)
        .clip(CircleShape)
        .background(background)
        .border(BorderStroke(1.dp, backgroundPrimary()), shape = CircleShape)

    onClick?.let { clickListener ->
        boxModifier = modifier.clickable(onClick = clickListener)
    }

    Box(modifier = boxModifier, contentAlignment = Alignment.Center) {
        if (photo.user.preSignedPhotoDownloadUrl != null) {
            SubcomposeAsyncImage(
                model = photo.makeImageRequest(),
                contentDescription = "User Avatar"
            ) {
                val state = painter.state
                if (state is AsyncImagePainter.State.Loading || state is AsyncImagePainter.State.Error) {
                    val defaultPainter = photo.makeFallbackImagePainter()
                    Image(
                        painter = defaultPainter,
                        contentDescription = "User Avatar",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.size(size / 2)
                    )
                } else {
                    Image(
                        painter = painter,
                        contentDescription = "User Avatar",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.size(size)
                    )
                }
            }
        }

        if (photo.user.preSignedPhotoDownloadUrl == null) {
            Text(text = photo.user.initials(), style = MaterialTheme.typography.h4.copy(textAlign = TextAlign.Center))
        }
    }
}

@ExperimentalCoilApi
@Composable
fun UserInviteAvatar(
    invite: UserInvite,
    modifier: Modifier = Modifier,
    background: Color = backgroundPrimary(),
    size: Dp = 70.dp,
    onClick: ((UserInvite) -> Unit)? = null
) {
    var boxModifier = modifier
        .size(size)
        .clip(CircleShape)
        .background(background)
        .border(BorderStroke(1.dp, backgroundPrimary()), shape = CircleShape)

    onClick?.let { clickListener ->
        boxModifier = boxModifier.clickable(onClick = { clickListener(invite) })
    }

    Box(modifier = boxModifier, contentAlignment = Alignment.Center) {
        Text(text = invite.emailPreview(), style = MaterialTheme.typography.h4.copy(textAlign = TextAlign.Center))
    }
}

@ExperimentalCoilApi
@Composable
fun UserInviteAvatar(
    email: String,
    modifier: Modifier = Modifier,
    background: Color = backgroundPrimary(),
    size: Dp = 70.dp,
    onClick: ((String) -> Unit)? = null
) {
    var boxModifier = modifier
        .size(size)
        .clip(CircleShape)
        .background(background)
        .border(BorderStroke(1.dp, backgroundPrimary()), shape = CircleShape)

    onClick?.let { clickListener ->
        boxModifier = boxModifier.clickable(onClick = { clickListener(email) })
    }

    Box(modifier = boxModifier, contentAlignment = Alignment.Center) {
        Text(text = email.emailPreview(), style = MaterialTheme.typography.h4.copy(textAlign = TextAlign.Center))
    }
}

@Composable
fun ImageAvatar(bitmap: Bitmap, onClick: (() -> Unit)? = null) {
    var modifier = Modifier
        .size(70.dp)
        .clip(CircleShape)
        .background(backgroundSecondary())
        .border(BorderStroke(1.dp, backgroundPrimary()), shape = CircleShape)

    onClick?.let { clickListener ->
        modifier = modifier.clickable(onClick = clickListener)
    }

    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(70.dp),
            contentDescription = "Image Avatar"
        )
    }
}

@Composable
fun UserSilhouetteAvatar(onClick: (() -> Unit)? = null) {
    var modifier = Modifier
        .size(70.dp)
        .clip(CircleShape)
        .background(backgroundSecondary())
        .border(BorderStroke(1.dp, backgroundPrimary()), shape = CircleShape)

    onClick?.let { clickListener ->
        modifier = modifier.clickable(onClick = clickListener)
    }

    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        ColorIcon(asset = painterResource(id = R.drawable.user_profile), modifier = Modifier.height(50.dp))
        Icon(
            imageVector = Icons.Filled.Add,
            modifier = Modifier
                .offset(x = 14.dp, y = (-10).dp)
                .height(18.dp),
            tint = MaterialTheme.colors.primary,
            contentDescription = "Default User Avatar"
        )
    }
}

@Composable
fun PhotoAvatar(
    photo: Photo,
    modifier: Modifier = Modifier,
    background: Color = backgroundSecondary(),
    size: Dp = 70.dp,
    imageSize: Dp = 70.dp,
    clipShape: Shape = CircleShape,
    onClick: (() -> Unit)? = null
) {
    var boxModifier = modifier
        .size(size)
        .clip(clipShape)
        .background(background)
        .border(BorderStroke(1.dp, backgroundPrimary()), shape = CircleShape)

    onClick?.let { clickListener ->
        boxModifier = boxModifier.clickable(onClick = clickListener)
    }

    Box(modifier = boxModifier, contentAlignment = Alignment.Center) {
        SubcomposeAsyncImage(
            model = photo.makeImageRequest(),
            contentScale = ContentScale.Crop,
            contentDescription = "Image Avatar"
        ) {
            val state = painter.state
            val loadingOrError = state is AsyncImagePainter.State.Loading || state is AsyncImagePainter.State.Error
            if (loadingOrError && photo !is LocalImage) {
                val defaultPainter = photo.makeFallbackImagePainter()
                Image(
                    painter = defaultPainter,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.size(imageSize / 2),
                    contentDescription = "Image Avatar"
                )
            } else {
                Image(
                    painter = painter,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.size(imageSize),
                    contentDescription = "Image Avatar"
                )
            }
        }
    }
}

@Composable
fun BankAccountPhoto(
    photo: Photo,
    modifier: Modifier = Modifier,
    size: Dp = 70.dp
) {
    SubcomposeAsyncImage(
        model = photo.makeImageRequest(),
        contentScale = ContentScale.Crop,
        contentDescription = "Image Avatar",
        modifier = modifier
            .height(size)
            .background(Color.Transparent)
    ) {
        val state = painter.state
        val loadingOrError = state is AsyncImagePainter.State.Loading || state is AsyncImagePainter.State.Error
        if (loadingOrError && photo !is LocalImage) {
            val defaultPainter = photo.makeFallbackImagePainter()
            Box(modifier = Modifier.fillMaxHeight(), contentAlignment = Alignment.Center) {
                Box(modifier = Modifier.height(size.times(0.7f))) {
                    Image(
                        painter = defaultPainter,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.height(size.times(0.7f)),
                        contentDescription = "Image Avatar"
                    )
                }
            }
        } else {
            val accountImagePainter = painter
            Box(
                modifier = Modifier
                    .size(size)
                    .clip(CircleShape)
                    .border(BorderStroke(1.dp, backgroundPrimary()), shape = CircleShape)
            ) {
                Image(
                    painter = accountImagePainter,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(size)
                        .background(Color.Green),
                    contentDescription = "Image Avatar"
                )
            }
        }
    }
}

@Composable fun AvatarLoader(
    modifier: Modifier = Modifier,
    background: Color = backgroundSecondary(),
    size: Dp = 70.dp
) {
    val boxModifier = modifier
        .size(size)
        .clip(CircleShape)
        .background(background)

    Box(modifier = boxModifier, contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = textPrimaryColor(), strokeWidth = 1.dp, modifier = Modifier.scale(0.8f))
    }
}
