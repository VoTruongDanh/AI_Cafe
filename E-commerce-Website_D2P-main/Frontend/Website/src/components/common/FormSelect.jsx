import { FormControl, InputLabel, Select, FormHelperText } from '@mui/material'
import { Controller } from 'react-hook-form'

/**
 * Select wrapper for React Hook Form
 */
const FormSelect = ({ 
  name, 
  control, 
  label, 
  children,
  disabled = false,
  size = 'small',
  fullWidth = true,
  ...rest 
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth={fullWidth} size={size} error={!!error} disabled={disabled}>
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            label={label}
            value={field.value ?? ''}
            {...rest}
          >
            {children}
          </Select>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}

export default FormSelect
