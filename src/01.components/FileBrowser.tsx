import { forwardRef, Fragment } from 'react'
import { InputAdornment, IconButton, TextField } from '@mui/material'
import { styled } from '@mui/system'
import { UploadSharp } from '@mui/icons-material'
import { open } from '@tauri-apps/api/dialog'

const FileInput = styled('input')({
    display: "none",
})

export const FileBrowser = forwardRef((props: any, ref: any): JSX.Element => {

    const {value, onChange} = props

    const handleChange = (file: string|string[]) => {
        if(onChange) {
            onChange(file);
            return
        }
    }

    return (
        <Fragment>
            <TextField value={value} label="Private Key" variant="standard" size="small" fullWidth InputLabelProps={{shrink: true}} InputProps={{
                readOnly: true,
                endAdornment: (<InputAdornment position="end">
                    <IconButton size="small" onClick={() => {
                        open({filters: [{
                            name: "PEM", extensions: ["pem"]
                        }, {
                            name: "ALL", extensions: ["*"],
                        }]}).then(e => handleChange(e))
                    }}><UploadSharp/></IconButton>
                </InputAdornment>),
            }}></TextField>
        </Fragment>
    )
})