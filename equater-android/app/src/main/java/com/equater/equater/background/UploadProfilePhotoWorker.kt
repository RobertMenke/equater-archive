package com.equater.equater.background

import android.content.Context
import androidx.core.net.toUri
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import arrow.core.computations.option
import arrow.core.toOption
import com.equater.equater.database.repository.UserRepository
import com.equater.equater.profile.PhotoType
import com.equater.equater.profile.PhotoUploadStatusDto
import com.equater.equater.utils.readAsRequestBody
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import timber.log.Timber
import java.io.File

const val FILE_URL = "FILE_URL"
const val UPLOAD_URL = "UPLOAD_URL"
const val PHOTO_TYPE = "PHOTO_TYPE"

private data class UploadContents(
    val fileUrl: String,
    val uploadUrl: String,
    val photoType: PhotoType
)

@HiltWorker
class UploadProfilePhotoWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val userRepository: UserRepository
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = coroutineScope {
        val scope = this

        val contents = option {
            val fileUrl = inputData.getString(FILE_URL).toOption().bind()
            val uploadUrl = inputData.getString(UPLOAD_URL).toOption().bind()
            val type = inputData.getString(PHOTO_TYPE).toOption().map(PhotoType::fromString).bind()

            UploadContents(fileUrl, uploadUrl, type)
        }

        contents.fold(
            { Result.failure() },
            { (fileUrl, uploadUrl, photoType) ->
                try {
                    val file = File(fileUrl)
                    val requestBody = applicationContext.contentResolver.readAsRequestBody(file.toUri())
                    val result = scope.async(Dispatchers.IO) {
                        userRepository.uploadFile("image/png", uploadUrl, requestBody)
                        // This will update the user cache as well
                        userRepository.setPhotoUploadStatus(
                            PhotoUploadStatusDto(
                                profilePhotoUploadComplete = true,
                                mimeType = "image/png",
                                photoType = photoType
                            )
                        )
                        file.delete()
                    }

                    result.await()
                    Result.success()
                } catch (e: Throwable) {
                    Timber.e(e)
                    Result.failure()
                }
            }
        )
    }
}
