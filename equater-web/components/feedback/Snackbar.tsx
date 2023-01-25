import * as React from 'react'
import { FC } from 'react'
import { ToastContainer } from 'react-toastify'

const AppSnackbar: FC = () => {
    return (
        <ToastContainer
            position="bottom-left"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            toastClassName={'theme-dark bg-app-secondary--important'}
            progressClassName={'theme-dark bg-accent-primary--important'}
            theme={'dark'}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
    )
}

export default AppSnackbar
