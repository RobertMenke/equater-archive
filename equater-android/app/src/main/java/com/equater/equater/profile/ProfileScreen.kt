package com.equater.equater.profile

import android.Manifest
import android.graphics.Bitmap
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.Button
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.Icon
import androidx.compose.material.LocalTextStyle
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ModalBottomSheetLayout
import androidx.compose.material.ModalBottomSheetState
import androidx.compose.material.ModalBottomSheetValue
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.material.TextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import androidx.hilt.navigation.compose.hiltViewModel
import arrow.core.continuations.nullable
import com.equater.equater.authentication.AuthenticationViewModel
import com.equater.equater.authentication.User
import com.equater.equater.components.BottomDrawerBody
import com.equater.equater.components.EmptyBottomDrawer
import com.equater.equater.components.ImageAvatar
import com.equater.equater.components.MenuItem
import com.equater.equater.components.UserSilhouetteAvatar
import com.equater.equater.ui.AppIcon
import com.equater.equater.ui.Haptics
import com.equater.equater.ui.backgroundSecondary
import com.equater.equater.ui.frameFillHeight
import com.equater.equater.ui.frameFillParent
import com.equater.equater.ui.frameFillWidth
import com.equater.equater.ui.textPrimary
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import timber.log.Timber

@ExperimentalMaterialApi
@Composable
fun ProfileScreen(
    authViewModel: AuthenticationViewModel,
    showOnBoardingInstructions: Boolean = true,
    onSave: ((User) -> Unit)? = null
) {
    val sheetState = rememberModalBottomSheetState(initialValue = ModalBottomSheetValue.Hidden)
    val user by authViewModel.authenticatedUser.collectAsState()
    val profileViewModel: ProfileViewModel = hiltViewModel()

    LaunchedEffect(true) {
        user?.let(profileViewModel::setUser)
    }

    ModalBottomSheetLayout(
        sheetContent = { ActionSheet(authViewModel, sheetState) },
        sheetState = sheetState
    ) {
        Profile(sheetState, user, showOnBoardingInstructions, onSave)
    }
}

@ExperimentalMaterialApi
@Composable
fun ProfileScreenAuthenticated(
    authViewModel: AuthenticationViewModel,
    showOnBoardingInstructions: Boolean = true,
    onSave: ((User) -> Unit)? = null
) {
    val sheetState = rememberModalBottomSheetState(initialValue = ModalBottomSheetValue.Hidden)
    val user by authViewModel.authenticatedUser.collectAsState()
    val profileViewModel: ProfileViewModel = hiltViewModel()

    LaunchedEffect(true) {
        user?.let(profileViewModel::setUser)
    }

    ModalBottomSheetLayout(
        sheetContent = { ActionSheet(authViewModel, sheetState) },
        content = {
            Column {
                Profile(sheetState, user, showOnBoardingInstructions, onSave)
            }
        },
        sheetState = sheetState
    )
}

@ExperimentalMaterialApi
@Composable
private fun Profile(
    sheetState: ModalBottomSheetState,
    user: User?,
    showOnBoardingInstructions: Boolean = true,
    onSave: ((User) -> Unit)? = null
) {
    LazyColumn(modifier = frameFillParent) {
        // Contains the cover sheet and avatar
        item {
            ProfileHeader(sheetState)
            ProfileBody(user, showOnBoardingInstructions, onSave)
        }
    }
}

@ExperimentalMaterialApi
@Composable
private fun ProfileHeader(sheetState: ModalBottomSheetState) {
    Box(
        modifier = Modifier
            .background(backgroundSecondary())
            .fillMaxWidth()
    ) {
        CoverPhotoWrapper(sheetState)
        Avatar(sheetState)
    }
}

@ExperimentalMaterialApi
@Composable
fun CoverPhotoWrapper(sheetState: ModalBottomSheetState) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val viewModel: ProfileViewModel = hiltViewModel()
    val coverPhoto by viewModel.coverPhoto.collectAsState()
    val currentCoverPhoto by viewModel.currentCoverPhoto.collectAsState()

    Row(
        modifier = frameFillParent.height(140.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        when {
            coverPhoto != null -> {
                coverPhoto?.let { bitmap -> CoverPhoto(sheetState, bitmap) }
            }
            currentCoverPhoto != null -> {
                currentCoverPhoto?.let { bitmap -> CoverPhoto(sheetState, bitmap) }
            }
            else -> {
                TextButton(
                    onClick = {
                        viewModel.setIsSelectingCoverPhoto(true)
                        Haptics.TAP.play(context)
                        scope.launch {
                            sheetState.show()
                        }
                    }
                ) {
                    Icon(imageVector = Icons.Filled.Add, tint = textPrimary(), contentDescription = "Add Cover Photo")
                    Text(text = "Cover Photo")
                }
            }
        }
    }
}

@ExperimentalMaterialApi
@Composable
fun Avatar(sheetState: ModalBottomSheetState) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val viewModel: ProfileViewModel = hiltViewModel()
    val avatarPhoto by viewModel.avatarPhoto.collectAsState()
    val currentAvatarPhoto by viewModel.currentAvatarPhoto.collectAsState()
    val focusManager = LocalFocusManager.current

    fun selectAvatar() {
        focusManager.clearFocus(true)
        Haptics.TAP.play(context)
        viewModel.setIsSelectingCoverPhoto(false)
        scope.launch {
            sheetState.show()
        }
    }

    Column(
        modifier = Modifier
            .frameFillHeight(100.dp)
            .offset(y = 105.dp),
        verticalArrangement = Arrangement.Bottom,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        when {
            avatarPhoto != null -> {
                avatarPhoto?.let { bitmap ->
                    ImageAvatar(bitmap) {
                        selectAvatar()
                    }
                }
            }
            currentAvatarPhoto != null -> {
                currentAvatarPhoto?.let { bitmap ->
                    ImageAvatar(bitmap) {
                        selectAvatar()
                    }
                }
            }
            else -> UserSilhouetteAvatar { selectAvatar() }
        }
    }
}

@ExperimentalMaterialApi
@Composable
fun CoverPhoto(sheetState: ModalBottomSheetState, bitmap: Bitmap) {
    val scope = rememberCoroutineScope()
    val viewModel: ProfileViewModel = hiltViewModel()
    val focusManager = LocalFocusManager.current

    Image(
        bitmap = bitmap.asImageBitmap(),
        contentDescription = "Cover Photo",
        modifier = Modifier
            .fillMaxSize()
            .clickable(onClick = {
                viewModel.setIsSelectingCoverPhoto(true)
                focusManager.clearFocus(true)
                scope.launch {
                    sheetState.show()
                }
            }),
        contentScale = ContentScale.Crop
    )
}

@Composable
private fun ProfileBody(
    user: User?,
    showOnBoardingInstructions: Boolean = true,
    onSave: ((User) -> Unit)? = null
) {
    val context = LocalContext.current
    val viewModel: ProfileViewModel = hiltViewModel()
    var firstName by rememberSaveable { mutableStateOf(user?.firstName ?: "") }
    var lastName by rememberSaveable { mutableStateOf(user?.lastName ?: "") }
    val isLoading by viewModel.isLoading.collectAsState()
    val lastNameFocus = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current
    val save = {
        Haptics.TAP.play(context)
        if (firstName.trim().isEmpty() || lastName.trim().isEmpty()) {
            Toast.makeText(context, "First and last name are required", Toast.LENGTH_LONG).show()
        } else {
            viewModel.saveProfile(context, firstName, lastName) { user ->
                if (user == null) {
                    Toast.makeText(context, "Failed to updated profile", Toast.LENGTH_LONG).show()
                    return@saveProfile
                }

                onSave?.invoke(user)
            }
        }
    }

    // Contains the first/last name fields
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 50.dp)
    ) {
        Column(modifier = frameFillParent.padding(start = 16.dp, end = 16.dp)) {
            if (showOnBoardingInstructions) {
                Text(text = "Nice! You're signed up.", style = MaterialTheme.typography.h2)
                Text(
                    text = "Now, take a moment to fill out your profile.",
                    style = MaterialTheme.typography.body1
                )
                Spacer(modifier = Modifier.padding(top = 16.dp))
            }

            TextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text(text = "First Name") },
                textStyle = LocalTextStyle.current.copy(fontSize = 16.sp),
                placeholder = { Text(text = "What's your first name?") },
                modifier = Modifier.frameFillWidth(60.dp),
                keyboardOptions = KeyboardOptions.Default.copy(imeAction = ImeAction.Next),
                // backgroundColor = backgroundSecondary(),
                keyboardActions = KeyboardActions(onNext = { lastNameFocus.requestFocus() })
            )
            Text(
                text = "(required) Enter your first name",
                style = MaterialTheme.typography.body2.copy(fontSize = 12.sp)
            )

            Spacer(modifier = Modifier.padding(top = 16.dp))

            TextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text(text = "Last Name") },
                textStyle = LocalTextStyle.current.copy(fontSize = 16.sp),
                placeholder = { Text(text = "What's your last name?") },
                modifier = Modifier
                    .frameFillWidth(60.dp)
                    .focusRequester(lastNameFocus)
                    .navigationBarsPadding()
                    .imePadding(),
                keyboardOptions = KeyboardOptions.Default.copy(imeAction = ImeAction.Go),
                keyboardActions = KeyboardActions(onGo = {
                    focusManager.clearFocus(true)
                    save()
                })
            )
            Text(
                text = "(required) Enter your last name",
                style = MaterialTheme.typography.body2.copy(fontSize = 12.sp)
            )

            Spacer(modifier = Modifier.padding(top = 32.dp))

            Button(
                onClick = { if (!isLoading) save() },
                modifier = Modifier.frameFillWidth(60.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        color = Color.White,
                        strokeWidth = 1.dp
                    )
                } else {
                    Text(text = "Save", style = MaterialTheme.typography.body1.copy(color = Color.White))
                }
            }
        }
    }
}

@ExperimentalMaterialApi
@Composable
private fun ActionSheet(authViewModel: AuthenticationViewModel, state: ModalBottomSheetState) {
    val viewModel: ProfileViewModel = hiltViewModel()
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()
    // Returns if the authenticated user is not defined. Should never happen on a profile selection action sheet.
    val user = authenticatedUser
    if (user == null) {
        EmptyBottomDrawer()
        return
    }

    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val cameraLauncher = createTakePictureLauncher(authViewModel, state)
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isEnabled ->
        if (isEnabled) {
            val uri = if (viewModel.isSelectingCoverPhoto.value) {
                viewModel.makeCoverPhotoUri(context, user)
            } else {
                viewModel.makeAvatarUri(context, user)
            }
            cameraLauncher.launch(uri)
        } else {
            Toast.makeText(context, "Go to settings to enabled the camera permission", Toast.LENGTH_LONG).show()
        }
    }

    val imagePickerLauncher = createImagePickerLauncher(state)
    val choosePhotoLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isEnabled ->
        if (isEnabled) {
            imagePickerLauncher.launch("image/*")
        } else {
            Toast.makeText(context, "Go to settings to enabled media permissions", Toast.LENGTH_LONG).show()
        }
    }

    BottomDrawerBody {
        MenuItem(icon = AppIcon.Photo.painterResource(), text = "Choose Photo", action = {
            scope.launch {
                state.hide()
            }
            choosePhotoLauncher.launch(Manifest.permission.READ_EXTERNAL_STORAGE)
        })
        MenuItem(icon = AppIcon.Camera.painterResource(), text = "Take Picture", action = {
            scope.launch {
                state.hide()
            }
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        })
        MenuItem(icon = AppIcon.CancelCircle.painterResource(), text = "Cancel", action = {
            scope.launch {
                state.hide()
            }
        })
    }
}

@ExperimentalMaterialApi
@Composable
fun createTakePictureLauncher(
    authViewModel: AuthenticationViewModel,
    state: ModalBottomSheetState
): ActivityResultLauncher<Uri> {
    val viewModel: ProfileViewModel = hiltViewModel()
    val authenticatedUser by authViewModel.authenticatedUser.collectAsState()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    return rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        Timber.d("Did succeed $success")
        nullable.eager {
            val user = authenticatedUser.bind()
            if (success) {
                if (viewModel.isSelectingCoverPhoto.value) {
                    val file = viewModel.getCoverPhoto(context, user).bind()
                    viewModel.setCoverPhoto(context, file.toUri())
                } else {
                    val file = viewModel.getAvatarFile(context, user).bind()
                    Timber.d("Setting avatar photo")
                    viewModel.setAvatarPhoto(context, file.toUri())
                }
            }
        }
        // This is a hack to work around a jetpack compose bug
        scope.launch {
            delay(200)
            state.hide()
        }
    }
}

@ExperimentalMaterialApi
@Composable
fun createImagePickerLauncher(state: ModalBottomSheetState): ActivityResultLauncher<String> {
    val viewModel: ProfileViewModel = hiltViewModel()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    return rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) {
        if (viewModel.isSelectingCoverPhoto.value) {
            viewModel.setCoverPhoto(context, it)
        } else {
            viewModel.setAvatarPhoto(context, it)
        }

        // This is a hack to work around a jetpack compose bug
        scope.launch {
            delay(200)
            state.hide()
        }
    }
}
