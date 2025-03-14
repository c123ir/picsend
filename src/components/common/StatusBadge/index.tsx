import React from 'react';
import { Chip, ChipProps } from '@mui/material';

type Status = 'pending' | 'approved' | 'rejected' | 'reviewing';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: Status;
}

const statusConfig: Record<Status, { label: string; color: ChipProps['color'] }> = {
  pending: {
    label: 'در انتظار بررسی',
    color: 'warning'
  },
  approved: {
    label: 'تایید شده',
    color: 'success'
  },
  rejected: {
    label: 'رد شده',
    color: 'error'
  },
  reviewing: {
    label: 'در حال بررسی',
    color: 'info'
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const config = statusConfig[status];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      {...props}
    />
  );
};

export default StatusBadge; 