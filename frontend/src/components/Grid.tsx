import { Grid as MuiGrid, GridProps } from '@mui/material';
import { forwardRef } from 'react';

interface CustomGridProps extends GridProps {
  item?: boolean;
}

export const Grid = forwardRef<HTMLDivElement, CustomGridProps>((props, ref) => {
  return <MuiGrid ref={ref} {...props} />;
});

Grid.displayName = 'Grid'; 