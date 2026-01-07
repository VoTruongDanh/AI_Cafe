import { TextField } from '@mui/material'
import { Controller } from 'react-hook-form'

/**
 * TextField wrapper for React Hook Form
 * Tự động hiển thị lỗi validation realtime
 */
const FormTextField = ({ 
  name, 
  control, 
  label, 
  type = 'text',
  multiline = false,
  rows = 1,
  disabled = false,
  size = 'small',
  fullWidth = true,
  InputProps,
  inputProps,
  helperText,
  onChange: customOnChange, // ✅ Custom onChange handler
  ...rest 
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          label={label}
          type={type}
          multiline={multiline}
          rows={rows}
          disabled={disabled}
          size={size}
          fullWidth={fullWidth}
          error={!!error}
          helperText={error ? error.message : helperText}
          InputProps={InputProps}
          inputProps={inputProps}
          value={field.value ?? ''}
          onChange={(e) => {
            const value = type === 'number' 
              ? (e.target.value === '' ? null : Number(e.target.value))
              : e.target.value
            field.onChange(value) // ✅ Update form value
            if (customOnChange) {
              customOnChange(e) // ✅ Call custom handler
            }
          }}
          {...rest}
        />
      )}
    />
  )
}

export default FormTextField
