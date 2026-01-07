import { FormControlLabel, Switch } from '@mui/material'
import { Controller } from 'react-hook-form'

/**
 * Switch wrapper for React Hook Form
 */
const FormSwitch = ({ 
  name, 
  control, 
  label,
  disabled = false,
  ...rest 
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Switch
              {...field}
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={disabled}
              {...rest}
            />
          }
          label={label}
        />
      )}
    />
  )
}

export default FormSwitch
