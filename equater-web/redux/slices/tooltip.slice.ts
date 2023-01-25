import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface TooltipState {
    description: string
    keys: string[]
}

const initialState: TooltipState = {
    description: '',
    keys: []
}

const tooltipSlice = createSlice({
    name: 'tooltip',
    initialState: initialState,
    reducers: {
        setTooltipState(state, { payload }: PayloadAction<TooltipState>) {
            state.description = payload.description
            state.keys = payload.keys
        }
    }
})

export const { setTooltipState } = tooltipSlice.actions

export const tooltipReducer = tooltipSlice.reducer
